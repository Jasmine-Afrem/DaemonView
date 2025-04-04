// components/LoginForm.tsx
'use client';

import styled from 'styled-components';

const Container = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color:rgb(17, 16, 44);
`;

const FormWrapper = styled.div`
  width: 400px;
  background: linear-gradient(#212121, #212121) padding-box,
              linear-gradient(145deg, transparent 35%, #e81cff, #40c9ff) border-box;
  border: 2px solid transparent;
  padding: 32px 24px;
  font-size: 14px;
  font-family: inherit;
  color: white;
  display: flex;
  flex-direction: column;
  gap: 20px;
  box-sizing: border-box;
  border-radius: 18px;
  justify-content: center;
  align-items: center;
  height: 45%;
`;

const Title = styled.h2`
  margin-bottom: 1rem;
  text-align: center;
  color: white;
  font-size: 28px;
  margin-bottom: 3rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 1.3rem;
  font-size: 1rem;
  margin-bottom: 2rem;
`;

const Button = styled.button`
  width: 30%;
  justify-content: center;
  align-items: center;
  padding: 0.75rem;
  margin-left: 35%;
  background-color: #0070f3;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  border-radius: 3rem;

  &:hover {
    background-color: #005bb5;
  }
`;

const Links = styled.div`
  margin-top: 1rem;
  text-align: center;

  a {
    color: #0070f3;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
`;

const LoginForm: React.FC = () => {
  return (
    <Container>
      <FormWrapper>
        <Title>Login</Title>
        <form>
          <Input type="text" placeholder="Username" required />
          <Input type="password" placeholder="Password" required />
          <Button type="submit">Login</Button>
        </form>
        <Links>
          <a href="/forgot-password">Forgot Password?</a> |{' '}
          <a href="/register">Register</a>
        </Links>
      </FormWrapper>
    </Container>
  );
};

export default LoginForm;
