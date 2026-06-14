'use client';

import React, { useState } from 'react';
import styled, { css } from 'styled-components';
import { Users, HelpCircle, X, ShieldAlert, Settings, ArrowRight } from 'lucide-react';
import Button from '../ui/Button';

const Colors = {
  primary: '#10b981',
  primaryLight: '#e6f7f0',
  textPrimary: '#1c1c1e',
  textSecondary: '#8e8e93',
  border: '#e5e5ea',
  white: '#ffffff',
  error: '#ff3b30'
};

interface GroupWidgetProps {
  currentGroup: { id: string; name: string; members: string[] } | null;
  onManageClick: () => void;
}

export default function GroupWidget({ currentGroup, onManageClick }: GroupWidgetProps) {
  const [showInfo, setShowInfo] = useState(false);

  return (
    <StyledGroupCard>
      <GroupHeaderRow>
        <GroupMeta>
          <GroupIconCircle>
            <Users size={22} />
          </GroupIconCircle>
          <div>
            <GroupCardTitle>
              {currentGroup ? currentGroup.name : 'Family & Friends Circle'}
            </GroupCardTitle>
            <p style={{ margin: 0, fontSize: '13px', color: Colors.textSecondary }}>
              {currentGroup 
                ? `${currentGroup.members.length} member(s) linked in your active monitoring pool.` 
                : 'Trace your circle members live across the city.'}
            </p>
          </div>
        </GroupMeta>
        
        <InfoToggleButton 
          type="button" 
          onClick={() => setShowInfo(!showInfo)}
          title="Learn more about Tracking Groups"
        >
          {showInfo ? <X size={18} color={Colors.error} /> : <HelpCircle size={18} />}
        </InfoToggleButton>
      </GroupHeaderRow>

      {showInfo && (
        <InfoPopoverPanel>
          <PopoverHeader>
            <ShieldAlert size={14} /> Geofence Anti-Lost Protection
          </PopoverHeader>
          <span>
            Create a secure tracking circle to invite family or colleagues. If any member leaves the designated perimeter boundaries of Redemption City, an automatic safety broadcast instantly notifies everyone in the group.
          </span>
        </InfoPopoverPanel>
      )}

      <Button 
        title={currentGroup ? "Configure Group Settings" : "Setup My Tracking Circle"} 
        variant={currentGroup ? "ghost" : "outline"}
        onClick={onManageClick} 
        icon={currentGroup ? <Settings size={16} /> : <ArrowRight size={16} />}
      />
    </StyledGroupCard>
  );
}

const StyledGroupCard = styled.div`
  background: ${Colors.white};
  border-radius: 20px;
  padding: 20px;
  border: 1.5px solid ${Colors.border};
  display: flex;
  flex-direction: column;
  gap: 16px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.01);
`;

const GroupHeaderRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
`;

const GroupMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const GroupIconCircle = styled.div`
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background-color: ${Colors.primaryLight};
  color: ${Colors.primary};
  display: flex;
  align-items: center;
  justify-content: center;
`;

const GroupCardTitle = styled.h4`
  font-size: 16px;
  font-weight: 700;
  color: ${Colors.textPrimary};
  margin: 0;
`;

const InfoToggleButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: ${Colors.textSecondary};
  padding: 4px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  &:hover {
    color: ${Colors.primary};
    background-color: ${Colors.primaryLight};
  }
`;

const InfoPopoverPanel = styled.div`
  background-color: #1c1c1e;
  color: white;
  padding: 14px;
  border-radius: 12px;
  font-size: 12px;
  line-height: 1.5;
  display: flex;
  flex-direction: column;
  gap: 6px;
  border-left: 4px solid ${Colors.primary};
`;

const PopoverHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 700;
  color: ${Colors.primary};
`;