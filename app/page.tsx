'use client';

import React from 'react';
import Link from 'next/link';
import styled, { keyframes } from 'styled-components';
import { Compass, Navigation2, MapPin, Search, Milestone, ArrowRight } from 'lucide-react';

// ─── ANIMATIONS (FOR THE ZERO-GRAVITY INTERACTIVE EFFECT) ───────────────────
const float = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
  100% { transform: translateY(0px); }
`;

const floatDelayed = keyframes`
  0% { transform: translateY(-5px); }
  50% { transform: translateY(5px); }
  100% { transform: translateY(-5px); }
`;

const pulseDot = keyframes`
  0% { transform: scale(0.95); opacity: 0.5; }
  50% { transform: scale(1.2); opacity: 0.8; }
  100% { transform: scale(0.95); opacity: 0.5; }
`;

// ─── STYLED COMPONENTS ──────────────────────────────────────────────────────
const Viewport = styled.div`
  min-height: 100vh;
  width: 100vw;
  background-color: #fafafa;
  color: #111111;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow-x: hidden;
`;

const Header = styled.header`
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 10;
`;

const LogoRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
  font-size: 16px;
  letter-spacing: -0.5px;
  color: #10b981;
`;

const HeaderNav = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const TextLink = styled(Link)`
  font-size: 14px;
  font-weight: 500;
  color: #666666;
  text-decoration: none;
  transition: color 0.2s;
  &:hover { color: #111111; }
`;

const NavButton = styled(Link)`
  padding: 8px 16px;
  border-radius: 50px;
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
  background-color: #111111;
  color: #ffffff;
  transition: opacity 0.2s;
  &:hover { opacity: 0.9; }
`;

const MainGrid = styled.main`
  flex: 1;
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  padding: 0 24px;
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  align-items: center;
  gap: 48px;

  @media (max-width: 968px) {
    grid-template-columns: 1fr;
    text-align: center;
    padding-top: 40px;
    padding-bottom: 8px;
  }
`;

const HeroLeft = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  @media (max-width: 968px) { align-items: center; }
`;

const PillBadge = styled.div`
  background-color: #e6f7f0;
  color: #10b981;
  padding: 6px 14px;
  border-radius: 50px;
  font-size: 12px;
  font-weight: 600;
  width: fit-content;
  display: flex;
  align-items: center;
  gap: 6px;
`;

const MainHeading = styled.h1`
  font-size: 52px;
  font-weight: 800;
  line-height: 1.1;
  letter-spacing: -1.5px;
  margin: 0;
  color: #111111;

  span {
    color: #10b981;
  }

  @media (max-width: 576px) { font-size: 38px; }
`;

const SubText = styled.p`
  font-size: 18px;
  line-height: 1.6;
  color: #555555;
  margin: 0;
  max-width: 480px;
`;

const ActionGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 8px;
  @media (max-width: 576px) {
    flex-direction: column;
    width: 100%;
  }
`;

const PrimaryCTA = styled(Link)`
  background-color: #10b981;
  color: white;
  padding: 16px 32px;
  border-radius: 14px;
  font-weight: 600;
  font-size: 15px;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 10px 20px rgba(16, 185, 129, 0.15);
  transition: transform 0.2s, box-shadow 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 24px rgba(16, 185, 129, 0.25);
  }

  @media (max-width: 576px) { width: 100%; justify-content: center; }
`;

const SecondaryCTA = styled(Link)`
  border: 1.5px solid #e5e5ea;
  background-color: white;
  color: #111111;
  padding: 16px 32px;
  border-radius: 14px;
  font-weight: 600;
  font-size: 15px;
  text-decoration: none;
  transition: background-color 0.2s;

  &:hover { background-color: #f2f2f7; }
  @media (max-width: 576px) { width: 100%; justify-content: center; }
`;

// ─── ANTI-GRAVITY FLOATING MAP BLOCK ────────────────────────────────────────
const HeroRight = styled.div`
  position: relative;
  width: 100%;
  height: 480px;
  display: flex;
  align-items: center;
  justify-content: center;
  @media (max-width: 968px) { height: 380px; margin-top: 24px; }
`;

const MapCanvasMock = styled.div`
  width: 100%;
  max-width: 400px;
  height: 400px;
  background: white;
  border-radius: 32px;
  box-shadow: 0 20px 40px rgba(0,0,0,0.06);
  border: 1px solid rgba(0,0,0,0.03);
  position: relative;
  overflow: hidden;
  animation: ${float} 6s ease-in-out infinite;

  /* Subtle background map vector tracks decoration lines */
  &::before {
    content: '';
    position: absolute;
    width: 200%;
    height: 200%;
    top: -50%;
    left: -50%;
    background-image: 
      linear-gradient(45deg, transparent 49%, #eefbf7 50%, transparent 51%),
      linear-gradient(-45deg, transparent 49%, #f0f3f2 50%, transparent 51%);
    background-size: 60px 60px;
    opacity: 0.7;
  }
`;

const FloatingElement = styled.div<{ $delay?: boolean }>`
  position: absolute;
  background: white;
  padding: 12px 16px;
  border-radius: 16px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.08);
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  font-weight: 600;
  animation: ${({ $delay }) => ($delay ? floatDelayed : float)} 5s ease-in-out infinite;
  z-index: 2;
`;

const MapHUDCard = styled.div`
  position: absolute;
  bottom: 20px;
  left: 20px;
  right: 20px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(8px);
  padding: 14px;
  border-radius: 18px;
  box-shadow: 0 8px 20px rgba(0,0,0,0.05);
  display: flex;
  flex-direction: column;
  gap: 4px;
  border: 1px solid rgba(255,255,255,0.6);
`;

const LivePulse = styled.div`
  width: 12px;
  height: 12px;
  background-color: #007aff;
  border-radius: 50%;
  position: absolute;
  top: 45%;
  left: 35%;
  box-shadow: 0 0 0 4px rgba(0, 122, 255, 0.2);
  &::after {
    content: '';
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background: inherit;
    position: absolute;
    animation: ${pulseDot} 2s infinite;
  }
`;

// ─── COMPONENT IMPLEMENTATION ───────────────────────────────────────────────
export default function Home() {
  return (
    <Viewport>
      <Header>
        <LogoRow>
          <Compass size={22} strokeWidth={2.5} />
          <span>RedeemGo</span>
        </LogoRow>
        <HeaderNav>
          <TextLink href="/login">Login</TextLink>
          <NavButton href="/signup">Join Now</NavButton>
        </HeaderNav>
      </Header>

      {/* Main Container Hero Panel Layout */}
      <MainGrid>
        <HeroLeft>
          <PillBadge>
            <Navigation2 size={12} fill="currentColor" />
            Designed Specially for Redemption City
          </PillBadge>
          
          <MainHeading>
            Never get lost in <br />
            <span>Redemption City</span> again.
          </MainHeading>
          
          <SubText>
            A minimal, precision-guided navigation app mapping every parish, auditorium, bank, car park, and street inside the campground layout.
          </SubText>

          <ActionGroup>
            <PrimaryCTA href="/signup">
              Start Navigating <ArrowRight size={16} />
            </PrimaryCTA>
            <SecondaryCTA href="/login">
              Sign In
            </SecondaryCTA>
          </ActionGroup>
        </HeroLeft>

        {/* Right Section: Anti-Gravity Vector Mock Map Simulation Layout */}
        <HeroRight>
          {/* Main Floating Canvas Module */}
          <MapCanvasMock>
            <LivePulse />
            
            {/* Embedded Mock Core Marker Pin */}
            <div style={{ position: 'absolute', top: '25%', right: '30%', fontSize: '24px' }}>📍</div>
            
            {/* Dashboard HUD Bottom Map card snippet overlay */}
            <MapHUDCard>
              <span style={{ fontSize: '9px', fontWeight: 700, color: '#10b981', letterSpacing: '0.5px' }}>ROUTE ACTIVE</span>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#111' }}>3km x 3km Auditorium</span>
              <span style={{ fontSize: '11px', color: '#666' }}>Est. Time: 4 mins walking</span>
            </MapHUDCard>
          </MapCanvasMock>

          {/* Floating Anti-Gravity Accessory Tags surrounding the frame */}
          <FloatingElement style={{ top: '40px', left: '10px' }}>
            <div style={{ background: '#e6f7f0', padding: '6px', borderRadius: '8px', color: '#10b981' }}>
              <Search size={14} />
            </div>
            <span>Find Parishes Instantly</span>
          </FloatingElement>

          <FloatingElement style={{ top: '160px', right: '-10px' }} $delay>
            <div style={{ background: '#f2f2f7', padding: '6px', borderRadius: '8px', color: '#007aff' }}>
              <Milestone size={14} />
            </div>
            <span>Gate Openings Info</span>
          </FloatingElement>

          <FloatingElement style={{ top: '300px', left: '-20px' }}>
            <div style={{ background: '#fff0ee', padding: '6px', borderRadius: '8px', color: '#ff3b30' }}>
              <MapPin size={14} />
            </div>
            <span>Locate Nearest ATM</span>
          </FloatingElement>
        </HeroRight>
      </MainGrid>
    </Viewport>
  );
}