'use client';

import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { Bell, Check, X, ShieldAlert, Mail } from 'lucide-react';
import { useGroupStore } from '../../store/groupStore';
import { useAuthStore } from '../../store/authStore';

const Colors = {
  primary: '#10b981',
  primaryLight: '#e6f7f0',
  textPrimary: '#1c1c1e',
  textSecondary: '#8e8e93',
  border: '#e5e5ea',
  white: '#ffffff',
  error: '#ff3b30',
  success: '#34c759',
  background: '#f8f9fa'
};

export default function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const { user, profile } = useAuthStore();
  const { notifications, respondToInvite } = useGroupStore();

  // Close the popup dropdown if the user clicks outside of it on their screen
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <Wrapper ref={dropdownRef}>
      {/* Target Notification Button trigger element */}
      <NotifButton type="button" onClick={() => setIsOpen(!isOpen)}>
        <Bell size={20} color={Colors.textPrimary} />
        {notifications.length > 0 && <NotifDot />}
      </NotifButton>

      {/* Floating Dropdown Frame Layout Overlay */}
      {isOpen && (
        <DropdownMenuContainer>
          <DropdownHeader>
            <h4>Alert Notifications</h4>
            {notifications.length > 0 && <BadgeCount>{notifications.length} pending</BadgeCount>}
          </DropdownHeader>

          <NotificationList>
            {notifications.length === 0 ? (
              <EmptyStateBlock>
                <Mail size={24} color={Colors.textSecondary} />
                <p>Your notification tray is completely clear!</p>
              </EmptyStateBlock>
            ) : (
              notifications.map((notif) => (
                <NotificationCardItem key={notif.id}>
                  <CardContentRow>
                    <IconLabelContainer><UsersIconWrapper /></IconLabelContainer>
                    <TextDetailsColumn>
                      <p className="description">
                        <strong>{notif.fromUserName}</strong> invited you to join the circle <span>{notif.fromGroupName}</span>.
                      </p>
                    </TextDetailsColumn>
                  </CardContentRow>

                  <ActionRowButtonGroup>
                    <ActionButton 
                      $variant="success"
                      onClick={async () => {
                        await respondToInvite(notif.id, true, user!.uid, profile!.displayName, profile!.username);
                        setIsOpen(false);
                      }}
                    >
                      <Check size={14} /> Accept
                    </ActionButton>
                    <ActionButton 
                      $variant="danger"
                      onClick={async () => {
                        await respondToInvite(notif.id, false, user!.uid, profile!.displayName, profile!.username);
                        setIsOpen(false);
                      }}
                    >
                      <X size={14} /> Skip
                    </ActionButton>
                  </ActionRowButtonGroup>
                </NotificationCardItem>
              ))
            )}
          </NotificationList>
        </DropdownMenuContainer>
      )}
    </Wrapper>
  );
}

// ─── STYLED DESIGN UTILITIES ────────────────────────────────────────────────
const Wrapper = styled.div`
  position: relative;
  display: inline-block;
`;

const NotifButton = styled.button`
  width: 44px;
  height: 44px;
  border-radius: 14px;
  background-color: ${Colors.white};
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1.5px solid ${Colors.border};
  cursor: pointer;
  position: relative;
  transition: background-color 0.2s;
  &:hover { background-color: #fafafa; }
`;

const NotifDot = styled.div`
  position: absolute;
  top: 10px;
  right: 10px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: ${Colors.error};
  border: 1.5px solid ${Colors.white};
`;

const DropdownMenuContainer = styled.div`
  position: absolute;
  top: 54px;
  right: 0;
  width: 340px;
  background-color: ${Colors.white};
  border: 1.5px solid ${Colors.border};
  border-radius: 20px;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12);
  z-index: 100;
  overflow: hidden;
`;

const DropdownHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid ${Colors.border};
  h4 { margin: 0; font-size: 15px; font-weight: 700; color: ${Colors.textPrimary}; }
`;

const BadgeCount = styled.span`
  background-color: ${Colors.error || '#ffebe9'};
  color: ${Colors.error};
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 50px;
`;

const NotificationList = styled.div`
  max-height: 380px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
`;

const EmptyStateBlock = styled.div`
  padding: 32px 16px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  p { margin: 0; font-size: 13px; color: ${Colors.textSecondary}; }
`;

const NotificationCardItem = styled.div`
  padding: 16px;
  border-bottom: 1px solid ${Colors.background};
  display: flex;
  flex-direction: column;
  gap: 12px;
  &:last-child { border-bottom: none; }
  &:hover { background-color: #fcfcfc; }
`;

const CardContentRow = styled.div`
  display: flex;
  gap: 12px;
`;

const IconLabelContainer = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background-color: ${Colors.primaryLight};
  color: ${Colors.primary};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const UsersIconWrapper = () => <span style={{ fontSize: '14px' }}>👥</span>;

const TextDetailsColumn = styled.div`
  display: flex;
  flex-direction: column;
  .description {
    margin: 0;
    font-size: 13px;
    line-height: 1.4;
    color: ${Colors.textPrimary};
    span { color: ${Colors.primary}; font-weight: 600; }
  }
`;

const ActionRowButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
`;

const ActionButton = styled.button<{ $variant: 'success' | 'danger' }>`
  border: none;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  color: white;
  background-color: ${({ $variant }) => ($variant === 'success' ? Colors.success : Colors.textSecondary)};
  transition: opacity 0.2s;
  &:hover { opacity: 0.9; }
`;