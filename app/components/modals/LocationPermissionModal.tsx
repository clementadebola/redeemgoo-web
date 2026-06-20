'use client';

import React, { useState } from 'react';
import styled from 'styled-components';
import { MapPin, ShieldCheck, X } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuthStore } from '../../store/authStore';

const Colors = {
  primary: '#10b981',
  primaryLight: '#e6f7f0',
  textPrimary: '#1c1c1e',
  textSecondary: '#8e8e93',
  white: '#ffffff',
  error: '#ff3b30',
  errorLight: '#ffebe9',
};

interface LocationPermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LocationPermissionModal({ isOpen, onClose }: LocationPermissionModalProps) {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleAllowLocation = () => {
    setLoading(true);
    setErrorMsg('');

    if (!navigator.geolocation) {
      setErrorMsg('Location services are not supported by your browser.');
      setLoading(false);
      return;
    }

    // Trigger the native browser prompt
    navigator.geolocation.getCurrentPosition(
      async () => {
        // User clicked "Allow" in the browser! Save preference to Firebase.
        try {
          if (user?.uid) {
            const profileRef = doc(db, 'users', user.uid);
            await updateDoc(profileRef, {
              locationEnabled: true,
              locationPrompted: true // So we don't ask again on login
            });
          }
          setLoading(false);
          onClose();
        } catch (err) {
          console.error("Failed to update profile", err);
          setLoading(false);
        }
      },
      (error) => {
        // User clicked "Block" in the browser
        setLoading(false);
        if (error.code === error.PERMISSION_DENIED) {
          setErrorMsg('Permission denied. Please enable location in your browser settings.');
        } else {
          setErrorMsg('Unable to retrieve your location. Try again.');
        }
      },
      { enableHighAccuracy: true }
    );
  };

  const handleDeny = async () => {
    if (user?.uid) {
      // Mark as prompted so we don't annoy them every time they log in
      const profileRef = doc(db, 'users', user.uid);
      await updateDoc(profileRef, { locationPrompted: true, locationEnabled: false });
    }
    onClose();
  };

  return (
    <Overlay onClick={handleDeny}>
      <ModalCard onClick={(e) => e.stopPropagation()}>
        <CloseButton onClick={handleDeny}>
          <X size={20} color={Colors.textSecondary} />
        </CloseButton>

        <IconCircle>
          <MapPin size={28} color={Colors.white} />
        </IconCircle>

        <Title>Enable Location Services</Title>
        <Description>
          To show you accurate routes to halls, banks, and gates inside Redemption City, we need access to your location.
        </Description>

        <PrivacyNote>
          <ShieldCheck size={14} color={Colors.primary} />
          <span>Your location is only shared with your active Circle.</span>
        </PrivacyNote>

        {errorMsg && <ErrorBanner>{errorMsg}</ErrorBanner>}

        <ActionRow>
          <SecondaryButton onClick={handleDeny} disabled={loading}>
            Not Now
          </SecondaryButton>
          <PrimaryButton onClick={handleAllowLocation} disabled={loading}>
            {loading ? 'Requesting...' : 'Allow Location'}
          </PrimaryButton>
        </ActionRow>
      </ModalCard>
    </Overlay>
  );
}


const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
  padding: 20px;
`;

const ModalCard = styled.div`
  background: ${Colors.white};
  border-radius: 24px;
  padding: 24px;
  width: 100%;
  max-width: 340px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  position: relative;
  box-shadow: 0 20px 40px rgba(0,0,0,0.1);
  animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);

  @keyframes slideUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

const CloseButton = styled.button`
  position: absolute;
  top: 16px;
  right: 16px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
`;

const IconCircle = styled.div`
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: ${Colors.primary};
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
  box-shadow: 0 8px 16px rgba(16, 185, 129, 0.25);
`;

const Title = styled.h2`
  font-size: 20px;
  font-weight: 800;
  color: ${Colors.textPrimary};
  margin: 0 0 8px 0;
`;

const Description = styled.p`
  font-size: 14px;
  color: ${Colors.textSecondary};
  line-height: 1.4;
  margin: 0 0 16px 0;
`;

const PrivacyNote = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  background: ${Colors.primaryLight};
  padding: 8px 12px;
  border-radius: 8px;
  margin-bottom: 24px;
  
  span {
    font-size: 11px;
    font-weight: 600;
    color: ${Colors.primary};
  }
`;

const ErrorBanner = styled.div`
  background: ${Colors.errorLight};
  color: ${Colors.error};
  font-size: 12px;
  font-weight: 600;
  padding: 8px 12px;
  border-radius: 8px;
  margin-bottom: 16px;
  width: 100%;
`;

const ActionRow = styled.div`
  display: flex;
  width: 100%;
  gap: 12px;
`;

const SecondaryButton = styled.button`
  flex: 1;
  height: 44px;
  border-radius: 12px;
  background: #f2f2f7;
  color: ${Colors.textPrimary};
  font-weight: 700;
  font-size: 14px;
  border: none;
  cursor: pointer;
`;

const PrimaryButton = styled.button`
  flex: 1;
  height: 44px;
  border-radius: 12px;
  background: ${Colors.primary};
  color: ${Colors.white};
  font-weight: 700;
  font-size: 14px;
  border: none;
  cursor: pointer;
  opacity: ${(props) => (props.disabled ? 0.7 : 1)};
`;