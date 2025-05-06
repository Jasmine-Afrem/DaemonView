'use client';
import styled, { keyframes } from 'styled-components';

const glow = keyframes`
  0% { box-shadow: 0 0 10px rgba(99, 91, 255, 0.4); }
  50% { box-shadow: 0 0 20px rgba(99, 91, 255, 0.7); }
  100% { box-shadow: 0 0 10px rgba(99, 91, 255, 0.4); }
`;

// Add all the styled components below
export const Container = styled.div`...`;
export const Sidebar = styled.div<{ $isOpen: boolean }>`...`;
export const SidebarButton = styled.button`...`;
export const Content = styled.div<{ $isSidebarOpen: boolean }>`...`;
export const Header = styled.div`...`;
export const SidebarToggle = styled.button`...`;
export const UserArea = styled.div`...`;
export const TitleImage = styled.img`...`;

// Export the rest similarly
