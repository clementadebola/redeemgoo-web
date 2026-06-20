'use client';

import React from 'react';
import styled from 'styled-components';
import { Users, Crown, User, ShieldAlert, ArrowRight } from 'lucide-react';

const Colors = {
  primary: '#10b981',
  primaryLight: '#e6f7f0',
  textPrimary: '#1c1c1e',
  textSecondary: '#8e8e93',
  border: '#e5e5ea',
  white: '#ffffff',
  warning: '#f59e0b',
  warningLight: '#fef3c7',
  info: '#3b82f6',
  infoLight: '#dbeafe'
};

interface ActiveGroupProps {
  currentGroup: { id: string; name: string; ownerId: string; members: string[] } | null;
  currentUserId: string | undefined;
  onManageClick: () => void;
}

export default function ActiveGroupWidget({ currentGroup, currentUserId, onManageClick }: ActiveGroupProps) {
  if (!currentGroup) return null;

  const isCreator = currentGroup.ownerId === currentUserId;

  return (
    <ActiveCard onClick={onManageClick}>
      <CardHeader>
       
        <RoleBadge $isCreator={isCreator}>
          {isCreator ? <Crown size={12} /> : <User size={12} />}
          <span>{isCreator ? 'Group Creator' : 'Circle Member'}</span>
        </RoleBadge>
        
        <MemberCount>
          <Users size={14} />
          <span>{currentGroup.members.length} Active</span>
        </MemberCount>
      </CardHeader>

      <GroupInfoRow>
        <GroupTitleBlock>
          <GroupIconContainer>
            <Users size={20} />
          </GroupIconContainer>
          <div>
            <GroupName>{currentGroup.name}</GroupName>
            <GroupSubtitle>Click to view live positions & geofencing alerts</GroupSubtitle>
          </div>
        </GroupTitleBlock>
        
        <ArrowRight size={20} color={Colors.textSecondary} />
      </GroupInfoRow>
    </ActiveCard>
  );
}



const ActiveCard = styled.button`
  background: ${Colors.white};
  border: 1.5px solid ${Colors.border};
  border-radius: 20px;
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  width: 100%;
  cursor: pointer;
  text-align: left;
  font-family: inherit;
  box-shadow: 0 4px 12px rgba(0,0,0,0.01);
  transition: transform 0.2s, background-color 0.2s;

  &:hover {
    transform: translateY(-1px);
    background-color: #fafafa;
  }
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
`;

const RoleBadge = styled.div<{ $isCreator: boolean }>`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 50px;
  font-size: 11px;
  font-weight: 700;
  
  color: ${({ $isCreator }) => ($isCreator ? Colors.warning : Colors.info)};
  background-color: ${({ $isCreator }) => ($isCreator ? Colors.warningLight : Colors.infoLight)};
`;

const MemberCount = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 600;
  color: ${Colors.textSecondary};
`;

const GroupInfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
`;

const GroupTitleBlock = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const GroupIconContainer = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background-color: ${Colors.primaryLight};
  color: ${Colors.primary};
  display: flex;
  align-items: center;
  justify-content: center;
`;

const GroupName = styled.h4`
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: ${Colors.textPrimary};
`;

const GroupSubtitle = styled.p`
  margin: 2px 0 0 0;
  font-size: 12px;
  color: ${Colors.textSecondary};
`;