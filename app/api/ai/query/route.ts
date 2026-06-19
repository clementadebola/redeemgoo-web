// app/api/ai/query/route.ts

import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { TOOL_DECLARATIONS, executeTool, type ToolContext } from '../../../lib/ai/tools';
import { safeParseAgentResponse } from '../../../lib/ai/schema';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const MODEL = 'llama-3.1-8b-instant';
const MAX_TOOL_ITERATIONS = 4;

const SYSTEM_PROMPT = `You are Redeem AI — the friendly, warm, slightly witty navigation guide for Redemption City (RCCG Camp), Nigeria.

LANGUAGE PATHS:
- If the user messages you in standard English, reply in warm standard English.
- If the user chats with you in Nigerian Pidgin, reply in natural Nigerian Pidgin.

CRITICAL INSTRUCTION FOR LLAMA 3:
You operate in TWO distinct phases. You must not mix them.

PHASE 1: TOOL CALLING (GATHERING INFO)
- If the user asks for a place ("bank", "market", "arena", "park"), you MUST call 'find_poi' first.
- CAMP DESTINATION RULE: If the user asks how to get to "Redemption City", "the camp", or "Redemption Camp", DO NOT guess. You MUST search 'find_poi' for "Main Camp Gate (Lagos-Ibadan Exp)" and use that as the destination.
- DO NOT output any text or your final JSON format during this phase.

PHASE 2: FINAL ANSWER (RESPONDING TO USER)
ONLY AFTER tools have returned their data, OR if no tools are needed (chit-chat), reply to the user.
Your final reply MUST BE RAW, VALID JSON ONLY. No markdown fences, no preamble, no text outside the JSON.

Choose EXACTLY ONE of these JSON shapes:
{"type":"navigate","poiId":"<id>","reason":"<1 sentence, warm + specific>"}
{"type":"info","message":"<1-3 sentences, human tone, 1-2 emojis ok>"}
{"type":"group_alert","message":"<warm but clear alert>","memberNames":["..."]}
{"type":"clarify","message":"<friendly question>","options":["Option A","Option B"]}

RULES:
- "navigate": ONLY when routing to ONE specific verified place.
- "clarify": If find_poi returns multiple options for a generic query ("bank", "market","park"), list them in "options" — do NOT randomly pick one.
- "info": Chit-chat, timing facts, general questions.
- "group_alert": Questions about group members only.
- STRICT ETA HONESTY: When using the "navigate" type, DO NOT guess or estimate the time in the "reason" string. Just say "I've plotted the route for you." The external Map UI will handle the exact math.`;

interface QueryRequestBody {
  query: string;
  userLocation: { latitude: number; longitude: number };
  groupMembers?: Array<{
    displayName: string;
    distanceFromYou?: number;
    distanceFromCamp?: number;
    activeDestination?: { name: string } | null;
  }>;
  conversationHistory?: Array<{ role: 'user' | 'assistant' | 'model'; text: string }>;
}

// ─── Sanitize Gemini-style uppercase types → lowercase for Groq/OpenAI ────────
function sanitizeParameters(params: any): any {
  if (Array.isArray(params)) return params.map(sanitizeParameters);
  if (params !== null && typeof params === 'object') {
    const result: any = {};
    for (const [key, value] of Object.entries(params)) {
      if (key === 'type' && typeof value === 'string') {
        result[key] = value.toLowerCase();
      } else if (key === 'required' && Array.isArray(value) && value.length === 0) {
        continue; // skip empty required arrays — Groq rejects them
      } else {
        result[key] = sanitizeParameters(value);
      }
    }
    return result;
  }
  return params;
}

// ─── Trim tool results to save tokens ────────────────────────────────────────
// routingService returns: { distance: "1.2 km", duration: "5 mins", coordinates: [...] }
// We strip coordinates (can be hundreds of points) and keep only what the model needs.
function trimToolResult(name: string, result: any): any {
  if (!result || typeof result !== 'object') return result;

  if (name === 'get_route') {
    // FIX: routingService returns `distance` and `duration` as strings like "1.2 km" / "5 mins"
    // Previous version wrongly mapped to distanceMeters/durationMinutes → model got undefined
    return {
      distance: result.distance,       // e.g. "1.2 km"
      duration: result.duration,       // e.g. "5 mins"
      success:  result.success ?? true,
    };
  }

  if (name === 'get_distance') {
    return {
      metres:         result.metres,
      formatted:      result.formatted,
      walkingMinutes: result.walkingMinutes,
    };
  }

  if (name === 'find_poi' && Array.isArray(result.matches)) {
    return {
      matches: result.matches.slice(0, 4).map((poi: any) => ({
        id:       poi.id,
        name:     poi.name,
        category: poi.category,
        lat:      poi.lat,
        lng:      poi.lng,
      })),
    };
  }

  return result;
}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { type: 'info', message: 'AI assistant is not configured on the server yet.' },
        { status: 200 },
      );
    }

    let body: QueryRequestBody;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ type: 'info', message: 'Malformed request.' }, { status: 400 });
    }

    const { query, userLocation, groupMembers = [], conversationHistory = [] } = body;

    if (!query?.trim()) {
      return NextResponse.json({ type: 'info', message: 'Ask me something about getting around camp.' });
    }

    // FIX: correct camp bounds — centre is 6.4531, 3.3958 (was wrongly set to 6.75–6.83)
   // ✅ FIXED: Correct camp bounds for Ogun State
    const isInsideCamp =
      userLocation.latitude  >= 6.7500 && userLocation.latitude  <= 6.8300 &&
      userLocation.longitude >= 3.4400 && userLocation.longitude <= 3.4700;

   const messages: Groq.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      // ✅ FIXED: Only send the last 6 messages to save massive amounts of tokens!
      ...conversationHistory.slice(-6).map((t) => ({
        role: (t.role === 'model' ? 'assistant' : t.role) as 'user' | 'assistant',
        content: t.text,
      })),
      {
        role: 'user',
        content: `User Status: Context area geofence check=${isInsideCamp ? 'Inside Camp boundaries' : 'Outside Camp boundaries'}.\nUser location: lat=${userLocation.latitude}, lng=${userLocation.longitude}\nUser query: "${query}"`,
      },
    ];

    const groqTools: Groq.Chat.ChatCompletionTool[] = TOOL_DECLARATIONS.map((t) => ({
      type: 'function' as const,
      function: {
        name:        t.name,
        description: t.description,
        parameters:  sanitizeParameters(t.parameters),
      },
    }));

    const toolContext: ToolContext = { groupMembers };

    let finalJson: any = null;
    let callCount = 0;

    for (let i = 0; i < MAX_TOOL_ITERATIONS; i++) {
      callCount++;

      const response = await groq.chat.completions.create({
        model:       MODEL,
        messages,
        tools:       groqTools,
        tool_choice: 'auto',
        temperature: 0.1,
        max_tokens:  300, // FIX: was 1024 — responses are 1-3 sentences of JSON, 300 is plenty
      });

      const msg = response.choices[0].message;

      if (msg.tool_calls && msg.tool_calls.length > 0) {
        messages.push({
          role:       'assistant',
          content:    msg.content ?? null,
          tool_calls: msg.tool_calls,
        });

        for (const tc of msg.tool_calls) {
          let args: any = {};
          try { args = JSON.parse(tc.function.arguments); } catch { args = {}; }

          const result  = await executeTool(tc.function.name, args, toolContext);
          const trimmed = trimToolResult(tc.function.name, result);

          messages.push({
            role:         'tool',
            tool_call_id: tc.id,
            content:      JSON.stringify(trimmed),
          });
        }
        continue;
      }

      // Model returned final answer — parse JSON
      const rawText = (msg.content ?? '').trim();
      try {
        finalJson = JSON.parse(rawText.replace(/```json|```/g, '').trim());
      } catch {
        finalJson = { type: 'info', message: rawText || "I couldn't find an answer for that." };
      }

      console.log(`[Redeem AI] resolved in ${callCount} call(s): "${query}"`);
      break;
    }

    if (!finalJson) {
      finalJson = { type: 'info', message: "That needed too many steps — try asking differently." };
    }

    const validated = safeParseAgentResponse(finalJson);
    return NextResponse.json(validated);

  } catch (err: any) {
    console.error('[Redeem AI] CRASH:', err);
    const status = err?.status ?? 0;
    const msg    = err?.error?.message ?? err?.message ?? 'Unknown error';
    return NextResponse.json(
      {
        type: 'info',
        message: status === 429
          ? "I've hit the usage limit — wait a minute and try again 🙏"
          : status === 400
          ? `Schema error: ${msg}` // surface 400s so we can catch any remaining schema issues
          : "Something went wrong — try again in a moment.",
      },
      { status: 200 },
    );
  }
}