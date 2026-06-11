'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styled from 'styled-components';
import { Map, User, Home, LogOut } from 'lucide-react';

// ─── STYLED COMPONENTS ──────────────────────────────────────────────────────

const LayoutContainer = styled.div`
  display: flex;
  height: 100vh;
  width: 100vw;
  background-color: #f8f9fa;
  overflow: hidden;

  /* On mobile, stack layout elements vertically to accommodate the bottom bar */
  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

/* DESKTOP SIDEBAR */
const Sidebar = styled.aside`
  width: 260px;
  background-color: #1c1c1e;
  color: white;
  display: flex;
  flex-direction: column;
  padding: 24px 16px;
  justify-content: space-between;
  flex-shrink: 0;

  /* Completely hide sidebar view frame on mobile sizes */
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

/* SHARED LINK STYLING FOR SIDEBAR */
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

/* MOBILE BOTTOM TAB BAR CONTAINER */
const MobileTabBar = styled.nav`
  display: none; /* Default hidden on laptop monitors */
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
    padding-bottom: env(safe-area-inset-bottom); /* Fixes iOS bottom home bar notch overlap */
  }
`;

/* INDIVIDUAL MOBILE TAB BUTTON LINK */
const MobileTabLink = styled(Link)<{ $active: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  color: ${({ $active }) => ($active ? '#10b981' : '#8e8e93')}; /* Highlight color on active mobile view */
  text-decoration: none;
  font-size: 11px;
  font-weight: 500;
  flex: 1;
  height: 100%;
  transition: color 0.2s ease;
`;

const MainContent = styled.main`
  flex: 1;
  overflow-y: auto;
  position: relative;
  width: 100%;
  height: 100%;
`;

// ─── COMPONENT LOGIC FRAME ──────────────────────────────────────────────────

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <LayoutContainer>
      {/* 1. DESKTOP SIDEBAR VIEW RAIL (Hidden on mobile phones) */}
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

        <NavLink href="/login" $active={false}>
          <LogOut size={20} /> Sign Out
        </NavLink>
      </Sidebar>

      {/* 2. THE CHOSEN PAGE VIEW SCREEN PORTAL */}
      <MainContent>{children}</MainContent>

      {/* 3. MOBILE RESPONSIVE BOTTOM TAB BAR (Hidden on desktop displays) */}
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

        <MobileTabLink href="/login" $active={false}>
          <LogOut size={22} />
          <span>Exit</span>
        </MobileTabLink>
      </MobileTabBar>
    </LayoutContainer>
  );
}