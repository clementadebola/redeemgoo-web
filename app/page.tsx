'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import styled, { keyframes } from 'styled-components';
import { 
  Compass, Navigation2, MapPin, Search, Milestone, ArrowRight, 
  Layers, Users, Cpu, ChevronDown, HelpCircle, Info, MessageSquare,
  Bot, Sparkles, Navigation
} from 'lucide-react';
import Lenis from 'lenis';

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

const typingPulse = keyframes`
  0%, 100% { transform: translateY(0); opacity: 0.4; }
  50% { transform: translateY(-3px); opacity: 1; }
`;


const Viewport = styled.div`
  min-height: 100vh;
  width: 100%;
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
  font-size: 18px;
  letter-spacing: -0.5px;
  color: #10b981;
`;

const HeaderNav = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
`;

const TextLink = styled(Link)`
  font-size: 14px;
  font-weight: 500;
  color: #666666;
  text-decoration: none;
  transition: color 0.2s;
  &:hover { color: #111111; }
  @media (max-width: 576px) { display: none; }
`;

const NavButton = styled(Link)`
  padding: 10px 20px;
  border-radius: 50px;
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
  background-color: #111111;
  color: #ffffff;
  transition: opacity 0.2s;
  &:hover { opacity: 0.9; }
`;

const HeroSection = styled.section`
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  padding: 60px 24px 100px 24px;
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  align-items: center;
  gap: 48px;

  @media (max-width: 968px) {
    grid-template-columns: 1fr;
    text-align: center;
    padding-top: 20px;
    padding-bottom: 60px;
  }
`;

const HeroLeft = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  @media (max-width: 968px) { align-items: center; }
`;

const PillBadge = styled.div<{ $dark?: boolean }>`
  background-color: ${({ $dark }) => ($dark ? 'rgba(16, 185, 129, 0.15)' : '#e6f7f0')};
  color: #10b981;
  padding: 6px 14px;
  border-radius: 50px;
  font-size: 12px;
  font-weight: 700;
  width: fit-content;
  display: flex;
  align-items: center;
  gap: 6px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const MainHeading = styled.h1`
  font-size: 56px;
  font-weight: 800;
  line-height: 1.1;
  letter-spacing: -1.5px;
  margin: 0;
  color: #111111;

  span { color: #10b981; }
  @media (max-width: 576px) { font-size: 38px; }
`;

const SubText = styled.p<{ $dark?: boolean }>`
  font-size: 18px;
  line-height: 1.6;
  color: ${({ $dark }) => ($dark ? '#a1a1aa' : '#555555')};
  margin: 0;
  max-width: 520px;
  @media (max-width: 576px) { font-size: 16px; }
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
  box-sizing: border-box;

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
  box-sizing: border-box;

  &:hover { background-color: #f2f2f7; }
  @media (max-width: 576px) { width: 100%; justify-content: center; }
`;

const HeroRight = styled.div`
  position: relative;
  width: 100%;
  min-height: 480px;
  display: flex;
  align-items: center;
  justify-content: center;
  @media (max-width: 968px) { min-height: 380px; margin-top: 24px; }
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
  box-sizing: border-box;

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

  @media (max-width: 576px) {
    height: 320px; /* Scaled down slightly to fit smaller screens perfectly */
  }
`;

// ✅ FIXED: Restored for mobile view with strict scaling and boundary constraints
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
  white-space: nowrap;

  @media (max-width: 576px) {
    padding: 8px 12px;
    font-size: 11px;
    gap: 6px;
    transform: scale(0.85); /* Scales down mathematically instead of hiding */
  }
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

// ─── SECTION: BENTO MATRIX FEATURES ────────────────────────────────────
const SectionWrapper = styled.section`
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 80px 24px;
`;

const SectionHeader = styled.div`
  text-align: center;
  margin-bottom: 56px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
`;

const SectionTitle = styled.h2<{ $dark?: boolean }>`
  font-size: 38px;
  font-weight: 800;
  letter-spacing: -1px;
  margin: 0;
  color: ${({ $dark }) => ($dark ? '#ffffff' : '#111111')};
  @media (max-width: 576px) { font-size: 28px; }
`;

// ✅ FIXED: Forced strict width boundaries to prevent CSS grid blowout overlap
const BentoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr)); /* The minmax(0, 1fr) forces bounds */
  gap: 24px;
  width: 100%;
  
  @media(max-width: 968px) { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  @media(max-width: 640px) { grid-template-columns: minmax(0, 1fr); }
`;

// ✅ FIXED: Added min-width and box-sizing to prevent content from expanding the card outwards
const BentoCard = styled.div<{ $big?: boolean }>`
  background: #ffffff;
  border: 1px solid #e5e5ea;
  border-radius: 24px;
  padding: 32px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 24px;
  grid-column: ${({ $big }) => ($big ? 'span 2' : 'span 1')};
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  box-sizing: border-box;
  min-width: 0; /* Critical fix for grid blowout */

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 30px rgba(0,0,0,0.04);
  }

  @media(max-width: 968px) { grid-column: span 1; }
`;

const IconCircle = styled.div<{ $bg: string; $color: string }>`
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background-color: ${({ $bg }) => $bg};
  color: ${({ $color }) => $color};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const CardTextContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  
  h3 { font-size: 18px; font-weight: 700; margin: 0; color: #111111; word-wrap: break-word; }
  p { font-size: 14px; color: #666666; line-height: 1.5; margin: 0; word-wrap: break-word; }
`;

// ─── SECTION: AI COPILOT (DARK THEME) ──────────────────────────────────
const AiSection = styled.section`
  max-width: 1200px;
  width: calc(100% - 32px);
  margin: 40px auto;
  background-color: #111111;
  border-radius: 36px;
  padding: 64px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 64px;
  align-items: center;
  color: #ffffff;
  box-shadow: 0 30px 60px rgba(0,0,0,0.15);
  box-sizing: border-box;

  @media(max-width: 968px) {
    grid-template-columns: 1fr;
    padding: 40px 24px;
    gap: 48px;
    border-radius: 28px;
  }
`;

const AiMockupContainer = styled.div`
  position: relative;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const PhoneFrame = styled.div`
  width: 100%;
  max-width: 340px; 
  min-height: 460px; 
  background: #1c1c1e;
  border-radius: 32px;
  border: 6px solid #333333;
  box-shadow: 0 20px 40px rgba(0,0,0,0.3);
  display: flex;
  flex-direction: column;
  padding: 24px 16px;
  position: relative;
  box-sizing: border-box;
  animation: ${float} 6s ease-in-out infinite;

  &::before {
    content: '';
    position: absolute;
    top: 0; left: 50%;
    transform: translateX(-50%);
    width: 100px; height: 20px;
    background: #333333;
    border-radius: 0 0 12px 12px;
  }

  @media (max-width: 576px) {
    min-height: auto;
    padding-top: 32px;
  }
`;

const ChatBubbleUser = styled.div`
  align-self: flex-end;
  background: #10b981;
  color: white;
  padding: 12px 16px;
  border-radius: 16px 16px 4px 16px;
  font-size: 13px;
  font-weight: 500;
  margin-top: 16px;
  margin-bottom: 16px;
  max-width: 85%;
  line-height: 1.4;
  box-sizing: border-box;
  animation: ${floatDelayed} 5s infinite ease-in-out;
`;

const ChatBubbleAi = styled.div`
  align-self: flex-start;
  background: #2c2c2e;
  color: #f4f4f5;
  padding: 14px 16px;
  border-radius: 16px 16px 16px 4px;
  font-size: 13px;
  font-weight: 500;
  margin-bottom: 12px;
  max-width: 90%;
  line-height: 1.5;
  display: flex;
  flex-direction: column;
  gap: 8px;
  box-sizing: border-box;
  animation: ${float} 5.5s infinite ease-in-out;
  border: 1px solid #3a3a3c;
`;

const ChatTypingIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 0;

  span {
    width: 6px;
    height: 6px;
    background: #10b981;
    border-radius: 50%;
    animation: ${typingPulse} 1.4s infinite ease-in-out;
    &:nth-child(1) { animation-delay: 0s; }
    &:nth-child(2) { animation-delay: 0.2s; }
    &:nth-child(3) { animation-delay: 0.4s; }
  }
`;

const GeneratedRouteCard = styled.div`
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.3);
  padding: 12px;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 4px;
  box-sizing: border-box;

  .card-header { display: flex; justify-content: space-between; align-items: center; }
  .title { font-weight: 700; font-size: 14px; color: #10b981; }
  .dist { font-size: 11px; color: #a1a1aa; font-weight: 600; white-space: nowrap; }
  
  .route-btn {
    background: #10b981;
    color: white;
    border: none;
    padding: 8px;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    margin-top: 4px;
    cursor: pointer;
  }
`;

// ─── SECTION: LIVE TELEMETRY / CIRCLES ──────────────────────────────────
const SplitSection = styled(SectionWrapper)`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 64px;
  align-items: center;
  background-color: #f2fdf9;
  border-radius: 36px;
  padding: 64px;
  margin-top: 40px;
  margin-bottom: 40px;
  box-sizing: border-box;

  @media(max-width: 968px) {
    grid-template-columns: 1fr;
    padding: 40px 24px;
    gap: 32px;
    border-radius: 28px;
    width: calc(100% - 32px);
  }
`;

const MockTelemetryUi = styled.div`
  background: #ffffff;
  border-radius: 24px;
  border: 1px solid #e5e5ea;
  padding: 24px;
  box-shadow: 0 15px 35px rgba(0,0,0,0.05);
  display: flex;
  flex-direction: column;
  gap: 12px;
  box-sizing: border-box;
`;

const TelemetryRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 12px;
  border: 1px solid #eee;
`;

const UserCluster = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const AvatarStub = styled.div<{ $bg: string }>`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: ${({ $bg }) => $bg};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  color: white;
  flex-shrink: 0;
`;

// ─── SECTION: ACCORDION FAQ ─────────────────────────────────────────────
const FaqStack = styled.div`
  max-width: 720px;
  width: 100%;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const FaqItem = styled.div<{ $isOpen: boolean }>`
  background: white;
  border: 1px solid #e5e5ea;
  border-radius: 16px;
  overflow: hidden;
  transition: all 0.2s ease-in-out;
`;

const FaqHeader = styled.div`
  padding: 20px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  user-select: none;
  font-weight: 600;
  font-size: 16px;
  color: #111111;

  @media(max-width: 576px) {
    font-size: 15px;
    padding: 16px 20px;
    gap: 12px;
  }
`;

const FaqBody = styled.div<{ $isOpen: boolean }>`
  max-height: ${({ $isOpen }) => ($isOpen ? '200px' : '0px')};
  padding: ${({ $isOpen }) => ($isOpen ? '0 24px 20px 24px' : '0 24px')};
  opacity: ${({ $isOpen }) => ($isOpen ? '1' : '0')};
  overflow: hidden;
  font-size: 14px;
  line-height: 1.6;
  color: #666666;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);

  @media(max-width: 576px) {
    padding: ${({ $isOpen }) => ($isOpen ? '0 20px 16px 20px' : '0 20px')};
  }
`;

const ChevronIcon = styled(ChevronDown)<{ $isOpen: boolean }>`
  transform: rotate(${({ $isOpen }) => ($isOpen ? '180deg' : '0deg')});
  transition: transform 0.2s ease;
  color: #8e8e93;
  flex-shrink: 0;
`;

// ─── SECTION: STRUCTURAL FOOTER ─────────────────────────────────────────
const AppFooter = styled.footer`
  background-color: #1c1c1e;
  color: #aeaeb2;
  padding: 64px 24px 32px 24px;
  margin-top: auto;
  width: 100%;
  box-sizing: border-box;
`;

const FooterMainGrid = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1.5fr repeat(3, 1fr);
  gap: 48px;
  padding-bottom: 48px;
  border-bottom: 1px solid #2c2c2e;

  @media(max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 32px;
  }
`;

const FooterBrandBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  
  .desc { font-size: 14px; line-height: 1.5; max-width: 300px; color: #8e8e93; }
`;

const FooterLogo = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
  font-size: 20px;
  color: #ffffff;
`;

const FooterColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  
  h4 { color: #ffffff; font-size: 14px; font-weight: 700; margin: 0; letter-spacing: 0.5px; }
  ul { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 10px; }
  a { color: #aeaeb2; text-decoration: none; font-size: 14px; transition: color 0.2s; }
  a:hover { color: #10b981; }
`;

const FooterBottomRow = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding-top: 32px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #636366;

  @media(max-width: 576px) {
    flex-direction: column;
    gap: 16px;
    text-align: center;
  }
`;

const FooterSocials = styled.div`
  display: flex;
  gap: 16px;
  color: #8e8e93;
  a { color: inherit; transition: color 0.2s; }
  a:hover { color: #ffffff; }
`;

// ─── ENTRY COMPONENT ────────────────────────────────────────────────────────
export default function Home() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, []);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

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

      {/* Hero Section Container */}
      <HeroSection>
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

        <HeroRight>
          <MapCanvasMock>
            <LivePulse />
            <div style={{ position: 'absolute', top: '25%', right: '30%', fontSize: '24px' }}>📍</div>
            <MapHUDCard>
              <span style={{ fontSize: '9px', fontWeight: 700, color: '#10b981', letterSpacing: '0.5px' }}>ROUTE ACTIVE</span>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#111' }}>3km x 3km Auditorium</span>
              <span style={{ fontSize: '11px', color: '#666' }}>Est. Time: 4 mins walking</span>
            </MapHUDCard>
          </MapCanvasMock>

          {/* ✅ FIXED: Restored safely on mobile by dynamically scaling it to fit via CSS media queries */}
          <FloatingElement style={{ top: '10%', left: '0%' }}>
            <div style={{ background: '#e6f7f0', padding: '6px', borderRadius: '8px', color: '#10b981' }}>
              <Search size={14} />
            </div>
            <span>Find Parishes Instantly</span>
          </FloatingElement>

          <FloatingElement style={{ top: '40%', right: '0%' }} $delay>
            <div style={{ background: '#f2f2f7', padding: '6px', borderRadius: '8px', color: '#007aff' }}>
              <Milestone size={14} />
            </div>
            <span>Gate Openings Info</span>
          </FloatingElement>

          <FloatingElement style={{ bottom: '15%', left: '5%' }}>
            <div style={{ background: '#fff0ee', padding: '6px', borderRadius: '8px', color: '#ff3b30' }}>
              <MapPin size={14} />
            </div>
            <span>Locate Nearest ATM</span>
          </FloatingElement>
        </HeroRight>
      </HeroSection>

      {/* Bento Grid Matrix Section */}
      <SectionWrapper id="features">
        <SectionHeader>
          <PillBadge><Layers size={12} /> SPECIFICATION MATRIX</PillBadge>
          <SectionTitle>Engineered For High-Density Congestion</SectionTitle>
        </SectionHeader>

        {/* ✅ FIXED: Explicit grid tracking rules applied to strictly prevent overlapping elements */}
        <BentoGrid>
          <BentoCard $big>
            <IconCircle $bg="#e6f7f0" $color="#10b981">
              <Search size={22} />
            </IconCircle>
            <CardTextContent>
              <h3>Smart POI Indexed Directory</h3>
              <p>Instantly query and find explicit paths directly straight to thousands of landmarks, matching the old convention halls, new multi-auditoriums, blocks, departments, or residential avenues without confusion.</p>
            </CardTextContent>
          </BentoCard>

          <BentoCard>
            <IconCircle $bg="#e1f5fe" $color="#0288d1">
              <Milestone size={22} />
            </IconCircle>
            <CardTextContent>
              <h3>Dynamic Gate Status Monitor</h3>
              <p>Avoid heavy traffic traps during Holy Ghost Congress conventions by tracking blockades and active gate checkpoints in real time.</p>
            </CardTextContent>
          </BentoCard>

          <BentoCard>
            <IconCircle $bg="#fff3e0" $color="#f57c00">
              <MapPin size={22} />
            </IconCircle>
            <CardTextContent>
              <h3>Utility Grid Locator</h3>
              <p>Locate points of convenience instantly: find operating banking points, cash machines, medical stations, food courts, and emergency infrastructure options closer to your zone.</p>
            </CardTextContent>
          </BentoCard>

          <BentoCard $big>
            <IconCircle $bg="#ede7f6" $color="#5e35b1">
              <Cpu size={22} />
            </IconCircle>
            <CardTextContent>
              <h3>Low Memory Footprint Architecture</h3>
              <p>Optimized explicitly to preserve bandwidth and power on old cellular hardware networks during crowded peak assemblies where network throughput is constricted.</p>
            </CardTextContent>
          </BentoCard>
        </BentoGrid>
      </SectionWrapper>

      {/* 🤖 NEW SECTION: AI COPILOT INTERACTION */}
      <AiSection>
        <HeroLeft>
          <PillBadge $dark><Sparkles size={12} fill="currentColor" /> AI CAMP ASSISTANT</PillBadge>
          <SectionTitle $dark>Just Ask. Tell the AI where you want to go.</SectionTitle>
          <SubText $dark>
            Not sure what you're looking for? Chat with the RedeemGo AI Assistant. Whether you're looking for hot meals, a quiet place to pray, or the nearest restroom, the AI instantly computes the best route for you.
          </SubText>
        </HeroLeft>

        <AiMockupContainer>
          <PhoneFrame>
            {/* User Message */}
            <ChatBubbleUser>
              Where can I get food to eat in the camp right now? I'm near the Old Arena.
            </ChatBubbleUser>

            {/* AI Typing / Response */}
            <ChatBubbleAi>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', fontWeight: 700, marginBottom: '4px' }}>
                <Bot size={14} /> Redeem AI
              </div>
              
              City Mart is currently open and just 400m away from your location. They serve hot meals and snacks.
              
              <GeneratedRouteCard>
                <div className="card-header">
                  <span className="title">City Mart Eatery</span>
                  <span className="dist">400m Away</span>
                </div>
                <button className="route-btn">
                  <Navigation size={12} fill="currentColor" /> Start Route
                </button>
              </GeneratedRouteCard>
            </ChatBubbleAi>

            {/* Continuous Typing Indicator Animation */}
            <ChatBubbleAi style={{ width: 'fit-content', padding: '10px 14px' }}>
              <ChatTypingIndicator>
                <span />
                <span />
                <span />
              </ChatTypingIndicator>
            </ChatBubbleAi>

          </PhoneFrame>
        </AiMockupContainer>
      </AiSection>

      {/* Live Telemetry Circles Component Section */}
      <SplitSection>
        <HeroLeft>
          <PillBadge><Users size={12} /> ENCRYPTED RADAR SHARING</PillBadge>
          <SectionTitle>Keep Track of Your Family Circles Live</SectionTitle>
          <SubText>
            Create private groups with your family members or travel companions to view live location updates across the campground layout, avoiding separations during massive conventions.
          </SubText>
        </HeroLeft>

        <MockTelemetryUi>
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#8e8e93' }}>RADAR GROUP: FAMILY PIPELINE</span>
          
          <TelemetryRow>
            <UserCluster>
              <AvatarStub $bg="#10b981">DA</AvatarStub>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '14px', fontWeight: 700 }}>Debo Adebola</span>
                <span style={{ fontSize: '11px', color: '#666' }}>Heading to: New Auditorium</span>
              </div>
            </UserCluster>
            <span style={{ fontSize: '12px', color: '#10b981', fontWeight: 600 }}>📍 400m away</span>
          </TelemetryRow>

          <TelemetryRow>
            <UserCluster>
              <AvatarStub $bg="#007aff">EO</AvatarStub>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '14px', fontWeight: 700 }}>Enoch Oluwa</span>
                <span style={{ fontSize: '11px', color: '#666' }}>Stationary near Youth Center</span>
              </div>
            </UserCluster>
            <span style={{ fontSize: '12px', color: '#8e8e93' }}>📍 1.2km away</span>
          </TelemetryRow>
        </MockTelemetryUi>
      </SplitSection>

      {/* Accordion FAQ Component Section */}
      <SectionWrapper id="faq">
        <SectionHeader>
          <PillBadge><HelpCircle size={12} /> INFORMATION HUB</PillBadge>
          <SectionTitle>Frequently Answered Questions</SectionTitle>
        </SectionHeader>

        <FaqStack>
          <FaqItem $isOpen={openFaq === 0}>
            <FaqHeader onClick={() => toggleFaq(0)}>
              <span>Does RedeemGo require strong internet access to run?</span>
              <ChevronIcon size={18} $isOpen={openFaq === 0} />
            </FaqHeader>
            <FaqBody $isOpen={openFaq === 0}>
              RedeemGo is lightweight and caches map vector coordinate data paths directly onto local device memory. Even during dense network congestion, the spatial routing index is optimized to track positions cleanly.
            </FaqBody>
          </FaqItem>

          <FaqItem $isOpen={openFaq === 1}>
            <FaqHeader onClick={() => toggleFaq(1)}>
              <span>Is my location history stored on your servers?</span>
              <ChevronIcon size={18} $isOpen={openFaq === 1} />
            </FaqHeader>
            <FaqBody $isOpen={openFaq === 1}>
              No. Location telemetry matrices are encrypted and streamed live to designated circle members only during active navigation tabs. They disappear completely once navigation ends.
            </FaqBody>
          </FaqItem>

          <FaqItem $isOpen={openFaq === 2}>
            <FaqHeader onClick={() => toggleFaq(2)}>
              <span>Are all the newest auditoriums and developments mapped?</span>
              <ChevronIcon size={18} $isOpen={openFaq === 2} />
            </FaqHeader>
            <FaqBody $isOpen={openFaq === 2}>
              Yes. The database platform index is continuously updated to reflect newly constructed assembly arenas, roads, parking centers, and gate designations across Redemption City.
            </FaqBody>
          </FaqItem>
        </FaqStack>
      </SectionWrapper>

      {/* Integrated Unified Structural Footer */}
      <AppFooter>
        <FooterMainGrid>
          <FooterBrandBlock>
            <FooterLogo>
              <Compass size={24} color="#10b981" strokeWidth={2.5} />
              <span>RedeemGo</span>
            </FooterLogo>
            <p className="desc">Providing reliable spatial awareness and navigation across Redemption City campgrounds.</p>
          </FooterBrandBlock>

          <FooterColumn>
            <h4>Application</h4>
            <ul>
              <li><Link href="/signup">Register Account</Link></li>
              <li><Link href="/login">User Access Portal</Link></li>
              <li><Link href="#features">Feature Specifications</Link></li>
            </ul>
          </FooterColumn>

          <FooterColumn>
            <h4>Resources</h4>
            <ul>
              <li><Link href="#faq">Help Center FAQs</Link></li>
              <li><Link href="/privacy">Privacy Guard Policy</Link></li>
              <li><Link href="/terms">Terms of Service</Link></li>
            </ul>
          </FooterColumn>

          <FooterColumn>
            <h4>Contact</h4>
            <ul>
              <li><Link href="mailto:support@redeemgo.com">Support Mail</Link></li>
              <li><Link href="/feedback">App Feedback</Link></li>
              <li><Link href="/report">Map Correction Form</Link></li>
            </ul>
          </FooterColumn>
        </FooterMainGrid>

        <FooterBottomRow>
          <span>&copy; {new Date().getFullYear()} RedeemGo Mapping Systems. All rights reserved.</span>
          <FooterSocials>
            <Link href="/about"><Info size={18} /></Link>
            <Link href="/support"><MessageSquare size={18} /></Link>
          </FooterSocials>
        </FooterBottomRow>
      </AppFooter>
    </Viewport>
  );
}