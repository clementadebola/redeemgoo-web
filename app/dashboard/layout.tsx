'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import styled from 'styled-components';
import { Map, User, Home, LogOut, Menu, X } from 'lucide-react';

// Firebase Engine Auth Handshakes
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase'; 
import { useAuthStore } from '../store/authStore';

import LogoutModal from '../(auth)/logout/page';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const [isVerifying, setIsVerifying] = useState(true);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  
  // Responsive sidebar states
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDesktopExpanded, setIsDesktopExpanded] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const profileSnap = await getDoc(doc(db, 'users', firebaseUser.uid));
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

  // Close mobile menu automatically when routes change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  if (isVerifying) {
    return <VerificationLoaderOverlay>Restoring session configuration tokens...</VerificationLoaderOverlay>;
  }

  return (
    <LayoutContainer>
      {/* 📱 MOBILE HEADER (Hamburger Trigger) */}
      <MobileHeader>
        <AppTitleMobile>Redeem Go</AppTitleMobile>
        <button className="menu-btn" onClick={() => setIsMobileMenuOpen(true)}>
          <Menu size={24} color="#1c1c1e" />
        </button>
      </MobileHeader>

      {/* 🌑 MOBILE OVERLAY BACKDROP WITH HEAVY BLUR */}
      <MobileBackdrop 
        $isOpen={isMobileMenuOpen} 
        onClick={() => setIsMobileMenuOpen(false)} 
      />

      {/* 🖥️ RESPONSIVE SIDEBAR */}
      <Sidebar $isMobileOpen={isMobileMenuOpen} $isDesktopExpanded={isDesktopExpanded}>
        
        <NavGroup>
          <SidebarHeader>
            {/* Desktop Hamburger Menu Toggle */}
            <DesktopHamburger onClick={() => setIsDesktopExpanded(!isDesktopExpanded)}>
              <Menu size={24} color="#ffffff" />
            </DesktopHamburger>

            {/* App Title Display */}
            <AppTitleBlock $isExpanded={isDesktopExpanded}>
              <span className="title-text">Redeem Go</span>
            </AppTitleBlock>

            {/* Mobile Close Button */}
            <MobileCloseBtn onClick={() => setIsMobileMenuOpen(false)}>
              <X size={24} color="#ffffff" />
            </MobileCloseBtn>
          </SidebarHeader>
          
          <NavLink href="/dashboard" $active={pathname === '/dashboard'} $isExpanded={isDesktopExpanded}>
            <div className="icon-wrap"><Home size={20} /></div>
            <span className="link-text">Home</span>
          </NavLink>
          
          <NavLink href="/dashboard/map" $active={pathname === '/dashboard/map'} $isExpanded={isDesktopExpanded}>
            <div className="icon-wrap"><Map size={20} /></div>
            <span className="link-text">Live Map</span>
          </NavLink>
          
          <NavLink href="/dashboard/profile" $active={pathname === '/dashboard/profile'} $isExpanded={isDesktopExpanded}>
            <div className="icon-wrap"><User size={20} /></div>
            <span className="link-text">My Profile</span>
          </NavLink>
        </NavGroup>

        <BottomGroup>
          <NavButtonTrigger type="button" onClick={() => setLogoutModalOpen(true)} $isExpanded={isDesktopExpanded}>
            <div className="icon-wrap"><LogOut size={20} /></div>
            <span className="link-text">Sign Out</span>
          </NavButtonTrigger>
        </BottomGroup>
      </Sidebar>

      {/* 🚀 THE CHOSEN PAGE VIEW SCREEN PORTAL */}
      <MainContent>
        {children}
      </MainContent>

      {/* Global Modals */}
      <LogoutModal isOpen={logoutModalOpen} onClose={() => setLogoutModalOpen(false)} />
    </LayoutContainer>
  );
}

// ─── STYLED CSS-IN-JS COMPONENTS ──────────────────────────────────────────

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

// ── Mobile Specific Layouts ──
const MobileHeader = styled.div`
  display: none;
  align-items: center;
  justify-content: space-between;
  height: 60px;
  background-color: #ffffff;
  padding: 0 20px;
  border-bottom: 1px solid #e5e5ea;
  z-index: 40;

  .menu-btn {
    background: transparent;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    padding: 4px;
  }

  @media (max-width: 768px) {
    display: flex;
  }
`;

const AppTitleMobile = styled.h2`
  font-size: 18px;
  font-weight: 800;
  color: #10b981;
  margin: 0;
  letter-spacing: -0.5px;
`;

const MobileBackdrop = styled.div<{ $isOpen: boolean }>`
  display: none;
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background-color: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(8px); /* ✅ Added deep blur */
  -webkit-backdrop-filter: blur(8px);
  z-index: 1400; /* ✅ Elevates safely above all map features */
  opacity: ${({ $isOpen }) => ($isOpen ? 1 : 0)};
  pointer-events: ${({ $isOpen }) => ($isOpen ? 'all' : 'none')};
  transition: opacity 0.3s ease;

  @media (max-width: 768px) {
    display: block;
  }
`;

// ── Unified Sidebar ──
const Sidebar = styled.aside<{ $isMobileOpen: boolean; $isDesktopExpanded: boolean }>`
  background-color: #1c1c1e;
  color: white;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100vh;
  padding: 24px 12px;
  transition: width 0.3s cubic-bezier(0.2, 0.8, 0.2, 1), transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
  z-index: 1500; /* ✅ Maximum clearance over map tools */
  flex-shrink: 0;
  
  /* Desktop state rules */
  width: ${({ $isDesktopExpanded }) => ($isDesktopExpanded ? '240px' : '72px')};

  /* Mobile state rules overrides */
  @media (max-width: 768px) {
    position: fixed;
    top: 0;
    left: 0;
    width: 280px;
    transform: ${({ $isMobileOpen }) => ($isMobileOpen ? 'translateX(0)' : 'translateX(-100%)')};
    padding: 32px 16px;
    box-shadow: ${({ $isMobileOpen }) => ($isMobileOpen ? '4px 0 24px rgba(0,0,0,0.15)' : 'none')};
  }
`;

const SidebarHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 32px;
  height: 40px;
  overflow: hidden;

  @media (max-width: 768px) {
    justify-content: space-between;
    padding: 0 4px;
  }
`;

const DesktopHamburger = styled.button`
  background: transparent;
  border: none;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px; /* Centers cleanly in the 72px collapsed block */
  flex-shrink: 0;
  transition: opacity 0.2s;

  &:hover { opacity: 0.8; }

  @media (max-width: 768px) {
    display: none;
  }
`;

const AppTitleBlock = styled.div<{ $isExpanded: boolean }>`
  display: flex;
  align-items: center;
  
  .title-text {
    font-size: 18px;
    font-weight: 800;
    color: #10b981;
    letter-spacing: -0.5px;
    white-space: nowrap;
    opacity: ${({ $isExpanded }) => ($isExpanded ? 1 : 0)};
    width: ${({ $isExpanded }) => ($isExpanded ? '120px' : '0px')};
    margin-left: ${({ $isExpanded }) => ($isExpanded ? '8px' : '0px')};
    transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
    overflow: hidden;

    @media (max-width: 768px) {
      opacity: 1;
      width: auto;
      margin-left: 0;
    }
  }
`;

const NavGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const BottomGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  align-items: center;
  
  /* ✅ FIXED: Push up from bottom edge, especially for iPhone notches */
  padding-bottom: max(92px, env(safe-area-inset-bottom));
`;

const MobileCloseBtn = styled.button`
  display: none;
  background: transparent;
  border: none;
  cursor: pointer;
  align-items: center;
  justify-content: center;
  padding: 4px;

  @media (max-width: 768px) {
    display: flex;
  }
`;

const NavLink = styled(Link)<{ $active: boolean; $isExpanded: boolean }>`
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px;
  border-radius: 12px;
  color: ${({ $active }) => ($active ? '#ffffff' : '#8e8e93')};
  background-color: ${({ $active }) => ($active ? '#2c2c2e' : 'transparent')};
  text-decoration: none;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.2s ease;
  overflow: hidden;

  &:hover {
    background-color: #2c2c2e;
    color: white;
  }

  .icon-wrap {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: 24px;
  }

  .link-text {
    white-space: nowrap;
    opacity: ${({ $isExpanded }) => ($isExpanded ? 1 : 0)};
    transition: opacity 0.2s ease;

    @media (max-width: 768px) {
      opacity: 1; /* Always visible on mobile sidebar */
    }
  }
`;

const NavButtonTrigger = styled.button<{ $isExpanded: boolean }>`
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px;
  border-radius: 12px;
  color: #ef4444; /* Red logout alert */
  background: transparent;
  border: none;
  width: 100%;
  cursor: pointer;
  font-family: inherit;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.2s ease;
  overflow: hidden;

  &:hover {
    background-color: rgba(239, 68, 68, 0.1);
  }

  .icon-wrap {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: 24px;
  }

  .link-text {
    white-space: nowrap;
    opacity: ${({ $isExpanded }) => ($isExpanded ? 1 : 0)};
    transition: opacity 0.2s ease;

    @media (max-width: 768px) {
      opacity: 1; 
    }
  }
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