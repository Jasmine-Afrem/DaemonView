'use client';

import styled from 'styled-components';

const Container = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: rgb(17, 16, 44);
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
  height: 70%;

  box-shadow:
    0 0 8px rgba(104, 0, 255, 0.4),
    0 0 16px rgba(64, 201, 255, 0.2),
    0 0 24px rgba(232, 28, 255, 0.15);
`;

const Title = styled.h2`
  text-align: center;
  color: white;
  font-size: 30px;
  margin-bottom: 3rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #ddd;
  border-radius: 1.3rem;
  font-size: 1rem;
  margin-bottom: 2rem;
  background-color: rgb(51, 50, 51);
`;

const Button = styled.button`
  width: 30%;
  justify-content: center;
  margin-top: 1rem;
  align-items: center;
  padding: 0.75rem;
  margin-left: 35%;
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

const Links = styled.div`
  margin-top: 1rem;
  text-align: center;

  a {
    color: rgb(72, 153, 247);
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
`;

const RegisterForm: React.FC = () => {
  return (
    <Container>
      <FormWrapper>
        <Title>Register</Title>
        <form>
          <Input type="text" placeholder="Username" required />
          <Input type="email" placeholder="Email" required />
          <Input type="password" placeholder="Password" required />
          <Input type="password" placeholder="Confirm Password" required />
          <Button type="submit">Sign Up</Button>
        </form>
        <Links>
          Already have an account? <a href="/login">Login</a>
        </Links>
      </FormWrapper>
    </Container>
  );
};

export default RegisterForm;
