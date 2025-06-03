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

const FormWrapper = styled.div`
  width: 350px;
  background: linear-gradient(#212121, rgb(33, 33, 33)) padding-box,
              linear-gradient(145deg, transparent 35%, #e81cff, #40c9ff) border-box;
  border: 2px solid transparent;
  padding: 24px 20px;
  font-size: 14px;
  color: white;
  display: flex;
  flex-direction: column;
  gap: 3rem; 
  border-radius: 16px;
  box-shadow: 0 0 8px rgba(190, 75, 243, 0.4);
  overflow: hidden;

  animation: fadeIn 0.7s ease-in-out;

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }

`;

const Title = styled.h2`
  text-align: center;
  color: white;
  font-size: 30px;
  margin-bottom: 0;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #ddd;
  border-radius: 1.3rem;
  font-size: 1rem;
  margin-bottom: 3rem; 
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
  margin-bottom: 1rem;
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
  margin-top: 0.5rem;
`;

const CornerImage = styled.img`
  position: absolute;
  top: 20px;
  left: 20px;
  width: 230px; 
  height: auto;
  z-index: 2; 
`;

const Footer = styled.footer`
  position: absolute;
  bottom: 20px;
  width: 100%;
  text-align: center;
  color: #a3a3a3;
  font-size: 0.8rem;
  z-index: 1;
`;


export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSent(false); 
    setIsLoading(true);

    if (!email) {
      setError('Email address is required.');
      setIsLoading(false);
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:8080/api/request-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        let errorMessage = `An error occurred. Please try again.`;
        try {
            const errorData = await response.json();
            errorMessage = errorData.message || `Request failed. Status: ${response.status}`;
        } catch (parseError) {
        }
        throw new Error(errorMessage);
      }
      
      setSent(true); 
    } catch (err: any) {
      console.error('Error requesting password reset:', err);
      setError(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container>
      <CornerImage src="/images/daemonview.png" alt="DaemonView logo" />
      <FormWrapper>
        <Title>Reset Password</Title>
        {sent ? (
          <Message>A link to reset your password will be given to you shortly. Please check your email inbox (and spam folder).</Message>
        ) : (
          <form onSubmit={handleSubmit}>
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Sending...' : 'Reset Password'}
            </Button>
            {error && <Message style={{ color: 'red', marginTop: '10px', fontSize: '0.85rem' }}>{error}</Message>}
          </form>
        )}
      </FormWrapper>
      <Footer>© {new Date().getFullYear()} DaemonView. All rights reserved.</Footer>
    </Container>
  );
}