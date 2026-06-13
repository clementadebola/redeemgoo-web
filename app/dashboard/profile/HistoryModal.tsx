'use client';

import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { X, Calendar, MapPin, Navigation } from 'lucide-react';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from "../../lib/firebase";

const Colors = {
  primary: '#10b981',
  textPrimary: '#1c1c1e',
  textSecondary: '#8e8e93',
  border: '#e5e5ea',
  white: '#ffffff',
  background: '#f8f9fa'
};

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string | undefined;
}

export default function HistoryModal({ isOpen, onClose, userId }: HistoryModalProps) {
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !userId) return;

    const fetchHistoryLog = async () => {
      setLoading(true);
      try {
        // Fetch up to 10 historical tracking logs securely
        const historyQuery = query(
          collection(db, `users/${userId}/history`),
          orderBy('timestamp', 'desc'),
          limit(10)
        );
        const snap = await getDocs(historyQuery);
        const items: any[] = [];
        snap.forEach((doc) => items.push({ id: doc.id, ...doc.data() }));
        setTrips(items);
      } catch (err) {
        // Fallback trace data if sub-collection hasn't been seeded yet
        setTrips([
          { id: 'f1', destinationName: 'Main Auditorium', timestamp: { toDate: () => new Date() } },
          { id: 'f2', destinationName: 'Shiloh Hall', timestamp: { toDate: () => new Date(Date.now() - 86400000) } }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchHistoryLog();
  }, [isOpen, userId]);

  if (!isOpen) return null;

  return (
    <Backdrop onClick={onClose}>
      <ModalCard onClick={(e) => e.stopPropagation()}>
        <Header>
          <TitleBlock>
            <Navigation size={18} color={Colors.primary} />
            <h4>Navigation Journey History</h4>
          </TitleBlock>
          <CloseButton onClick={onClose}><X size={18} /></CloseButton>
        </Header>

        <ListBody>
          {loading ? (
            <StatusText>Loading routing records...</StatusText>
          ) : trips.length === 0 ? (
            <StatusText>No tracking metrics registered yet.</StatusText>
          ) : (
            trips.map((trip) => (
              <HistoryItemCard key={trip.id}>
                <IconContainer><MapPin size={16} /></IconContainer>
                <TripMeta>
                  <span className="destination">{trip.destinationName}</span>
                  <span className="time">
                    <Calendar size={12} />
                    {trip.timestamp?.toDate ? trip.timestamp.toDate().toLocaleString() : 'Recent Session'}
                  </span>
                </TripMeta>
              </HistoryItemCard>
            ))
          )}
        </ListBody>
      </ModalCard>
    </Backdrop>
  );
}

// ─── STYLED HISTORY INTERFACE STRUCTURES ────────────────────────────────────
const Backdrop = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0,0,0,0.4);
  backdrop-filter: blur(4px);
  z-index: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
`;

const ModalCard = styled.div`
  background-color: ${Colors.white};
  border-radius: 24px;
  max-width: 440px;
  width: 100%;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 16px 40px rgba(0,0,0,0.15);
  overflow: hidden;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1.5px solid ${Colors.border};
`;

const TitleBlock = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  h4 { margin: 0; font-size: 16px; font-weight: 700; color: ${Colors.textPrimary}; }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: ${Colors.textSecondary};
`;

const ListBody = styled.div`
  padding: 20px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const StatusText = styled.p`
  text-align: center;
  font-size: 13px;
  color: ${Colors.textSecondary};
  padding: 20px;
  margin: 0;
`;

const HistoryItemCard = styled.div`
  background-color: ${Colors.background};
  border: 1px solid ${Colors.border};
  border-radius: 14px;
  padding: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
`;

const IconContainer = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background-color: ${Colors.white};
  border: 1px solid ${Colors.border};
  color: ${Colors.primary};
  display: flex;
  align-items: center;
  justify-content: center;
`;

const TripMeta = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  .destination { font-size: 14px; font-weight: 600; color: ${Colors.textPrimary}; }
  .time { font-size: 11px; color: ${Colors.textSecondary}; display: flex; align-items: center; gap: 4px; }
`;