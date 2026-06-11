'use client';

import React from 'react';
import styled, { css } from 'styled-components';

type ButtonVariant = 'primary' | 'outline' | 'ghost' | 'danger';

// 1. Extend standard HTML button attributes to support "type", "form", etc. natively
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  title: string;
  onClick?: () => void; // Made optional so type="submit" forms can manage execution
  variant?: ButtonVariant;
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
  icon?: React.ReactNode;
}

export default function Button({
  title,
  onClick,
  variant = 'primary',
  isLoading = false,
  disabled = false,
  type = 'button', // Default explicitly to 'button' so it doesn't accidentally trigger forms
  className,
  icon,
  ...props // Capture any other native HTML button properties automatically
}: ButtonProps) {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || isLoading) {
      e.preventDefault();
      return;
    }

    // Optional browser vibration (similar to haptics)
    if (typeof window !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(10);
    }

    // Only invoke onClick if it was explicitly passed down
    if (onClick) {
      onClick();
    }
  };

  return (
    <StyledButton
      type={type}
      variant={variant}
      disabled={disabled || isLoading}
      onClick={handleClick}
      className={className}
      {...props} // Pass through remaining native elements safely
    >
      {isLoading ? (
        <Spinner $variant={variant} />
      ) : (
        <>
          {icon}
          <ButtonText variant={variant}>{title}</ButtonText>
        </>
      )}
    </StyledButton>
  );
}

// ─── STYLED COMPONENTS & STYLING LOGIC ──────────────────────────────────────

const COLORS = {
  primary: '#10b981',
  primaryLight: '#DBEAFE',
  error: '#DC2626',
  errorLight: '#FEE2E2',
  white: '#FFFFFF',
};

const StyledButton = styled.button<{ variant: ButtonVariant }>`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  padding: 16px 24px;
  border-radius: 16px;
  border: none;

  cursor: pointer;
  transition: all 0.2s ease;

  ${({ variant }) =>
    variant === 'primary' &&
    css`
      background: ${COLORS.primary};
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3); /* Adjusted shadow color token to match primary green */
    `}

  ${({ variant }) =>
    variant === 'outline' &&
    css`
      background: transparent;
      border: 1.5px solid ${COLORS.primary};
    `}

  ${({ variant }) =>
    variant === 'ghost' &&
    css`
      background: ${COLORS.primaryLight};
    `}

  ${({ variant }) =>
    variant === 'danger' &&
    css`
      background: ${COLORS.errorLight};
      border: 1.5px solid ${COLORS.error};
    `}

  &:hover:not(:disabled) {
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ButtonText = styled.span<{ variant: ButtonVariant }>`
  font-size: 16px;
  font-weight: 600;

  ${({ variant }) =>
    variant === 'primary' &&
    css`
      color: ${COLORS.white};
    `}

  ${({ variant }) =>
    ['outline', 'ghost'].includes(variant) &&
    css`
      color: ${COLORS.primary};
    `}

  ${({ variant }) =>
    variant === 'danger' &&
    css`
      color: ${COLORS.error};
    `}
`;

// Dynamic loading spinner configuration logic based on button variant colors
const Spinner = styled.div<{ $variant: ButtonVariant }>`
  width: 18px;
  height: 18px;
  border: 2px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;

  border-top-color: ${({ $variant }) => 
    $variant === 'primary' ? COLORS.white : COLORS.primary};

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;