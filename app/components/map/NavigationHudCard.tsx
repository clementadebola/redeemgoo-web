'use client';

import React from 'react';
import styled from 'styled-components';
import { Compass, X, Footprints, Car, Bike } from 'lucide-react';
import type { RouteMode } from '../../services/routingService';

interface NavigationHudProps {
  activeRoute: {
    destinationName: string;
    distance: string;
    duration: string;
    mode: RouteMode;
  };
  onCancel: () => void;
  onSwitchMode: (mode: RouteMode) => void;
}

export default function NavigationHud({ activeRoute, onCancel, onSwitchMode }: NavigationHudProps) {
  return (
    <HudCardContainer>
      <HeaderSection>
        <RouteTitle>{activeRoute.destinationName}</RouteTitle>
        <CancelIconButton type="button" onClick={onCancel} title="End Navigation">
          <X size={16} />
        </CancelIconButton>
      </HeaderSection>

      {/* ── GOOGLE MAPS STYLE TOGGLE BAR ── */}
      <ModeToggleBar>
        <ModeButton $active={activeRoute.mode === 'driving'} onClick={() => onSwitchMode('driving')}>
          <Car size={16} />
          <span>Drive</span>
        </ModeButton>
        <ModeButton $active={activeRoute.mode === 'bike'} onClick={() => onSwitchMode('bike')}>
          <Bike size={16} />
          <span>Bike</span>
        </ModeButton>
        <ModeButton $active={activeRoute.mode === 'foot'} onClick={() => onSwitchMode('foot')}>
          <Footprints size={16} />
          <span>Walk</span>
        </ModeButton>
      </ModeToggleBar>

      <MetricsRowGrid>
        <MetricBlock>
          <MetricLabel>DISTANCE</MetricLabel>
          <MetricValue>{activeRoute.distance}</MetricValue>
        </MetricBlock>
        <VerticalDivider />
        <MetricBlock>
          <MetricLabel>EST. TIME</MetricLabel>
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

const ModeToggleBar = styled.div`
  display: flex;
  background: rgba(0, 0, 0, 0.04);
  border-radius: 12px;
  padding: 4px;
  margin-top: 4px;
`;

const ModeButton = styled.button<{ $active: boolean }>`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 0;
  border: none;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  
  background: ${({ $active }) => ($active ? '#ffffff' : 'transparent')};
  color: ${({ $active }) => ($active ? '#10b981' : '#8e8e93')};
  box-shadow: ${({ $active }) => ($active ? '0 2px 8px rgba(0,0,0,0.06)' : 'none')};

  &:hover {
    color: ${({ $active }) => ($active ? '#10b981' : '#1c1c1e')};
  }
`;

const HudCardContainer = styled.div`
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  padding: 20px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08);
  width: 100%;
  max-width: 440px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  animation: slideCardUp 0.3s ease-out;

  @keyframes slideCardUp {
    from { transform: translateY(20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }

  @media (max-width: 768px) {
    padding: 16px;
    border-radius: 20px;
  }
`;

const HeaderSection = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
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
  &:hover { background: rgba(255, 59, 48, 0.15); color: #ff3b30; }
`;

const RouteTitle = styled.h2`
  font-size: 18px;
  font-weight: 800;
  color: #1c1c1e;
  margin: 0;
`;

const MetricsRowGrid = styled.div`
  display: flex;
  align-items: center;
  background: rgba(0, 0, 0, 0.03);
  border-radius: 16px;
  padding: 12px;
`;

const MetricBlock = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const MetricLabel = styled.span`
  font-size: 9px;
  color: #8e8e93;
  font-weight: 700;
  margin-bottom: 2px;
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
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  cursor: pointer;
  &:hover { background-color: #e02e24; }
`;