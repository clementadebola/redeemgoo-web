'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import styled from 'styled-components';
import { Users, ChevronDown, ChevronUp, Map, Settings, Crown, UserCheck, Plus } from 'lucide-react';

const Colors = {
  primary: '#10b981',
  primaryLight: '#e6f7f0',
  textPrimary: '#1c1c1e',
  textSecondary: '#8e8e93',
  border: '#e5e5ea',
  white: '#ffffff',
  warningLight: '#fff3e0',
  warningText: '#f57c00',
  badgeBg: '#f2f2f7',
  badgeText: '#3a3a3c'
};

interface GroupItem {
  id: string;
  name: string;
  ownerId: string;
  members: string[];
}

interface GroupWidgetProps {
  userGroups: GroupItem[];
  currentGroup: GroupItem | null;
  setCurrentGroup: (group: GroupItem | null) => void;
  userId: string | undefined;
}

export default function GroupWidget({ userGroups, currentGroup, setCurrentGroup, userId }: GroupWidgetProps) {
  const router = useRouter();
  const [isGroupsExpanded, setIsGroupsExpanded] = useState(false);

  const visibleGroups = isGroupsExpanded ? userGroups : userGroups.slice(0, 2);
  const hasMoreGroups = userGroups.length > 2;

  // ✅ CENTRALIZED CREATION NAVIGATION CONSTANT: Change this single string to match your exact directory layout route!
 const CREATE_GROUP_ROUTE = '/dashboard/groups?action=create'; 

  return (
    <BentoWidgetCard>
      <WidgetHeaderRow>
        <HeaderTitleCluster>
          <Users size={18} color={Colors.primary} />
          <WidgetHeading>Tracking Pipelines ({userGroups.length})</WidgetHeading>
        </HeaderTitleCluster>
        
        {/* ✅ FIXED: Routes the user straight to the Group Creation layout step screen */}
        {userGroups.length > 0 && (
          <CreateCircleButton onClick={() => router.push(CREATE_GROUP_ROUTE)}>
            <Plus size={14} />
            <span>Create Group</span>
          </CreateCircleButton>
        )}
      </WidgetHeaderRow>

      {userGroups.length === 0 ? (
        /* ✅ FIXED: Re-routed empty state placeholder click trigger straight to Creation route */
        <EmptyGroupPlaceholder onClick={() => router.push(CREATE_GROUP_ROUTE)}>
          <span className="emoji">👥</span>
          <p>You have not joined any tracking circles yet. Tap here to set up a brand new tracking group.</p>
        </EmptyGroupPlaceholder>
      ) : (
        <GroupCardsStackGrid>
          {visibleGroups.map((group) => {
            const isSelectedActive = currentGroup?.id === group.id;
            const isCreator = group.ownerId === userId;

            return (
              <PipelineRowCard 
                key={group.id} 
                $selected={isSelectedActive}
                onClick={() => {
                  setCurrentGroup(group);
                  // Mobile view fallback handling setup details dashboard
                  if (window.innerWidth <= 768) {
                    router.push('/dashboard/groups');
                  }
                }}
              >
                <PipelineLeftBlock>
                  <CustomRadioToggle $selected={isSelectedActive} />
                  <PipelineMetaInfo>
                    <div className="title-cluster">
                      <span className="pipeline-title">{group.name}</span>
                      {isCreator ? (
                        <RoleBadge $type="creator" title="You created this circle">
                          <Crown size={10} fill="currentColor" />
                          <span>Creator</span>
                        </RoleBadge>
                      ) : (
                        <RoleBadge $type="member" title="You are a joined participant">
                          <UserCheck size={10} />
                          <span>Member</span>
                        </RoleBadge>
                      )}
                    </div>
                    <span className="pipeline-count">👥 {group.members.length} members linked</span>
                  </PipelineMetaInfo>
                </PipelineLeftBlock>
                
                {/* Desktop layout dual-action docks */}
                <SelectionActionDock>
                  <ActionButton 
                    $variant="map"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentGroup(group);
                      router.push('/dashboard/map');
                    }}
                  >
                    <Map size={13} />
                    <span>Map View</span>
                  </ActionButton>

                  <ActionButton 
                    $variant="setup"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentGroup(group);
                      router.push('/dashboard/groups');
                    }}
                  >
                    <Settings size={13} />
                    <span>Setup</span>
                  </ActionButton>
                </SelectionActionDock>
              </PipelineRowCard>
            );
          })}
        </GroupCardsStackGrid>
      )}

      {hasMoreGroups && (
        <ShowMoreToggleAction onClick={() => setIsGroupsExpanded(!isGroupsExpanded)}>
          <span>{isGroupsExpanded ? "Collapse List" : `Show More (${userGroups.length - 2} hidden)`}</span>
          {isGroupsExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </ShowMoreToggleAction>
      )}
    </BentoWidgetCard>
  );
}

// ─── STYLED COMPONENT ENCAPSULATIONS ────────────────────────────────────────
const BentoWidgetCard = styled.div`
  background: ${Colors.white};
  border: 1px solid ${Colors.border};
  border-radius: 24px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.01);
`;

const WidgetHeaderRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
`;

const HeaderTitleCluster = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const WidgetHeading = styled.h3`
  font-size: 15px;
  font-weight: 700;
  color: ${Colors.textPrimary};
  margin: 0;
`;

const CreateCircleButton = styled.button`
  background: ${Colors.primaryLight};
  color: ${Colors.primary};
  border: none;
  padding: 6px 12px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover { opacity: 0.85; transform: translateY(-0.5px); }
  &:active { transform: translateY(0); }
`;

const GroupCardsStackGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const PipelineRowCard = styled.div<{ $selected: boolean }>`
  background-color: ${({ $selected }) => ($selected ? Colors.primaryLight : '#f8f9fa')};
  border: 1px solid ${({ $selected }) => ($selected ? Colors.primary : Colors.border)};
  border-radius: 16px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);

  &:hover {
    transform: translateY(-1px);
    background-color: ${({ $selected }) => ($selected ? Colors.primaryLight : '#f2f2f7')};
    box-shadow: 0 6px 16px rgba(0,0,0,0.03);
  }

  @media(min-width: 768px) {
    flex-direction: row;
    align-items: center;
    padding: 14px 18px;
    gap: 0;
  }
`;

const PipelineLeftBlock = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  width: 100%;
  text-align: left;

  @media(min-width: 768px) {
    align-items: center;
    width: auto;
  }
`;

const PipelineMetaInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  
  .title-cluster {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
  }
  
  .pipeline-title { 
    font-size: 15px; 
    font-weight: 700; 
    color: ${Colors.textPrimary};
    line-height: 1.2;
  }
  
  .pipeline-count { 
    font-size: 12px; 
    color: ${Colors.textSecondary}; 
    font-weight: 600; 
  }
`;

const RoleBadge = styled.div<{ $type: 'creator' | 'member' }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 9px;
  font-weight: 800;
  padding: 2px 8px;
  border-radius: 6px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  
  background-color: ${({ $type }) => ($type === 'creator' ? Colors.warningLight : Colors.badgeBg)};
  color: ${({ $type }) => ($type === 'creator' ? Colors.warningText : Colors.badgeText)};
`;

const SelectionActionDock = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  display: none;

  @media(min-width: 768px) {
    display: flex;
    width: auto;
  }
`;

const ActionButton = styled.button<{ $variant: 'map' | 'setup' }>`
  border: none;
  border-radius: 10px;
  padding: 8px 14px;
  font-size: 12px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  background-color: ${({ $variant }) => ($variant === 'map' ? Colors.primary : Colors.white)};
  color: ${({ $variant }) => ($variant === 'map' ? Colors.white : Colors.textPrimary)};
  border: 1px solid ${({ $variant }) => ($variant === 'map' ? 'transparent' : Colors.border)};
  box-shadow: ${({ $variant }) => ($variant === 'map' ? '0 4px 12px rgba(16, 185, 129, 0.2)' : '0 2px 4px rgba(0,0,0,0.02)')};

  &:hover {
    transform: translateY(-1px);
    background-color: ${({ $variant }) => ($variant === 'map' ? '#059669' : '#f2f2f7')};
  }
`;

const CustomRadioToggle = styled.div<{ $selected: boolean }>`
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 2px solid ${({ $selected }) => ($selected ? Colors.primary : '#c7c7cc')};
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${Colors.white};
  margin-top: 2px;
  flex-shrink: 0;

  &::after {
    content: '';
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: ${Colors.primary};
    transform: scale(${({ $selected }) => ($selected ? "1" : "0")});
    transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  @media(min-width: 768px) { margin-top: 0; }
`;

const EmptyGroupPlaceholder = styled.div`
  border: 2px dashed ${Colors.border};
  border-radius: 14px;
  padding: 24px;
  text-align: center;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;

  .emoji { font-size: 24px; }
  p { font-size: 13px; color: ${Colors.textSecondary}; margin: 0; max-width: 320px; line-height: 1.4; font-weight: 500; }
  &:hover { background: #f8f9fa; border-color: ${Colors.primary}; }
`;

const ShowMoreToggleAction = styled.button`
  background: none;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  width: 100%;
  color: ${Colors.textSecondary};
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  margin-top: 4px;
  &:hover { color: ${Colors.textPrimary}; }
`;