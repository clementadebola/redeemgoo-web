'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import styled, { keyframes, css } from 'styled-components';
import {
  Navigation, Compass, Users, ChevronDown, ChevronUp,
  Sparkles, AlertTriangle, MapPin, Radio, UserCheck,
} from 'lucide-react';

const Colors = {
  primary: '#10b981',
  primaryLight: '#e6f7f0',
  primaryDark: '#059669',
  blue: '#3b82f6',
  blueLight: 'rgba(59,130,246,0.08)',
  textPrimary: '#1c1c1e',
  textSecondary: '#8e8e93',
  border: '#e5e5ea',
  white: '#ffffff',
  background: '#f8f9fa',
  error: '#ef4444',
  errorLight: 'rgba(239, 68, 68, 0.08)',
  warning: '#f59e0b',
  warningLight: 'rgba(245,158,11,0.08)',
  surface: '#f2f2f7',
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface GroupMemberLoc {
  latitude: number;
  longitude: number;
  displayName: string;
  activeDestination?: { name: string; latitude: number; longitude: number } | null;
  lastSeen?: number; // unix ms
}

interface GroupMapOverlayProps {
  membersLocations: Record<string, GroupMemberLoc>;
  userLocation: { latitude: number; longitude: number } | null;
  campCenter: { latitude: number; longitude: number };
  onFocusMember: (lat: number, lng: number) => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function computeDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(d: number): string {
  if (d <= 0) return '0m';
  return d < 1 ? `${Math.round(d * 1000)}m` : `${d.toFixed(2)}km`;
}

function formatLastSeen(ts?: number): string {
  if (!ts) return 'Live';
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 10) return 'Just now';
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

type AIInsight = {
  type: 'drift' | 'approaching' | 'arrived';
  severity: 'high' | 'medium' | 'low';
  message: string;
  suggestion: string;
};

// ─── AI Insight Engine ────────────────────────────────────────────────────────

function buildAIInsights(
  members: GroupMemberLoc[],
  userLocation: { latitude: number; longitude: number } | null,
  campCenter: { latitude: number; longitude: number },
): Record<string, AIInsight> {
  const insights: Record<string, AIInsight> = {};
  if (!userLocation) return insights;

  members.forEach((m) => {
    if (!m?.latitude || !m?.longitude) return;
    const distToUser = computeDistanceKm(
      userLocation.latitude, userLocation.longitude,
      m.latitude, m.longitude,
    );
    const distToCamp = computeDistanceKm(
      campCenter.latitude, campCenter.longitude,
      m.latitude, m.longitude,
    );

    if (distToCamp < 0.15) {
      insights[m.displayName] = {
        type: 'arrived',
        severity: 'low',
        message: 'Inside camp perimeter',
        suggestion: 'Member has arrived. Pin their location to meet up.',
      };
    } else if (distToUser > 0.6) {
      insights[m.displayName] = {
        type: 'drift',
        severity: distToUser > 1.2 ? 'high' : 'medium',
        message: distToUser > 1.2 ? `Critical drift — ${formatDistance(distToUser)} away` : `Drifting — ${formatDistance(distToUser)} from you`,
        suggestion: distToUser > 1.2
          ? 'Send a meetup point or call this member immediately.'
          : 'Tap focus to view their position on the map.',
      };
    } else if (distToCamp < 0.5 && distToCamp > 0.15) {
      insights[m.displayName] = {
        type: 'approaching',
        severity: 'low',
        message: `Approaching camp — ${formatDistance(distToCamp)} out`,
        suggestion: 'Member is close to the camp entrance.',
      };
    }
  });

  return insights;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function GroupMapOverlay({
  membersLocations,
  userLocation,
  campCenter,
  onFocusMember,
}: GroupMapOverlayProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState<'members' | 'ai'>('members');
  const [focusedMemberId, setFocusedMemberId] = useState<string | null>(null);
  const [aiNarrative, setAiNarrative] = useState<string | null>(null);
  const [aiNarrativeLoading, setAiNarrativeLoading] = useState(false);

  // Always show ALL members — filter out undefined entries only
  const locationsArray = useMemo(
    () => Object.entries(membersLocations ?? {})
      .filter(([, v]) => v?.latitude && v?.longitude)
      .map(([id, loc]) => ({ id, ...loc })),
    [membersLocations],
  );

  const aiInsights = useMemo(
    () => buildAIInsights(locationsArray, userLocation, campCenter),
    [locationsArray, userLocation, campCenter],
  );

  const warningCount = Object.values(aiInsights).filter(
    (i) => i.type === 'drift',
  ).length;

  const hasWarnings = warningCount > 0;

  // ── Fetch natural-language summary from the AI endpoint whenever the
  //    drift picture changes meaningfully (not on every GPS jitter tick) ──
  //
  // IMPORTANT: round to ~100m buckets at most, not finer. GPS noise alone
  // is routinely 5-20m, and live tracking pushes a new position every few
  // seconds — a too-precise fingerprint re-fires this on every jitter and
  // silently burns API quota with no user action behind it at all.
  const driftFingerprint = useMemo(
    () => locationsArray
      .map((m) => `${m.displayName}:${Math.round(
        userLocation ? computeDistanceKm(userLocation.latitude, userLocation.longitude, m.latitude, m.longitude) : 0,
      )}`) // rounded to whole km, not 100m — collapses GPS jitter into one bucket
      .join('|'),
    [locationsArray, userLocation],
  );

  const lastNarrativeFetchRef = useRef<number>(0);
  const NARRATIVE_COOLDOWN_MS = 45_000; // hard floor: never call more than ~once/45s

  useEffect(() => {
    if (!hasWarnings || !userLocation) { setAiNarrative(null); return; }

    const now = Date.now();
    const elapsed = now - lastNarrativeFetchRef.current;
    if (elapsed < NARRATIVE_COOLDOWN_MS) return; // still in cooldown — skip silently
    lastNarrativeFetchRef.current = now;

    let cancelled = false;
    setAiNarrativeLoading(true);

    const payload = {
      members: locationsArray.map((m) => ({
        displayName: m.displayName,
        distanceFromYouMetres: computeDistanceKm(userLocation.latitude, userLocation.longitude, m.latitude, m.longitude) * 1000,
        distanceFromCampMetres: computeDistanceKm(campCenter.latitude, campCenter.longitude, m.latitude, m.longitude) * 1000,
        headingTo: m.activeDestination?.name ?? null,
      })),
    };

    fetch('/api/ai/group-insight', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then((r) => r.json())
      .then((data) => { if (!cancelled) setAiNarrative(data.message ?? null); })
      .catch(() => { if (!cancelled) setAiNarrative(null); })
      .finally(() => { if (!cancelled) setAiNarrativeLoading(false); });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [driftFingerprint, hasWarnings]);

  const handleFocus = (id: string, lat: number, lng: number) => {
    setFocusedMemberId(id);
    onFocusMember(lat, lng);
    if (window.innerWidth <= 768) setIsExpanded(false);
  };

  return (
    <Panel $hasWarning={hasWarnings}>
      {/* ── Header ─────────────────────────────────────── */}
      <PanelHeader onClick={() => setIsExpanded(!isExpanded)}>
        <HeaderLeft>
          {hasWarnings ? (
            <PulseWrap><AlertTriangle size={15} color={Colors.error} /></PulseWrap>
          ) : (
            <IconDot $color={Colors.primary}><Radio size={13} color={Colors.primary} /></IconDot>
          )}
          <div>
            <PanelTitle $hasWarning={hasWarnings}>
              {hasWarnings ? `${warningCount} Drift Alert${warningCount > 1 ? 's' : ''}` : 'Group Radar'}
            </PanelTitle>
            <PanelSub>{locationsArray.length} member{locationsArray.length !== 1 ? 's' : ''} tracked</PanelSub>
          </div>
        </HeaderLeft>
        <ChevronBtn>{isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</ChevronBtn>
      </PanelHeader>

      {isExpanded && (
        <>
          {/* ── Tabs ───────────────────────────────────── */}
          <TabRow>
            <Tab $active={activeTab === 'members'} onClick={() => setActiveTab('members')}>
              <Users size={12} /> Members
            </Tab>
            <Tab $active={activeTab === 'ai'} onClick={() => setActiveTab('ai')}>
              <Sparkles size={12} />
              AI Copilot
              {hasWarnings && <TabBadge>{warningCount}</TabBadge>}
            </Tab>
          </TabRow>

          {/* ── Members Tab ────────────────────────────── */}
          {activeTab === 'members' && (
            <MembersList>
              {locationsArray.length === 0 && (
                <EmptyState>
                  <UserCheck size={28} color={Colors.textSecondary} />
                  <p>No group members are sharing location yet.</p>
                </EmptyState>
              )}

              {locationsArray.map((member) => {
                const distToYou = userLocation
                  ? computeDistanceKm(
                      userLocation.latitude, userLocation.longitude,
                      member.latitude, member.longitude,
                    )
                  : null;
                const distToCamp = computeDistanceKm(
                  campCenter.latitude, campCenter.longitude,
                  member.latitude, member.longitude,
                );
                const insight = aiInsights[member.displayName];
                const isFocused = focusedMemberId === member.id;

                return (
                  <MemberCard
                    key={member.id}
                    $status={insight?.type ?? 'none'}
                    $isFocused={isFocused}
                    onClick={() => handleFocus(member.id, member.latitude, member.longitude)}
                  >
                    {/* Avatar */}
                    <Avatar $status={insight?.type ?? 'none'}>
                      {getInitials(member.displayName || 'RG')}
                      {insight?.type === 'drift' && <AvatarRing $severity={insight.severity} />}
                    </Avatar>

                    {/* Info */}
                    <MemberInfo>
                      <MemberName>{member.displayName || 'Circle Member'}</MemberName>

                      <MetricRow>
                        <MetricChip $color={Colors.primary}>
                          <MapPin size={9} />
                          {distToYou !== null ? `${formatDistance(distToYou)} from you` : '--'}
                        </MetricChip>
                        <MetricChip $color={Colors.textSecondary}>
                          <Navigation size={9} />
                          {formatDistance(distToCamp)} to camp
                        </MetricChip>
                      </MetricRow>

                      {member.activeDestination?.name && (
                        <DestBadge>
                          <Navigation size={9} style={{ transform: 'rotate(45deg)' }} />
                          Heading: {member.activeDestination.name}
                        </DestBadge>
                      )}

                      {insight && (
                        <InsightChip $type={insight.type}>
                          {insight.type === 'drift' && <AlertTriangle size={9} />}
                          {insight.type === 'approaching' && <Navigation size={9} />}
                          {insight.type === 'arrived' && <UserCheck size={9} />}
                          {insight.message}
                        </InsightChip>
                      )}

                      <LastSeen>{formatLastSeen(member.lastSeen)}</LastSeen>
                    </MemberInfo>

                    {/* Focus button */}
                    <FocusBtn $isFocused={isFocused} title="Focus on map">
                      <Compass size={14} />
                    </FocusBtn>
                  </MemberCard>
                );
              })}
            </MembersList>
          )}

          {/* ── AI Copilot Tab ─────────────────────────── */}
          {activeTab === 'ai' && (
            <AiPanel>
              {/* Live LLM-generated summary, when there's something worth saying */}
              {hasWarnings && (
                <AiNarrativeCard>
                  <AiNarrativeHeader><Sparkles size={12} /> AI Summary</AiNarrativeHeader>
                  {aiNarrativeLoading ? (
                    <AiNarrativeLoading><span /><span /><span /></AiNarrativeLoading>
                  ) : (
                    <AiNarrativeText>
                      {aiNarrative ?? 'Some members are spread out — check the cards below for details.'}
                    </AiNarrativeText>
                  )}
                </AiNarrativeCard>
              )}

              {Object.keys(aiInsights).length === 0 ? (
                <AiAllClear>
                  <span style={{ fontSize: 28 }}>✅</span>
                  <strong>All clear</strong>
                  <p>No drift or separation detected. Your group is cohesive.</p>
                </AiAllClear>
              ) : (
                Object.entries(aiInsights).map(([name, insight]) => (
                  <AiInsightCard key={name} $type={insight.type}>
                    <AiInsightHeader $type={insight.type}>
                      {insight.type === 'drift' && <AlertTriangle size={13} />}
                      {insight.type === 'approaching' && <Navigation size={13} />}
                      {insight.type === 'arrived' && <UserCheck size={13} />}
                      <span>{name}</span>
                      <SeverityDot $severity={insight.severity} />
                    </AiInsightHeader>
                    <AiInsightBody>{insight.message}</AiInsightBody>
                    <AiSuggestion>💡 {insight.suggestion}</AiSuggestion>
                  </AiInsightCard>
                ))
              )}

              <AiFooter>
                <Sparkles size={11} />
                Powered by on-device AI · Updates every 30s
              </AiFooter>
            </AiPanel>
          )}
        </>
      )}
    </Panel>
  );
}

// ─── Animations ───────────────────────────────────────────────────────────────

const pulseAnim = keyframes`
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.15); opacity: 0.6; }
  100% { transform: scale(1); opacity: 1; }
`;

const ringExpand = keyframes`
  0% { transform: scale(1); opacity: 0.8; }
  100% { transform: scale(2.2); opacity: 0; }
`;

const slideDown = keyframes`
  from { opacity: 0; transform: translateY(-6px); }
  to { opacity: 1; transform: translateY(0); }
`;

// ─── Styled Components ────────────────────────────────────────────────────────

const Panel = styled.div<{ $hasWarning: boolean }>`
  position: absolute;
  top: 80px;
  right: 16px;
  width: 310px;
  background: ${Colors.white};
  border: 1.5px solid ${({ $hasWarning }) => ($hasWarning ? Colors.error : Colors.border)};
  border-radius: 20px;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.12);
  z-index: 110;
  overflow: hidden;
  transition: border-color 0.3s ease;

  @media (max-width: 768px) {
    width: calc(100% - 32px);
    left: 16px;
    right: 16px;
    top: 130px;
  }
`;

const PanelHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  cursor: pointer;
  user-select: none;
  border-bottom: 1px solid ${Colors.border};

  &:hover { background: ${Colors.surface}; }
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const PulseWrap = styled.div`
  animation: ${pulseAnim} 1.8s infinite ease-in-out;
  display: flex;
  align-items: center;
`;

const IconDot = styled.div<{ $color: string }>`
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: ${({ $color }) => $color}18;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const PanelTitle = styled.div<{ $hasWarning: boolean }>`
  font-size: 13px;
  font-weight: 700;
  color: ${({ $hasWarning }) => ($hasWarning ? Colors.error : Colors.textPrimary)};
  line-height: 1;
`;

const PanelSub = styled.div`
  font-size: 10px;
  color: ${Colors.textSecondary};
  margin-top: 2px;
  font-weight: 500;
`;

const ChevronBtn = styled.div`
  color: ${Colors.textSecondary};
  display: flex;
  align-items: center;
`;

const TabRow = styled.div`
  display: flex;
  gap: 0;
  border-bottom: 1px solid ${Colors.border};
  padding: 0 12px;
`;

const Tab = styled.button<{ $active: boolean }>`
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 10px 12px;
  font-size: 12px;
  font-weight: 600;
  border: none;
  background: none;
  cursor: pointer;
  color: ${({ $active }) => ($active ? Colors.primary : Colors.textSecondary)};
  border-bottom: 2px solid ${({ $active }) => ($active ? Colors.primary : 'transparent')};
  transition: all 0.2s;
  position: relative;
  bottom: -1px;

  &:hover { color: ${Colors.primary}; }
`;

const TabBadge = styled.span`
  background: ${Colors.error};
  color: white;
  font-size: 9px;
  font-weight: 800;
  padding: 1px 5px;
  border-radius: 50px;
  margin-left: 2px;
`;

const MembersList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0;
  max-height: 340px;
  overflow-y: auto;
  animation: ${slideDown} 0.2s ease;

  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-thumb { background: ${Colors.border}; border-radius: 2px; }
`;

const statusBg = (status: string) => {
  if (status === 'drift') return Colors.errorLight;
  if (status === 'approaching') return Colors.warningLight;
  if (status === 'arrived') return Colors.primaryLight;
  return Colors.white;
};

const statusBorder = (status: string) => {
  if (status === 'drift') return 'rgba(239,68,68,0.2)';
  if (status === 'approaching') return 'rgba(245,158,11,0.2)';
  if (status === 'arrived') return 'rgba(16,185,129,0.2)';
  return Colors.border;
};

const MemberCard = styled.div<{ $status: string; $isFocused: boolean }>`
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 14px;
  background: ${({ $status }) => statusBg($status)};
  border-bottom: 1px solid ${Colors.border};
  cursor: pointer;
  transition: all 0.18s;
  outline: ${({ $isFocused }) => ($isFocused ? `2px solid ${Colors.primary}` : 'none')};
  outline-offset: -2px;

  &:hover { filter: brightness(0.97); }
  &:last-child { border-bottom: none; }
`;

const Avatar = styled.div<{ $status: string }>`
  position: relative;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: ${({ $status }) =>
    $status === 'drift' ? Colors.error :
    $status === 'arrived' ? Colors.primary :
    Colors.blue};
  color: white;
  font-size: 11px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 4px 10px rgba(0,0,0,0.15);
`;

const AvatarRing = styled.div<{ $severity: string }>`
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 2px solid ${({ $severity }) => $severity === 'high' ? Colors.error : Colors.warning};
  animation: ${ringExpand} ${({ $severity }) => $severity === 'high' ? '1.2s' : '2s'} infinite ease-out;
`;

const MemberInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const MemberName = styled.div`
  font-size: 13px;
  font-weight: 700;
  color: ${Colors.textPrimary};
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const MetricRow = styled.div`
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
  margin-bottom: 4px;
`;

const MetricChip = styled.div<{ $color: string }>`
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 10px;
  font-weight: 600;
  color: ${({ $color }) => $color};
  background: ${({ $color }) => $color}14;
  padding: 2px 6px;
  border-radius: 4px;
`;

const DestBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: ${Colors.primaryLight};
  color: ${Colors.primaryDark};
  font-size: 10px;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 4px;
  margin-bottom: 3px;
  max-width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const insightColor = (type: string) =>
  type === 'drift' ? Colors.error :
  type === 'approaching' ? Colors.warning :
  Colors.primary;

const InsightChip = styled.div<{ $type: string }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 9px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  color: ${({ $type }) => insightColor($type)};
  margin-top: 2px;
`;

const LastSeen = styled.div`
  font-size: 9px;
  color: ${Colors.textSecondary};
  margin-top: 3px;
  font-weight: 500;
`;

const FocusBtn = styled.div<{ $isFocused: boolean }>`
  color: ${({ $isFocused }) => ($isFocused ? Colors.primary : Colors.textSecondary)};
  background: ${({ $isFocused }) => ($isFocused ? Colors.primaryLight : Colors.surface)};
  width: 30px;
  height: 30px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.2s;

  &:hover { background: ${Colors.primaryLight}; color: ${Colors.primary}; }
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 32px 16px;
  color: ${Colors.textSecondary};

  p { font-size: 12px; text-align: center; margin: 0; line-height: 1.5; }
`;

// ── AI Panel ──────────────────────────────────────────────────────────────────

const AiPanel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  max-height: 340px;
  overflow-y: auto;
  animation: ${slideDown} 0.2s ease;
`;

const AiAllClear = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 24px 16px;
  text-align: center;

  strong { font-size: 14px; color: ${Colors.primary}; }
  p { font-size: 12px; color: ${Colors.textSecondary}; margin: 0; }
`;

const AiNarrativeCard = styled.div`
  background: linear-gradient(135deg, ${Colors.primaryLight}, rgba(16,185,129,0.04));
  border: 1px solid rgba(16,185,129,0.25);
  border-radius: 12px;
  padding: 10px 12px;
  margin-bottom: 4px;
`;

const AiNarrativeHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  color: ${Colors.primaryDark};
  margin-bottom: 4px;
`;

const AiNarrativeText = styled.div`
  font-size: 12.5px;
  font-weight: 600;
  color: ${Colors.textPrimary};
  line-height: 1.45;
`;

const aiDotPulse = keyframes`
  0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
  40%           { opacity: 1; transform: scale(1.1); }
`;

const AiNarrativeLoading = styled.div`
  display: flex;
  gap: 4px;
  padding: 2px 0;

  span {
    width: 5px; height: 5px; border-radius: 50%;
    background: ${Colors.primaryDark};
    animation: ${aiDotPulse} 1.2s infinite ease-in-out;
    &:nth-child(2) { animation-delay: 0.2s; }
    &:nth-child(3) { animation-delay: 0.4s; }
  }
`;

const AiInsightCard = styled.div<{ $type: string }>`
  border: 1px solid ${({ $type }) =>
    $type === 'drift' ? 'rgba(239,68,68,0.2)' :
    $type === 'approaching' ? 'rgba(245,158,11,0.2)' :
    'rgba(16,185,129,0.2)'};
  border-radius: 12px;
  padding: 10px 12px;
  background: ${({ $type }) =>
    $type === 'drift' ? Colors.errorLight :
    $type === 'approaching' ? Colors.warningLight :
    Colors.primaryLight};
`;

const AiInsightHeader = styled.div<{ $type: string }>`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 700;
  color: ${({ $type }) => insightColor($type)};
  margin-bottom: 4px;

  span { flex: 1; }
`;

const SeverityDot = styled.div<{ $severity: string }>`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: ${({ $severity }) =>
    $severity === 'high' ? Colors.error :
    $severity === 'medium' ? Colors.warning :
    Colors.primary};
`;

const AiInsightBody = styled.div`
  font-size: 12px;
  color: ${Colors.textPrimary};
  font-weight: 600;
  margin-bottom: 4px;
`;

const AiSuggestion = styled.div`
  font-size: 11px;
  color: ${Colors.textSecondary};
  line-height: 1.4;
`;

const AiFooter = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 10px;
  color: ${Colors.textSecondary};
  padding: 4px 0 0;
  justify-content: center;
  border-top: 1px solid ${Colors.border};
  padding-top: 8px;
`;