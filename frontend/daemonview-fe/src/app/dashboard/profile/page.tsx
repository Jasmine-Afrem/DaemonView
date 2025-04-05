'use client';

import { useState } from 'react';
import Link from 'next/link';
import styled from 'styled-components';
import { FiArrowLeft, FiUser, FiCamera, FiEye, FiEyeOff, FiLogOut } from 'react-icons/fi';

const ProfilePage = () => {
  const [userInfo, setUserInfo] = useState({
    username: 'John Doe',
    email: 'john.doe@example.com',
    password: 'password123',
    avatar: '', // Optionally include an avatar URL
  });
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [showPopup, setShowPopup] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUserInfo({ ...userInfo, [name]: value });
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();

      reader.onloadend = () => {
        setUserInfo({
          ...userInfo,
          avatar: reader.result as string, // Set the image as base64 string
        });
      };

      reader.readAsDataURL(file); // Convert the file to a base64 string
    }
  };

  const handleSaveChanges = () => {
    setShowPopup(true); // Show the confirmation popup
  };

  const handleConfirmSave = () => {
    console.log('Changes confirmed:', userInfo);
    setShowPopup(false); // Close the popup and save changes
  };

  const resetForm = () => {
    setUserInfo({
      username: 'John Doe',
      email: 'john.doe@example.com',
      password: 'password123',
      avatar: '',
    });
  };

  return (
    <Container>
      <Header>
        <Link href="/dashboard">
          <Back>
            <FiArrowLeft />
            Dashboard
          </Back>
        </Link>
        <PageTitle>Profile</PageTitle>
      </Header>

      <ProfileSection>
        <Avatar>
          <FiUser size={75} />
        </Avatar>
        <Username>{userInfo.username}</Username>

        {/* Subtle Change Avatar Button */}
        <ChangeAvatarButton htmlFor="avatar-upload">
          <FiCamera size={16} />
        </ChangeAvatarButton>
        <InputFile
          id="avatar-upload"
          type="file"
          accept="image/*"
          onChange={handleAvatarChange}
        />

        <FormCard>
          <Field>
            <Label>Email</Label>
            <Input type="email" value={userInfo.email} readOnly />
          </Field>

          <Field>
            <Label>Password</Label>
            <PasswordWrapper>
              <Input
                type={passwordVisible ? 'text' : 'password'}
                name="password"
                value={userInfo.password}
                onChange={handleChange}
              />
              <PasswordToggle onClick={() => setPasswordVisible(!passwordVisible)}>
                {passwordVisible ? <FiEyeOff /> : <FiEye />}
              </PasswordToggle>
            </PasswordWrapper>
          </Field>

        <SaveButton type="button" onClick={handleSaveChanges}>Save Changes</SaveButton>

        </FormCard>
      </ProfileSection>

      {/* Popup */}
      {showPopup && (
        <Popup>
          <PopupContent>
            <h3>Are you sure you want to save the changes?</h3>
            <div>
              <ConfirmButton onClick={handleConfirmSave}>Yes</ConfirmButton>
            </div>
          </PopupContent>
        </Popup>
      )}
    </Container>
  );
};

const Container = styled.div`
  min-height: 100vh;
  background-color: #090821;
  color: #fff;
  font-family: 'Orbitron', sans-serif;
  padding: 40px;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Back = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: #635bff;
  cursor: pointer;
  font-weight: bold;

  &:hover {
    opacity: 0.8;
  }
`;

const PageTitle = styled.h1`
  font-size: 2rem;
`;

const ProfileSection = styled.div`
  margin-top: 60px;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const Avatar = styled.div`
  width: 150px;
  height: 150px;
  border-radius: 50%;
  background-color: #1a1a2e;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #fff;
  border: 2px solid #635bff;
  box-shadow: 0 0 15px rgba(99, 91, 255, 0.5);
  font-size: 3rem;
  cursor: pointer;

  &:hover {
    opacity: 0.8;
  }
`;

const Username = styled.h2`
  font-size: 1.8rem;
  margin-bottom: 20px;
  margin-top: 1.3rem;
`;

const ChangeAvatarButton = styled.label`
  display: flex;
  align-items: center;
  background-color: #635bff;
  color: #fff;
  padding: 4px;
  border-radius: 30px;
  cursor: pointer;
  font-weight: bold;
  padding-left: 8px;
  margin-bottom: 20px;
  transition: background-color 0.3s;

  &:hover {
    background-color: #4e49c4;
  }

  svg {
    margin-right: 5px;
  }
`;

const InputFile = styled.input`
  display: none;
`;

const FormCard = styled.form`
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px;
  padding: 32px;
  backdrop-filter: blur(6px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  width: 100%;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const Label = styled.label`
  font-size: 0.9rem;
  color: #aaa;
`;

const Input = styled.input`
  background: transparent;
  border: 1px solid #635bff;
  border-radius: 8px;
  padding: 10px;
  color: #fff;
  transition: 0.2s;
  outline: none;

  &:hover, &:focus {
    background: rgba(255, 255, 255, 0.03);
  }

  &:read-only {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const PasswordWrapper = styled.div`
  position: relative;
`;

const PasswordToggle = styled.button`
  position: absolute;
  top: 50%;
  right: 10px;
  transform: translateY(-50%);
  background: transparent;
  border: none;
  color: #aaa;
  cursor: pointer;
`;

const SaveButton = styled.button`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  padding: 12px;
  border: none;
  border-radius: 10px;
  background-color: #635bff;
  color: #fff;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.3s, box-shadow 0.3s;
  box-shadow: 0 0 0 rgba(99, 91, 255, 0.6);
  position: relative;
  overflow: hidden;

  &:hover {
    background-color: #4e49c4;
    animation: glow 2s ease-in-out infinite;
  }

  @keyframes glow {
    0% {
      box-shadow: 0 0 10px rgba(99, 91, 255, 0.4);
    }
    50% {
      box-shadow: 0 0 20px rgba(99, 91, 255, 0.7);
    }
    100% {
      box-shadow: 0 0 10px rgba(99, 91, 255, 0.4);
    }
  }
`;

// Popup Styles
const Popup = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  background: rgba(0, 0, 0, 0.5);
  z-index: 9999;
`;

const PopupContent = styled.div`
  background: #fff;
  color: #090821;
  padding: 30px;
  border-radius: 10px;
  text-align: center;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  width: 300px;
`;

const ConfirmButton = styled.button`
  padding: 10px 20px;
  background-color: #635bff;
  color: #fff;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  margin: 10px;

  &:hover {
    background-color: #4e49c4;
  }
`;

export default ProfilePage;
