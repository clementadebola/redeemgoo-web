// lib/ai/tools.ts
//
// Tool layer for the Gemini function-calling agent.
// Each tool wraps EXISTING app logic (routingService, mapData) —
// the agent doesn't reimplement routing, it just decides when to call it.

import { POIS } from '../../constants/mapData';
import { fetchInAppRoute } from '../../services/routingService';
import { getEventsForPoi, getTodaysSchedule, minsUntil } from '../../constants/eventSchedule';

// ─── Shared geo util ──────────────────────────────────────────────────────────

function haversineMetres(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6_371_000;
  const toRad = (v: number) => (v * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1), dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Tool: find_poi ───────────────────────────────────────────────────────────
// Fuzzy-resolves a natural language place description to a known POI.

function findPoi(args: { query: string }) {
  const q = args.query.trim().toLowerCase();
  if (!q) return { matches: [] };

  const scored = POIS.map((poi) => {
    const name = poi.name.toLowerCase();
    const cat = poi.category.toLowerCase();
    let score = 0;
    if (name.startsWith(q)) score = 4;
    else if (name.split(/\s+/).some((w) => w.startsWith(q))) score = 3;
    else if (name.includes(q) || cat.includes(q)) score = 2;
    else {
      // loose token overlap for fuzzy/colloquial phrasing
      const qTokens = q.split(/\s+/);
      const overlap = qTokens.filter((t) => name.includes(t) || cat.includes(t)).length;
      if (overlap > 0) score = 1;
    }
    return { poi, score };
  })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map((s) => s.poi);

  return { matches: scored };
}

// ─── Tool: get_route ──────────────────────────────────────────────────────────
// Calls the SAME OSRM routing service the map already uses.

async function getRoute(args: {
  fromLat: number; fromLng: number; toLat: number; toLng: number;
}) {
  const result = await fetchInAppRoute(
    { latitude: args.fromLat, longitude: args.fromLng },
    { latitude: args.toLat, longitude: args.toLng },
  );
  if (!result) return { success: false };
  return {
    success: true,
    distance: result.distance,           // e.g. "400 m" or "1.2 km"
    duration: result.duration,           // e.g. "5 mins" or "1 hr 30 min"
    durationMinutes: result.durationMinutes, // integer — use this, not parseFloat(duration string)
  };
}

// ─── Tool: get_distance ───────────────────────────────────────────────────────

function getDistance(args: { fromLat: number; fromLng: number; toLat: number; toLng: number }) {
  const metres = haversineMetres(args.fromLat, args.fromLng, args.toLat, args.toLng);
  return {
    metres: Math.round(metres),
    formatted: metres < 1000 ? `${Math.round(metres)} m` : `${(metres / 1000).toFixed(1)} km`,
    walkingMinutes: Math.max(1, Math.round((metres / 1.3) / 60)), // ~1.3 m/s walking pace
  };
}

// ─── Tool: get_event_schedule ─────────────────────────────────────────────────
// Lets the agent reason about "will I make it before X event".

function getEventSchedule(args: { poiId?: string }) {
  const now = new Date();
  if (args.poiId) {
    const events = getEventsForPoi(args.poiId, now);
    return {
      events: events.map((e) => ({
        name: e.name,
        startTime: e.startTime,
        endTime: e.endTime,
        minutesUntilStart: minsUntil(e.startTime, now),
        doorsOpenMinsBefore: e.doorsOpenMinsBefore ?? 0,
      })),
    };
  }
  const todays = getTodaysSchedule(now);
  return {
    events: todays.map((e) => ({
      name: e.name,
      poiId: e.poiId,
      startTime: e.startTime,
      endTime: e.endTime,
      minutesUntilStart: minsUntil(e.startTime, now),
    })),
  };
}

// ─── Tool: get_group_positions ────────────────────────────────────────────────
// Group context is passed in from the client request (Firestore already
// streams it there) — the tool just shapes it for the model.

function getGroupPositions(args: Record<string, never>, context: { groupMembers?: any[] }) {
  const members = context.groupMembers ?? [];
  return {
    members: members.map((m) => ({
      name: m.displayName,
      distanceFromYouMetres: m.distanceFromYou ?? null,
      distanceFromCampMetres: m.distanceFromCamp ?? null,
      headingTo: m.activeDestination?.name ?? null,
    })),
  };
}

// ─── Gemini function declarations (schema sent to the model) ─────────────────

export const TOOL_DECLARATIONS = [
  {
    name: 'find_poi',
    description:
      'Search Redemption City locations (halls, gates, banks, markets, hospital, etc) by name, category, or loose/colloquial description. Use this whenever the user mentions a place, even vaguely.',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'The place name or description to search for' },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_route',
    description:
      'Get the actual driving/walking route distance and duration between two coordinates inside the camp, using the real routing engine.',
    parameters: {
      type: 'object',
      properties: {
        fromLat: { type: 'number' },
        fromLng: { type: 'number' },
        toLat:   { type: 'number' },
        toLng:   { type: 'number' },
      },
      required: ['fromLat', 'fromLng', 'toLat', 'toLng'],
    },
  },
  {
    name: 'get_distance',
    description:
      'Get straight-line distance and estimated walking time between two coordinates. Faster than get_route; use for quick estimates or group-member distance checks.',
    parameters: {
      type: 'object',
      properties: {
        fromLat: { type: 'number' },
        fromLng: { type: 'number' },
        toLat:   { type: 'number' },
        toLng:   { type: 'number' },
      },
      required: ['fromLat', 'fromLng', 'toLat', 'toLng'],
    },
  },
  {
    name: 'get_event_schedule',
    description:
      'Get camp event/service schedule for today, optionally filtered to a specific POI. Use this to answer questions about timing, like whether the user can make it somewhere before an event starts.',
    parameters: {
      type: 'object',
      properties: {
        poiId: { type: 'string', description: 'Optional POI id to filter events to a specific location' },
      },
    },
  },
  {
    name: 'get_group_positions',
    description:
      "Get the current positions and status of the user's circle/group members, including distance from the user and where they're headed. Use this for questions about where friends/group members are.",
    parameters: { type: 'object', properties: {} },
  },
] as const;

// ─── Dispatcher ───────────────────────────────────────────────────────────────

export type ToolContext = {
  groupMembers?: any[];
};

export async function executeTool(
  name: string,
  args: any,
  context: ToolContext = {},
): Promise<any> {
  switch (name) {
    case 'find_poi':
      return findPoi(args);
    case 'get_route':
      return await getRoute(args);
    case 'get_distance':
      return getDistance(args);
    case 'get_event_schedule':
      return getEventSchedule(args);
    case 'get_group_positions':
      return getGroupPositions(args, context);
    default:
      return { error: `Unknown tool: ${name}` };
  }
}