'use client';

import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import styled, { keyframes } from 'styled-components';
import {
  FiGrid, FiTag, FiUsers, FiLogOut, FiUser, FiMenu, FiX, FiSettings,
  FiHelpCircle, FiShield, FiPlus, FiEdit3, FiTrash2, FiUserPlus,
  FiEye, FiEyeOff, FiSearch, FiAlignLeft, FiChevronUp, FiChevronDown,
  FiCheck, FiAlertCircle, FiRefreshCw, FiEdit, FiTrash
} from 'react-icons/fi';
import '../../globals.css'; // Ensure your global styles are imported
import ProtectedRoute from '@/app/components/ProtectedRoute';

// --- KEYFRAMES & GENERAL STYLED COMPONENTS ---
const slideIn = keyframes`
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
`;

const glow = keyframes`
  0% { box-shadow: 0 0 10px rgba(99, 91, 255, 0.4); }
  50% { box-shadow: 0 0 20px rgba(99, 91, 255, 0.7); }
  100% { box-shadow: 0 0 10px rgba(99, 91, 255, 0.4); }
`;

const slideDownFadeIn = keyframes`
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const NotificationContainer = styled.div`
  position: fixed; top: 20px; right: 20px; z-index: 9999;
  display: flex; flex-direction: column; gap: 10px;
`;

const NotificationItem = styled.div<{ $type: 'success' | 'error' }>`
  background-color: ${({ $type }) => $type === 'success' ? '#1a472a' : '#5c1a1a'};
  color: white; padding: 16px 20px; border-radius: 8px;
  display: flex; align-items: center; gap: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  animation: ${slideIn} 0.3s ease-out;
  border: 1px solid ${({ $type }) => $type === 'success' ? '#2ecc71' : '#e74c3c'};
  svg { font-size: 20px; color: ${({ $type }) => $type === 'success' ? '#2ecc71' : '#e74c3c'}; }
`;

const Container = styled.div`
  display: flex; height: 100vh; background-color: #090821; color: #fff;
  font-family: 'Orbitron', sans-serif;
  &::before {
    content: ""; position: absolute; top: 0; left: 0; right: 0; bottom: 0;
    background-image: url('/images/background.png'); /* Ensure this path is correct */
    background-size: cover; background-position: center;
    opacity: 0.15; pointer-events: none; z-index: 0;
  }
`;

const ModalOverlay = styled.div`
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background-color: rgba(0, 0, 0, 0.75); display: flex;
  justify-content: center; align-items: center; z-index: 1001;
  backdrop-filter: blur(1px); animation: ${slideDownFadeIn} 0.3s ease-out;
`;

const ModalContent = styled.div`
  background-color: #1a1839; padding: 25px 30px; border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.4); width: 90%; max-width: 450px; 
  border: 1px solid #635bff;
  h3 { margin-top: 0; margin-bottom: 20px; color: #e0e0e0; font-size: 1.4em; text-align: center; }
`;

const MemberModalContent = styled(ModalContent)` max-width: 900px; width: 95%; `;

const Sidebar = styled.div<{ $isOpen: boolean }>`
  position: fixed; top: 0; left: 0; height: 100%; width: 70px;
  background-color: #2a274f; display: flex; flex-direction: column;
  align-items: center; padding-top: 20px; gap: 15px;
  box-shadow: ${({ $isOpen }) => $isOpen ? '4px 0px 10px rgba(0, 0, 0, 0.1)' : 'none'};
  transition: transform 0.4s ease-in-out;
  transform: ${({ $isOpen }) => ($isOpen ? 'translateX(0)' : 'translateX(-100%)')};
  z-index: 1000;
`;

const SidebarButton = styled.button.attrs(() => ({ type: 'button' }))`
  background: #1e1b3a; border: none; color: #fff; padding: 14px; border-radius: 10px;
  cursor: pointer; width: 50px; height: 50px; display: flex; align-items: center;
  justify-content: center; position: relative; overflow: hidden; transition: 0.3s ease;
  &:hover { background: #635bff; transform: scale(1.1); animation: ${glow} 2s ease-in-out infinite; }
`;

const Content = styled.div<{ $isSidebarOpen: boolean }>`
  flex: 1; padding: 20px; display: flex; flex-direction: column;
  overflow-y: auto; min-width: 0; transition: margin-left 0.4s ease-in-out;
  margin-left: ${({ $isSidebarOpen }) => ($isSidebarOpen ? '70px' : '0')};
  position: relative; z-index: 1;
`;

const Header = styled.div`
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 20px; position: relative; z-index: 2;
`;

const OriginalLeftHeader = styled.div` /* Renamed from LeftHeader */
  display: flex; align-items: center; gap: 10px;
`;

const SidebarToggle = styled.button`
  background: #1a1839; border: none; padding: 8px; border-radius: 50%;
  color: white; cursor: pointer; margin-right: 10px; transition: 0.3s ease;
  position: relative; overflow: hidden;
  &:hover { background: #635bff; animation: ${glow} 2s ease-in-out infinite; }
`;

const OriginalTitleImage = styled.img` /* Renamed from TitleImage */
  height: 60px; object-fit: contain; position: absolute; left: 50%;
  transform: translateX(-50%); filter: drop-shadow(0 2px 8px rgba(255, 255, 255, 0.2));
`;

const UserArea = styled.div`
  display: flex; align-items: center; gap: 10px; background: #1a1839;
  padding: 8px 12px; border-radius: 20px;
`;

const ProfileIcon = styled(FiUser)`
  cursor: pointer; transition: 0.3s ease; font-size: 20px;
  &:hover { color:rgb(134, 129, 240); transform: scale(1.1); }
`;

const LogoutIcon = styled(FiLogOut)`
  cursor: pointer; transition: 0.3s ease; font-size: 20px;
  &:hover { color: #ff5b5b; transform: scale(1.1); }
`;

const AdminSection = styled.div`
  flex: 1; background-color: rgba(19, 18, 48, 0.85); backdrop-filter: blur(10px);
  padding: 24px; border-radius: 20px; display: flex; flex-direction: column;
  gap: 30px; box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
`;

const SectionContainer = styled.div` padding: 0 10px; overflow: visible; `;

const SectionHeader = styled.div`
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid #3a376f;
`;

const HeaderActions = styled.div` display: flex; align-items: center; gap: 12px; `;

const SectionTitle = styled.h2`
  color: #e0e0e0; font-size: 1.6em; display: flex; align-items: center;
  gap: 10px; margin: 0;
`;

const ActionButton = styled.button`
  background-color: #635bff; color: white; border: none; padding: 10px 15px;
  border-radius: 8px; cursor: pointer; font-size: 0.9em;
  font-family: 'Orbitron', sans-serif; display: flex; align-items: center; gap: 8px;
  transition: background-color 0.3s, transform 0.2s;
  &:hover { background-color: #4e49c4; transform: translateY(-1px); animation: ${glow} 1.5s infinite alternate; }
  svg { font-size: 1.1em; }
`;

const ItemList = styled.ul` /* For Teams List */
  list-style: none; padding: 8px 0; margin: 20px 0 0 0; display: flex;
  flex-direction: column; gap: 10px; max-height: 400px; overflow-y: auto; overflow-x: visible;
  &::-webkit-scrollbar { width: 8px; height: 8px; }
  &::-webkit-scrollbar-track { background: #1c1a3a; border-radius: 4px; }
  &::-webkit-scrollbar-thumb { background: #4b4299; border-radius: 4px; border: 2px solid #1c1a3a; }
  &::-webkit-scrollbar-thumb:hover { background: #635bff; }
`;
const ItemCard = styled.li<{ $selected?: boolean; $members: number }>` /* For Teams List Item */
  background-color: #1e1b3a; padding: 16px; border-radius: 12px; display: flex;
  justify-content: space-between; align-items: center; cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid ${({ $selected }) => $selected ? '#635bff' : '#2a274f'};
  box-shadow: ${({ $selected }) => $selected ? '0 0 15px rgba(99, 91, 255, 0.5)' : 'none'};
  position: relative; overflow: hidden;
  &::before {
    content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 4px;
    background: ${({ $members }) => $members > 0 ? '#00c853' : '#ff6b6b'};
    transition: opacity 0.3s ease; opacity: 0.7;
  }
  &:hover {
    background-color: #2a274f; border-color: #4e49c4; transform: translateY(-2px); z-index: 1;
    &::before { opacity: 1; }
  }
`;
const TeamInfo = styled.div` flex: 1; min-width: 0; margin-right: 16px; `;
const TeamMainContent = styled.div` display: flex; flex-direction: column; gap: 4px; `;
const ItemName = styled.span`
  font-size: 1.1em; font-weight: 500; color: #fff; display: block;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
`;
const TeamDescription = styled.p`
  font-size: 0.85em; color: #a0a0c0; margin: 0; line-height: 1.4;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
`;
const TeamMeta = styled.div` display: flex; align-items: center; gap: 8px; margin-left: auto; `;
const MetaBadge = styled.div<{ $type?: 'members' | 'lead' }>`
  display: flex; align-items: center; gap: 4px; padding: 4px 12px; border-radius: 6px;
  font-size: 0.8em; white-space: nowrap;
  min-width: ${({ $type }) => $type === 'members' ? '60px' : '100px'}; justify-content: center;
  background-color: ${({ $type }) => $type === 'members' ? 'rgba(99, 91, 255, 0.15)' : $type === 'lead' ? 'rgba(0, 200, 83, 0.15)' : 'rgba(42, 39, 79, 0.5)'};
  color: ${({ $type }) => $type === 'members' ? '#635bff' : $type === 'lead' ? '#00c853' : '#8884b8'};
  svg { font-size: 1em; }
`;
const ItemActions = styled.div` display: flex; gap: 8px; align-items: center; margin-left: 12px; `;
const ActionIconButton = styled.button` /* General purpose icon button, e.g., in modals */
  background: none; border: none; cursor: pointer; padding: 8px; border-radius: 8px;
  display: flex; align-items: center; justify-content: center; transition: all 0.2s ease; color: #a0a0c0;
  &:hover { background: rgba(255, 255, 255, 0.1); transform: translateY(-2px); }
  svg { font-size: 1.3em; }
`;
const EditActionButton = styled(ActionIconButton)` &:hover { color: #76c7f7; background: rgba(118, 199, 247, 0.1); } `;
const DeleteActionButton = styled(ActionIconButton)`
  &:hover:enabled {
    color: #ff6b6b;
    background: rgba(255, 107, 107, 0.1);
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed !important;
    background: none;
    box-shadow: none;
    transform: none;
    animation: none;
  }
`;


const ModalButton = styled.button<{ variant?: 'primary' | 'secondary' | 'danger' }>`
  padding: 8px 16px; border-radius: 8px; border: none; cursor: pointer; font-weight: bold;
  transition: all 0.2s ease;
  background-color: ${({ variant }) => variant === 'secondary' ? '#2a274f' : variant === 'danger' ? '#ff4d4d' : '#635bff'};
  color: white;
  &:hover {
    transform: translateY(-2px);
    background-color: ${({ variant }) => variant === 'secondary' ? '#3a375f' : variant === 'danger' ? '#ff6666' : '#7671ff'};
  }
`;
const FormGroup = styled.div`
  margin-bottom: 18px;
  label { display: block; margin-bottom: 7px; color: #b0b0d0; font-size: 0.9em; }
  input, select {
    width: 100%; padding: 10px 12px; background-color: #2a274f; border: 1px solid #3a376f;
    border-radius: 8px; color: white; font-size: 0.95em; font-family: 'Orbitron', sans-serif;
    transition: border-color 0.2s, box-shadow 0.2s;
    &:focus { outline: none; border-color: #635bff; box-shadow: 0 0 0 3px rgba(99, 91, 255, 0.3); }
  }
  select {
    appearance: none;
    background-image: url("data:image/svg+xml;charset=UTF-8,%3Csvg width='12' height='8' viewBox='0 0 12 8' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1.41.59L6 5.17l4.59-4.58L12 2l-6 6-6-6z' fill='%23cccccc'/%3E%3C/svg%3E");
    background-repeat: no-repeat; background-position: right 12px center; padding-right: 36px;
    option { background-color: #1a1839; color: #e0e0e0; padding: 8px 12px; }
    option[value=""]:disabled { color: #888dab; }
    option:not([disabled]):not([value=""]):hover, option:not([disabled]):not([value=""]):focus { background-color: #2c2a5f; color: white; }
  }
`;
const ModalActions = styled.div`
  display: flex; justify-content: space-between; align-items: center; margin-top: 25px; padding: 0 20px;
  &:only-child { justify-content: center; }
  & > button:last-child:not(:first-child) { margin-left: auto; }
  & > button:first-child:last-child { margin: 0 auto; }
`;
const SearchContainer = styled.div` /* For Team Search */
  position: relative; display: flex; align-items: center; width: 250px; 
`;
const SearchInput = styled.input` /* For Team Search */
  width: 100%; padding: 10px 35px 10px 12px; background-color: #1a1839; border: 1px solid #2a274f;
  border-radius: 8px; color: white; font-family: 'Orbitron', sans-serif; font-size: 0.9em;
  transition: all 0.3s ease;
  &:focus { outline: none; border-color: #635bff; box-shadow: 0 0 10px rgba(99, 91, 255, 0.2); }
  &::placeholder { color: #666; }
`;
const SearchIcon = styled(FiSearch)` position: absolute; right: 12px; color: #666; font-size: 18px; `;
const SortButton = styled.button<{ $active?: boolean; $direction?: 'asc' | 'desc' }>` /* For Team Sort */
  background: ${({ $active }) => $active ? '#2a274f' : 'none'};
  border: 1px solid ${({ $active }) => $active ? '#635bff' : '#2a274f'};
  color: ${({ $active }) => $active ? '#fff' : '#a0a0c0'};
  font-family: 'Orbitron', sans-serif; font-size: 0.9em; display: flex; align-items: center;
  gap: 8px; cursor: pointer; padding: 8px 12px; border-radius: 8px; transition: all 0.2s;
  &:hover { background: #2a274f; border-color: #635bff; color: #fff; }
  .sort-icon {
    display: flex; flex-direction: column; align-items: center; font-size: 0.8em; gap: 0px;
    svg {
      &:first-child { margin-bottom: -4px; color: ${({ $active, $direction }) => $active && $direction === 'asc' ? '#635bff' : 'inherit'}; }
      &:last-child { margin-top: -4px; color: ${({ $active, $direction }) => $active && $direction === 'desc' ? '#635bff' : 'inherit'}; }
    }
  }
`;
const ChevronUpIcon = styled(FiChevronUp)` transform: scale(1.2); `;
const ChevronDownIcon = styled(FiChevronDown)` transform: scale(1.2); `;
const MemberTable = styled.table` /* For Team Members in Modal */
  width: 100%; border-collapse: collapse; margin-top: 15px;
  th, td { padding: 12px 15px; text-align: left; border-bottom: 1px solid #2a274f; font-family: 'BPReplay', sans-serif; }
  th { background-color: #1e1b3a; color: #a0a0c0; font-weight: 600; font-size: 0.95em; }
  tbody tr { transition: background-color 0.2s; &:hover { background-color: #222044; } }
  td { color: #d0d0d0; font-size: 0.9em; }
`;

// --- STYLED COMPONENTS FOR USER MANAGEMENT TABLE (as per your request) ---
const UserTableSection = styled.div`
  flex: 1; background-color: rgba(19, 18, 48, 0.85); backdrop-filter: blur(10px);
  padding: 24px; border-radius: 20px; display: flex; flex-direction: column;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2); margin-top: 20px;
`;
const UserListTableHeader = styled.div`
  display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;
`;
const UserListTableSearch = styled.div`
  background-color: #1a1839; padding: 8px 15px; border-radius: 20px;
  display: flex; align-items: center; gap: 8px;
  input {
    background: none; border: none; color: #fff; outline: none;
    font-size: 14px; width: 200px; font-family: 'Orbitron', sans-serif;
  }
`;
const UserListTableActions = styled.div`
  display: flex; align-items: center; gap: 10px;
  button {
    background: #1a1839; padding: 10px; border-radius: 50%; display: flex;
    align-items: center; justify-content: center; cursor: pointer;
    transition: 0.3s ease; position: relative; overflow: hidden;
    border: none; color: #ccc;
    &:hover { background: #635bff; color: #fff; animation: ${glow} 2s ease-in-out infinite; }
    svg { font-size: 18px; }
  }
`;
const UserListTable = styled.table`
  width: 100%;
  border-collapse: collapse;

  th,
  td {
    padding: 14px 12px;
    text-align: left; 
    border-bottom: 1px solid #2a274f; /* Match image's subtle row separator */
    color: #d0d0d0; /* Light text color for data */
    vertical-align: middle;
  }

  thead th {
    position: sticky;
    top: 0; /* Adjust if you have other sticky headers above this table's container */
    background-color: #1a1839; /* Slightly darker/more distinct header for the table. Adjust as needed based on image. */
    z-index: 5;
    color: #a0a0c0; /* Lighter text for headers as in image */
    font-weight: 600;
    font-size: 0.85em; /* Slightly smaller header text */
    text-transform: uppercase;
    letter-spacing: 0.5px; /* Slight letter spacing for uppercase headers */
    border-bottom: 1px solid #3a376f; /* Stronger border for header bottom */

    &:last-child {
      text-align: right; /* Align "ACTIONS" header text to the right */
    }
  }

  tbody tr {
     transition: background-color 0.2s ease;
     &:hover {
        background-color: #181633; /* Subtle hover, slightly lighter than row background */
     }
  }
  
  td {
    font-family: 'Inter', sans-serif; 
    font-size: 0.95em;
    color: #c0c0d0; /* Slightly adjusted for readability */
  }

  .action-cell-user-list {
    text-align: right; 
    button {
      background: none;
      border: none;
      color: #8785a0; /* Muted icon color */
      padding: 6px;
      cursor: pointer;
      border-radius: 4px; /* Slightly less round for a sharper look */
      display: inline-flex; 
      align-items: center;
      justify-content: center;
      margin-left: 8px; 
      transition: color 0.2s, background-color 0.2s;

      &:hover {
        color: #a9a7f0; /* Lighter purple for icon hover */
        background-color: rgba(99, 91, 255, 0.1); 
      }
      svg {
        font-size: 17px; /* Slightly smaller icons if needed */
      }
    }
  }
`;
const StyledPagination = styled.div`
  display: flex; justify-content: center; align-items: center;
  margin-top: 25px; gap: 8px; flex-wrap: wrap;
  span { color: #777; padding: 0 5px; }
`;
const PageNavButton = styled.button`
  background-color: #1a1839; color: #fff; border: 1px solid #2a274f;
  padding: 8px 12px; border-radius: 8px; font-weight: 500;
  cursor: pointer; transition: all 0.2s ease; font-size: 14px;
  min-width: 36px; display: flex; align-items: center; justify-content: center;
  &:hover:not(:disabled) { background-color: #635bff; border-color: #635bff; transform: translateY(-1px); }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;
const PageNumberButton = styled(PageNavButton) <{ $active?: boolean }>`
  background-color: ${({ $active }) => $active ? '#635bff' : '#1a1839'};
  border-color: ${({ $active }) => $active ? '#635bff' : '#2a274f'};
  font-weight: ${({ $active }) => $active ? 'bold' : '500'};
  &:hover:not(:disabled) { background-color: ${({ $active }) => $active ? '#7671ff' : '#2a274f'}; }
`;


// --- TYPES ---
type Role = 'user' | 'admin' | 'tehnician' | 'supervisor';
const AVAILABLE_ROLES: Role[] = ['user', 'admin', 'tehnician', 'supervisor'];

type Member = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

interface EditUserFormData {
  email: string;
  username: string;
  role: Role;
}

type FetchedTeamFromAPI = {
  team_id: number;
  team_name: string;
  description: string | null;
  members: string | null;
};

type Team = {
  id: string;
  name: string;
  description: string;
  members: Member[];
  memberNamesString?: string;
};

type FetchedUser = { id: string; username: string; email: string; role?: string; };

type SortField = 'name' | 'members';
type SortDirection = 'asc' | 'desc';
const USERS_PER_PAGE = 5;

const AccountAdminPage = () => {
  const auth = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loggedInUsername, setLoggedInUsername] = useState('');

  // Account Creation States
  const [isCreateAccountModalOpen, setIsCreateAccountModalOpen] = useState(false);
  const [accountFormData, setAccountFormData] = useState({ username: '', email: '' });
  const [createdPassword, setCreatedPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);

  // System Users Management States
  const [systemUsers, setSystemUsers] = useState<FetchedUser[]>([]);
  const [loadingSystemUsers, setLoadingSystemUsers] = useState(true);
  const [errorSystemUsers, setErrorSystemUsers] = useState<string | null>(null);
  const [systemUserSearchQuery, setSystemUserSearchQuery] = useState('');
  const [currentSystemUserPage, setCurrentSystemUserPage] = useState(1);
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<FetchedUser | null>(null);
  const [editUserFormData, setEditUserFormData] = useState<EditUserFormData>({
    email: '',
    username: '',
    role: AVAILABLE_ROLES[0],
  });
  // Teams Management States
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [teamFormData, setTeamFormData] = useState({ name: '', description: '' });
  const [loadingTeams, setLoadingTeams] = useState(true);
  const [errorTeams, setErrorTeams] = useState<string | null>(null);

  // Add/Edit Member (to Team) States
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null); // For editing member's role within a team
  const [memberFormData, setMemberFormData] = useState<Omit<Member, 'id'>>({ name: '', email: '', role: AVAILABLE_ROLES[2] });
  const [allAvailableUsersForTeam, setAllAvailableUsersForTeam] = useState<FetchedUser[]>([]);
  const [selectedUserIdToAdd, setSelectedUserIdToAdd] = useState<string | null>(null);
  const [loadingUsersForTeam, setLoadingUsersForTeam] = useState(false);
  const [errorLoadingUsersForTeam, setErrorLoadingUsersForTeam] = useState<string | null>(null);

  // Delete Modals States
  const [isDeleteTeamModalOpen, setIsDeleteTeamModalOpen] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState<Team | null>(null);
  const [isDeleteMemberModalOpen, setIsDeleteMemberModalOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<Member | null>(null);
  // No separate modal state for deleting user, will use window.confirm as per original snippet

  // General Search and Sort for Teams
  const [teamSearchQuery, setTeamSearchQuery] = useState('');
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [teamSortBy, setTeamSortBy] = useState<SortField>('name');
  const [teamSortDirection, setTeamSortDirection] = useState<SortDirection>('asc');

  // Notifications
  type Notification = { id: string; message: string; type: 'success' | 'error'; };
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const showNotification = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 3000);
  }, []);

  const sidebarIcons = [
    { icon: <FiGrid />, label: 'Dashboard', onClick: () => router.push('/dashboard') },
    { icon: <FiTag />, label: 'Ticket Charts', onClick: () => router.push('/dashboard/ticket-charts') },
    { icon: <FiUsers />, label: 'Team Charts', onClick: () => router.push('/dashboard/team-charts') },
    { icon: <FiShield />, label: 'Account Admin', onClick: () => router.push('/dashboard/account-administrator') },
  ];

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';


  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/me`, { method: 'GET', credentials: 'include' });
        if (res.ok) { const data = await res.json(); setLoggedInUsername(auth.user?.username || data.username || ""); }
        else { router.push('/login'); }
      } catch (err) { console.error('Auth check failed', err); router.push('/login'); }
    };
    fetchUser();
  }, [router, auth.user, API_BASE_URL]);

  // --- API CALLS & DATA FETCHING ---
  const fetchSystemUsers = useCallback(async () => {
    setLoadingSystemUsers(true); setErrorSystemUsers(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/get-users`, {
        method: 'GET', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `Server error: ${response.status}` }));
        throw new Error(errorData.message || `Failed to fetch system users: ${response.status}`);
      }
      const rawUsersData: any[] = await response.json();
      const usersData: FetchedUser[] = rawUsersData.map(user => ({
        ...user,
        id: String(user.id)
      }));
      setSystemUsers(usersData);
    } catch (error) {
      console.error('Error fetching system users:', error);
      setErrorSystemUsers(error instanceof Error ? error.message : 'An unknown error occurred while fetching users.');
      setSystemUsers([]);
    } finally {
      setLoadingSystemUsers(false);
    }
  }, [API_BASE_URL]);

  const fetchTeams = useCallback(async () => {
    setLoadingTeams(true); setErrorTeams(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/get-teams`, {
        method: 'GET', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
      });
      if (!response.ok) {
        let errorMessage = `Failed to fetch teams: ${response.status} ${response.statusText}`;
        try { const errorData = await response.json(); errorMessage = errorData.message || errorMessage; } catch (e) { /* no-op */ }
        throw new Error(errorMessage);
      }
      const rawTeamsData: FetchedTeamFromAPI[] = await response.json();
      const processedTeams: Team[] = rawTeamsData.map((apiTeam) => {
        let parsedMembers: Member[] = [];
        if (apiTeam.members && typeof apiTeam.members === 'string') {
          parsedMembers = apiTeam.members.split(',').map(name => name.trim()).filter(name => name)
            .map((memberName, memberIndex) => ({
              id: `member_placeholder_${apiTeam.team_id}_${memberIndex}`,
              name: memberName,
              email: '', // Placeholder
              role: 'Developer' as Role, // Placeholder default role
            }));
        }
        return {
          id: apiTeam.team_id.toString(),
          name: apiTeam.team_name,
          description: apiTeam.description || "",
          members: parsedMembers,
          memberNamesString: apiTeam.members || "",
        };
      });
      setTeams(processedTeams);
    } catch (error) {
      console.error('Error fetching teams:', error);
      setErrorTeams(error instanceof Error ? error.message : 'An unknown error occurred while fetching teams.');
      setTeams([]);
    } finally {
      setLoadingTeams(false);
    }
  }, [API_BASE_URL]);

  useEffect(() => {
    fetchSystemUsers();
    fetchTeams();
  }, [fetchSystemUsers, fetchTeams]);

  useEffect(() => {
    if (teams.length > 0 || !loadingTeams) {
      localStorage.setItem('teams', JSON.stringify(teams));
    }
  }, [teams, loadingTeams]);

  useEffect(() => {
    if (isMemberModalOpen && !editingMember && selectedTeam) {
      setLoadingUsersForTeam(true); setErrorLoadingUsersForTeam(null);
      setAllAvailableUsersForTeam([]); setSelectedUserIdToAdd(null);
      try {
        if (systemUsers && systemUsers.length > 0) {
          const memberUsernamesInCurrentTeam = new Set(
            selectedTeam.members.map(m => m.name.toLowerCase())
          );
          const available = systemUsers.filter(
            user => user && user.username && !memberUsernamesInCurrentTeam.has(user.username.toLowerCase())
          );
          setAllAvailableUsersForTeam(available);
        } else {
          showNotification("System user list is not available for selection.", "error");
        }
      } catch (error) {
        console.error("Error in useEffect for add member modal:", error);
        setErrorLoadingUsersForTeam("Error filtering users for team.");
      } finally {
        setLoadingUsersForTeam(false);
      }
    }
  }, [isMemberModalOpen, editingMember, selectedTeam, systemUsers, showNotification]);

  // --- HANDLERS ---
  const handleLogout = async () => { try { await auth.logout(); router.push('/login'); } catch (e) { console.error(e); showNotification('Logout failed', 'error'); } };
  const handleProfileClick = () => router.push('/dashboard/profile');
  const handleSelectTeam = (team: Team) => { setSelectedTeam(team); setShowMembersModal(true); };

  const handleCreateAccount = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...accountFormData }),
      });
      if (response.ok) {
        showNotification(`Account for ${accountFormData.username} created successfully.`);
        fetchSystemUsers();
      } else {
        const data = await response.json().catch(() => ({ message: 'Failed to create account' }));
        showNotification(data.message || 'Failed to create account', 'error');
      }
    } catch (error) {
      showNotification('Network error occurred while creating account.', 'error');
      console.error(error);
    }
  };

  const closeCreateAccountModal = () => {
    setIsCreateAccountModalOpen(false); setCreatedPassword(''); setShowPassword(false);
    setAccountFormData({ username: '', email: '' });
  };

  // --- System User Handlers ---
  const handleDeleteSystemUser = async (userName: string) => {
    if (!window.confirm(`Are you sure you want to delete user "${userName}" permanently? This action cannot be undone.`)) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/delete-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username: userName }),
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        showNotification(data.message || `User "${userName}" deleted successfully.`);
        fetchSystemUsers(); // Refresh the user list
      } else {
        throw new Error(data.message || `Failed to delete user ${userName}. Status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      showNotification(error instanceof Error ? error.message : 'An unknown error occurred.', 'error');
    }
  };

  const openEditUserModal = (userToEdit: FetchedUser) => {
    setEditingUser(userToEdit);
    setEditUserFormData({
      email: userToEdit.email || '',
      username: userToEdit.username || '', // Assuming username is a property
      role: userToEdit.role || AVAILABLE_ROLES[0] // Use current role or a default
    });
    setIsEditUserModalOpen(true);
  };

  const closeEditUserModal = () => {
    setIsEditUserModalOpen(false);
    setEditingUser(null);
    setEditUserFormData({ email: '', username: '', role: AVAILABLE_ROLES[2] });
  };

  const handleUpdateSystemUser = async () => {
    if (!editingUser) return;

    const updates: { email?: string; role?: string } = {};
    if (editUserFormData.email !== editingUser.email) {
      updates.email = editUserFormData.email;
    }
    // Ensure role is included if it changed or if API expects it even if same
    if (editUserFormData.role !== (editingUser.role || AVAILABLE_ROLES[2])) {
      updates.role = editUserFormData.role;
    }


    if (Object.keys(updates).length === 0) {
      showNotification('No changes detected for the user.', 'error');
      closeEditUserModal();
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/update-user`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          current_username: editingUser.username,
          ...updates,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        showNotification(data.message || `User "${editingUser.username}" updated successfully.`);
        fetchSystemUsers(); // Refresh user list
        closeEditUserModal();
      } else {
        throw new Error(data.message || `Failed to update user. Status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error updating user:', error);
      showNotification(error instanceof Error ? error.message : 'An unknown error occurred while updating user.', 'error');
    }
  };


  // --- Team Handlers ---
  const openAddTeamModal = () => { setEditingTeam(null); setTeamFormData({ name: '', description: '' }); setIsTeamModalOpen(true); };
  const openEditTeamModal = (team: Team, event: React.MouseEvent) => { event.stopPropagation(); setEditingTeam(team); setTeamFormData({ name: team.name, description: team.description }); setIsTeamModalOpen(true); };

  const handleSaveTeam = async () => {
    if (editingTeam) { // UPDATE (This part remains the same as before)
      const updatePayload: { current_name: string; team_id: string; name?: string; description?: string } = {
        current_name: editingTeam.name,
        team_id: editingTeam.id,
      };
      let hasChanges = false;
      if (teamFormData.name !== editingTeam.name) { updatePayload.name = teamFormData.name; hasChanges = true; }
      if (teamFormData.description !== editingTeam.description) { updatePayload.description = teamFormData.description; hasChanges = true; }

      if (!hasChanges) {
        showNotification('No changes made to the team.', 'error'); // Or 'info'
        setIsTeamModalOpen(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/update-team`, {
          method: 'POST', // Or PUT if your API uses PUT for updates
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(updatePayload),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: `Failed to update team: ${response.status}` }));
          throw new Error(errorData.message || `Failed to update team: ${response.status}`);
        }

        const data = await response.json(); // Assuming API sends back { message: '...' } or updated team data
        showNotification(data.message || `Team "${updatePayload.name || editingTeam.name}" updated successfully.`);
        await fetchTeams(); // Re-fetch all teams to ensure data consistency

      } catch (error) {
        console.error("Error updating team:", error);
        showNotification(error instanceof Error ? error.message : 'Could not update team.', 'error');
      }

    } else { // CREATE operation
      const newTeamData = {
        name: teamFormData.name.trim(), // Trim whitespace
        description: teamFormData.description.trim() // Trim whitespace
      };

      if (!newTeamData.name) {
        showNotification('Team name cannot be empty.', 'error');
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/create-team`, { // Ensure this endpoint is correct
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(newTeamData),
        });

        if (!response.ok) {
          let errorMessage = `Failed to create team. Status: ${response.status}`;
          try {
            const errorData = await response.json(); // Try to get server's error message
            errorMessage = errorData.message || errorMessage;
          } catch (e) {
            const textError = await response.text();
            console.error("Server returned non-JSON error for create-team:", textError);
            errorMessage += ` - Server response: ${textError.substring(0, 100)}...`;
          }
          throw new Error(errorMessage);
        }

        const data = await response.json(); // Expecting { team_id, team_name, description, ... } or at least { message }

        showNotification(data.message || `Team "${data.team_name || newTeamData.name}" created successfully.`);

        await fetchTeams();

      } catch (error) {
        console.error("Error creating team:", error);
        showNotification(error instanceof Error ? error.message : 'An unknown error occurred while creating the team.', 'error');
      }
    }

    setIsTeamModalOpen(false);
    setTeamFormData({ name: '', description: '' }); // Reset form
    setEditingTeam(null); // Clear editing state
  };

  const handleDeleteTeam = (teamId: string, event: React.MouseEvent) => { event.stopPropagation(); const team = teams.find(t => t.id === teamId); if (team) { setTeamToDelete(team); setIsDeleteTeamModalOpen(true); } };

  const confirmDeleteTeam = async () => {
    if (!teamToDelete) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/delete-team`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: teamToDelete.name }), // API expects 'name'
      });
      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        showNotification(data.message || `Team "${teamToDelete.name}" deleted successfully.`);
        fetchTeams(); // Re-fetch teams
        if (selectedTeam?.id === teamToDelete.id) setSelectedTeam(null);
      } else {
        throw new Error(data.message || `Failed to delete team "${teamToDelete.name}".`);
      }
    } catch (error) {
      console.error('Error deleting team:', error);
      showNotification(error instanceof Error ? error.message : 'An unknown error occurred while deleting team.', 'error');
    } finally {
      setIsDeleteTeamModalOpen(false);
      setTeamToDelete(null);
    }
  };

  // --- Team Member Handlers ---
  const openAddMemberModal = () => { if (!selectedTeam) return; setEditingMember(null); setMemberFormData({ name: '', email: '', role: AVAILABLE_ROLES[2] }); setIsMemberModalOpen(true); };

  const openEditMemberModal = (member: Member, event: React.MouseEvent) => {
    event.stopPropagation();
    if (!selectedTeam) return;
    setEditingMember(member);
    // For editing, prefill with existing member data.
    // The form for editing member usually involves changing their role within the team.
    setMemberFormData({ name: member.name, email: member.email, role: member.role });
    setIsMemberModalOpen(true);
    // No need to fetch allAvailableUsersForTeam if we are editing an existing member's role.
    setAllAvailableUsersForTeam([]);
    setSelectedUserIdToAdd(null);
  };

  const handleSaveMember = async () => {
    if (!selectedTeam) { showNotification('No team selected.', 'error'); return; }

    if (editingMember) {
      const updatedMembers = selectedTeam.members.map(m =>
        m.id === editingMember.id ? { ...m, role: memberFormData.role } : m // Only role is typically editable here
      );
      const updatedTeamForEdit = { ...selectedTeam, members: updatedMembers };
      setTeams(teams.map(t => (t.id === selectedTeam.id ? updatedTeamForEdit : t)));
      setSelectedTeam(updatedTeamForEdit);
      showNotification(`Member "${editingMember.name}" role updated to "${memberFormData.role}" in team "${selectedTeam.name}". (Local update, API needed)`);
      closeMemberModal();
    } else { // ADDING a new member
      if (!selectedUserIdToAdd) { showNotification('Please select a user to add.', 'error'); return; }
      const userObjectToAdd = allAvailableUsersForTeam.find(u => u.id === selectedUserIdToAdd);
      if (!userObjectToAdd) { showNotification('Selected user not found.', 'error'); return; }

      const payload = { team_name: selectedTeam.name, username: userObjectToAdd.username };
      try {
        const response = await fetch(`${API_BASE_URL}/api/add-member`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload),
        });
        const responseData = await response.json();
        if (!response.ok) throw new Error(responseData.message || `Failed to add member: ${response.status}`);

        showNotification(responseData.message || `User "${userObjectToAdd.username}" added to "${selectedTeam.name}".`);
        fetchTeams(); // Re-fetch teams to get updated member list
        // Or, if API returns the updated team or member details, update locally more precisely.
        // For simplicity, re-fetching is safer.
        if (selectedTeam) { // Refresh the currently selected team's view
          const updatedSelectedTeam = teams.find(t => t.id === selectedTeam.id);
          if (updatedSelectedTeam) setSelectedTeam(updatedSelectedTeam);
        }

      } catch (error) {
        console.error("Error adding member to team:", error);
        showNotification(error instanceof Error ? error.message : 'Could not add member to team.', 'error');
      } finally {
        closeMemberModal();
      }
    }
  };

  const closeMemberModal = () => { setIsMemberModalOpen(false); setEditingMember(null); setMemberFormData({ name: '', email: '', role: AVAILABLE_ROLES[2] }); setAllAvailableUsersForTeam([]); setSelectedUserIdToAdd(null); setLoadingUsersForTeam(false); setErrorLoadingUsersForTeam(null); };

  const handleDeleteMember = (memberId: string, event: React.MouseEvent) => { event.stopPropagation(); if (!selectedTeam) return; const member = selectedTeam.members.find(m => m.id === memberId); if (member) { setMemberToDelete(member); setIsDeleteMemberModalOpen(true); } };

  const confirmDeleteMember = async () => {
    if (!selectedTeam || !memberToDelete) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/remove-member`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          team_name: selectedTeam.name,
          username: memberToDelete.name, // Assuming member.name is the username
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || `Failed to remove member. Status: ${response.status}`);

      showNotification(data.message || `Member "${memberToDelete.name}" removed from "${selectedTeam.name}".`);
      fetchTeams(); // Re-fetch teams to get updated member list
      // Refresh the currently selected team's view
      if (selectedTeam) {
        const teamAfterMemberRemoval = await fetchTeamDetails(selectedTeam.id); // You might need a specific fetchTeamDetails
        if (teamAfterMemberRemoval) setSelectedTeam(teamAfterMemberRemoval);
        else setSelectedTeam(null); // Or simply refetch all and find
      }


    } catch (error) {
      console.error('Error removing member from team:', error);
      showNotification(error instanceof Error ? error.message : 'An unknown error occurred while removing member.', 'error');
    } finally {
      setIsDeleteMemberModalOpen(false);
      setMemberToDelete(null);
    }
  };
  // Helper function placeholder, actual implementation depends on your API structure
  const fetchTeamDetails = async (teamId: string): Promise<Team | null> => {
    // This function would fetch details for a single team, including its members.
    // Useful after operations like adding/removing members to refresh just the selected team.
    // For now, we're re-fetching all teams. If you have an endpoint like /api/teams/{id}, use it here.
    console.warn("fetchTeamDetails called, but not fully implemented. Re-fetching all teams instead for now.");
    await fetchTeams();
    const refreshedTeam = teams.find(t => t.id === teamId);
    return refreshedTeam || null;
  };

  // --- UI LOGIC (Pagination, Sorting, Filtering) ---
  const SIBLING_COUNT = 1;
  let paginationItems: (number | string)[] = [];

  const filteredSystemUsers = useMemo(() => {
    return systemUsers.filter(user =>
      user.username.toLowerCase().includes(systemUserSearchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(systemUserSearchQuery.toLowerCase())
    );
  }, [systemUsers, systemUserSearchQuery]);
  const totalSystemUserPages = Math.ceil(filteredSystemUsers.length / USERS_PER_PAGE);
  const paginatedSystemUsers = useMemo(() => {
    const startIndex = (currentSystemUserPage - 1) * USERS_PER_PAGE;
    return filteredSystemUsers.slice(startIndex, startIndex + USERS_PER_PAGE);
  }, [filteredSystemUsers, currentSystemUserPage]);
  const handleSystemUserPageChange = (newPage: number) => { if (newPage >= 1 && newPage <= totalSystemUserPages) { setCurrentSystemUserPage(newPage); } };
  const userTableHeaders = ['Username', 'Email', 'Role', 'Actions'];

  const filteredTeams = useMemo(() => teams.filter(team =>
    team.name.toLowerCase().includes(teamSearchQuery.toLowerCase()) ||
    team.description?.toLowerCase().includes(teamSearchQuery.toLowerCase())
  ), [teams, teamSearchQuery]);
  const sortedTeams = useMemo(() => [...filteredTeams].sort((a, b) => {
    if (teamSortBy === 'name') return teamSortDirection === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
    if (teamSortBy === 'members') return teamSortDirection === 'asc' ? a.members.length - b.members.length : b.members.length - a.members.length;
    return 0;
  }), [filteredTeams, teamSortBy, teamSortDirection]);
  const toggleTeamSort = (field: SortField) => { if (teamSortBy === field) { setTeamSortDirection(prev => prev === 'asc' ? 'desc' : 'asc'); } else { setTeamSortBy(field); setTeamSortDirection('asc'); } };

  if (totalSystemUserPages > 1) {
    const range = (start: number, end: number) => Array.from({ length: end - start + 1 }, (_, idx) => idx + start);
    const showEllipsis = totalSystemUserPages > (SIBLING_COUNT * 2) + 3;
    if (!showEllipsis) {
      paginationItems = range(1, totalSystemUserPages);
    } else {
      const leftSiblingIndex = Math.max(currentSystemUserPage - SIBLING_COUNT, 1);
      const rightSiblingIndex = Math.min(currentSystemUserPage + SIBLING_COUNT, totalSystemUserPages);
      const shouldShowLeftDots = leftSiblingIndex > 2;
      const shouldShowRightDots = rightSiblingIndex < totalSystemUserPages - 1;
      if (!shouldShowLeftDots && shouldShowRightDots) {
        const leftItemCount = (SIBLING_COUNT * 2) + 2;
        const leftRange = range(1, Math.min(leftItemCount, totalSystemUserPages - 1));
        paginationItems = [...leftRange, `ellipsis_right`, totalSystemUserPages];
      } else if (shouldShowLeftDots && !shouldShowRightDots) {
        const rightItemCount = (SIBLING_COUNT * 2) + 2;
        const rightRange = range(Math.max(totalSystemUserPages - rightItemCount + 1, 2), totalSystemUserPages);
        paginationItems = [1, `ellipsis_left`, ...rightRange];
      } else if (shouldShowLeftDots && shouldShowRightDots) {
        const middleRange = range(leftSiblingIndex, rightSiblingIndex);
        paginationItems = [1, `ellipsis_left`, ...middleRange, `ellipsis_right`, totalSystemUserPages];
      } else {
        paginationItems = range(1, totalSystemUserPages);
      }
    }
  }

  return (
    <ProtectedRoute role="admin">
      <Container>
        <NotificationContainer>
          {notifications.map(notification => (
            <NotificationItem key={notification.id} $type={notification.type}>
              {notification.type === 'success' ? <FiCheck /> : <FiAlertCircle />}
              {notification.message}
            </NotificationItem>
          ))}
        </NotificationContainer>

        <Sidebar $isOpen={sidebarOpen}>
          {sidebarIcons.map(({ icon, label, onClick }, idx) => (
            <SidebarButton key={idx} title={label} onClick={onClick}>{icon}</SidebarButton>
          ))}
        </Sidebar>

        <Content $isSidebarOpen={sidebarOpen}>
          <Header>
            <OriginalLeftHeader><SidebarToggle onClick={() => setSidebarOpen(!sidebarOpen)}>{sidebarOpen ? <FiX size={20} /> : <FiMenu size={20} />}</SidebarToggle></OriginalLeftHeader>
            <OriginalTitleImage src="/images/daemonview.png" alt="DaemonView Admin" />
            <UserArea><ProfileIcon onClick={handleProfileClick} /> {loggedInUsername || "User"}<LogoutIcon onClick={handleLogout} /></UserArea>
          </Header>

          <AdminSection>
            <SectionContainer>
              <SectionHeader>
                <SectionTitle><FiShield /> Account Management</SectionTitle>
                <ActionButton onClick={() => setIsCreateAccountModalOpen(true)}><FiPlus /> Create New Account</ActionButton>
              </SectionHeader>
              <UserTableSection>
                <UserListTableHeader>
                  <UserListTableSearch>
                    <FiSearch color="#888" size={18} />
                    <input type="text" placeholder="Search users..." value={systemUserSearchQuery} onChange={(e) => { setSystemUserSearchQuery(e.target.value); setCurrentSystemUserPage(1); }} />
                  </UserListTableSearch>
                  <UserListTableActions><button onClick={fetchSystemUsers} title="Refresh User List" disabled={loadingSystemUsers}><FiRefreshCw /></button></UserListTableActions>
                </UserListTableHeader>
                <UserListTable>
                  <thead><tr>{userTableHeaders.map((header, idx) => (<th key={`user-header-${idx}`}>{header}</th>))}</tr></thead>
                  <tbody>
                    {loadingSystemUsers ? (<tr><td colSpan={userTableHeaders.length} style={{ textAlign: 'center', padding: '20px', color: '#aaa' }}>Loading users...</td></tr>)
                      : errorSystemUsers ? (<tr><td colSpan={userTableHeaders.length} style={{ textAlign: 'center', padding: '20px', color: '#ff6b6b' }}>Error: {errorSystemUsers}</td></tr>)
                        : paginatedSystemUsers.length === 0 ? (<tr><td colSpan={userTableHeaders.length} style={{ textAlign: 'center', padding: '20px', color: '#888' }}>{systemUserSearchQuery ? 'No users match your search.' : 'No system users found.'}</td></tr>)
                          : (paginatedSystemUsers.map((user) => (
                            <tr key={`user-${user.id}`}>
                              <td>{user.username}</td><td>{user.email}</td><td>{user.role || 'N/A'}</td>
                              <td className="action-cell-user-list">
                                <ActionButton title="Edit User" onClick={() => openEditUserModal(user)} style={{ padding: '6px', marginRight: '5px' }}><FiEdit /></ActionButton>
                                <DeleteActionButton
                                  title={user.username === loggedInUsername ? "Cannot delete yourself" : "Delete User"}
                                  onClick={(e: React.MouseEvent) => {
                                    if (user.username === loggedInUsername) return;
                                    handleDeleteSystemUser(user.username);
                                  }}
                                  disabled={user.username === loggedInUsername}
                                >
                                  <FiTrash2 />
                                </DeleteActionButton>


                              </td>
                            </tr>)))}
                  </tbody>
                </UserListTable>
                {!loadingSystemUsers && !errorSystemUsers && filteredSystemUsers.length > 0 && totalSystemUserPages > 1 && (
                  <StyledPagination>
                    <PageNavButton key="pagination-prev" disabled={currentSystemUserPage <= 1} onClick={() => handleSystemUserPageChange(currentSystemUserPage - 1)}>←</PageNavButton>
                    {paginationItems.map((item) => {
                      const itemKey = typeof item === 'string' ? item : `page-${item}`;
                      if (typeof item === 'string' && item.startsWith('ellipsis_')) return <span key={itemKey} style={{ padding: '0 4px', color: '#aaa', alignSelf: 'center' }}>...</span>;
                      const pageNumber = item as number;
                      return (<PageNumberButton key={itemKey} $active={pageNumber === currentSystemUserPage} onClick={() => handleSystemUserPageChange(pageNumber)}>{pageNumber}</PageNumberButton>);
                    })}
                    <PageNavButton key="pagination-next" disabled={currentSystemUserPage >= totalSystemUserPages} onClick={() => handleSystemUserPageChange(currentSystemUserPage + 1)}>→</PageNavButton>
                  </StyledPagination>)}
              </UserTableSection>
            </SectionContainer>

            <SectionContainer>
              <SectionHeader>
                <SectionTitle><FiUsers /> Teams Management</SectionTitle>
                <HeaderActions>
                  <SearchContainer><SearchInput type="text" placeholder="Search teams..." value={teamSearchQuery} onChange={(e) => setTeamSearchQuery(e.target.value)} /><SearchIcon /></SearchContainer>
                  <ActionButton onClick={openAddTeamModal}><FiPlus /> Add Team</ActionButton>
                </HeaderActions>
              </SectionHeader>
              <div style={{ display: 'flex', gap: '12px', marginTop: '15px', marginBottom: '20px' }}>
                <SortButton onClick={() => toggleTeamSort('name')} $active={teamSortBy === 'name'} $direction={teamSortBy === 'name' ? teamSortDirection : undefined}>Name <span className="sort-icon"><ChevronUpIcon /><ChevronDownIcon /></span></SortButton>
                <SortButton onClick={() => toggleTeamSort('members')} $active={teamSortBy === 'members'} $direction={teamSortBy === 'members' ? teamSortDirection : undefined}>Members <span className="sort-icon"><ChevronUpIcon /><ChevronDownIcon /></span></SortButton>
              </div>
              {loadingTeams && (<p style={{ textAlign: 'center', color: '#aaa', marginTop: '20px' }}>Loading teams...</p>)}
              {!loadingTeams && errorTeams && (<p style={{ textAlign: 'center', color: '#ff6b6b', marginTop: '20px' }}>Error fetching teams: {errorTeams}</p>)}
              {!loadingTeams && !errorTeams && (teams.length > 0 ? (
                <ItemList>
                  {sortedTeams.map(team => (
                    <ItemCard key={team.id} onClick={() => handleSelectTeam(team)} $selected={selectedTeam?.id === team.id} $members={team.members.length}>
                      <TeamInfo><TeamMainContent><ItemName>{team.name}</ItemName><TeamDescription>{team.description || "No description"}</TeamDescription></TeamMainContent></TeamInfo>
                      <TeamMeta>
                        <MetaBadge $type="members"><FiUsers />{team.members.length}</MetaBadge>
                      </TeamMeta>
                      <ItemActions>
                        <EditActionButton title="Edit Team" onClick={(e) => { e.stopPropagation(); openEditTeamModal(team, e); }}><FiEdit3 /></EditActionButton>
                        <DeleteActionButton title="Delete Team" onClick={(e) => { e.stopPropagation(); handleDeleteTeam(team.id, e); }}><FiTrash2 /></DeleteActionButton>
                      </ItemActions>
                    </ItemCard>))}
                </ItemList>
              ) : (<p style={{ textAlign: 'center', color: '#888', marginTop: '20px' }}>{teamSearchQuery ? 'No teams match your search.' : 'No teams found.'}</p>)
              )}
            </SectionContainer>
          </AdminSection>
        </Content>

        {/* MODALS */}
        {isEditUserModalOpen && editingUser && (
          <ModalOverlay onClick={closeEditUserModal}>
            <ModalContent onClick={e => e.stopPropagation()}>
              <h3>Edit User: {editingUser.username}</h3> {/* Use initial username for title */}

              <FormGroup>
                <label htmlFor="userNameEdit">Username</label>
                <input
                  type="text"
                  id="userNameEdit"
                  value={editUserFormData.username}
                  onChange={e => setEditUserFormData({ ...editUserFormData, username: e.target.value })}
                />
              </FormGroup>

              <FormGroup>
                <label htmlFor="userEmailEdit">Email</label>
                <input
                  type="email"
                  id="userEmailEdit"
                  value={editUserFormData.email}
                  onChange={e => setEditUserFormData({ ...editUserFormData, email: e.target.value })}
                />
              </FormGroup>

              <FormGroup>
                <label htmlFor="userRoleEdit">Role</label>
                <select
                  id="userRoleEdit"
                  value={editUserFormData.role}
                  onChange={e => setEditUserFormData({ ...editUserFormData, role: e.target.value as Role })}
                >
                  {AVAILABLE_ROLES.map(roleOption => (
                    <option key={roleOption} value={roleOption}>
                      {/* Optional: Capitalize for display */}
                      {roleOption.charAt(0).toUpperCase() + roleOption.slice(1)}
                    </option>
                  ))}
                </select>
              </FormGroup>

              <ModalActions>
                <ModalButton variant="secondary" onClick={closeEditUserModal}>Cancel</ModalButton>
                <ModalButton onClick={handleUpdateSystemUser}>Save Changes</ModalButton>
              </ModalActions>
            </ModalContent>
          </ModalOverlay>
        )}

        {showMembersModal && selectedTeam && (
          <ModalOverlay onClick={() => setShowMembersModal(false)}>
            <MemberModalContent onClick={e => e.stopPropagation()}>
              <SectionHeader style={{ marginBottom: '20px', paddingBottom: '15px' }}><SectionTitle><FiUser /> Members of: {selectedTeam.name}</SectionTitle><ActionButton onClick={openAddMemberModal}><FiUserPlus /> Add Member</ActionButton></SectionHeader>
              {selectedTeam.members.length > 0 ? (
                <MemberTable>
                  <thead><tr><th>Name</th><th style={{ textAlign: 'right' }}>Actions</th></tr></thead>
                  <tbody>
                    {selectedTeam.members.map(member => (
                      <tr key={member.id}>
                        <td>{member.name}</td>
                        <td style={{ textAlign: 'right' }}>
                          <ItemActions style={{ justifyContent: 'flex-end' }}>
                            <DeleteActionButton
                              title={member.name === loggedInUsername ? "Remove yourself from team" : "Remove Member"}
                              onClick={(e: React.MouseEvent) => handleDeleteMember(member.id, e)}
                            >
                              <FiTrash2 />
                            </DeleteActionButton>
                          </ItemActions>
                        </td>
                      </tr>
                    ))}



                  </tbody>
                </MemberTable>
              ) : (<p style={{ textAlign: 'center', color: '#888', marginTop: '20px' }}>No members in this team yet.</p>)}
            </MemberModalContent>
          </ModalOverlay>
        )}
        {isTeamModalOpen && (<ModalOverlay onClick={() => setIsTeamModalOpen(false)}><ModalContent onClick={e => e.stopPropagation()}><h3>{editingTeam ? 'Edit Team' : 'Add New Team'}</h3><FormGroup><label htmlFor="tn">Name</label><input type="text" id="tn" value={teamFormData.name} onChange={e => setTeamFormData({ ...teamFormData, name: e.target.value })} /></FormGroup><FormGroup><label htmlFor="td">Description</label><input type="text" id="td" value={teamFormData.description} onChange={e => setTeamFormData({ ...teamFormData, description: e.target.value })} /></FormGroup><ModalActions><ModalButton variant="secondary" onClick={() => setIsTeamModalOpen(false)}>Cancel</ModalButton><ModalButton onClick={handleSaveTeam}>{editingTeam ? 'Save Changes' : 'Create Team'}</ModalButton></ModalActions></ModalContent></ModalOverlay>)}
        {isMemberModalOpen && selectedTeam && (
          <ModalOverlay onClick={closeMemberModal}>
            <ModalContent onClick={e => e.stopPropagation()}>
              <>
                <FormGroup>
                  <label htmlFor="selectUserToAdd">User</label>
                  {loadingUsersForTeam && <p>Loading available users...</p>}
                  {errorLoadingUsersForTeam && <p style={{ color: 'red' }}>{errorLoadingUsersForTeam}</p>}
                  {!loadingUsersForTeam && !errorLoadingUsersForTeam && allAvailableUsersForTeam.length === 0 && <p>No users available to add or all users are already in this team.</p>}
                  {!loadingUsersForTeam && !errorLoadingUsersForTeam && allAvailableUsersForTeam.length > 0 && (
                    <select id="selectUserToAdd" value={selectedUserIdToAdd || ''} onChange={e => setSelectedUserIdToAdd(e.target.value)}>
                      <option value="" disabled>-- Select a User --</option>
                      {allAvailableUsersForTeam.map(u => (<option key={u.id} value={u.id}>{u.username} ({u.email})</option>))}
                    </select>
                  )}
                </FormGroup>
              </>
              <ModalActions>
                <ModalButton variant="secondary" onClick={closeMemberModal}>Cancel</ModalButton>
                <ModalButton onClick={handleSaveMember}>{editingMember ? 'Save Role' : 'Add Member'}</ModalButton>
              </ModalActions>
            </ModalContent>
          </ModalOverlay>
        )}
        {isDeleteTeamModalOpen && teamToDelete && (<ModalOverlay onClick={() => setIsDeleteTeamModalOpen(false)}><ModalContent onClick={e => e.stopPropagation()}><h3>Confirm Deletion</h3><p>Are you sure you want to delete the team "{teamToDelete.name}"? {teamToDelete.members.length > 0 && <span style={{ color: 'red', display: 'block', marginTop: '5px' }}>This team has {teamToDelete.members.length} member(s).</span>} This action cannot be undone.</p><ModalActions><ModalButton variant="secondary" onClick={() => setIsDeleteTeamModalOpen(false)}>Cancel</ModalButton><ModalButton variant="danger" onClick={confirmDeleteTeam}>Delete Team</ModalButton></ModalActions></ModalContent></ModalOverlay>)}
        {isDeleteMemberModalOpen && memberToDelete && selectedTeam && (<ModalOverlay onClick={() => setIsDeleteMemberModalOpen(false)}><ModalContent onClick={e => e.stopPropagation()}><h3>Confirm Removal</h3><p>Are you sure you want to remove member "{memberToDelete.name}" from the team "{selectedTeam.name}"?</p><ModalActions><ModalButton variant="secondary" onClick={() => setIsDeleteMemberModalOpen(false)}>Cancel</ModalButton><ModalButton variant="danger" onClick={confirmDeleteMember}>Remove Member</ModalButton></ModalActions></ModalContent></ModalOverlay>)}
        {isCreateAccountModalOpen && (<ModalOverlay onClick={closeCreateAccountModal}><ModalContent onClick={e => e.stopPropagation()}><h3>Create New Account</h3><FormGroup><label htmlFor="un">Username</label><input type="text" id="un" value={accountFormData.username} onChange={e => setAccountFormData({ ...accountFormData, username: e.target.value })} /></FormGroup><FormGroup><label htmlFor="ue">Email</label><input type="email" id="ue" value={accountFormData.email} onChange={e => setAccountFormData({ ...accountFormData, email: e.target.value })} /></FormGroup>
          <ModalActions><ModalButton variant="secondary" onClick={closeCreateAccountModal}>Cancel</ModalButton>{!createdPassword && (<ModalButton onClick={handleCreateAccount}>Create Account</ModalButton>)}</ModalActions></ModalContent></ModalOverlay>)}
      </Container>
    </ProtectedRoute>
  );
};

export default AccountAdminPage;