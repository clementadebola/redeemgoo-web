'use client';

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useRouter } from 'next/navigation';
import { 
  Users, Check, X, Bell, UserCheck, 
  ShieldAlert, MapPin, UserCheck2, ArrowRight 
} from 'lucide-react';

import { useAuthStore } from '../../store/authStore';
import { useGroupStore } from '../../store/groupStore';

// Modular Component Imports
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
  const { user, profile } = useAuthStore();
  const store = useGroupStore();

  const [groupName, setGroupName] = useState('');

  useEffect(() => {
    if (!user?.uid) return;
    const disconnectStream = store.listenToGroupAndNotifications(user.uid);
    return () => disconnectStream();
  }, [user?.uid]);

  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim() || !user?.uid || !profile) return;
    store.createGroup(groupName.trim(), user.uid, profile.displayName, profile.username);
  };

  const handleInviteAction = async (targetUsername: string) => {
    if (!user?.uid || !profile) return { success: false, message: 'Session invalid' };
    return await store.inviteUserByUsername(targetUsername, user.uid, profile.displayName);
  };

  const isAloneInGroup = store.groupMembersProfiles.length <= 1;

  return (
    <ContainerWrapper>
      {/* ─── NOTIFICATION INBOX PANEL SECTION ─── */}
      {store.notifications.length > 0 && (
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

      {/* ─── GROUP STATUS ENGINE CONDITIONAL ROUTER ─── */}
      {!store.currentGroup ? (
        <InteractiveFormCard onSubmit={handleCreateGroup}>
          <Users size={48} color={Colors.primary} style={{ alignSelf: 'center' }} />
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
            <h1 style={{ fontSize: '20px', color: '#000000', fontWeight: '800', margin: 0 }}>{store.currentGroup.name}</h1>
            <p style={{ color: Colors.textSecondary, margin: '-4px 0 12px 0', fontSize: '14px' }}>
              Active tracking metrics and circle geofencing alerts.
            </p>

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

          {/* Invitation Side Column Panels Wrapper */}
          <SideSectionColumn>
            <InviteUserCard onInvite={handleInviteAction} />
            <InviteGuestCard 
              groupId={store.currentGroup.id} 
              generateInviteLink={store.generateInviteLink} 
            />
          </SideSectionColumn>
        </GroupDashboardLayout>
      )}
    </ContainerWrapper>
  );
}

// ─── STYLED DESIGN INFRASTRUCTURE ELEMENTS ──────────────────────────────────
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