'use client';

import React from 'react';
import styled from 'styled-components';
import { ShieldAlert } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useLocationStore } from '../../store/locationStore';

const Colors = {
  textPrimary: '#1c1c1e',
  textSecondary: '#0A0A0A',
  white: '#ffffff',
  error: '#ff3b30',
  background: '#f2f2f7'
};

interface LogoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LogoutModal({ isOpen, onClose }: LogoutModalProps) {
  const logout = useAuthStore((state) => state.logout);
  const stopTracking = useLocationStore((state) => state.stopTracking);

  if (!isOpen) return null;

  const handleConfirmLogout = async () => {
    // 1. Turn off live background background GPS listeners safely
    if (stopTracking) stopTracking();
    
    // 2. Wipe the session credentials
    if (logout) {
      await logout();
    } else {
      useAuthStore.setState({ user: null, profile: null });
    }
    
    // 3. Clear window layout frame
    onClose();
  };

  return (
    <ModalBackdrop onClick={onClose}>
      <ModalCard onClick={(e) => e.stopPropagation()}>
        <ShieldAlert size={40} color={Colors.error} style={{ alignSelf: 'center' }} />
        <ModalTitle>Confirm Sign Out</ModalTitle>
        <ModalSubtitle>
          Are you sure you want to end your tracking session? You will stop sharing your live city boundaries status parameters.
        </ModalSubtitle>
        
        <ActionGroup>
          <ModalButton $primary={false} onClick={onClose}>
            Cancel
          </ModalButton>
          <ModalButton $primary={true} onClick={handleConfirmLogout}>
            Log Out Safely
          </ModalButton>
        </ActionGroup>
      </ModalCard>
    </ModalBackdrop>
  );
}

// ─── STYLED MODAL BOX MODULE STRUCTURES ─────────────────────────────────────
const ModalBackdrop = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  z-index: 999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
`;

const ModalCard = styled.div`
  background-color: ${Colors.white};
  border-radius: 24px;
  max-width: 380px;
  width: 100%;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  animation: modalPop 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);

  @keyframes modalPop {
    from { transform: scale(0.95); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
  }
`;

const ModalTitle = styled.h4`
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  text-align: center;
  color: ${Colors.textPrimary};
`;

const ModalSubtitle = styled.p`
  margin: 0;
  font-size: 13px;
  color: ${Colors.textSecondary};
  text-align: center;
  line-height: 1.5;
`;

const ActionGroup = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 4px;
`;

const ModalButton = styled.button<{ $primary: boolean }>`
  flex: 1;
  height: 44px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: opacity 0.2s;
  background-color: ${({ $primary }) => ($primary ? Colors.error : Colors.background)};
  color: ${({ $primary }) => ($primary ? Colors.white : Colors.textPrimary)};
  &:hover { opacity: 0.9; }
`;