'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styled from 'styled-components';
import { User, Building2 } from 'lucide-react';

import { useAuthStore } from '../store/authStore';
import { useLocationStore } from '../store/locationStore';
import { useGroupStore } from '../store/groupStore';
import { useLocation } from '../hooks/useLocation';
import NotificationCenter from '../components/home/NotificationCenter';
import DestinationWidget from '../components/home/DestinationWidget';
import LiveLocationWidget from '../components/home/LiveLocationWidget';
import GroupWidget from '../components/home/GroupWidget'; 

const Colors = {
  primary: '#10b981',
  primaryLight: '#e6f7f0',
  textPrimary: '#1c1c1e',
  textSecondary: '#8e8e93',
  border: '#e5e5ea',
  white: '#ffffff'
};

const GREETING = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
};

const CATEGORIES = [
  { id: 'Auditoriums', icon: Building2 },
  { id: 'Halls', icon: Building2 },
];

export default function HomeScreen() {
  const router = useRouter();
  
  const user = useAuthStore((state) => state.user);
  const profile = useAuthStore((state) => state.profile);
  const { startTracking } = useLocationStore();
  

  const { userGroups, currentGroup, setCurrentGroup, listenToGroupAndNotifications } = useGroupStore();
  const { userLocation } = useLocation();

  useEffect(() => {
    if (!user?.uid) return;
    const unsub = listenToGroupAndNotifications(user.uid);
    return () => unsub();
  }, [user?.uid, listenToGroupAndNotifications]);

  const firstName = profile?.displayName?.split(' ')[0] ?? 'Traveler';

  const handleLocationBarClick = async () => {
    if (userLocation) {
      router.push('/dashboard/map');
    } else if (user?.uid) {
      await startTracking(user.uid);
    }
  };

  return (
    <ScreenContainer>
      {/* Top Profile & Notifications Bar */}
      <TopBar>
        <UserRow>
          <Avatar><User size={20} /></Avatar>
          <div>
            <GreetingText>{GREETING()},</GreetingText>
            <SidebarUserName>{firstName}.</SidebarUserName>
          </div>
        </UserRow>
        <NotificationCenter />
      </TopBar>

      {/* Hero Welcome Banner */}
      <HeroBanner>
        <HeroTitle>
          <span>Welcome to</span>
          Redemption City
        </HeroTitle>
        <Building2 size={40} opacity={0.8} />
      </HeroBanner>

      {/* ✅ ENCAPSULATED: The Group tracking block lives entirely inside GroupWidget now */}
      <GroupWidget 
        userGroups={userGroups}
        currentGroup={currentGroup}
        setCurrentGroup={setCurrentGroup}
        userId={user?.uid}
      />
      
      <DestinationWidget onClick={() => router.push('/dashboard/map')} />

      {/* Explore Grid */}
      <Section>
        <SectionTitle>Explore</SectionTitle>
        <CatScroll>
          {CATEGORIES.map((cat) => (
            <CatPill key={cat.id} onClick={() => router.push('/dashboard/map')}>
              <cat.icon size={16} color={Colors.primary} />
              {cat.id}
            </CatPill>
          ))}
        </CatScroll>
      </Section>

      <LiveLocationWidget userLocation={userLocation} onActivate={handleLocationBarClick} />
    </ScreenContainer>
  );
}

// ─── HIGH PERFORMANCE SCREEN STYLED LAYOUTS ────────────────────────────────
const ScreenContainer = styled.div`
  padding: 24px;
  max-width: 900px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
  
  @media(min-width: 768px) { padding: 32px; }
`;

const TopBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const UserRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const Avatar = styled.div`
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background-color: ${Colors.primaryLight};
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid ${Colors.border};
  color: ${Colors.primary};
`;

const GreetingText = styled.p`
  font-size: 13px;
  color: ${Colors.textSecondary};
  margin: 0;
`;

const SidebarUserName = styled.h3`
  font-size: 18px;
  font-weight: 700;
  color: ${Colors.textPrimary};
  margin: 0;
`;

const HeroBanner = styled.div`
  background-color: ${Colors.primary};
  border-radius: 20px;
  padding: 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: white;
  box-shadow: 0 10px 25px rgba(16, 185, 129, 0.15);
`;

const HeroTitle = styled.h1`
  font-size: 24px;
  font-weight: 800;
  margin: 0;
  span {
    display: block;
    font-size: 16px;
    font-weight: 400;
    opacity: 0.9;
  }
`;

const Section = styled.section`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const SectionTitle = styled.h4`
  font-size: 16px;
  font-weight: 700;
  margin: 0;
`;

const CatScroll = styled.div`
  display: flex;
  gap: 12px;
  overflow-x: auto;
  padding-bottom: 8px;
  
  /* ✅ FIXED: Smooth mobile touch scrolling */
  -webkit-overflow-scrolling: touch;
  scroll-behavior: smooth;
  
  /* Optional: Makes it snap neatly to the items like the map carousel */
  scroll-snap-type: x mandatory;
  
  /* Hide the scrollbar for a native app feel */
  scrollbar-width: none; /* Firefox */
  &::-webkit-scrollbar { 
    display: none; /* Chrome/Safari/Edge */
  }

  & > * {
    scroll-snap-align: start; /* Ensures items lock into place nicely */
  }
`;

const CatPill = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background-color: ${Colors.white};
  border-radius: 50px;
  border: 1.5px solid ${Colors.border};
  cursor: pointer;
  white-space: nowrap;
  font-weight: 500;
  color: ${Colors.textPrimary};
`;