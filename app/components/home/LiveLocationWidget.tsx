'use client';

import React from 'react';
import styled from 'styled-components';
import { Locate } from 'lucide-react';

const Colors = {
  primary: '#10b981',
  textPrimary: '#1c1c1e',
  textSecondary: '#8e8e93',
  border: '#e5e5ea',
  white: '#ffffff',
  success: '#34c759'
};

interface LiveLocationProps {
  userLocation: { latitude: number; longitude: number } | null;
  onActivate: () => void;
}

export default function LiveLocationWidget({ userLocation, onActivate }: LiveLocationProps) {
  return (
    <InteractiveLocationButton onClick={onActivate}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <StatusDot $active={!!userLocation} />
        <div>
          <p style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: Colors.textPrimary }}>
            {userLocation ? 'Location Active' : 'Location Inactive - Tap to Enable'}
          </p>
          <p style={{ margin: 0, fontSize: '12px', color: Colors.textSecondary }}>
            {userLocation 
              ? `${userLocation.latitude.toFixed(4)}, ${userLocation.longitude.toFixed(4)}` 
              : 'Click here to prompt the browser geolocation permission request.'}
          </p>
        </div>
      </div>
      <Locate size={20} color={userLocation ? Colors.success : Colors.textSecondary} />
    </InteractiveLocationButton>
  );
}

const InteractiveLocationButton = styled.button`
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: ${Colors.white};
  border-radius: 16px;
  padding: 16px;
  border: 1.5px solid ${Colors.border};
  width: 100%;
  cursor: pointer;
  text-align: left;
  font-family: inherit;
  transition: background-color 0.2s ease;
  &:hover { background-color: #fafafa; }
`;

const StatusDot = styled.div<{ $active: boolean }>`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: ${({ $active }) => ($active ? Colors.success : Colors.textSecondary)};
`;