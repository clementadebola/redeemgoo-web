'use client';

import React from 'react';
import styled from 'styled-components';
import { useAuthStore } from '../../store/authStore';

const Container = styled.div`
  padding: 32px;
`;

export default function ProfilePage() {
  const profile = useAuthStore((state) => state.profile);

  return (
    <Container>
      <h1>Account Settings</h1>
      <p>Manage your Redemption City navigator settings here.</p>
      <div style={{ marginTop: '24px', background: 'white', padding: '24px', borderRadius: '16px' }}>
        <p><strong>Name:</strong> {profile?.displayName || 'User'}</p>
        <p><strong>Email:</strong> {profile?.email || 'N/A'}</p>
      </div>
    </Container>
  );
}