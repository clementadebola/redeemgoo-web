'use client';

import React, { useState } from 'react';
import styled from 'styled-components';
import { Link2 } from 'lucide-react';

const Colors = {
  primary: '#10b981',
  textSecondary: '#8e8e93',
  border: '#e5e5ea',
  white: '#ffffff',
  success: '#34c759'
};

// ✅ FIXED: Added currentGroupName to the TypeScript interface matching the parent passing it
interface InviteGuestCardProps {
  groupId: string;
  generateInviteLink: (id: string) => string;
  currentGroupName?: string; 
}

export default function InviteGuestCard({ groupId, generateInviteLink, currentGroupName }: InviteGuestCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    const path = generateInviteLink(groupId);
    navigator.clipboard.writeText(path);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <InteractiveFormCard>
      <SectionHeading><Link2 size={18} /> Invite External Guests</SectionHeading>
      <p style={{ margin: 0, fontSize: '12px', color: Colors.textSecondary, lineHeight: '1.4' }}>
        Share this magic tracking authorization link with users who do not have an active account yet. It will direct them through registration straight into your tracking loop 
        {currentGroupName ? ` for ${currentGroupName}` : ''}.
      </p>
      <SubmitButton 
        type="button" 
        onClick={handleCopyLink} 
        $success={copied}
      >
        {copied ? 'Link Copied to Clipboard!' : 'Copy Guest Registration Link'}
      </SubmitButton>
    </InteractiveFormCard>
  );
}

const InteractiveFormCard = styled.div`
  background-color: ${Colors.white};
  border: 1.5px solid ${Colors.border};
  border-radius: 24px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.01);
`;

const SectionHeading = styled.h4`
  font-size: 16px;
  font-weight: 700;
  margin: 0;
  color: #000000;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const SubmitButton = styled.button<{ $success: boolean }>`
  background-color: ${({ $success }) => ($success ? Colors.success : Colors.primary)};
  color: white;
  border: none;
  border-radius: 12px;
  height: 48px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s ease, opacity 0.2s;
  &:hover { opacity: 0.9; }
`;