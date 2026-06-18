// lib/ai/schema.ts
//
// The model's FINAL answer (after tool calls resolve) must match one of these
// shapes. We validate server-side so a hallucinated poiId or malformed action
// never reaches the client and silently breaks navigation.

import { z } from 'zod';
import { POIS } from '../../constants/mapData';

const VALID_POI_IDS = POIS.map((p) => p.id);

export const NavigateActionSchema = z.object({
  type: z.literal('navigate'),
  poiId: z.string().refine((id) => VALID_POI_IDS.includes(id), {
    message: 'poiId must match an existing POI',
  }),
  reason: z.string().max(200),
});

export const InfoActionSchema = z.object({
  type: z.literal('info'),
  message: z.string().max(600),
});

export const GroupAlertActionSchema = z.object({
  type: z.literal('group_alert'),
  message: z.string().max(300),
  memberNames: z.array(z.string()).max(20),
});

export const ClarifyActionSchema = z.object({
  type: z.literal('clarify'),
  message: z.string().max(300),
  options: z.array(z.string()).max(5).optional(),
});

export const AgentResponseSchema = z.discriminatedUnion('type', [
  NavigateActionSchema,
  InfoActionSchema,
  GroupAlertActionSchema,
  ClarifyActionSchema,
]);

export type AgentResponse = z.infer<typeof AgentResponseSchema>;

/** Safe parse with a graceful fallback — never throw into the API response */
export function safeParseAgentResponse(raw: unknown): AgentResponse {
  const result = AgentResponseSchema.safeParse(raw);
  if (result.success) return result.data;

  // Fallback: surface whatever text we got rather than failing the request
  const fallbackMessage =
    typeof raw === 'object' && raw !== null && 'message' in raw && typeof (raw as any).message === 'string'
      ? (raw as any).message
      : "I couldn't quite work that out — try rephrasing, or use the search bar.";

  return { type: 'info', message: fallbackMessage };
}