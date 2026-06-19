'use client';

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useRouter, useSearchParams } from 'next/navigation'; 
import { 
  Users, Check, X, Bell, UserCheck, 
  ShieldAlert, MapPin, UserCheck2, ArrowRight, ArrowLeft,
  UserMinus, Settings, Trash2 
} from 'lucide-react';

import { useAuthStore } from '../../store/authStore';
import { useGroupStore } from '../../store/groupStore';

import InviteUserCard from './InviteUserCard';
import InviteGuestCard from './InviteGuestCard';

const Colors = {
  primary: '#10b981',
  primaryLight: '#e6f7f0',
  textPrimary: '#1C1C1E',
  textSecondary: '#8e8e93',
  border: '#e5e5ea',
  white: '#ffffff',
  error: '#ff3b30',
  errorLight: '#ffebe9',
  success: '#34c759',
  background: '#f8f9fa'
};

export default function GroupsManagerPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, profile } = useAuthStore();
  const store = useGroupStore();

  const [groupName, setGroupName] = useState('');

  const isCreationMode = searchParams.get('action') === 'create';

  useEffect(() => {
    if (!user?.uid) return;
    const disconnectStream = store.listenToGroupAndNotifications(user.uid);
    return () => disconnectStream();
  }, [user?.uid]);

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim() || !user?.uid || !profile) return;
    
    await store.createGroup(groupName.trim(), user.uid, profile.displayName, profile.username);
    setGroupName('');
    
    router.push('/dashboard');
  };

  const handleInviteAction = async (targetUsername: string) => {
    if (!user?.uid || !profile) return { success: false, message: 'Session invalid' };
    return await store.inviteUserByUsername(targetUsername, user.uid, profile.displayName);
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    // ✅ FIXED: Added a strict null check here to satisfy TypeScript
    if (!store.currentGroup) return;

    if (confirm(`Are you sure you want to remove ${memberName} from this circle?`)) {
      try {
        if (store.removeMemberFromGroup) {
          await store.removeMemberFromGroup(store.currentGroup.id, memberId);
        }
      } catch (error) {
        console.error("Failed to remove member:", error);
      }
    }
  };

  const isAloneInGroup = store.groupMembersProfiles.length <= 1;
  const isAdmin = store.currentGroup?.ownerId === user?.uid;

  return (
    <ContainerWrapper>
      {/* ─── NOTIFICATION INBOX PANEL SECTION ─── */}
      {store.notifications.length > 0 && !isCreationMode && (
        <InboxCard>
          <SectionHeading style={{ display: 'flex', alignItems: 'center', gap: '8px', color: Colors.primary }}>
            <Bell size={18} /> Dynamic Invitation Alerts ({store.notifications.length})
          </SectionHeading>
          <NotificationGrid>
            {store.notifications.map((notif) => (
              <NotificationItem key={notif.id}>
                <span>
                  <strong>{notif.fromUserName}</strong> invited you to join the circle: <strong>{notif.fromGroupName}</strong>
                </span>
                <ActionButtonsGroup>
                  <ActionButton 
                    $variant="success" 
                    onClick={() => store.respondToInvite(notif.id, true, user!.uid, profile!.displayName, profile!.username)}
                  >
                    <Check size={16} /> Accept
                  </ActionButton>
                  <ActionButton 
                    $variant="danger" 
                    onClick={() => store.respondToInvite(notif.id, false, user!.uid, profile!.displayName, profile!.username)}
                  >
                    <X size={16} /> Decline
                  </ActionButton>
                </ActionButtonsGroup>
              </NotificationItem>
            ))}
          </NotificationGrid>
        </InboxCard>
      )}

      {/* ─── MODIFIED MODULAR ROUTER GRID SECTION ─── */}
      {isCreationMode || !store.currentGroup ? (
        <InteractiveFormCard onSubmit={handleCreateGroup}>
          {store.userGroups?.length > 0 && (
            <BackButton type="button" onClick={() => router.push('/dashboard')}>
              <ArrowLeft size={16} />
              <span>Back to Dashboard</span>
            </BackButton>
          )}
          
          <Users size={48} color={Colors.primary} style={{ alignSelf: 'center', marginTop: '10px' }} />
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ margin: '0 0 6px 0', fontSize: '22px', fontWeight: '800' }}>Create Your Circle</h2>
            <p style={{ margin: 0, color: Colors.textSecondary, fontSize: '14px' }}>
              Form a secure layout group to trace your family members live in the city bounds.
            </p>
          </div>
          <InputGroup>
            <StyledTextInput 
              type="text" 
              placeholder="e.g., Adebayo Family Circle"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              required
            />
          </InputGroup>
          <SubmitButton type="submit" disabled={store.isLoading}>
            {store.isLoading ? 'Creating Circle...' : 'Initialize Group'}
          </SubmitButton>
        </InteractiveFormCard>
      ) : (
        <GroupDashboardLayout>
          {/* Main List Management Side Pane */}
          <MainSectionColumn>
            <HeaderControlRow>
              <div>
                {/* ✅ FIXED: Added optional chaining to properly handle TS strict mode */}
                <h1 style={{ fontSize: '20px', color: '#000000', fontWeight: '800', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {store.currentGroup?.name} 
                  {isAdmin && <AdminBadge>Admin</AdminBadge>}
                </h1>
                <p style={{ color: Colors.textSecondary, margin: '2px 0 0 0', fontSize: '14px' }}>
                  Active tracking metrics and circle geofencing alerts.
                </p>
              </div>
              <ActionButtonsGroup>
                {isAdmin && (
                  <SecondaryPanelButton onClick={() => alert('Group settings configuration modal coming soon.')} title="Group Settings">
                    <Settings size={16} />
                  </SecondaryPanelButton>
                )}
                <SecondaryPanelButton onClick={() => router.push('/dashboard')}>
                  Exit
                </SecondaryPanelButton>
              </ActionButtonsGroup>
            </HeaderControlRow>

            <TraceMapBarButton type="button" onClick={() => router.push('/dashboard/map')}>
              <MapBarContent>
                <MapIconCircle><MapPin size={18} /></MapIconCircle>
                <div>
                  <h5 style={{ margin: 0, fontSize: '14px', fontWeight: '700' }}>Trace All Members On Live Map</h5>
                  <p style={{ margin: 0, fontSize: '12px', opacity: 0.8 }}>Overlay everyone's coordinates onto a unified radar view</p>
                </div>
              </MapBarContent>
              <ArrowRight size={18} />
            </TraceMapBarButton>

            <SectionHeading>Circle Members ({store.groupMembersProfiles.length})</SectionHeading>
            
            <RosterGridList>
              {store.groupMembersProfiles.map((member) => (
                <RosterItemCard key={member.uid}>
                  <AvatarLabelIcon><UserCheck size={18} /></AvatarLabelIcon>
                  <MemberMeta>
                    <span className="name">{member.displayName} {member.uid === user?.uid && '(You)'}</span>
                    <span className="username">@{member.username}</span>
                  </MemberMeta>
                  
                  <GeofenceBadge $outside={member.isOutsideGeofence}>
                    {member.isOutsideGeofence ? <ShieldAlert size={12} /> : null}
                    {member.isOutsideGeofence ? 'Outside Campus' : 'Safe Inside'}
                  </GeofenceBadge>

                  {isAdmin && member.uid !== user?.uid && (
                    <RemoveMemberButton 
                      title={`Remove ${member.displayName}`} 
                      onClick={() => handleRemoveMember(member.uid, member.displayName)}
                    >
                      <UserMinus size={16} />
                    </RemoveMemberButton>
                  )}
                </RosterItemCard>
              ))}

              {isAloneInGroup && (
                <LoneUserSuggestionCard>
                  <UserCheck2 size={24} color={Colors.primary} />
                  <div>
                    <h5 style={{ margin: '0 0 2px 0', fontSize: '13px', fontWeight: '700', color: Colors.textPrimary }}>
                      It's a bit lonely here!
                    </h5>
                    <p style={{ margin: 0, fontSize: '12px', color: Colors.textSecondary, lineHeight: '1.4' }}>
                      You are the only member in this group. Use the invitation tools on the right sidebar panel to add your family or colleagues so you can track each other live!
                    </p>
                  </div>
                </LoneUserSuggestionCard>
              )}
            </RosterGridList>
          </MainSectionColumn>

          <SideSectionColumn>
            <InviteUserCard onInvite={handleInviteAction} />
            
            <InviteGuestCard 
              // ✅ FIXED: Added optional chaining and fallback empty strings
              groupId={store.currentGroup?.id || ''} 
              generateInviteLink={store.generateInviteLink} 
              currentGroupName={store.currentGroup?.name || ''}
            />

            {isAdmin && (
              <AdminControlsCard>
                <SectionHeading style={{ color: Colors.error, fontSize: '14px', marginBottom: '8px' }}>
                  Admin Danger Zone
                </SectionHeading>
                <p style={{ fontSize: '12px', color: Colors.textSecondary, margin: '0 0 16px 0' }}>
                  Irreversible administrative actions for group lifecycle management.
                </p>
                <ActionButton 
                  $variant="danger" 
                  style={{ width: '100%', justifyContent: 'center', padding: '10px' }}
                  onClick={() => confirm('Are you sure you want to disband this group permanently?')}
                >
                  <Trash2 size={16} /> Disband Entire Circle
                </ActionButton>
              </AdminControlsCard>
            )}

          </SideSectionColumn>
        </GroupDashboardLayout>
      )}
    </ContainerWrapper>
  );
}

// ─── ADDED NEW STYLES FOR ADMIN FEATURES ──────────────────────────────────
const AdminBadge = styled.span`
  background-color: ${Colors.primaryLight};
  color: ${Colors.primary};
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
  padding: 2px 6px;
  border-radius: 6px;
  margin-left: 8px;
  vertical-align: middle;
`;

const RemoveMemberButton = styled.button`
  background: ${Colors.errorLight};
  color: ${Colors.error};
  border: none;
  border-radius: 8px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  margin-left: 8px;
  flex-shrink: 0;

  &:hover {
    background: ${Colors.error};
    color: white;
  }
`;

const AdminControlsCard = styled.div`
  background: ${Colors.white};
  border: 1.5px solid ${Colors.errorLight};
  border-radius: 16px;
  padding: 16px;
  display: flex;
  flex-direction: column;
`;

// ─── EXISTING ALIGNMENT STYLES ───────────────────────────────────────────
const HeaderControlRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  margin-bottom: 8px;
`;

const SecondaryPanelButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f2f2f7;
  color: #1c1c1e;
  border: none;
  border-radius: 10px;
  padding: 8px 14px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s;
  &:hover { background: #e5e5ea; }
`;

const BackButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: none;
  color: ${Colors.textSecondary};
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  align-self: flex-start;
  padding: 0;
  margin-bottom: 4px;
  &:hover { color: ${Colors.textPrimary}; }
`;

// ─── CORE LAYOUT STYLES ───────────────────────────────────────────
const ContainerWrapper = styled.div`
  padding: 32px;
  max-width: 1000px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
`;
const InboxCard = styled.div`
  background: ${Colors.white};
  border: 1.5px solid ${Colors.border};
  border-radius: 20px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
`;
const NotificationGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;
const NotificationItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: ${Colors.background};
  border: 1px solid ${Colors.border};
  color: ${Colors.textPrimary};
  padding: 12px 16px;
  border-radius: 12px;
  font-size: 14px;
  @media(max-width: 768px) { flex-direction: column; gap: 12px; align-items: flex-start; }
`;
const ActionButtonsGroup = styled.div`
  display: flex;
  gap: 8px;
`;
const ActionButton = styled.button<{ $variant: 'success' | 'danger' }>`
  display: flex;
  align-items: center;
  gap: 4px;
  border: none;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  color: white;
  background-color: ${({ $variant }) => ($variant === 'success' ? Colors.success : Colors.error)};
`;
const InteractiveFormCard = styled.form`
  background-color: ${Colors.white};
  border: 1.5px solid ${Colors.border};
  border-radius: 24px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.01);
`;
const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
`;
const StyledTextInput = styled.input`
  height: 48px;
  border-radius: 12px;
  border: 1.5px solid ${Colors.border};
  padding: 0 16px;
  font-size: 14px;
  outline: none;
  &:focus { border-color: ${Colors.primary}; }
`;
const SubmitButton = styled.button`
  background-color: ${Colors.primary};
  color: white;
  border: none;
  border-radius: 12px;
  height: 48px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
  &:disabled { opacity: 0.6; }
`;
const GroupDashboardLayout = styled.div`
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 24px;
  @media(max-width: 768px) { grid-template-columns: 1fr; }
`;
const MainSectionColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;
const SideSectionColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;
const SectionHeading = styled.h4`
  font-size: 16px;
  font-weight: 700;
  margin: 0;
  color: #000000;
`;
const RosterGridList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;
const RosterItemCard = styled.div`
  background: ${Colors.white};
  border: 1.5px solid ${Colors.border};
  border-radius: 16px;
  padding: 14px;
  display: flex;
  align-items: center;
  gap: 12px;
`;
const AvatarLabelIcon = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background-color: ${Colors.primaryLight};
  color: ${Colors.primary};
  display: flex;
  align-items: center;
  justify-content: center;
`;
const MemberMeta = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  .name { font-weight: 600; font-size: 14px; color: ${Colors.textPrimary}; }
  .username { font-size: 12px; color: ${Colors.textSecondary}; }
`;
const GeofenceBadge = styled.div<{ $outside: boolean }>`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border-radius: 50px;
  font-size: 11px;
  font-weight: 700;
  color: ${({ $outside }) => ($outside ? Colors.error : Colors.success)};
  background-color: ${({ $outside }) => ($outside ? Colors.errorLight : Colors.primaryLight)};
`;
const TraceMapBarButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  background-color: #1c1c1e;
  color: white;
  border: none;
  border-radius: 18px;
  padding: 16px;
  cursor: pointer;
  text-align: left;
  font-family: inherit;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  transition: transform 0.2s, background-color 0.2s;
  &:hover {
    transform: translateY(-1px);
    background-color: #2c2c2e;
  }
`;
const MapBarContent = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
`;
const MapIconCircle = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background-color: rgba(16, 185, 129, 0.2);
  color: ${Colors.primary};
  display: flex;
  align-items: center;
  justify-content: center;
`;
const LoneUserSuggestionCard = styled.div`
  display: flex;
  gap: 14px;
  background-color: ${Colors.white};
  border: 1.5px dashed ${Colors.primary};
  border-radius: 16px;
  padding: 16px;
  align-items: flex-start;
`;