'use client';

import React from 'react';
import styled from 'styled-components';
import { Navigation, Compass, X } from 'lucide-react';

interface NavigationHudProps {
  activeRoute: {
    destinationName: string;
    distance: string;
    duration: string;
  };
  onCancel: () => void;
}

export default function NavigationHud({ activeRoute, onCancel }: NavigationHudProps) {
  return (
    <HudCardContainer>
      <HeaderSection>
        <StatusBadge>
          <PulseIndicator />
          <Navigation size={10} style={{ transform: 'rotate(45deg)' }} />
          <span>GUIDANCE ACTIVE</span>
        </StatusBadge>
        <CancelIconButton type="button" onClick={onCancel} title="End Navigation">
          <X size={16} />
        </CancelIconButton>
      </HeaderSection>

      <RouteTitle>{activeRoute.destinationName}</RouteTitle>

      <MetricsRowGrid>
        <MetricBlock>
          <MetricLabel>DISTANCE REMAINING</MetricLabel>
          <MetricValue>{activeRoute.distance}</MetricValue>
        </MetricBlock>
        
        <VerticalDivider />
        
        <MetricBlock>
          <MetricLabel>ESTIMATED ARRIVAL</MetricLabel>
          <MetricValue $highlight>{activeRoute.duration}</MetricValue>
        </MetricBlock>
      </MetricsRowGrid>

      <EndButtonAction type="button" onClick={onCancel}>
        <Compass size={14} />
        <span>End Navigation Route</span>
      </EndButtonAction>
    </HudCardContainer>
  );
}

// ─── STYLED NAVIGATION SYSTEMS HUD CARD ────────────────────────────────────
const HudCardContainer = styled.div`
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px) saturate(190%);
  -webkit-backdrop-filter: blur(20px) saturate(190%);
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 24px;
  padding: 20px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0,0,0,0.02);
  width: 100%;
  max-width: 440px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  transform: translateY(0);
  animation: slideCardUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);

  @keyframes slideCardUp {
    from { transform: translateY(30px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
`;

const HeaderSection = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
`;

const StatusBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background-color: #e6f7f0;
  color: #10b981;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.5px;
  padding: 4px 10px;
  border-radius: 50px;
`;

const PulseIndicator = styled.div`
  width: 6px;
  height: 6px;
  background-color: #10b981;
  border-radius: 50%;
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background: inherit;
    animation: badgePulse 1.8s infinite ease-in-out;
  }

  @keyframes badgePulse {
    0% { transform: scale(1); opacity: 0.6; }
    100% { transform: scale(2.4); opacity: 0; }
  }
`;

const CancelIconButton = styled.button`
  background: rgba(0, 0, 0, 0.05);
  color: #3a3a3c;
  border: none;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(255, 59, 48, 0.15);
    color: #ff3b30;
  }
`;

const RouteTitle = styled.h2`
  font-size: 20px;
  font-weight: 800;
  color: #1c1c1e;
  margin: 0;
  letter-spacing: -0.3px;
  line-height: 1.2;
`;

const MetricsRowGrid = styled.div`
  display: flex;
  align-items: center;
  background: rgba(0, 0, 0, 0.03);
  border-radius: 16px;
  padding: 12px;
  border: 1px solid rgba(0, 0, 0, 0.02);
`;

const MetricBlock = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
`;

const MetricLabel = styled.span`
  font-size: 9px;
  color: #8e8e93;
  font-weight: 700;
  letter-spacing: 0.5px;
  margin-bottom: 2px;
  user-select: none;
`;

const MetricValue = styled.span<{ $highlight?: boolean }>`
  font-size: 18px;
  font-weight: 800;
  color: ${({ $highlight }) => ($highlight ? '#10b981' : '#1c1c1e')};
`;

const VerticalDivider = styled.div`
  width: 1px;
  height: 32px;
  background-color: rgba(0, 0, 0, 0.08);
`;

const EndButtonAction = styled.button`
  width: 100%;
  background-color: #ff3b30;
  border: none;
  border-radius: 14px;
  padding: 12px 0;
  color: #ffffff;
  font-size: 13px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(255, 59, 48, 0.2);
  transition: all 0.2s ease;

  &:hover {
    background-color: #e02e24;
    box-shadow: 0 6px 16px rgba(255, 59, 48, 0.3);
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }
`;