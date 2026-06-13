'use client';

import React, { useState } from 'react';
import styled from 'styled-components';
import { Navigation, Compass, Users, ChevronDown, ChevronUp } from 'lucide-react';

const Colors = {
  primary: '#10b981',
  primaryLight: '#e6f7f0',
  textPrimary: '#1c1c1e',
  textSecondary: '#8e8e93',
  border: '#e5e5ea',
  white: '#ffffff',
  background: '#f8f9fa'
};

interface GroupMemberLoc {
  latitude: number;
  longitude: number;
  displayName: string;
  activeDestination?: { name: string; latitude: number; longitude: number } | null;
}

interface GroupMapOverlayProps {
  membersLocations: Record<string, GroupMemberLoc>;
  userLocation: { latitude: number; longitude: number } | null;
  campCenter: { latitude: number; longitude: number };
  onFocusMember: (lat: number, lng: number) => void;
}

function computeDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): string {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return d < 1 ? `${Math.round(d * 1000)}m` : `${d.toFixed(1)}km`;
}

export default function GroupMapOverlay({ membersLocations, userLocation, campCenter, onFocusMember }: GroupMapOverlayProps) {
  const locationsArray = Object.values(membersLocations);
  const [isMobileExpanded, setIsMobileExpanded] = useState(false);

  return (
    <OverlayPanelCard $isExpanded={isMobileExpanded}>
      {/* Interactive header area acts as the sheet drawer trigger toggle hook */}
      <HeaderRow onClick={() => setIsMobileExpanded(!isMobileExpanded)} style={{ cursor: 'pointer' }}>
        <HeaderLeftInfo>
          <Users size={16} color={Colors.primary} />
          <OverlayTitle>Radar Feed ({locationsArray.length})</OverlayTitle>
        </HeaderLeftInfo>
        
        <MobileToggleWrapper>
          {isMobileExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </MobileToggleWrapper>
      </HeaderRow>

      <MembersRosterScroll $isExpanded={isMobileExpanded}>
        {locationsArray.map((member, idx) => {
          const distToYou = userLocation 
            ? computeDistanceKm(userLocation.latitude, userLocation.longitude, member.latitude, member.longitude)
            : '--';
          
          const distToCamp = computeDistanceKm(campCenter.latitude, campCenter.longitude, member.latitude, member.longitude);

          return (
            <MemberRowCard 
              key={idx} 
              onClick={() => {
                onFocusMember(member.latitude, member.longitude);
                // On mobile screens, auto-collapse drawer view after targeting a user to clear screen space
                if (window.innerWidth <= 768) setIsMobileExpanded(false);
              }}
            >
              <MetaBlockColumn>
                <span className="name">{member.displayName}</span>
                <span className="metrics">
                  📍 {distToYou} away · {distToCamp} to Center
                </span>
                
                {member.activeDestination && (
                  <DestinationBadge>
                    <Navigation size={10} style={{ transform: 'rotate(45deg)' }} />
                    Heading to: {member.activeDestination.name}
                  </DestinationBadge>
                )}
              </MetaBlockColumn>
              <FocusBadge><Compass size={14} /></FocusBadge>
            </MemberRowCard>
          );
        })}
      </MembersRosterScroll>
    </OverlayPanelCard>
  );
}

// ─── STYLED DESIGN WORKSPACE OVERLAYS ────────────────────────────────────────
const OverlayPanelCard = styled.div<{ $isExpanded: boolean }>`
  position: absolute;
  top: 80px;
  right: 16px;
  width: 320px;
  background-color: ${Colors.white};
  border: 1.5px solid ${Colors.border};
  border-radius: 20px;
  padding: 16px;
  box-shadow: 0 12px 32px rgba(0,0,0,0.1);
  z-index: 110; /* Ensures the radar panel floats clearly above underlying HUD bars */
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 400px;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);

  @media(max-width: 768px) {
    width: calc(100% - 32px);
    left: 16px;
    right: 16px;
    /* Move to top layout bar alignment stack so it leaves the bottom carousel undisturbed */
    top: 140px; 
    bottom: auto;
    max-height: ${({ $isExpanded }) => ($isExpanded ? '280px' : '48px')};
    padding: 12px 16px;
    border-radius: 14px;
    overflow: hidden;
  }
`;

const HeaderRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  user-select: none;
`;

const HeaderLeftInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const OverlayTitle = styled.h5`
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  color: ${Colors.textPrimary};
`;

const MobileToggleWrapper = styled.div`
  display: none;
  color: ${Colors.textSecondary};
  @media(max-width: 768px) {
    display: flex;
    align-items: center;
  }
`;

const MembersRosterScroll = styled.div<{ $isExpanded: boolean }>`
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
  
  @media(max-width: 768px) {
    /* Hide the scrolling feed on mobile unless explicitly toggled open */
    display: ${({ $isExpanded }) => ($isExpanded ? 'flex' : 'none')};
    opacity: ${({ $isExpanded }) => ($isExpanded ? '1' : '0')};
    transition: opacity 0.2s ease-in;
  }
`;

const MemberRowCard = styled.div`
  background-color: ${Colors.background};
  border: 1px solid ${Colors.border};
  border-radius: 12px;
  padding: 10px 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  transition: background-color 0.2s;
  &:hover { background-color: #f2f2f7; }
`;

const MetaBlockColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;

  .name {
    font-size: 13px;
    font-weight: 600;
    color: ${Colors.textPrimary};
  }

  .metrics {
    font-size: 11px;
    color: ${Colors.textSecondary};
  }
`;

const DestinationBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background-color: ${Colors.primaryLight};
  color: ${Colors.primary};
  font-size: 10px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
  margin-top: 4px;
  width: fit-content;
`;

const FocusBadge = styled.div`
  color: ${Colors.textSecondary};
  padding: 4px;
  display: flex;
  align-items: center;
`;