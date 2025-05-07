'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styled from 'styled-components';
import { FiArrowLeft, FiUser, FiCamera, FiEye, FiEyeOff } from 'react-icons/fi';

const ProfilePage = () => {
  const [userInfo, setUserInfo] = useState({
    username: 'John Doe',
    email: 'john.doe@example.com',
    password: 'password',
    avatar: '',
  });

  const [passwordVisible, setPasswordVisible] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [popupVisible, setPopupVisible] = useState(false);

  const router = useRouter();

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
          avatar: reader.result as string,
        });
      };

      reader.readAsDataURL(file);
    }
  };

  const handleSaveChanges = () => {
    setShowPopup(true);
    setTimeout(() => setPopupVisible(true), 10);
  };

  const handleConfirmSave = () => {
    console.log('Changes confirmed:', userInfo);
    setPopupVisible(false);
    setTimeout(() => setShowPopup(false), 400);
  };

  const resetForm = () => {
    setUserInfo({
      username: 'John Doe',
      email: 'john.doe@example.com',
      password: 'password',
      avatar: '',
    });
  };

  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch('http://localhost:8080/api/check-auth', {
          method: 'GET',
          credentials: 'include',
        });

        if (!res.ok) {
          router.push('/login');
        } else {
          const data = await res.json();
          setUserInfo({ ...userInfo, username: data.user.username, email: data.user.email });
        }
      } catch (err) {
        console.error('Error checking session:', err);
        router.push('/login');
      }
    };
    checkSession();
  }, []);

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

          <SaveButton type="button" onClick={handleSaveChanges}>
            Save Changes
          </SaveButton>
        </FormCard>
      </ProfileSection>

      {showPopup && (
      <Popup $isVisible={popupVisible}>
        <PopupContent $isVisible={popupVisible}>
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

// === STYLED COMPONENTS ===

const Container = styled.div`
  position: relative;
  min-height: 100vh;
  background-color: #090821;
  color: #fff;
  font-family: 'Orbitron', sans-serif;
  padding: 40px;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
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
  transition: all 0.2s ease;

  &:hover {
    opacity: 1;
    transform: scale(1.05);
    text-shadow: 0 0 6px rgba(140, 135, 247, 0.5);
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
  transition: all 0.3s ease;

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
  padding: 6px 10px;
  border-radius: 30px;
  cursor: pointer;
  font-weight: bold;
  margin-bottom: 20px;
  transition: background-color 0.3s;

  &:hover {
    background-color: #4e49c4;
  }

  svg {
    margin-right: 1px;
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
  box-shadow: 0 0px 32px rgba(107, 61, 214, 0.2);
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

const PasswordToggle = styled.button.attrs({ type: 'button' })`
  position: absolute;
  top: 50%;
  right: 10px;
  transform: translateY(-50%);
  background: transparent;
  border: none;
  color: #aaa;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    color: #fff;
    transform: translateY(-50%) scale(1.1);
    text-shadow: 0 0 5px rgba(255, 255, 255, 0.4);
  }
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
    background-color: rgb(108, 104, 240);
    animation: glow 2s ease-in-out infinite;
  }

  @keyframes glow {
    0% {
      box-shadow: 0 0 10px rgba(99, 136, 238, 0.4);
    }
    50% {
      box-shadow: 0 0 20px rgba(99, 91, 255, 0.7);
    }
    100% {
      box-shadow: 0 0 10px rgba(99, 91, 255, 0.4);
    }
  }
`;

const Popup = styled.div<{ $isVisible: boolean }>`
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  background: rgba(0, 0, 0, 0.5);
  z-index: 9999;
  opacity: ${(props) => (props.$isVisible ? 1 : 0)};
  pointer-events: ${(props) => (props.$isVisible ? 'auto' : 'none')};
  transition: opacity 0.4s ease;
`;

const PopupContent = styled.div<{ $isVisible: boolean }>`
  background: #1c1b3a;
  color: #ffffff;
  padding: 30px;
  border-radius: 16px;
  text-align: center;
  width: 320px;
  box-shadow:
    0 0 8px rgba(99, 91, 255, 0.4),
    0 0 16px rgba(99, 91, 255, 0.3),
    0 0 24px rgba(99, 91, 255, 0.2);
  transform: ${(props) => (props.$isVisible ? 'scale(1)' : 'scale(0.85)')};
  transition: all 0.4s ease;
  backdrop-filter: blur(6px);
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const ConfirmButton = styled.button`
  padding: 10px 20px;
  background-color: #635bff;
  color: #fff;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  margin-top: 15px;

  &:hover {
    background-color: #4e49c4;
  }
`;

export default ProfilePage;
