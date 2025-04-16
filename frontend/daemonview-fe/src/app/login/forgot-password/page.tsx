'use client';

import styled from 'styled-components';
import { useState } from 'react';

const Container = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  font-family: 'Orbitron', sans-serif;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-image: url('/images/background.png');
    background-size: cover;
    background-position: center;
    opacity: 0.15;
    pointer-events: none;
    z-index: 0;
  }

  > * {
    position: relative;
    z-index: 1;
  }
`;

const FormWrapper = styled.div.attrs(() => ({}))<{ $isExpanded: boolean }>`
  width: 350px;
  background: linear-gradient(#212121, rgb(33, 33, 33)) padding-box,
              linear-gradient(145deg, transparent 35%, #e81cff, #40c9ff) border-box;
  border: 2px solid transparent;
  padding: 24px 20px;
  font-size: 14px;
  color: white;
  display: flex;
  flex-direction: column;
  gap: 16px;
  border-radius: 16px;
  box-shadow: 0 0 8px rgba(190, 75, 243, 0.4);
  overflow: hidden;
  max-height: ${(props) => (props.$isExpanded ? '500px' : '200px')};
  transition: max-height 0.9s ease-in-out;
`;

const Title = styled.h2`
  text-align: center;
  color: white;
  font-size: 30px;
  margin-bottom: 2rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #ddd;
  border-radius: 1.3rem;
  font-size: 1rem;
  margin-bottom: 2rem;
  background-color: rgb(51, 50, 51);
  color: white;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    color: white;
    border-color: rgb(210, 206, 224);
    box-shadow: 0 0 8px rgba(255, 255, 255, 0.8);
  }

  &:-webkit-autofill {
    background-color: rgb(51, 50, 51) !important;
    -webkit-box-shadow: 0 0 0px 1000px rgb(51, 50, 51) inset;
    -webkit-text-fill-color: white !important;
    transition: background-color 5000s ease-in-out 0s;
  }
`;

const Button = styled.button`
  width: 60%;
  justify-content: center;
  margin-top: 1rem;
  align-items: center;
  padding: 0.75rem;
  margin-left: 20%;
  background-color: #6b18ab;
  color: white;
  border: none;
  border-radius: 3rem;
  font-size: 1rem;
  cursor: pointer;
  transition: transform 0.2s ease, background-color 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    background-color: #7b1bc4;
    transform: scale(1.05);
    box-shadow:
      0 0 8px rgba(104, 0, 255, 0.4),
      0 0 16px rgba(64, 201, 255, 0.2),
      0 0 24px rgba(232, 28, 255, 0.15);
  }
`;

const Message = styled.p`
  color: #a3a3a3;
  font-size: 0.9rem;
  text-align: center;
`;

const PasswordInput = styled(Input)`
  margin-bottom: 1.5rem;
`;

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password === confirmPassword) {
      try {
        await fetch('http://localhost:8080/api/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        setSent(true);
      } catch (err) {
        console.error('Error resetting password:', err);
      }
    } else {
      alert("Passwords don't match!");
    }
  };

  return (
    <Container>
      <FormWrapper $isExpanded={isExpanded}>
        <Title>Reset Password</Title>
        {sent ? (
          <Message>Your password has been successfully reset!</Message>
        ) : (
          <form onSubmit={handleSubmit}>
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              onFocus={() => setIsExpanded(true)}  // Expand form when the user focuses on email input
            />
            {isExpanded && (
              <>
                <PasswordInput
                  type="password"
                  placeholder="New Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <PasswordInput
                  type="password"
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                <Button type="submit">Confirm Changes</Button>
              </>
            )}
          </form>
        )}
      </FormWrapper>
    </Container>
  );
}
