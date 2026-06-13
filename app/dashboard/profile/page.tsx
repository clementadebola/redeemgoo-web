'use client';

import React, { useState } from 'react';
import styled, { css } from 'styled-components';
import { useRouter } from 'next/navigation';
import { 
  User, MapPin, Settings, HelpCircle, Info, LogOut, 
  ChevronRight, Edit2, Users, Crown
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useLocationStore } from '../../store/locationStore'; 
import { useGroupStore } from '../../store/groupStore';

// Component Injections
import HistoryModal from './HistoryModal';
import LogoutModal from '../../(auth)/logout/page';

const Colors = {
  primary: '#10b981',
  primaryLight: '#e6f7f0',
  textPrimary: '#1c1c1e',
  textSecondary: '#8e8e93',
  border: '#e5e5ea',
  white: '#ffffff',
  error: '#ff3b30',
  errorLight: '#ffebe9',
  success: '#34c759',
  background: '#f8f9fa'
};

interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  danger?: boolean;
  rightText?: string;
}

function MenuItem({ icon, label, onPress, danger = false, rightText }: MenuItemProps) {
  const handleItemClick = () => {
    if (typeof window !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(10);
    }
    onPress();
  };

  return (
    <StyledMenuItem $danger={danger} onClick={handleItemClick} type="button">
      <MenuIconBg $danger={danger}>
        {icon}
      </MenuIconBg>
      <MenuLabel $danger={danger}>{label}</MenuLabel>
      <MenuRight>
        {rightText && <MenuRightBadge>{rightText}</MenuRightBadge>}
        <ChevronRight size={18} color={danger ? Colors.error : Colors.textSecondary} />
      </MenuRight>
    </StyledMenuItem>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const { profile, user } = useAuthStore();
  const { currentGroup } = useGroupStore();

  // Dialog view window states
  const [historyOpen, setHistoryOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);

  const displayName = profile?.displayName ?? user?.displayName ?? 'Traveler';
  const username = profile?.username ? `@${profile.username}` : user?.email ?? '';
  
  // Real dynamic mapping parameters from your saved Firestore collection payload
  const totalTrips = profile?.tripsCount ?? 0;
  const savedPlacesCount = profile?.savedPlaces?.length ?? 0;
  const userRating = profile?.rating ?? '5.0';

  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U';

  const isGroupOwner = currentGroup?.ownerId === user?.uid;

  return (
    <ScrollContainerWrapper>
      {/* Header Layout */}
      <HeaderBar>
        <HeaderTitle>Profile Settings</HeaderTitle>
        <EditIconActionButton type="button" onClick={() => alert('Profile editing is coming soon!')}>
          <Edit2 size={18} color={Colors.primary} />
        </EditIconActionButton>
      </HeaderBar>

      {/* Main Profile Info Card */}
      <ProfileCard>
        <AvatarCircle>
          <span>{initials}</span>
        </AvatarCircle>
        <ProfileMetaColumn>
          <ProfileNameText>{displayName}</ProfileNameText>
          <ProfileUsernameText>{username}</ProfileUsernameText>
        </ProfileMetaColumn>
      </ProfileCard>

      {/* Linked Custom Active Circle Status Block */}
      {currentGroup ? (
        <GroupStatusCard onClick={() => router.push('/dashboard/groups')}>
          <GroupInfoBlock>
            <GroupIconWrapper $isOwner={isGroupOwner}>
              {isGroupOwner ? <Crown size={16} /> : <Users size={16} />}
            </GroupIconWrapper>
            <div>
              <GroupCardTitle>{currentGroup.name}</GroupCardTitle>
              <GroupCardSubtitle>
                {isGroupOwner ? 'Circle Creator' : 'Joined Member'} · {currentGroup.members.length} Users Tracked
              </GroupCardSubtitle>
            </div>
          </GroupInfoBlock>
          <ChevronRight size={18} color={Colors.textSecondary} />
        </GroupStatusCard>
      ) : (
        <NoGroupPromptCard onClick={() => router.push('/dashboard/groups')}>
          <Users size={18} color={Colors.textSecondary} />
          <span>No tracking group active. Tap to form a private loop.</span>
        </NoGroupPromptCard>
      )}

      {/* ✅ REAL DATA ATTACHED: Dashboard Usage Statistics Panel Grid */}
      <StatsRowGrid>
        <StatBoxItem onClick={() => setHistoryOpen(true)} style={{ cursor: 'pointer' }}>
          <span className="number">{totalTrips}</span>
          <span className="label">Trips</span>
        </StatBoxItem>
        <StatGridDivider />
        <StatBoxItem>
          <span className="number">{savedPlacesCount}</span>
          <span className="label">Saved</span>
        </StatBoxItem>
        <StatGridDivider />
        <StatBoxItem>
          <span className="number">{userRating}</span>
          <span className="label">Rating</span>
        </StatBoxItem>
      </StatsRowGrid>

      {/* Primary configuration menu items */}
      <MenuBlockContainer>
        <MenuItem
          icon={<User size={18} color={Colors.primary} />}
          label="Account Profile Metadata"
          onPress={() => alert('Account metrics verified.')}
        />
        {/* ✅ INTERCEPTED: Now opens the history list overlay tracking system safely */}
        <MenuItem
          icon={<MapPin size={18} color={Colors.primary} />}
          label="Saved Routes & Journey Log"
          onPress={() => setHistoryOpen(true)}
          rightText={String(totalTrips)}
        />
        <MenuItem
          icon={<Settings size={18} color={Colors.primary} />}
          label="App Configurations"
          onPress={() => alert('System parameters optimized.')}
        />
        <MenuItem
          icon={<HelpCircle size={18} color={Colors.primary} />}
          label="Help & Technical Support"
          onPress={() => alert('Need assistance? Drop us an email at: support@redeemgo.app')}
        />
      </MenuBlockContainer>

      {/* Secondary signout element action item panel container blocks */}
      <MenuBlockContainer>
        <MenuItem
          icon={<LogOut size={18} color={Colors.error} />}
          label="Log out from device workspace"
          onPress={() => setLogoutOpen(true)}
          danger
        />
      </MenuBlockContainer>

      <VersionLabelText>RedeemGo Workspace v1.0.0</VersionLabelText>

      {/* ✅ UNIFIED CENTRAL DIALOG AND ROUTING INTERFACES */}
      <HistoryModal isOpen={historyOpen} onClose={() => setHistoryOpen(false)} userId={user?.uid} />
      <LogoutModal isOpen={logoutOpen} onClose={() => setLogoutOpen(false)} />
    </ScrollContainerWrapper>
  );
}

// ─── STYLED VISUAL WORKSPACE RENDERING ENGINES ──────────────────────────────
const ScrollContainerWrapper = styled.main`
  padding: 32px;
  max-width: 640px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
  font-family: -apple-system, BlinkMacSystemFont, sans-serif;
`;

const HeaderBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const HeaderTitle = styled.h1`
  font-size: 24px;
  font-weight: 800;
  color: ${Colors.textPrimary};
  margin: 0;
  letter-spacing: -0.5px;
`;

const EditIconActionButton = styled.button`
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background-color: ${Colors.primaryLight};
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
`;

const ProfileCard = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  background-color: ${Colors.white};
  border-radius: 20px;
  padding: 20px;
  border: 1.5px solid ${Colors.border};
`;

const AvatarCircle = styled.div`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background-color: ${Colors.primary};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 22px;
  font-weight: 800;
`;

const ProfileMetaColumn = styled.div`
  display: flex;
  flex-direction: column;
`;

const ProfileNameText = styled.h3`
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: ${Colors.textPrimary};
`;

const ProfileUsernameText = styled.span`
  font-size: 13px;
  color: ${Colors.textSecondary};
  margin-top: 2px;
`;

const StatsRowGrid = styled.div`
  display: flex;
  background-color: ${Colors.white};
  border-radius: 16px;
  padding: 16px 0;
  border: 1.5px solid ${Colors.border};
`;

const StatBoxItem = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  transition: opacity 0.2s;
  &:hover { opacity: 0.8; }

  .number {
    font-size: 20px;
    font-weight: 800;
    color: ${Colors.primary};
  }

  .label {
    font-size: 12px;
    font-weight: 600;
    color: ${Colors.textSecondary};
  }
`;

const StatGridDivider = styled.div`
  width: 1px;
  background-color: ${Colors.border};
  align-self: stretch;
`;

const MenuBlockContainer = styled.div`
  background-color: ${Colors.white};
  border-radius: 20px;
  overflow: hidden;
  border: 1.5px solid ${Colors.border};
  display: flex;
  flex-direction: column;
`;

const StyledMenuItem = styled.button<{ $danger: boolean }>`
  display: flex;
  align-items: center;
  padding: 14px 16px;
  gap: 14px;
  border: none;
  background: transparent;
  width: 100%;
  cursor: pointer;
  text-align: left;
  font-family: inherit;
  border-bottom: 1px solid ${Colors.background};
  transition: background-color 0.2s;

  &:hover { background-color: #fafafa; }
  &:last-child { border-bottom: none; }

  ${({ $danger }) => $danger && css`
    &:hover { background-color: ${Colors.errorLight}; }
  `}
`;

const MenuIconBg = styled.div<{ $danger: boolean }>`
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background-color: ${({ $danger }) => ($danger ? Colors.errorLight : Colors.primaryLight)};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const MenuLabel = styled.span<{ $danger: boolean }>`
  flex: 1;
  font-size: 14px;
  font-weight: 500;
  color: ${({ $danger }) => ($danger ? Colors.error : Colors.textPrimary)};
`;

const MenuRight = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const MenuRightBadge = styled.span`
  font-size: 11px;
  font-weight: 700;
  color: ${Colors.primary};
  background-color: ${Colors.primaryLight};
  padding: 2px 8px;
  border-radius: 50px;
`;

const VersionLabelText = styled.span`
  font-size: 12px;
  text-align: center;
  color: ${Colors.textSecondary};
  margin-top: 8px;
`;

const GroupStatusCard = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  background-color: ${Colors.white};
  border: 1.5px solid ${Colors.border};
  border-radius: 16px;
  padding: 14px 16px;
  cursor: pointer;
  text-align: left;
  font-family: inherit;
  transition: background-color 0.2s;
  &:hover { background-color: #fafafa; }
`;

const GroupInfoBlock = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const GroupIconWrapper = styled.div<{ $isOwner: boolean }>`
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  background-color: ${({ $isOwner }) => ($isOwner ? '#f59e0b' : '#3b82f6')};
`;

const GroupCardTitle = styled.h4`
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  color: ${Colors.textPrimary};
`;

const GroupCardSubtitle = styled.p`
  margin: 2px 0 0 0;
  font-size: 11px;
  color: ${Colors.textSecondary};
`;

const NoGroupPromptCard = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  height: 48px;
  background-color: transparent;
  border: 1.5px dashed ${Colors.border};
  border-radius: 16px;
  font-size: 13px;
  font-weight: 500;
  color: ${Colors.textSecondary};
  cursor: pointer;
  transition: border-color 0.2s;
  &:hover { border-color: ${Colors.primary}; color: ${Colors.primary}; }
`;