'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import styled from 'styled-components';
import { User, Building2, Users, ChevronDown, ChevronUp, Map, Settings, Crown, UserCheck } from 'lucide-react';

import { useAuthStore } from '../store/authStore';
import { useLocationStore } from '../store/locationStore';
import { useGroupStore } from '../store/groupStore';
import { useLocation } from '../hooks/useLocation';
import NotificationCenter from '../components/home/NotificationCenter';
import DestinationWidget from '../components/home/DestinationWidget';
import LiveLocationWidget from '../components/home/LiveLocationWidget';

const Colors = {
  primary: '#10b981',
  primaryLight: '#e6f7f0',
  textPrimary: '#1c1c1e',
  textSecondary: '#8e8e93',
  border: '#e5e5ea',
  white: '#ffffff',
  error: '#ff3b30',
  warningLight: '#fff3e0',
  warningText: '#f57c00',
  badgeBg: '#f2f2f7',
  badgeText: '#3a3a3c'
};

const GREETING = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
};

const CATEGORIES = [
  { id: 'Auditoriums', icon: Building2 },
  { id: 'Halls', icon: Building2 },
];

export default function HomeScreen() {
  const router = useRouter();
  
  const user = useAuthStore((state) => state.user);
  const profile = useAuthStore((state) => state.profile);
  const { startTracking } = useLocationStore();
  
  const { userGroups, currentGroup, setCurrentGroup, listenToGroupAndNotifications } = useGroupStore();
  const { userLocation } = useLocation();
  const [isGroupsExpanded, setIsGroupsExpanded] = useState(false);

  useEffect(() => {
    if (!user?.uid) return;
    const unsub = listenToGroupAndNotifications(user.uid);
    return () => unsub();
  }, [user?.uid, listenToGroupAndNotifications]);

  const firstName = profile?.displayName?.split(' ')[0] ?? 'Traveler';

  const handleLocationBarClick = async () => {
    if (userLocation) {
      router.push('/dashboard/map');
    } else if (user?.uid) {
      await startTracking(user.uid);
    }
  };

  const visibleGroups = isGroupsExpanded ? userGroups : userGroups.slice(0, 2);
  const hasMoreGroups = userGroups.length > 2;

  return (
    <ScreenContainer>
      {/* Top Profile & Notifications Bar */}
      <TopBar>
        <UserRow>
          <Avatar><User size={20} /></Avatar>
          <div>
            <GreetingText>{GREETING()},</GreetingText>
            <SidebarUserName>{firstName}.</SidebarUserName>
          </div>
        </UserRow>
        <NotificationCenter />
      </TopBar>

      {/* Hero Welcome Banner */}
      <HeroBanner>
        <HeroTitle>
          <span>Welcome to</span>
          Redemption City
        </HeroTitle>
        <Building2 size={40} opacity={0.8} />
      </HeroBanner>

      {/* Multi-Group Context Widget Card */}
      <BentoWidgetCard>
        <WidgetHeaderRow>
          <HeaderTitleCluster>
            <Users size={18} color={Colors.primary} />
            <WidgetHeading>Tracking Pipelines ({userGroups.length})</WidgetHeading>
          </HeaderTitleCluster>
        </WidgetHeaderRow>

        {userGroups.length === 0 ? (
          <EmptyGroupPlaceholder onClick={() => router.push('/dashboard/groups')}>
            <span className="emoji">👥</span>
            <p>You have not joined any tracking circles yet. Tap here to set up or accept invites.</p>
          </EmptyGroupPlaceholder>
        ) : (
          <GroupCardsStackGrid>
            {visibleGroups.map((group) => {
              const isSelectedActive = currentGroup?.id === group.id;
              const isCreator = group.ownerId === user?.uid;

              return (
                <PipelineRowCard 
                  key={group.id} 
                  $selected={isSelectedActive}
                  onClick={() => {
                    setCurrentGroup(group);
                    // ✅ MOBILE SELECTION BYPASS: Acts directly as configuration redirector on small viewports
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
                        {/* ✅ ROLE IDENTIFICATION BADGES */}
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
                  
                  {/* ✅ ADAPTIVE DOCK SYSTEM: Shows dual buttons on desktop, collapses cleanly into card click parameters on mobile */}
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

        {/* Collapsible expansion switch */}
        {hasMoreGroups && (
          <ShowMoreToggleAction onClick={() => setIsGroupsExpanded(!isGroupsExpanded)}>
            <span>{isGroupsExpanded ? "Collapse List" : `Show More (${userGroups.length - 2} hidden)`}</span>
            {isGroupsExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </ShowMoreToggleAction>
        )}
      </BentoWidgetCard>
      
      <DestinationWidget onClick={() => router.push('/dashboard/map')} />

      {/* Explore Grid */}
      <Section>
        <SectionTitle>Explore</SectionTitle>
        <CatScroll>
          {CATEGORIES.map((cat) => (
            <CatPill key={cat.id} onClick={() => router.push('/dashboard/map')}>
              <cat.icon size={16} color={Colors.primary} />
              {cat.id}
            </CatPill>
          ))}
        </CatScroll>
      </Section>

      <LiveLocationWidget userLocation={userLocation} onActivate={handleLocationBarClick} />
    </ScreenContainer>
  );
}

// ─── HIGH PERFORMANCE SYSTEM STYLED LAYOUTS ────────────────────────────────
const ScreenContainer = styled.div`
  padding: 24px;
  max-width: 900px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
  
  @media(min-width: 768px) {
    padding: 32px;
  }
`;

const TopBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const UserRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const Avatar = styled.div`
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background-color: ${Colors.primaryLight};
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid ${Colors.border};
  color: ${Colors.primary};
`;

const GreetingText = styled.p`
  font-size: 13px;
  color: ${Colors.textSecondary};
  margin: 0;
`;

const SidebarUserName = styled.h3`
  font-size: 18px;
  font-weight: 700;
  color: ${Colors.textPrimary};
  margin: 0;
`;

const HeroBanner = styled.div`
  background-color: ${Colors.primary};
  border-radius: 20px;
  padding: 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: white;
  box-shadow: 0 10px 25px rgba(16, 185, 129, 0.15);
`;

const HeroTitle = styled.h1`
  font-size: 24px;
  font-weight: 800;
  margin: 0;
  span {
    display: block;
    font-size: 16px;
    font-weight: 400;
    opacity: 0.9;
  }
`;

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
  text-align: left; /* ✅ FORCES BULLETPROOF TEXT ALIGNMENTS ON MOBILE */

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
  
  background-color: ${({ $type }) => ($type === 'creator' ? Colors.warningLight ?? '#fff3e0' : Colors.badgeBg)};
  color: ${({ $type }) => ($type === 'creator' ? Colors.warningText ?? '#f57c00' : Colors.badgeText)};
`;

const SelectionActionDock = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%; /* ✅ Makes buttons full width context parameters on mobile lines */
  display: none; /* ✅ HIDDEN BY DEFAULT ON MOBILE VIEWPORTS */

  @media(min-width: 768px) {
    display: flex; // ✅ RENDER DUAL ACTION BUTTON SIDEWAYS ON MONITOR SCREENS
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

  @media(min-width: 768px) {
    margin-top: 0;
  }
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

const Section = styled.section`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const SectionTitle = styled.h4`
  font-size: 16px;
  font-weight: 700;
  margin: 0;
`;

const CatScroll = styled.div`
  display: flex;
  gap: 12px;
  overflow-x: auto;
  padding-bottom: 8px;
`;

const CatPill = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background-color: ${Colors.white};
  border-radius: 50px;
  border: 1.5px solid ${Colors.border};
  cursor: pointer;
  white-space: nowrap;
  font-weight: 500;
  color: ${Colors.textPrimary};
`;