'use client';

import React, { useState, useRef, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { Sparkles, X, Send, MapPin, Users, Info, HelpCircle } from 'lucide-react';
import { useAIAssistant, AgentResponse } from '../../hooks/useAIAssistant';
import { POIS } from '../../constants/mapData';

// ─── Colors ───────────────────────────────────────────────────────────────────

const Colors = {
  primary: '#10b981',
  primaryLight: '#e6f7f0',
  textPrimary: '#1c1c1e',
  textSecondary: '#29292C',
  border: '#e5e5ea',
  white: '#ffffff',
  background: '#f8f9fa',
  blue: '#3b82f6',
  blueLight: 'rgba(59,130,246,0.08)',
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  response?: AgentResponse;
  text?: string; // for user messages
}

interface GroupMemberInput {
  displayName: string;
  distanceFromYou?: number;
  distanceFromCamp?: number;
  activeDestination?: { name: string } | null;
}

interface AIAssistantPanelProps {
  userLocation: { latitude: number; longitude: number };
  groupMembers?: GroupMemberInput[];
  onNavigate: (poi: typeof POIS[0]) => void;
}

const SUGGESTED_PROMPTS = [
  'Where can I get food near me?',
  'Can I make it to the evening service in time?',
  'Where is my group right now?',
  'How far is the bank from here?',
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function AIAssistantPanel({ userLocation, groupMembers, onNavigate }: AIAssistantPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const { ask, isThinking, resetConversation } = useAIAssistant({ userLocation, groupMembers });
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isThinking]);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 250);
  }, [isOpen]);

  const handleSend = async (textOverride?: string) => {
    const text = (textOverride ?? input).trim();
    if (!text || isThinking) return;

    setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: 'user', text }]);
    setInput('');

    const response = await ask(text);
    if (response) {
      setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: 'assistant', response }]);
    } else {
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: 'assistant', response: { type: 'info', message: "Sorry, I couldn't process that. Try again?" } },
      ]);
    }
  };

  const handleClose = () => setIsOpen(false);

  const handleNewChat = () => {
    setMessages([]);
    resetConversation();
  };

  return (
    <>
      {/* Floating trigger button */}
      {!isOpen && (
        <FabButton onClick={() => setIsOpen(true)} title="Ask AI Assistant">
          <Sparkles size={18} />
        </FabButton>
      )}

      {/* Chat panel */}
      {isOpen && (
        <Panel>
          <PanelHeader>
            <HeaderLeft>
              <IconCircle><Sparkles size={14} color={Colors.primary} /></IconCircle>
              <div>
                <PanelTitle>Camp Assistant</PanelTitle>
                <PanelSub>Ask me anything about getting around</PanelSub>
              </div>
            </HeaderLeft>
            <HeaderActions>
              {messages.length > 0 && (
                <SmallBtn onClick={handleNewChat} title="New conversation">New</SmallBtn>
              )}
              <CloseBtn onClick={handleClose}><X size={16} /></CloseBtn>
            </HeaderActions>
          </PanelHeader>

          <MessagesArea ref={scrollRef}>
            {messages.length === 0 && (
              <EmptyState>
                <Sparkles size={28} color={Colors.primary} style={{ opacity: 0.5 }} />
                <p>Ask about places, timing, or where your group is.</p>
                <PromptChips>
                  {SUGGESTED_PROMPTS.map((p) => (
                    <PromptChip key={p} onClick={() => handleSend(p)}>{p}</PromptChip>
                  ))}
                </PromptChips>
              </EmptyState>
            )}

            {messages.map((msg) => (
              <MessageRow key={msg.id} $isUser={msg.role === 'user'}>
                {msg.role === 'user' ? (
                  <UserBubble>{msg.text}</UserBubble>
                ) : (
                  <AssistantBubbleRenderer response={msg.response!} onNavigate={onNavigate} onAskFollowup={handleSend} />
                )}
              </MessageRow>
            ))}

            {isThinking && (
              <MessageRow $isUser={false}>
                <ThinkingBubble>
                  <Dot /><Dot /><Dot />
                </ThinkingBubble>
              </MessageRow>
            )}
          </MessagesArea>

          <InputRow>
            <ChatInput
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
              placeholder="Ask the camp assistant…"
              disabled={isThinking}
            />
            <SendBtn onClick={() => handleSend()} disabled={!input.trim() || isThinking}>
              <Send size={15} />
            </SendBtn>
          </InputRow>
        </Panel>
      )}
    </>
  );
}

// ─── Renders the agent's structured response as the right UI ─────────────────

function AssistantBubbleRenderer({
  response,
  onNavigate,
  onAskFollowup,
}: {
  response: AgentResponse;
  onNavigate: (poi: typeof POIS[0]) => void;
  onAskFollowup: (text: string) => void;
}) {
  if (response.type === 'navigate') {
    const poi = POIS.find((p) => p.id === response.poiId);
    if (!poi) {
      return <AssistantBubble><Info size={13} />I found that place but lost track of its details — try the search bar.</AssistantBubble>;
    }
    return (
      <AssistantBubble $accent={Colors.primary}>
        <MapPin size={13} color={Colors.primary} />
        <div>
          <BubbleText>{response.reason}</BubbleText>
          <NavigateCard onClick={() => onNavigate(poi)}>
            <div>
              <NavigateCardName>{poi.name}</NavigateCardName>
              <NavigateCardCat>{poi.category}</NavigateCardCat>
            </div>
            <NavigateCardCta>Route →</NavigateCardCta>
          </NavigateCard>
        </div>
      </AssistantBubble>
    );
  }

  if (response.type === 'group_alert') {
    return (
      <AssistantBubble $accent={Colors.blue}>
        <Users size={13} color={Colors.blue} />
        <div>
          <BubbleText>{response.message}</BubbleText>
          {response.memberNames.length > 0 && (
            <MemberTagRow>
              {response.memberNames.map((n) => <MemberTag key={n}>{n}</MemberTag>)}
            </MemberTagRow>
          )}
        </div>
      </AssistantBubble>
    );
  }

  if (response.type === 'clarify') {
    return (
      <AssistantBubble $accent="#f59e0b">
        <HelpCircle size={13} color="#f59e0b" />
        <div>
          <BubbleText>{response.message}</BubbleText>
          {response.options && response.options.length > 0 && (
            <PromptChips style={{ marginTop: 8 }}>
              {response.options.map((opt) => (
                <PromptChip key={opt} onClick={() => onAskFollowup(opt)}>{opt}</PromptChip>
              ))}
            </PromptChips>
          )}
        </div>
      </AssistantBubble>
    );
  }

  // info (default)
  return (
    <AssistantBubble>
      <Info size={13} color={Colors.textSecondary} />
      <BubbleText>{response.message}</BubbleText>
    </AssistantBubble>
  );
}

// ─── Animations ───────────────────────────────────────────────────────────────

const popIn = keyframes`
  from { opacity: 0; transform: scale(0.9) translateY(8px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
`;

const dotPulse = keyframes`
  0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
  40%           { opacity: 1; transform: scale(1.1); }
`;

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
`;



const FabButton = styled.button`
  position: absolute;
  bottom: 100px;
  left: 16px;
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: linear-gradient(135deg, #10b981, #059669);
  border: none;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 10px 28px rgba(16, 185, 129, 0.4);
  z-index: 800; /* above UIOverlayContainer carousel/HUD which can sit ~30-40 */
  transition: transform 0.2s ease;

  &:hover { transform: scale(1.06); }
  &:active { transform: scale(0.96); }

  /* On phones the bottom carousel/HUD card takes up much more relative
     height, so a fixed 100px offset gets buried under it. Push the FAB
     above that card instead of guessing a taller fixed offset. */
  @media (max-width: 768px) {

    bottom: 220px;
    left: 12px;
    width: 48px;
    height: 48px;
  }
`;

const Panel = styled.div`
  position: absolute;
  bottom: 16px;
  left: 16px;
  width: 360px;
  height: 520px;
  background: ${Colors.white};
  border-radius: 22px;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.2);
  z-index: 800;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: ${popIn} 0.25s cubic-bezier(0.16, 1, 0.3, 1);

  @media (max-width: 768px) {
    width: calc(100% - 24px);
    right: 12px;
    left: 12px;
    bottom: 12px;
    height: 70vh;
  }
`;

const PanelHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid ${Colors.border};
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const IconCircle = styled.div`
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: ${Colors.primaryLight};
  display: flex;
  align-items: center;
  justify-content: center;
`;

const PanelTitle = styled.div`
  font-size: 13px;
  font-weight: 700;
  color: ${Colors.textPrimary};
`;

const PanelSub = styled.div`
  font-size: 10px;
  color: ${Colors.textSecondary};
  margin-top: 1px;
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const SmallBtn = styled.button`
  font-size: 11px;
  font-weight: 600;
  color: ${Colors.primary};
  background: ${Colors.primaryLight};
  border: none;
  border-radius: 8px;
  padding: 5px 10px;
  cursor: pointer;
`;

const CloseBtn = styled.button`
  background: ${Colors.background};
  border: none;
  border-radius: 50%;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: ${Colors.textSecondary};

  &:hover { background: #ececef; }
`;

const MessagesArea = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;

  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-thumb { background: ${Colors.border}; border-radius: 2px; }
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  text-align: center;
  padding: 24px 8px;
  color: ${Colors.textSecondary};

  p { font-size: 13px; margin: 0; line-height: 1.5; max-width: 240px; }
`;

const PromptChips = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  justify-content: center;
`;

const PromptChip = styled.button`
  font-size: 11px;
  font-weight: 600;
  color: ${Colors.primary};
  background: ${Colors.primaryLight};
  border: 1px solid rgba(16,185,129,0.2);
  border-radius: 50px;
  padding: 6px 12px;
  cursor: pointer;
  transition: all 0.15s;

  &:hover { background: rgba(16,185,129,0.18); }
`;

const MessageRow = styled.div<{ $isUser: boolean }>`
  display: flex;
  justify-content: ${({ $isUser }) => ($isUser ? 'flex-end' : 'flex-start')};
  animation: ${fadeUp} 0.2s ease;
`;

const UserBubble = styled.div`
  background: ${Colors.primary};
  color: white;
  font-size: 13px;
  font-weight: 500;
  padding: 10px 14px;
  border-radius: 16px 16px 4px 16px;
  max-width: 80%;
  line-height: 1.4;
`;

const AssistantBubble = styled.div<{ $accent?: string }>`
  display: flex;
  align-items: flex-start;
  gap: 8px;
  background: ${Colors.background};
  border: 1px solid ${({ $accent }) => ($accent ? `${$accent}30` : Colors.border)};
  font-size: 13px;
  padding: 11px 14px;
  border-radius: 4px 16px 16px 16px;
  max-width: 88%;
  line-height: 1.45;
  color: ${Colors.textPrimary};
`;

const BubbleText = styled.div`
  font-weight: 500;
`;

const ThinkingBubble = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  background: ${Colors.background};
  padding: 12px 16px;
  border-radius: 4px 16px 16px 16px;
`;

const Dot = styled.span`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: ${Colors.textSecondary};
  display: inline-block;
  animation: ${dotPulse} 1.2s infinite ease-in-out;

  &:nth-child(2) { animation-delay: 0.2s; }
  &:nth-child(3) { animation-delay: 0.4s; }
`;

const NavigateCard = styled.button`
  margin-top: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  background: white;
  border: 1px solid ${Colors.border};
  border-radius: 12px;
  padding: 10px 12px;
  cursor: pointer;
  text-align: left;
  transition: all 0.15s;

  &:hover { border-color: ${Colors.primary}; background: ${Colors.primaryLight}; }
`;

const NavigateCardName = styled.div`
  font-size: 12px;
  font-weight: 700;
  color: ${Colors.textPrimary};
`;

const NavigateCardCat = styled.div`
  font-size: 10px;
  color: ${Colors.textSecondary};
  margin-top: 1px;
`;

const NavigateCardCta = styled.div`
  font-size: 11px;
  font-weight: 700;
  color: ${Colors.primary};
  flex-shrink: 0;
`;

const MemberTagRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-top: 8px;
`;

const MemberTag = styled.span`
  font-size: 10px;
  font-weight: 700;
  background: ${Colors.blueLight};
  color: ${Colors.blue};
  padding: 3px 8px;
  border-radius: 50px;
`;

const InputRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 14px;
  border-top: 1px solid ${Colors.border};
`;

const ChatInput = styled.input`
  flex: 1;
  border: 1px solid ${Colors.border};
  border-radius: 50px;
  padding: 10px 16px;
  font-size: 13px;
  outline: none;
  color: #1B1A1A;
  transition: border-color 0.15s;

  &:focus { border-color: ${Colors.primary}; }
  &:disabled { background: ${Colors.background}; }
`;

const SendBtn = styled.button`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: ${Colors.primary};
  border: none;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: opacity 0.15s;

  &:disabled { opacity: 0.4; cursor: not-allowed; }
`;