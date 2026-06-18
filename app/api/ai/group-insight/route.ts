// app/api/ai/group-insight/route.ts
//
// Lightweight, no-tool-loop endpoint: takes already-computed member distances
// (GroupMapOverlay does the math client-side already) and asks Gemini to turn
// them into one short, natural-language summary. Cheaper and faster than the
// full agent loop in /api/ai/query — this is a single-shot generation call.

import { NextRequest, NextResponse } from 'next/server';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MODEL = 'gemini-2.5-flash'; // gemini-2.0-flash was deprecated June 1, 2026
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`;

interface MemberSnapshot {
  displayName: string;
  distanceFromYouMetres: number;
  distanceFromCampMetres: number;
  headingTo?: string | null;
}

export async function POST(req: NextRequest) {
  if (!GEMINI_API_KEY) {
    return NextResponse.json({ message: null });
  }

  let members: MemberSnapshot[];
  try {
    const body = await req.json();
    members = body.members ?? [];
  } catch {
    return NextResponse.json({ message: null }, { status: 400 });
  }

  if (!members.length) return NextResponse.json({ message: null });

  // Only bother calling the model if something's actually notable —
  // saves API calls and avoids "everything's fine" filler chatter.
  const drifting = members.filter((m) => m.distanceFromYouMetres > 600);
  if (drifting.length === 0) {
    return NextResponse.json({ message: null });
  }

  const summaryInput = drifting
    .map((m) => `${m.displayName}: ${Math.round(m.distanceFromYouMetres)}m from you, ${Math.round(m.distanceFromCampMetres)}m from camp center${m.headingTo ? `, heading to ${m.headingTo}` : ''}`)
    .join('\n');

  const prompt = `Group members who are far from the user, at Redemption City camp:
${summaryInput}

Write ONE short, friendly, actionable sentence (max 22 words) summarizing this for the user. Suggest a concrete next step if relevant (e.g. send a pin, call them). No preamble, just the sentence.`;

  try {
    const res = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.4, maxOutputTokens: 60 },
      }),
    });

    if (!res.ok) return NextResponse.json({ message: null });

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    return NextResponse.json({ message: text || null });
  } catch (err) {
    console.error('group-insight error:', err);
    return NextResponse.json({ message: null });
  }
}