'use client';

export const dynamic = 'force-dynamic';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styled from 'styled-components';
import { ArrowLeft, Navigation, AlertCircle } from 'lucide-react';

import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { useAuthStore } from '../../store/authStore';
import { Colors, Spacing } from '../../constants/theme';


const ViewportContainer = styled.main`
  min-height: 100vh;
  width: 100vw;
  background-color: ${Colors.background};
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${Spacing.lg}px;
  font-family: -apple-system, BlinkMacSystemFont, sans-serif;
`;

const ContentWrapper = styled.div`
  width: 100%;
  max-width: 440px;
  display: flex;
  flex-direction: column;
  gap: ${Spacing.lg}px;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: ${Spacing.md}px;
`;

const BackButton = styled(Link)`
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background-color: ${Colors.white};
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1.5px solid ${Colors.border};
  color: ${Colors.textPrimary};
  transition: background-color 0.2s;
  &:hover { background-color: #f2f2f7; }
`;

const LogoRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const LogoCircle = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background-color: ${Colors.primary};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${Colors.white};
`;

const AppName = styled.span`
  font-size: 20px;
  font-weight: 800;
  color: ${Colors.textPrimary};
  letter-spacing: -0.5px;
`;

const TitleSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const Title = styled.h1`
  font-size: 28px;
  font-weight: 800;
  color: ${Colors.textPrimary};
  margin: 0;
  letter-spacing: -0.5px;
`;

const Subtitle = styled.p`
  font-size: 14px;
  color: ${Colors.textMuted || '#8e8e93'};
  margin: 0;
`;

const CardForm = styled.form`
  background-color: ${Colors.white};
  border-radius: 24px;
  padding: ${Spacing.lg}px;
  display: flex;
  flex-direction: column;
  gap: ${Spacing.md}px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.03);
  border: 1px solid rgba(0,0,0,0.02);
`;

const ErrorBanner = styled.div`
  display: flex;
  align-items: center;
  gap: ${Spacing.xs}px;
  background-color: ${Colors.errorLight};
  padding: ${Spacing.md}px;
  border-radius: 12px;
`;

const ErrorText = styled.p`
  color: ${Colors.error};
  flex: 1;
  font-size: 14px;
  margin: 0;
`;

const Fields = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${Spacing.md}px;
`;

const Footer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 4px;
  font-size: 14px;
`;

const FooterText = styled.p`
  color: ${Colors.textSecondary};
  margin: 0;
`;

const FooterLink = styled(Link)`
  color: ${Colors.primary};
  text-decoration: none;
  font-weight: 700;
  &:hover { text-decoration: underline; }
`;


export default function SignupPage() {
  const router = useRouter();
  const { signUp, isLoading, error, clearError } = useAuthStore();

  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!fullName.trim()) e.fullName = 'Full name is required';
    if (!username.trim()) e.username = 'Username is required';
    else if (username.length < 3) e.username = 'At least 3 characters';
    if (!email.trim()) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Enter a valid email';
    if (!password) e.password = 'Password is required';
    else if (password.length < 6) e.password = 'At least 6 characters';
    if (password !== confirm) e.confirm = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault(); 
    clearError();
    if (!validate()) return;
    
    try {
      await signUp(email.trim(), password, fullName.trim(), username.trim());
      router.replace('/dashboard'); 
    } catch (err) {
      console.error("Registration failed:", err);
    }
  };

  return (
    <ViewportContainer>
      <ContentWrapper>

        <Header>
          <BackButton href="/login">
            <ArrowLeft size={18} />
          </BackButton>
          <LogoRow>
            <LogoCircle>
              <Navigation size={18} fill="currentColor" />
            </LogoCircle>
            <AppName>RedeemGo</AppName>
          </LogoRow>
        </Header>

        <TitleSection>
          <Title>Create account</Title>
          <Subtitle>Join and navigate Redemption City</Subtitle>
        </TitleSection>


        <CardForm onSubmit={handleSignup}>
          {error && (
            <ErrorBanner>
              <AlertCircle size={16} color={Colors.error} />
              <ErrorText>{error}</ErrorText>
            </ErrorBanner>
          )}

          <Fields>
            <Input
              label="Full Name"
              placeholder="David Adebayo"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              error={errors.fullName}
            />

            <Input
              label="Username"
              placeholder="davidade"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.replace(/\s/g, ''))}
              error={errors.username}
            />

            <Input
              label="Email Address"
              placeholder="you@example.com"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
            />

            <Input
              label="Password"
              placeholder="Min. 6 characters"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
            />

            <Input
              label="Confirm Password"
              placeholder="Re-enter your password"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              error={errors.confirm}
            />
          </Fields>

          <Button 
            title="Create Account" 
            type="submit" 
            isLoading={isLoading} 
          />
        </CardForm>

        <Footer>
          <FooterText>Already have an account?</FooterText>
          <FooterLink href="/login">Sign in</FooterLink>
        </Footer>
      </ContentWrapper>
    </ViewportContainer>
  );
}