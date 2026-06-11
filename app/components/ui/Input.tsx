"use client";

import React, { useState, InputHTMLAttributes } from "react";
import styled, { css } from "styled-components";
import {
  FiEye,
  FiEyeOff,
  FiMail,
  FiLock,
  FiSearch,
  FiUser,
} from "react-icons/fi";

import {
  Colors,
  BorderRadius,
  Typography,
  Spacing,
} from "../../constants/theme";

type IconName =
  | "mail-outline"
  | "lock-closed-outline"
  | "search-outline"
  | "person-outline";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: IconName;
  rightIcon?: React.ReactNode;
  onRightIconPress?: () => void;
  isPassword?: boolean;
}

const getIcon = (icon?: IconName) => {
  switch (icon) {
    case "mail-outline":
      return <FiMail />;
    case "lock-closed-outline":
      return <FiLock />;
    case "search-outline":
      return <FiSearch />;
    case "person-outline":
      return <FiUser />;
    default:
      return null;
  }
};

const Input = ({
  label,
  error,
  leftIcon,
  rightIcon,
  onRightIconPress,
  isPassword = false,
  ...props
}: InputProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  return (
    <Container>
      {label && <Label>{label}</Label>}

      <InputWrapper
        $focused={isFocused}
        $error={!!error}
      >
        {leftIcon && (
          <LeftIcon $focused={isFocused}>
            {getIcon(leftIcon)}
          </LeftIcon>
        )}

        <StyledInput
          {...props}
          type={
            isPassword
              ? showPassword
                ? "text"
                : "password"
              : props.type
          }
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />

        {isPassword ? (
          <RightIconButton
            type="button"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <FiEyeOff /> : <FiEye />}
          </RightIconButton>
        ) : (
          rightIcon && (
            <RightIconButton
              type="button"
              onClick={onRightIconPress}
            >
              {rightIcon}
            </RightIconButton>
          )
        )}
      </InputWrapper>

      {error && <ErrorText>{error}</ErrorText>}
    </Container>
  );
};

export default Input;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${Spacing.xs}px;
`;

const Label = styled.label`
  font-size: ${Typography.label.fontSize}px;
  font-weight: 600;
  color: ${Colors.textSecondary};
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const InputWrapper = styled.div<{
  $focused: boolean;
  $error: boolean;
}>`
  display: flex;
  align-items: center;
  background: ${Colors.surface};
  border-radius: ${BorderRadius.md}px;
  border: 1.5px solid ${Colors.border};
  padding: 0 ${Spacing.md}px;
  transition: all 0.2s ease;

  ${({ $focused }) =>
    $focused &&
    css`
      border-color: ${Colors.primary};
      background: ${Colors.white};
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    `}

  ${({ $error }) =>
    $error &&
    css`
      border-color: ${Colors.error};
    `}
`;

const StyledInput = styled.input`
  flex: 1;
  border: none;
  outline: none;
  background: transparent;

  padding: 14px 0;

  font-size: 15px;
  color: ${Colors.textPrimary};

  &::placeholder {
    color: ${Colors.textMuted};
  }
`;

const LeftIcon = styled.div<{ $focused: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;

  margin-right: ${Spacing.sm}px;

  color: ${({ $focused }) =>
    $focused ? Colors.primary : Colors.textMuted};

  svg {
    width: 20px;
    height: 20px;
  }
`;

const RightIconButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;

  margin-left: ${Spacing.sm}px;

  background: none;
  border: none;
  cursor: pointer;
  color: ${Colors.textMuted};

  svg {
    width: 20px;
    height: 20px;
  }
`;

const ErrorText = styled.span`
  color: ${Colors.error};
  font-size: ${Typography.bodySmall.fontSize}px;
`;