'use client';

import React from 'react';
import styled from 'styled-components';
import { Plus } from 'lucide-react';

const Colors = {
  primary: '#10b981',
  textSecondary: '#8e8e93',
  border: '#e5e5ea',
  white: '#ffffff',
};

export default function DestinationWidget({ onClick }: { onClick: () => void }) {
  return (
    <AddCard onClick={onClick}>
      <AddIconCircle><Plus size={24} /></AddIconCircle>
      <h4 style={{ fontSize: '16px', fontWeight: '700', margin: 0 }}>Add Destination</h4>
      <p style={{ fontSize: '13px', color: Colors.textSecondary, margin: 0 }}>
        Input where you want to go.
      </p>
    </AddCard>
  );
}

const AddCard = styled.button`
  background-color: ${Colors.white};
  border-radius: 20px;
  padding: 32px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  border: 1.5px dashed ${Colors.border};
  cursor: pointer;
  width: 100%;
  transition: transform 0.2s;
  &:hover { transform: translateY(-2px); }
`;

const AddIconCircle = styled.div`
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background-color: ${Colors.primary};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.35);
`;