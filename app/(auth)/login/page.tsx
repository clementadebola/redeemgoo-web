"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styled from "styled-components";
import { IoNavigate, IoAlertCircle, IoArrowBack } from "react-icons/io5";

import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import { useAuthStore } from "../../store/authStore";
import {
  Colors,
  Spacing,
  BorderRadius,
} from "../../constants/theme";

export default function LoginPage() {
  const router = useRouter();

  const { signIn, isLoading, error, clearError } = useAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
  }>({});

  const validate = () => {
    const e: typeof errors = {};

    if (!email.trim()) {
      e.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      e.email = "Enter a valid email";
    }

    if (!password) {
      e.password = "Password is required";
    }

    setErrors(e);

    return Object.keys(e).length === 0;
  };

  const handleLogin = async (e: React.FormEvent) => {
    // Prevent default HTML form reload behavior
    e.preventDefault();
    clearError();

    if (!validate()) return;

    try {
      await signIn(email.trim(), password);
      router.push("/dashboard");
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <Container>
      <Content onSubmit={handleLogin}>
        <Header>
          <BackButton href="/">
            <IoArrowBack size={18} color={Colors.textPrimary} />
          </BackButton>
          <LogoRow>
            <LogoCircle>
              <IoNavigate size={18} color={Colors.white} />
            </LogoCircle>
            <AppName>RedeemGo</AppName>
          </LogoRow>
        </Header>

        <TitleSection>
          <CardTitle>Welcome back</CardTitle>
          <CardSub>Sign in to continue navigating Redemption City with ease</CardSub>
        </TitleSection>

        <Card>
          {error && (
            <ErrorBanner>
              <IoAlertCircle
                size={16}
                color={Colors.error}
              />
              <ErrorText>{error}</ErrorText>
            </ErrorBanner>
          )}

          <Fields>
            <Input
              label="Email Address"
              placeholder="you@example.com"
              type="email"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              error={errors.email}
            />

            <Input
              label="Password"
              placeholder="Enter your password"
              type="password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              error={errors.password}
            />
          </Fields>

          <ForgotRow>
            <ForgotLink href="#">
              Forgot password?
            </ForgotLink>
          </ForgotRow>

          <Button
            title="Sign In"
            type="submit"
            isLoading={isLoading}
          />
        </Card>

        {/* Bottom Route Toggle Panel */}
        <Footer>
          <FooterText>
            Don't have an account?
          </FooterText>
          <SignupLink href="/signup">
            Create account
          </SignupLink>
        </Footer>
      </Content>
    </Container>
  );
}



const Container = styled.main`
  min-height: 100vh;
  background: ${Colors.background};
  display: flex;
  justify-content: center;
  align-items: center;
  padding: ${Spacing.xl}px;
`;


const Content = styled.form`
  width: 100%;
  max-width: 440px;
  display: flex;
  flex-direction: column;
  gap: ${Spacing.lg}px;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const BackButton = styled(Link)`
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background-color: ${Colors.white};
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1.5px solid ${Colors.border || '#e5e5ea'};
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
  background: ${Colors.primary};
  display: flex;
  align-items: center;
  justify-content: center;
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

const Card = styled.div`
  background: ${Colors.white};
  border-radius: ${BorderRadius.xl}px;
  padding: ${Spacing.lg}px;
  display: flex;
  flex-direction: column;
  gap: ${Spacing.md}px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.03);
  border: 1px solid rgba(0,0,0,0.02);
`;

const CardTitle = styled.h1`
  font-size: 28px;
  font-weight: 800;
  color: ${Colors.textPrimary};
  margin: 0;
  letter-spacing: -0.5px;
`;

const CardSub = styled.p`
  font-size: 14px;
  color: ${Colors.textMuted || '#8e8e93'};
  margin: 0;
`;

const ErrorBanner = styled.div`
  display: flex;
  align-items: center;
  gap: ${Spacing.xs}px;
  background: ${Colors.errorLight};
  padding: ${Spacing.md}px;
  border-radius: ${BorderRadius.md}px;
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

const ForgotRow = styled.div`
  display: flex;
  justify-content: flex-end;
`;

const ForgotLink = styled(Link)`
  color: ${Colors.primary};
  font-weight: 600;
  text-decoration: none;
  font-size: 14px;
  &:hover { text-decoration: underline; }
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

const SignupLink = styled(Link)`
  color: ${Colors.primary};
  font-weight: 700;
  text-decoration: none;
  &:hover { text-decoration: underline; }
`;