// hooks/useAIAssistant.ts

import { useState, useCallback, useRef } from 'react';

export type AgentResponse =
  | { type: 'navigate'; poiId: string; reason: string }
  | { type: 'info'; message: string }
  | { type: 'group_alert'; message: string; memberNames: string[] }
  | { type: 'clarify'; message: string; options?: string[] };

export interface ChatTurn {
  role: 'user' | 'model';
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
  const [isThinking, setIsThinking] = useState(false);
  const [lastResponse, setLastResponse] = useState<AgentResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const historyRef = useRef<ChatTurn[]>([]);

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

      // Maintain a short rolling history so follow-ups have context.
      // Explicitly typed as ChatTurn[] so 'user'/'model' stay literal types
      // instead of widening to `string` (which broke assignability before).
      const newTurns: ChatTurn[] = [
        { role: 'user', text: query },
        { role: 'model', text: JSON.stringify(data) },
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