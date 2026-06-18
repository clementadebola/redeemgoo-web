// app/api/ai/query/route.ts
//
// Server-side agent orchestrator. Holds the Gemini API key (never exposed to
// the client), runs the function-calling loop against our tools, validates
// the final structured response, and returns it.

import { NextRequest, NextResponse } from 'next/server';
import { TOOL_DECLARATIONS, executeTool } from '../../../lib/ai/tools';
import { safeParseAgentResponse } from '../../../lib/ai/schema';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY; // server-only, no NEXT_PUBLIC_
const MODEL = 'gemini-2.5-flash'; // gemini-2.0-flash was deprecated June 1, 2026
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`;

const MAX_TOOL_ITERATIONS = 4;

const SYSTEM_INSTRUCTION = `You are the navigation assistant for Redemption City (RCCG Camp), Nigeria.

Your job: help pilgrims find places, plan routes, check event timing, and understand where their group members are — using ONLY the provided tools for facts. Never invent distances, durations, POI names, or schedule times; always call a tool to get them.

When you have enough information to act, respond with a final answer as JSON matching exactly one of these shapes (no markdown, no commentary outside the JSON):

{"type":"navigate","poiId":"<id from find_poi results>","reason":"<short reason, max 1 sentence>"}
{"type":"info","message":"<helpful answer, conversational, max 3 sentences>"}
{"type":"group_alert","message":"<natural language summary>","memberNames":["..."]}
{"type":"clarify","message":"<question to ask the user>","options":["opt1","opt2"]}

Rules:
- Use "navigate" only when the user clearly wants to go somewhere AND you've confirmed the POI exists via find_poi.
- Use "clarify" if find_poi returns multiple plausible matches and intent is ambiguous — list the options.
- Use "group_alert" only when the user asks about group/friends/circle members.
- Use "info" for general questions, timing questions, or anything else.
- Keep messages short, warm, and useful — this is a mobile app, not an essay.
- If a tool call fails or returns no results, say so honestly in "info" rather than guessing.`;

interface QueryRequestBody {
  query: string;
  userLocation: { latitude: number; longitude: number };
  groupMembers?: Array<{
    displayName: string;
    distanceFromYou?: number;
    distanceFromCamp?: number;
    activeDestination?: { name: string } | null;
  }>;
  conversationHistory?: Array<{ role: 'user' | 'model'; text: string }>;
}

export async function POST(req: NextRequest) {
  if (!GEMINI_API_KEY) {
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

  if (!query || typeof query !== 'string' || !query.trim()) {
    return NextResponse.json({ type: 'info', message: 'Ask me something about getting around camp.' });
  }

  // Build initial conversation contents for Gemini
  const contents: any[] = [
    ...conversationHistory.map((turn) => ({
      role: turn.role,
      parts: [{ text: turn.text }],
    })),
    {
      role: 'user',
      parts: [{
        text: `User location: lat=${userLocation.latitude}, lng=${userLocation.longitude}\nUser query: "${query}"`,
      }],
    },
  ];

  const toolContext = { groupMembers };

  try {
    let finalJson: any = null;
    let geminiCallCount = 0; // visibility: how many actual API calls one user message costs

    for (let iteration = 0; iteration < MAX_TOOL_ITERATIONS; iteration++) {
      geminiCallCount++;
      const geminiRes = await fetch(GEMINI_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
          contents,
          tools: [{ functionDeclarations: TOOL_DECLARATIONS }],
          generationConfig: { temperature: 0.3 },
        }),
      });

      if (!geminiRes.ok) {
        const errText = await geminiRes.text();
        console.error(
          `Gemini API error (status ${geminiRes.status}) on call ${geminiCallCount}/${MAX_TOOL_ITERATIONS} for this question:`,
          errText,
        );

        // Surface a more honest message for quota exhaustion specifically —
        // this is the most common free-tier failure and "try again" is
        // misleading if the quota resets in 60s vs hours.
        const isQuotaError = geminiRes.status === 429;
        return NextResponse.json(
          {
            type: 'info',
            message: isQuotaError
              ? "I've hit my usage limit for now — give it about a minute and try again."
              : "I'm having trouble thinking right now — try again in a moment.",
          },
          { status: 200 },
        );
      }

      const data = await geminiRes.json();
      const candidate = data?.candidates?.[0];
      const parts = candidate?.content?.parts ?? [];

      const functionCallPart = parts.find((p: any) => p.functionCall);

      if (functionCallPart) {
        // Model wants to call a tool — execute it and feed the result back
        const { name, args } = functionCallPart.functionCall;
        const toolResult = await executeTool(name, args, toolContext);

        // Append the model's function call + our function response to history
        contents.push({ role: 'model', parts: [{ functionCall: { name, args } }] });
        contents.push({
          role: 'user',
          parts: [{ functionResponse: { name, response: toolResult } }],
        });
        continue; // loop again, let the model see the tool result
      }

      // No function call — model returned a text answer (should be our JSON)
      const textPart = parts.find((p: any) => typeof p.text === 'string');
      const rawText = textPart?.text ?? '';

      try {
        // Strip accidental markdown fences defensively
        const cleaned = rawText.replace(/```json|```/g, '').trim();
        finalJson = JSON.parse(cleaned);
      } catch {
        finalJson = { type: 'info', message: rawText || "I couldn't find an answer for that." };
      }
      break;
    }

    console.log(`AI query resolved in ${geminiCallCount} Gemini call(s): "${query}"`);

    if (!finalJson) {
      finalJson = { type: 'info', message: 'That took too many steps to resolve — try a simpler question.' };
    }

    const validated = safeParseAgentResponse(finalJson);
    return NextResponse.json(validated);
  } catch (err) {
    console.error('AI orchestrator error:', err);
    return NextResponse.json(
      { type: 'info', message: 'Something went wrong reaching the AI assistant.' },
      { status: 200 },
    );
  }
}