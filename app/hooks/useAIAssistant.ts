// hooks/useAIAssistant.ts

import { useState, useCallback, useRef } from 'react';

export type AgentResponse =
  | { type: 'navigate'; poiId: string; reason: string }
  | { type: 'info'; message: string }
  | { type: 'group_alert'; message: string; memberNames: string[] }
  | { type: 'clarify'; message: string; options?: string[] };

export interface ChatTurn {
  role: 'user' | 'assistant'; // ← was 'model' (Gemini) — Groq uses 'assistant'
  text: string;
}

interface GroupMemberInput {
  displayName: string;
  distanceFromYou?: number;
  distanceFromCamp?: number;
  activeDestination?: { name: string } | null;
}

interface UseAIAssistantOptions {
  userLocation: { latitude: number; longitude: number };
  groupMembers?: GroupMemberInput[];
}

export function useAIAssistant({ userLocation, groupMembers }: UseAIAssistantOptions) {
  const [isThinking, setIsThinking]     = useState(false);
  const [lastResponse, setLastResponse] = useState<AgentResponse | null>(null);
  const [error, setError]               = useState<string | null>(null);
  const historyRef                      = useRef<ChatTurn[]>([]);

  const ask = useCallback(async (query: string): Promise<AgentResponse | null> => {
    setIsThinking(true);
    setError(null);

    try {
      const res = await fetch('/api/ai/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          userLocation,
          groupMembers,
          conversationHistory: historyRef.current,
        }),
      });

      const data: AgentResponse = await res.json();

      // ChatTurn[] typed explicitly so 'user'/'assistant' stay as literals,
      // not widened to string (that was the old TS error with 'model').
      const newTurns: ChatTurn[] = [
        { role: 'user',      text: query },
        { role: 'assistant', text: JSON.stringify(data) }, // ← was 'model'
      ];
      historyRef.current = [...historyRef.current, ...newTurns].slice(-10);

      setLastResponse(data);
      return data;
    } catch (err) {
      console.error('useAIAssistant error:', err);
      setError("Couldn't reach the assistant. Check your connection.");
      return null;
    } finally {
      setIsThinking(false);
    }
  }, [userLocation, groupMembers]);

  const resetConversation = useCallback(() => {
    historyRef.current = [];
    setLastResponse(null);
    setError(null);
  }, []);

  return { ask, isThinking, lastResponse, error, resetConversation };
}