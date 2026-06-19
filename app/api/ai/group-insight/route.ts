// app/api/ai/group-insight/route.ts
// Lightweight single-shot Groq call — no tool loop, just natural language
// summary of group member positions. Only fires when real drift exists.

import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const MODEL = 'llama-3.1-8b-instant'; // faster/cheaper model is fine here — no tool use needed

interface MemberSnapshot {
  displayName: string;
  distanceFromYouMetres: number;
  distanceFromCampMetres: number;
  headingTo?: string | null;
}

export async function POST(req: NextRequest) {
  if (!process.env.GROQ_API_KEY) return NextResponse.json({ message: null });

  let members: MemberSnapshot[];
  try {
    const body = await req.json();
    members = body.members ?? [];
  } catch {
    return NextResponse.json({ message: null }, { status: 400 });
  }

  if (!members.length) return NextResponse.json({ message: null });

  const drifting = members.filter((m) => m.distanceFromYouMetres > 600);
  if (drifting.length === 0) return NextResponse.json({ message: null });

  const summaryInput = drifting
    .map((m) =>
      `${m.displayName}: ${Math.round(m.distanceFromYouMetres)}m from you, ` +
      `${Math.round(m.distanceFromCampMetres)}m from camp center` +
      (m.headingTo ? `, heading to ${m.headingTo}` : ''),
    )
    .join('\n');

  const prompt = `Group members who are far from the user at Redemption City camp:\n${summaryInput}\n\nWrite ONE short, friendly, actionable sentence (max 22 words) summarising this. Suggest a concrete next step if relevant. No preamble.`;

  try {
    const response = await groq.chat.completions.create({
      model: MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.4,
      max_tokens: 80,
    });

    const text = response.choices[0]?.message?.content?.trim();
    return NextResponse.json({ message: text || null });

  } catch (err: any) {
    console.error('group-insight Groq error:', err?.message ?? err);
    return NextResponse.json({ message: null });
  }
}