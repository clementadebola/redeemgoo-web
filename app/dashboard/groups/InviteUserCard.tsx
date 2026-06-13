'use client';

import React, { useState } from 'react';
import styled from 'styled-components';
import { UserPlus, UserCheck } from 'lucide-react';
import { useGroupStore } from '../../store/groupStore';

const Colors = {
  primary: '#10b981',
  primaryLight: '#e6f7f0',
  textPrimary: '#1c1c1e',
  textSecondary: '#060607',
  border: '#e5e5ea',
  white: '#ffffff',
  error: '#ff3b30',
  errorLight: '#ffebe9',
  success: '#34c759',
  background: '#f8f9fa'
};

interface InviteUserCardProps {
  onInvite: (username: string) => Promise<{ success: boolean; message: string }>;
}

export default function InviteUserCard({ onInvite }: InviteUserCardProps) {
  const { searchResults, searchUsersByPrefix } = useGroupStore();
  
  const [searchUser, setSearchUser] = useState('');
  const [status, setStatus] = useState({ show: false, success: false, message: '' });
  const [loading, setLoading] = useState(false);

  // Fire prefix search as character keys change
  const handleInputChange = async (text: string) => {
    setSearchUser(text);
    await searchUsersByPrefix(text);
  };

  const handleSelectSuggested = (username: string) => {
    setSearchUser(username);
    useGroupStore.setState({ searchResults: [] }); // Dismiss suggestions panel layout container
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchUser.trim()) return;

    setLoading(true);
    const result = await onInvite(searchUser);
    setLoading(false);

    setStatus({ show: true, success: result.success, message: result.message });
    if (result.success) {
      setSearchUser('');
      useGroupStore.setState({ searchResults: [] });
    }
  };

  return (
    <InteractiveFormCard onSubmit={handleSubmit}>
      <SectionHeading><UserPlus size={18} /> Add by Username</SectionHeading>
      
      <InputWrapperContainer>
        <StyledTextInput 
          type="text" 
          placeholder="Enter exact username"
          value={searchUser}
          onChange={(e) => handleInputChange(e.target.value)}
          required
          autoComplete="off"
        />

        {/* Dynamic Suggestions List Overlay Menu */}
        {searchResults.length > 0 && (
          <SuggestionsListOverlay>
            {searchResults.map((suggestion) => (
              <SuggestionItemRow 
                key={suggestion.uid} 
                type="button"
                onClick={() => handleSelectSuggested(suggestion.username)}
              >
                <UserCheck size={14} color={Colors.primary} />
                <div>
                  <span className="name">{suggestion.displayName}</span>
                  <span className="username">@{suggestion.username}</span>
                </div>
              </SuggestionItemRow>
            ))}
          </SuggestionsListOverlay>
        )}
      </InputWrapperContainer>

      <SubmitButton type="submit" disabled={loading}>
        {loading ? 'Sending...' : 'Send In-App Invite'}
      </SubmitButton>
      
      {status.show && (
        <BannerFeedbackAlert $success={status.success}>
          {status.message}
        </BannerFeedbackAlert>
      )}
    </InteractiveFormCard>
  );
}

// ─── STYLED LOGIC DESIGN ENGINES ────────────────────────────────────────────

const InteractiveFormCard = styled.form`
  background-color: ${Colors.white};
  border: 1.5px solid ${Colors.border};
  border-radius: 24px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.01);
  position: relative;
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

const InputWrapperContainer = styled.div`
  position: relative;
  width: 100%;
`;

const StyledTextInput = styled.input`
  height: 48px;
  width: 100%;
  border-radius: 12px;
  color: #000000;
  border: 1.5px solid ${Colors.border};
  padding: 0 16px;
  font-size: 14px;
  outline: none;
  box-sizing: border-box;
  &:focus { border-color: ${Colors.primary}; }
`;

const SuggestionsListOverlay = styled.div`
  position: absolute;
  top: 52px;
  left: 0;
  width: 100%;
  background-color: ${Colors.white};
  border: 1.5px solid ${Colors.border};
  border-radius: 12px;
  box-shadow: 0 8px 20px rgba(0,0,0,0.08);
  z-index: 60;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const SuggestionItemRow = styled.button`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border: none;
  background: transparent;
  width: 100%;
  cursor: pointer;
  text-align: left;
  font-family: inherit;
  border-bottom: 1px solid ${Colors.background};
  
  &:hover { background-color: #fafafa; }
  &:last-child { border-bottom: none; }

  div {
    display: flex;
    flex-direction: column;
    .name { font-size: 13px; font-weight: 600; color: ${Colors.textPrimary}; }
    .username { font-size: 11px; color: ${Colors.textSecondary}; }
  }
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

const BannerFeedbackAlert = styled.div<{ $success: boolean }>`
  padding: 10px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 500;
  color: ${({ $success }) => ($success ? Colors.success : Colors.error)};
  background-color: ${({ $success }) => ($success ? Colors.primaryLight : Colors.errorLight)};
`;