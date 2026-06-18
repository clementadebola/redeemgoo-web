'use client';

import React, { useState, useEffect, useMemo } from 'react';
import styled, { css } from 'styled-components';
import { useRouter } from 'next/navigation';
import { 
  User, MapPin, Settings, HelpCircle, LogOut, 
  ChevronRight, Edit2, Users, Crown, Key, Save, X, ChevronDown, ChevronUp
} from 'lucide-react';
import { updatePassword, updateProfile } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../../lib/firebase';
import { useAuthStore } from '../../store/authStore';
import { useGroupStore } from '../../store/groupStore';

// Component Injections
import HistoryModal from './HistoryModal';
import LogoutModal from '../../(auth)/logout/page';

const Colors = {
  primary: '#10b981',
  primaryLight: '#e6f7f0',
  textPrimary: '#1c1c1e',
  textSecondary: '#353538',
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
  
  // ✅ EXACT MATCH TO YOUR HOME PAGE STORE SCHEMA
  const { userGroups = [], listenToGroupAndNotifications } = useGroupStore(); 

  // Interaction Panel States
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const [groupsExpanded, setGroupsExpanded] = useState(false);
  
  // Forms Inputs States
  const [editName, setEditName] = useState(profile?.displayName ?? user?.displayName ?? '');
  const [editUsername, setEditUsername] = useState(profile?.username ?? '');
  const [newPassword, setNewPassword] = useState('');
  
  // Feedback States
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });
  const [actionLoading, setActionLoading] = useState(false);

  // Dialog window states
  const [historyOpen, setHistoryOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);

  // ✅ REAL-TIME LISTENER MATRIX AS DONE ON HOME PAGE
  useEffect(() => {
    if (!user?.uid) return;
    const unsub = listenToGroupAndNotifications(user.uid);
    return () => unsub();
  }, [user?.uid, listenToGroupAndNotifications]);

  const displayName = profile?.displayName ?? user?.displayName ?? 'Traveler';
  const username = profile?.username ? `@${profile.username}` : user?.email ?? '';
  
  const totalTrips = profile?.tripsCount ?? 0;
  const savedPlacesCount = profile?.savedPlaces?.length ?? 0;
  const userRating = profile?.rating ?? '5.0';

  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U';

  // ✅ CAP TO A MINIMUM OF 2 GROUPS BY DEFAULT
  const visibleGroups = useMemo(() => {
    return groupsExpanded ? userGroups : userGroups.slice(0, 2);
  }, [userGroups, groupsExpanded]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid) return;
    setActionLoading(true);
    setStatusMsg({ type: '', text: '' });

    try {
      await updateProfile(user, { displayName: editName });
      
      const profileRef = doc(db, 'users', user.uid);
      await updateDoc(profileRef, {
        displayName: editName,
        username: editUsername.replace('@', '').trim()
      });

      setStatusMsg({ type: 'success', text: 'Profile changes mapped successfully!' });
      setIsEditing(false);
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Verification link timeout.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const activeUser = auth.currentUser;
    if (!activeUser || newPassword.length < 6) {
      setStatusMsg({ type: 'error', text: 'Password must match minimum 6 alphanumeric characters.' });
      return;
    }
    setActionLoading(true);
    setStatusMsg({ type: '', text: '' });

    try {
      await updatePassword(activeUser, newPassword);
      setStatusMsg({ type: 'success', text: 'Master authorization password updated.' });
      setNewPassword('');
      setShowPasswordFields(false);
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Requires fresh session re-authentication.' });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <ScrollContainerWrapper>
      {/* Header Layout */}
      <HeaderBar>
        <ProfileHeaderTitle>Profile Settings</ProfileHeaderTitle>
        <EditIconActionButton type="button" onClick={() => setIsEditing(!isEditing)}>
          {isEditing ? <X size={18} color={Colors.error} /> : <Edit2 size={18} color={Colors.primary} />}
        </EditIconActionButton>
      </HeaderBar>

      {/* Global Status Banner Alert */}
      {statusMsg.text && (
        <StatusMessageAlert $type={statusMsg.type}>
          {statusMsg.text}
        </StatusMessageAlert>
      )}

      {/* Profile Modification Cards View */}
      {isEditing ? (
        <InteractiveFormCard onSubmit={handleSaveProfile}>
          <FormRowGrid>
            <label>DISPLAY LANDMARK NAME</label>
            <input type="text" value={editName} onChange={e => setEditName(e.target.value)} required />
          </FormRowGrid>
          <FormRowGrid>
            <label>SYSTEM USERNAME HANDLE</label>
            <input type="text" value={editUsername} onChange={e => setEditUsername(e.target.value)} placeholder="username" required />
          </FormRowGrid>
          <ActionSubmissionRow>
            <FormSubmitButton type="submit" disabled={actionLoading}>
              <Save size={14} /> <span>{actionLoading ? 'Saving...' : 'Commit Changes'}</span>
            </FormSubmitButton>
            <PasswordToggleLink type="button" onClick={() => setShowPasswordFields(!showPasswordFields)}>
              <Key size={14} /> <span>Security Override</span>
            </PasswordToggleLink>
          </ActionSubmissionRow>
        </InteractiveFormCard>
      ) : (
        <ProfileCard>
          <AvatarCircle>
            <span>{initials}</span>
          </AvatarCircle>
          <ProfileMetaColumn>
            <ProfileNameText>{displayName}</ProfileNameText>
            <ProfileUsernameText>{username}</ProfileUsernameText>
          </ProfileMetaColumn>
        </ProfileCard>
      )}

      {/* Password override drawer */}
      {showPasswordFields && isEditing && (
        <InteractiveFormCard onSubmit={handleUpdatePassword} style={{ borderTop: `2px dashed ${Colors.border}`, marginTop: '-12px' }}>
          <FormRowGrid>
            <label>NEW SECURITY ENCRYPTION KEY PHRASE</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              value={newPassword} 
              onChange={e => setNewPassword(e.target.value)} 
              required 
            />
          </FormRowGrid>
          <FormSubmitButton type="submit" style={{ background: Colors.textPrimary }} disabled={actionLoading}>
            Update Access Key
          </FormSubmitButton>
        </InteractiveFormCard>
      )}

      {/* Dynamic Network Circles Roster Layout */}
      <SectionHeadingBlock>Your Circle Networks</SectionHeadingBlock>
      {visibleGroups.length > 0 ? (
        <GroupsTrackingRosterContainer>
          {visibleGroups.map((group) => {
            const amIOwner = group.ownerId === user?.uid;
            return (
              <GroupStatusCard key={group.id} onClick={() => router.push(`/dashboard/map`)}>
                <GroupInfoBlock>
                  <GroupIconWrapper $isOwner={amIOwner}>
                    {amIOwner ? <Crown size={16} /> : <Users size={16} />}
                  </GroupIconWrapper>
                  <div>
                    <GroupCardTitle>{group.name}</GroupCardTitle>
                    <GroupCardSubtitle>
                      {amIOwner ? 'Circle Creator' : 'Joined Member'} · {group.members?.length || 0} Users Mapped
                    </GroupCardSubtitle>
                  </div>
                </GroupInfoBlock>
                <ChevronRight size={18} color={Colors.textSecondary} />
              </GroupStatusCard>
            );
          })}

          {/* Toggle triggers the userGroups visibility count */}
          {userGroups.length > 2 && (
            <ShowMoreToggleButton type="button" onClick={() => setGroupsExpanded(!groupsExpanded)}>
              <span>{groupsExpanded ? 'Collapse Pipelines' : `View All Registered Circles (${userGroups.length})`}</span>
              {groupsExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </ShowMoreToggleButton>
          )}
        </GroupsTrackingRosterContainer>
      ) : (
        <NoGroupPromptCard onClick={() => router.push('/dashboard/groups')}>
          <Users size={18} color={Colors.textSecondary} />
          <span>No tracking group active. Tap to form a private loop.</span>
        </NoGroupPromptCard>
      )}

      {/* Usage Metrics Panel Grid */}
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

      {/* Configuration Menu Actions Stack */}
      <MenuBlockContainer>
        <MenuItem
          icon={<User size={18} color={Colors.primary} />}
          label="Account Profile Metadata"
          onPress={() => alert('Account metrics verified.')}
        />
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

      {/* Disconnect Workspace Action Controls */}
      <MenuBlockContainer>
        <MenuItem
          icon={<LogOut size={18} color={Colors.error} />}
          label="Log out from device workspace"
          onPress={() => setLogoutOpen(true)}
          danger
        />
      </MenuBlockContainer>

      <VersionLabelText>RedeemGo Workspace v1.0.0</VersionLabelText>

      <HistoryModal isOpen={historyOpen} onClose={() => setHistoryOpen(false)} userId={user?.uid} />
      <LogoutModal isOpen={logoutOpen} onClose={() => setLogoutOpen(false)} />
    </ScrollContainerWrapper>
  );
}

// ─── STYLED DESIGN WORKSPACE PANELS ──────────────────────────────────────────
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

const ProfileHeaderTitle = styled.h1`
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

const InteractiveFormCard = styled.form`
  background-color: ${Colors.white};
  border: 1.5px solid ${Colors.border};
  border-radius: 20px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const FormRowGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  label { font-size: 10px; font-weight: 800; color: ${Colors.textSecondary}; letter-spacing: 0.3px; }
  input { height: 44px; color: #887D7D; border-radius: 10px; border: 1.5px solid ${Colors.border}; padding: 0 12px; outline: none; font-size: 12px; font-weight: 500; &:focus { border-color: ${Colors.primary}; } }
`;

const ActionSubmissionRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 4px;
`;

const FormSubmitButton = styled.button`
  background: ${Colors.primary};
  color: white;
  border: none;
  height: 40px;
  padding: 0 16px;
  border-radius: 10px;
  font-weight: 700;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  &:disabled { opacity: 0.6; }
`;

const PasswordToggleLink = styled.button`
  background: none;
  border: none;
  color: ${Colors.textSecondary};
  font-size: 12px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  &:hover { color: ${Colors.primary}; }
`;

const SectionHeadingBlock = styled.h4`
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  color: ${Colors.textSecondary};
  letter-spacing: 0.5px;
  margin: 8px 0 -12px 2px;
`;

const GroupsTrackingRosterContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const ShowMoreToggleButton = styled.button`
  background: none;
  border: none;
  color: ${Colors.primary};
  font-size: 13px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  margin-top: 4px;
  cursor: pointer;
`;

const StatusMessageAlert = styled.div<{ $type: string }>`
  padding: 12px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 600;
  text-align: center;
  background-color: ${({ $type }) => ($type === 'success' ? Colors.primaryLight : Colors.errorLight)};
  color: ${({ $type }) => ($type === 'success' ? Colors.primary : Colors.error)};
  border: 1px solid ${({ $type }) => ($type === 'success' ? 'rgba(16,185,129,0.15)' : 'rgba(255,59,48,0.15)')};
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

  .number { font-size: 20px; font-weight: 800; color: ${Colors.primary}; }
  .label { font-size: 12px; font-weight: 600; color: ${Colors.textSecondary}; }
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