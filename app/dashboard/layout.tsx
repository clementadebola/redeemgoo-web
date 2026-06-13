'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import styled from 'styled-components';
import { Map, User, Home, LogOut } from 'lucide-react';

// Firebase Engine Auth Handshakes
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase'; 
import { useAuthStore } from '../store/authStore';

// ✅ NEW COMPONENT IMPORT
import LogoutModal from '../(auth)/logout/page';

// ─── STYLED COMPONENTS ──────────────────────────────────────────────────────
const LayoutContainer = styled.div`
  display: flex;
  height: 100vh;
  width: 100vw;
  background-color: #f8f9fa;
  overflow: hidden;

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const Sidebar = styled.aside`
  width: 260px;
  background-color: #1c1c1e;
  color: white;
  display: flex;
  flex-direction: column;
  padding: 24px 16px;
  justify-content: space-between;
  flex-shrink: 0;

  @media (max-width: 768px) {
    display: none;
  }
`;

const NavGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const AppTitle = styled.h2`
  font-size: 18px;
  font-weight: 800;
  color: #10b981;
  margin-bottom: 32px;
  padding-left: 12px;
  letter-spacing: -0.5px;
`;

const NavLink = styled(Link)<{ $active: boolean }>`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 12px;
  color: ${({ $active }) => ($active ? '#ffffff' : '#8e8e93')};
  background-color: ${({ $active }) => ($active ? '#2c2c2e' : 'transparent')};
  text-decoration: none;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.2s ease;

  &:hover {
    background-color: #2c2c2e;
    color: white;
  }
`;

// Converted to semantic button to handle synthetic overlay preventions seamlessly
const NavButtonTrigger = styled.button`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 12px;
  color: #8e8e93;
  background: transparent;
  border: none;
  width: 100%;
  cursor: pointer;
  font-family: inherit;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.2s ease;

  &:hover {
    background-color: #2c2c2e;
    color: white;
  }
`;

const MobileTabBar = styled.nav`
  display: none;
  background-color: #1c1c1e;
  border-top: 1px solid #2c2c2e;
  height: 64px;
  width: 100%;
  position: relative;
  z-index: 30;

  @media (max-width: 768px) {
    display: flex;
    align-items: center;
    justify-content: space-around;
    padding-bottom: env(safe-area-inset-bottom);
  }
`;

const MobileTabLink = styled(Link)<{ $active: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  color: ${({ $active }) => ($active ? '#10b981' : '#8e8e93')};
  text-decoration: none;
  font-size: 11px;
  font-weight: 500;
  flex: 1;
  height: 100%;
  transition: color 0.2s ease;
`;

const MobileTabButtonTrigger = styled.button`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  color: #8e8e93;
  background: transparent;
  border: none;
  font-size: 11px;
  font-weight: 500;
  flex: 1;
  height: 100%;
  cursor: pointer;
  font-family: inherit;
  transition: color 0.2s ease;
`;

const MainContent = styled.main`
  flex: 1;
  overflow-y: auto;
  position: relative;
  width: 100%;
  height: 100%;
`;

const VerificationLoaderOverlay = styled.div`
  width: 100vw;
  height: 100vh;
  background-color: #f8f9fa;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: #8e8e93;
  font-family: -apple-system, BlinkMacSystemFont, sans-serif;
`;

// ─── COMPONENT ENTRY POINT PANEL ────────────────────────────────────────────
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const [isVerifying, setIsVerifying] = useState(true);
  // ✅ New layout overlay trigger switch
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const profileSnap = await getDoc(doc(db, 'profiles', firebaseUser.uid));
          
          if (profileSnap.exists()) {
            const rawData = profileSnap.data();
            
            useAuthStore.setState({ 
              user: firebaseUser,
              profile: {
                uid: rawData.uid ?? firebaseUser.uid,
                displayName: rawData.displayName ?? '',
                email: rawData.email ?? firebaseUser.email ?? '',
                username: rawData.username ?? '',
                ...rawData
              } 
            });
          } else {
            useAuthStore.setState({ user: firebaseUser });
          }
        } catch (error) {
          console.error("Failed background layout profiles matching sync:", error);
          useAuthStore.setState({ user: firebaseUser });
        }
      } else {
        useAuthStore.setState({ user: null, profile: null });
        router.replace('/login');
      }
      setIsVerifying(false);
    });

    return () => unsubscribe();
  }, [router]);

  if (isVerifying) {
    return <VerificationLoaderOverlay>Restoring session configuration tokens...</VerificationLoaderOverlay>;
  }

  return (
    <LayoutContainer>
      {/* 1. DESKTOP SIDEBAR VIEW RAIL */}
      <Sidebar>
        <NavGroup>
          <AppTitle>Redeem Go</AppTitle>
          
          <NavLink href="/dashboard" $active={pathname === '/dashboard'}>
            <Home size={20} /> Home
          </NavLink>
          
          <NavLink href="/dashboard/map" $active={pathname === '/dashboard/map'}>
            <Map size={20} /> Live Map
          </NavLink>
          
          <NavLink href="/dashboard/profile" $active={pathname === '/dashboard/profile'}>
            <User size={20} /> My Profile
          </NavLink>
        </NavGroup>

        {/* ✅ INTERCEPTED: Triggers modal instead of instant routing */}
        <NavButtonTrigger type="button" onClick={() => setLogoutModalOpen(true)}>
          <LogOut size={20} /> Sign Out
        </NavButtonTrigger>
      </Sidebar>

      {/* 2. THE CHOSEN PAGE VIEW SCREEN PORTAL */}
      <MainContent>{children}</MainContent>

      {/* 3. MOBILE RESPONSIVE BOTTOM TAB BAR */}
      <MobileTabBar>
        <MobileTabLink href="/dashboard" $active={pathname === '/dashboard'}>
          <Home size={22} />
          <span>Home</span>
        </MobileTabLink>

        <MobileTabLink href="/dashboard/map" $active={pathname === '/dashboard/map'}>
          <Map size={22} />
          <span>Map</span>
        </MobileTabLink>

        <MobileTabLink href="/dashboard/profile" $active={pathname === '/dashboard/profile'}>
          <User size={22} />
          <span>Profile</span>
        </MobileTabLink>

        {/* ✅ INTERCEPTED FOR MOBILE TOO */}
        <MobileTabButtonTrigger type="button" onClick={() => setLogoutModalOpen(true)}>
          <LogOut size={22} />
          <span>Exit</span>
        </MobileTabButtonTrigger>
      </MobileTabBar>

      {/* ✅ UNIFIED LAYOUT OVERLAY DIALOG INJECTION */}
      <LogoutModal isOpen={logoutModalOpen} onClose={() => setLogoutModalOpen(false)} />
    </LayoutContainer>
  );
}