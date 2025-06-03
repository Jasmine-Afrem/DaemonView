'use client';

import styled from 'styled-components';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } 
from 'next/navigation';

// --- Styled Components (remain the same as your provided code) ---
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
  gap: 1.5rem; /* Adjusted gap for this page's content */
  border-radius: 16px;
  box-shadow: 0 0 8px rgba(190, 75, 243, 0.4);
  overflow: hidden;
  min-height: 300px; /* Ensure a minimum height */

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
  margin-bottom: 0; /* Rely on FormWrapper's gap */
`;

const BaseInput = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #ddd;
  border-radius: 1.3rem;
  font-size: 1rem;
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

const PasswordInput = styled(BaseInput)`
  margin-bottom: 1rem; 
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

const StyledForm = styled.form`
  display: flex;
  flex-direction: column;
`;
// --- End Styled Components ---


async function parseErrorResponse(response: Response): Promise<string> {
    let errorMessage = `Request failed with status ${response.status}`;
    try {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
            const errorData = await response.json();
            errorMessage = errorData.message || errorData.error || errorMessage;
        } else {
            const textError = await response.text();
            console.error("Non-JSON error response from server:", textError.substring(0, 500)); 
        }
    } catch (e) {
        console.error("Failed to parse error response:", e);
    }
    return errorMessage;
}


function ResetPasswordFormComponent() {
  const searchParams = useSearchParams();
  const router = useRouter(); 
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  const [isTokenValidatingOnLoad, setIsTokenValidatingOnLoad] = useState(true); 
  const [tokenInitiallyValid, setTokenInitiallyValid] = useState(false); 

  const VALIDATE_TOKEN_URL = 'http://localhost:8080/api/validate-token'; 
  const RESET_PASSWORD_URL = 'http://localhost:8080/api/reset-password';

  useEffect(() => {
    if (!token) {
      setError('No reset token found. Please request a new password reset link.');
      setTokenInitiallyValid(false);
      setIsTokenValidatingOnLoad(false);
      return;
    }

    const initialValidateToken = async () => {
      setIsTokenValidatingOnLoad(true);
      setError('');
      try {
        // VALIDATE_TOKEN_URL: Make sure this is correct. If your validate-token API
        // is also on localhost:8080, change this to 'http://localhost:8080/api/validate-token'
        const response = await fetch(VALIDATE_TOKEN_URL, { 
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        if (!response.ok) {
          const detailedError = await parseErrorResponse(response);
          throw new Error(detailedError);
        }
        
        // Assuming a successful response means the token is valid for now.
        // You might want to check response.json() for a specific success message if your API provides one.
        // const data = await response.json(); 
        // if (data.message !== 'Token is valid.') throw new Error("Token validation failed.");
        setTokenInitiallyValid(true);

      } catch (err: any) {
        console.error("Error during initial token validation:", err);
        setError(err.message || 'Token is invalid or has expired.');
        setTokenInitiallyValid(false);
      } finally {
        setIsTokenValidatingOnLoad(false);
      }
    };

    initialValidateToken();
  }, [token, VALIDATE_TOKEN_URL]); // Added VALIDATE_TOKEN_URL to dependencies

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!password || !confirmPassword) {
      setError('Please fill in both password fields.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 8) {
        setError('Password must be at least 8 characters long.');
        return;
    }

    // Double-check that we have a token string.
    if (!token) {
        setError('No token available for reset operation.');
        return;
    }

    setIsLoading(true);
    try {
      // Step 1: Re-validate the token before attempting to reset password
      console.log("Re-validating token before reset submission...");
      // VALIDATE_TOKEN_URL: Make sure this is correct. If your validate-token API
      // is also on localhost:8080, change this to 'http://localhost:8080/api/validate-token'
      const validationResponse = await fetch(VALIDATE_TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      if (!validationResponse.ok) {
        const validationError = await parseErrorResponse(validationResponse);
        console.error("Token re-validation failed during submission:", validationError);
        // Set specific error if token is no longer valid, otherwise use parsed error
        throw new Error(validationResponse.status === 400 ? "Password reset link is no longer valid or has expired." : validationError);
      }
      // Optionally, check content of validationResponse.json() if needed
      // const validationData = await validationResponse.json();
      // if (validationData.message !== "Token is valid.") { // Or whatever your API returns
      //    throw new Error("Token validation check failed before reset.");
      // }
      console.log("Token re-validated successfully. Proceeding to reset password.");

      // Step 2: If token re-validation is successful, proceed to reset password
      const resetResponse = await fetch(RESET_PASSWORD_URL, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }), // Send token and new password
      });

      if (!resetResponse.ok) {
        const resetError = await parseErrorResponse(resetResponse);
        throw new Error(resetError);
      }

      const resetData = await resetResponse.json();
      setSuccessMessage(resetData.message || 'Password has been reset successfully! You can now try logging in.');
      setPassword(''); // Clear password fields on success
      setConfirmPassword('');
      // Optionally, redirect after success:
      // setTimeout(() => router.push('/login'), 3000);

    } catch (err: any) {
      console.error("Error during password reset process:", err);
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isTokenValidatingOnLoad) {
    return <Message>Validating link...</Message>;
  }

  // If initial token validation failed, show error and don't render form
  if (!tokenInitiallyValid) { 
    return <Message style={{ color: 'red' }}>{error || 'This password reset link is invalid or has expired.'}</Message>;
  }

  // If password reset was successful, show success message
  if (successMessage) {
    return <Message style={{ color: 'lightgreen' }}>{successMessage}</Message>;
  }
  
  // Render form only if initial token validation was successful and no success message yet
  return (
    <StyledForm onSubmit={handleSubmit}>
      <PasswordInput
        type="password"
        placeholder="New Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        disabled={isLoading} // Form is only rendered if tokenInitiallyValid is true
      />
      <PasswordInput
        type="password"
        placeholder="Confirm New Password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        required
        disabled={isLoading}
      />
      <Button type="submit" disabled={isLoading}>
        {isLoading ? 'Resetting...' : 'Confirm New Password'}
      </Button>
      {error && <Message style={{ color: 'red', marginTop: '10px', fontSize: '0.85rem' }}>{error}</Message>}
    </StyledForm>
  );
}


export default function ResetPasswordPage() {
  return (
    <Container>
      <CornerImage src="/images/daemonview.png" alt="DaemonView logo" />
      <FormWrapper>
        <Title>Set New Password</Title>
        <Suspense fallback={<Message>Loading...</Message>}>
          <ResetPasswordFormComponent />
        </Suspense>
      </FormWrapper>
      <Footer>© {new Date().getFullYear()} DaemonView. All rights reserved.</Footer>
    </Container>
  );
}