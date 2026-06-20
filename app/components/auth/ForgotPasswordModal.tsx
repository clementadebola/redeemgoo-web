'use client';

import React, { useState } from 'react';
import styled from 'styled-components';
import { IoClose, IoMail, IoCheckmarkCircle } from 'react-icons/io5';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../lib/firebase'; 
import { Colors } from '../../constants/theme';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialEmail?: string;
}

export default function ForgotPasswordModal({ isOpen, onClose, initialEmail = '' }: ForgotPasswordModalProps) {
  const [email, setEmail] = useState(initialEmail);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  if (!isOpen) return null;

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setStatus('error');
      setMessage('Please enter your email address.');
      return;
    }

    setStatus('loading');
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setStatus('success');
      setMessage('Reset link sent! Check your inbox.');
    } catch (error: any) {
      setStatus('error');
      // Firebase throws 'auth/user-not-found' if the email isn't registered
      if (error.code === 'auth/user-not-found') {
        setMessage('No account found with this email.');
      } else {
        setMessage('Failed to send reset link. Try again.');
      }
    }
  };

  const handleClose = () => {
    setStatus('idle');
    setMessage('');
    onClose();
  };

  return (
    <Overlay onClick={handleClose}>
      <ModalCard onClick={(e) => e.stopPropagation()}>
        <CloseButton onClick={handleClose}>
          <IoClose size={20} color={Colors.textPrimary} />
        </CloseButton>

        {status === 'success' ? (
          <SuccessState>
            <IoCheckmarkCircle size={48} color={Colors.primary} />
            <ModalTitle>Check your mail</ModalTitle>
            <ModalSub>We have sent a password reset link to <strong>{email}</strong>.</ModalSub>
            <SubmitButton onClick={handleClose} type="button">
              Return to Login
            </SubmitButton>
          </SuccessState>
        ) : (
          <Form onSubmit={handleResetPassword}>
            <ModalTitle>Reset Password</ModalTitle>
            <ModalSub>Enter the email associated with your account and we'll send you a link to reset your password.</ModalSub>

            <InputWrapper>
              <IoMail size={18} color={Colors.textSecondary} className="input-icon" />
              <EmailInput 
                type="email" 
                placeholder="you@example.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </InputWrapper>

            {status === 'error' && <ErrorText>{message}</ErrorText>}

            <SubmitButton type="submit" disabled={status === 'loading'}>
              {status === 'loading' ? 'Sending...' : 'Send Reset Link'}
            </SubmitButton>
          </Form>
        )}
      </ModalCard>
    </Overlay>
  );
}


const Overlay = styled.div`
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
`;

const ModalCard = styled.div`
  background: ${Colors.white};
  border-radius: 24px;
  padding: 32px 24px;
  width: 100%;
  max-width: 400px;
  position: relative;
  box-shadow: 0 20px 40px rgba(0,0,0,0.1);
  animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);

  @keyframes slideUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

const CloseButton = styled.button`
  position: absolute;
  top: 16px;
  right: 16px;
  background: #f2f2f7;
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s;
  &:hover { background: #e5e5ea; }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const SuccessState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 12px;
  padding: 16px 0;
`;

const ModalTitle = styled.h2`
  font-size: 20px;
  font-weight: 800;
  color: ${Colors.textPrimary};
  margin: 0;
`;

const ModalSub = styled.p`
  font-size: 14px;
  color: #666666;
  line-height: 1.5;
  margin: 0 0 8px 0;
`;

const InputWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;

  .input-icon {
    position: absolute;
    left: 14px;
  }
`;

const EmailInput = styled.input`
  width: 100%;
  height: 48px;
  border-radius: 12px;
  border: 1.5px solid ${Colors.border || '#e5e5ea'};
  padding: 0 16px 0 40px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
  
  &:focus {
    border-color: ${Colors.primary};
  }
`;

const ErrorText = styled.span`
  color: ${Colors.error};
  font-size: 12px;
  font-weight: 600;
`;

const SubmitButton = styled.button`
  width: 100%;
  height: 48px;
  border-radius: 12px;
  background: ${Colors.primary};
  color: white;
  border: none;
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
  margin-top: 8px;
  transition: opacity 0.2s;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  &:hover:not(:disabled) {
    opacity: 0.9;
  }
`;