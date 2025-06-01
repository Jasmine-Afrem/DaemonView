'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import {
  FiGrid,
  FiTag,
  FiUsers,    
  FiLogOut,
  FiUser,      
  FiMenu,
  FiX,
  FiSettings,
  FiHelpCircle,
  FiShield,    
  FiPlus,      
  FiEdit3,     
  FiTrash2,    
  FiUserPlus,  
  FiEye,
  FiEyeOff,
  FiSearch,
  FiAlignLeft,
  FiChevronUp,
  FiChevronDown,
  FiCheck,
  FiAlertCircle,
} from 'react-icons/fi';
import '../../globals.css'; 

const slideIn = keyframes`
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
`;

const NotificationContainer = styled.div`
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const NotificationItem = styled.div<{ $type: 'success' | 'error' }>`
  background-color: ${({ $type }) => $type === 'success' ? '#1a472a' : '#5c1a1a'};
  color: white;
  padding: 16px 20px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  animation: ${slideIn} 0.3s ease-out;
  border: 1px solid ${({ $type }) => $type === 'success' ? '#2ecc71' : '#e74c3c'};
  
  svg {
    font-size: 20px;
    color: ${({ $type }) => $type === 'success' ? '#2ecc71' : '#e74c3c'};
  }
`;

const glow = keyframes`
  0% { box-shadow: 0 0 10px rgba(99, 91, 255, 0.4); }
  50% { box-shadow: 0 0 20px rgba(99, 91, 255, 0.7); }
  100% { box-shadow: 0 0 10px rgba(99, 91, 255, 0.4); }
`;

const redGlow = keyframes`
  0% { box-shadow: 0 0 10px rgba(255, 91, 91, 0.4); }
  50% { box-shadow: 0 0 20px rgba(255, 91, 91, 0.7); }
  100% { box-shadow: 0 0 10px rgba(255, 91, 91, 0.4); }
`;

const slideDownFadeIn = keyframes`
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const Container = styled.div`
  display: flex;
  height: 100vh;
  background-color: #090821;
  color: #fff;
  font-family: 'Orbitron', sans-serif;
  &::before {
    content: ""; position: absolute; top: 0; left: 0; right: 0; bottom: 0;
    background-image: url('/images/background.png');
    background-size: cover; background-position: center;
    opacity: 0.15; pointer-events: none; z-index: 0;
  }
`;

const ModalOverlay = styled.div`
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background-color: rgba(0, 0, 0, 0.75);
  display: flex; justify-content: center; align-items: center;
  z-index: 1001; backdrop-filter: blur(1px);
  animation: ${slideDownFadeIn} 0.3s ease-out;
`;

const ModalContent = styled.div`
  background-color: #1a1839;
  padding: 25px 30px;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.4);
  width: 90%;
  max-width: 450px; 
  border: 1px solid #635bff;

  h3 {
    margin-top: 0; margin-bottom: 20px; color: #e0e0e0;
    font-size: 1.4em; text-align: center;
  }
`;

const MemberModalContent = styled(ModalContent)`
  max-width: 900px;
  width: 95%;
`;

const Sidebar = styled.div<{ $isOpen: boolean }>`
  position: fixed;
  top: 0; left: 0; height: 100%; width: 70px;
  background-color: #2a274f; display: flex; flex-direction: column;
  align-items: center; padding-top: 20px; gap: 15px;
  box-shadow: ${({ $isOpen }) => $isOpen ? '4px 0px 10px rgba(0, 0, 0, 0.1)' : 'none'};
  transition: transform 0.4s ease-in-out;
  transform: ${({ $isOpen }) => ($isOpen ? 'translateX(0)' : 'translateX(-100%)')};
  z-index: 1000;
`;

const SidebarButton = styled.button.attrs(() => ({ type: 'button' }))`
  background: #1e1b3a; border: none; color: #fff; padding: 14px;
  border-radius: 10px; cursor: pointer; width: 50px; height: 50px;
  display: flex; align-items: center; justify-content: center;
  position: relative; overflow: hidden; transition: 0.3s ease;
  &:hover { background: #635bff; transform: scale(1.1); animation: ${glow} 2s ease-in-out infinite; }
`;

const Content = styled.div<{ $isSidebarOpen: boolean }>`
  flex: 1; padding: 20px; display: flex; flex-direction: column;
  overflow-y: auto; min-width: 0;
  transition: margin-left 0.4s ease-in-out;
  margin-left: ${({ $isSidebarOpen }) => ($isSidebarOpen ? '70px' : '0')};
  position: relative; z-index: 1;
`;

const Header = styled.div`
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 20px; position: relative; z-index: 2;
`;

const LeftHeader = styled.div`
  display: flex; align-items: center; gap: 10px;
`;

const SidebarToggle = styled.button`
  background: #1a1839; border: none; padding: 8px;
  border-radius: 50%; color: white; cursor: pointer;
  margin-right: 10px; transition: 0.3s ease;
  position: relative; overflow: hidden;
  &:hover { background: #635bff; animation: ${glow} 2s ease-in-out infinite; }
`;

const TitleImage = styled.img`
  height: 60px; object-fit: contain;
  position: absolute; left: 50%; transform: translateX(-50%);
  filter: drop-shadow(0 2px 8px rgba(255, 255, 255, 0.2));
`;

const UserArea = styled.div`
  display: flex; align-items: center; gap: 10px;
  background: #1a1839; padding: 8px 12px; border-radius: 20px;
`;

const ProfileIcon = styled(FiUser)`
  cursor: pointer;
  transition: 0.3s ease;
  font-size: 20px;
  &:hover {
    color:rgb(134, 129, 240);
    transform: scale(1.1);
  }
`;

const LogoutIcon = styled(FiLogOut)`
  cursor: pointer;
  transition: 0.3s ease;
  font-size: 20px;
  &:hover {
    color: #ff5b5b;
    transform: scale(1.1);
  }
`;

const AdminSection = styled.div`
  flex: 1; background-color: rgba(19, 18, 48, 0.85);
  backdrop-filter: blur(10px); padding: 24px; border-radius: 20px;
  display: flex; flex-direction: column; gap: 30px; 
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
`;

const SectionContainer = styled.div`
  padding: 0 10px;
  overflow: visible;
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #3a376f;
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const SectionTitle = styled.h2`
  color: #e0e0e0;
  font-size: 1.6em;
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0;
`;

const ActionButton = styled.button`
  background-color: #635bff;
  color: white;
  border: none;
  padding: 10px 15px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9em;
  font-family: 'Orbitron', sans-serif;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: background-color 0.3s, transform 0.2s;

  &:hover {
    background-color: #4e49c4;
    transform: translateY(-1px);
    animation: ${glow} 1.5s infinite alternate;
  }

  svg {
    font-size: 1.1em;
  }
`;

const ItemList = styled.ul`
  list-style: none;
  padding: 8px 0;
  margin: 20px 0 0 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 400px;
  overflow-y: auto;
  overflow-x: visible;

  /* Scrollbar styling */
  &::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  &::-webkit-scrollbar-track {
    background: #1c1a3a;
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: #4b4299;
    border-radius: 4px;
    border: 2px solid #1c1a3a;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: #635bff;
  }
`;

const ItemCard = styled.li<{ $selected?: boolean; $members: number }>`
  background-color: #1e1b3a;
  padding: 16px;
  border-radius: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid ${({ $selected }) => $selected ? '#635bff' : '#2a274f'};
  box-shadow: ${({ $selected }) => $selected ? '0 0 15px rgba(99, 91, 255, 0.5)' : 'none'};
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 4px;
    background: ${({ $members }) => $members > 0 ? '#00c853' : '#ff6b6b'};
    transition: opacity 0.3s ease;
    opacity: 0.7;
  }

  &:hover {
    background-color: #2a274f;
    border-color: #4e49c4;
    transform: translateY(-2px);
    z-index: 1;
    
    &::before {
      opacity: 1;
    }
  }
`;

const TeamInfo = styled.div`
  flex: 1;
  min-width: 0;
  margin-right: 16px;
`;

const TeamMainContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const ItemName = styled.span`
  font-size: 1.1em;
  font-weight: 500;
  color: #fff;
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const TeamDescription = styled.p`
  font-size: 0.85em;
  color: #a0a0c0;
  margin: 0;
  line-height: 1.4;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const TeamMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
`;

const MetaBadge = styled.div<{ $type?: 'members' | 'lead' }>`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 0.8em;
  white-space: nowrap;
  min-width: ${({ $type }) => $type === 'members' ? '60px' : '100px'};
  justify-content: center;
  background-color: ${({ $type }) => 
    $type === 'members' ? 'rgba(99, 91, 255, 0.15)' : 
    $type === 'lead' ? 'rgba(0, 200, 83, 0.15)' : 
    'rgba(42, 39, 79, 0.5)'};
  color: ${({ $type }) => 
    $type === 'members' ? '#635bff' : 
    $type === 'lead' ? '#00c853' : 
    '#8884b8'};

  svg {
    font-size: 1em;
  }
`;

const ItemActions = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  margin-left: 12px;
`;

const ActionIconButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  color: #a0a0c0;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    transform: translateY(-2px);
  }

  svg {
    font-size: 1.3em;
  }
`;

const EditActionButton = styled(ActionIconButton)`
  &:hover {
    color: #76c7f7;
    background: rgba(118, 199, 247, 0.1);
  }
`;

const DeleteActionButton = styled(ActionIconButton)`
  &:hover {
    color: #ff6b6b;
    background: rgba(255, 107, 107, 0.1);
  }
`;

const ModalButton = styled.button<{ variant?: 'primary' | 'secondary' | 'danger' }>`
  padding: 8px 16px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.2s ease;
  background-color: ${({ variant }) => 
    variant === 'secondary' ? '#2a274f' :
    variant === 'danger' ? '#ff4d4d' :
    '#635bff'};
  color: white;

  &:hover {
    transform: translateY(-2px);
    background-color: ${({ variant }) => 
      variant === 'secondary' ? '#3a375f' :
      variant === 'danger' ? '#ff6666' :
      '#7671ff'};
  }
`;

const FormGroup = styled.div`
  margin-bottom: 18px;
  label {
    display: block; margin-bottom: 7px; color: #b0b0d0;
    font-size: 0.9em;
  }
  input, select {
    width: 100%; padding: 10px 12px;
    background-color: #2a274f; border: 1px solid #3a376f;
    border-radius: 8px; color: white; font-size: 0.95em;
    font-family: 'Orbitron', sans-serif;
    &:focus {
      outline: none; border-color: #635bff;
      box-shadow: 0 0 0 2px rgba(99, 91, 255, 0.4);
    }
  }
  select {
    appearance: none;
    background-image: url("data:image/svg+xml;charset=UTF-8,%3Csvg width='12' height='8' viewBox='0 0 12 8' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1.41.59L6 5.17l4.59-4.58L12 2l-6 6-6-6z' fill='%23cccccc'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 12px center;
    padding-right: 32px;
  }
`;

const ModalActions = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 25px;
  padding: 0 20px;
`;

const SearchContainer = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  width: 250px;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 10px 35px 10px 12px;
  background-color: #1a1839;
  border: 1px solid #2a274f;
  border-radius: 8px;
  color: white;
  font-family: 'Orbitron', sans-serif;
  font-size: 0.9em;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: #635bff;
    box-shadow: 0 0 10px rgba(99, 91, 255, 0.2);
  }

  &::placeholder {
    color: #666;
  }
`;

const SearchIcon = styled(FiSearch)`
  position: absolute;
  right: 12px;
  color: #666;
  font-size: 18px;
`;

const SortButton = styled.button<{ $active?: boolean; $direction?: 'asc' | 'desc' }>`
  background: ${({ $active }) => $active ? '#2a274f' : 'none'};
  border: 1px solid ${({ $active }) => $active ? '#635bff' : '#2a274f'};
  color: ${({ $active }) => $active ? '#fff' : '#a0a0c0'};
  font-family: 'Orbitron', sans-serif;
  font-size: 0.9em;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 8px;
  transition: all 0.2s;

  &:hover {
    background: #2a274f;
    border-color: #635bff;
    color: #fff;
  }

  .sort-icon {
    display: flex;
    flex-direction: column;
    align-items: center;
    font-size: 0.8em;
    gap: 0px;
    
    svg {
      &:first-child {
        margin-bottom: -4px;
        color: ${({ $active, $direction }) => 
          $active && $direction === 'asc' ? '#635bff' : 'inherit'};
      }
      &:last-child {
        margin-top: -4px;
        color: ${({ $active, $direction }) => 
          $active && $direction === 'desc' ? '#635bff' : 'inherit'};
      }
    }
  }
`;

const ChevronUpIcon = styled(FiChevronUp)`
  transform: scale(1.2);
`;

const ChevronDownIcon = styled(FiChevronDown)`
  transform: scale(1.2);
`;

const MemberTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 15px;

  th, td {
    padding: 12px 15px;
    text-align: left;
    border-bottom: 1px solid #2a274f;
    font-family: 'BPReplay', sans-serif;
  }

  th {
    background-color: #1e1b3a;
    color: #a0a0c0;
    font-weight: 600;
    font-size: 0.95em;
  }

  tbody tr {
    transition: background-color 0.2s;
    &:hover {
      background-color: #222044; 
    }
  }

  td {
    color: #d0d0d0;
    font-size: 0.9em;
  }
`;

type Role = 'Administrator' | 'Team Lead' | 'Developer' | 'Analyst' | 'Read-Only';
const AVAILABLE_ROLES: Role[] = ['Administrator', 'Team Lead', 'Developer', 'Analyst', 'Read-Only'];

type Member = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

type Team = {
  id: string;
  name: string;
  description: string;
  members: Member[];
};

const initialTeams: Team[] = [
  {
    id: 'team_a',
    name: 'TEAM A',
    description: 'Core development and innovation squad.',
    members: [
      { id: 'm1', name: 'Aida', email: 'aida@daemon.dev', role: 'Team Lead' },
      { id: 'm2', name: 'Bianca', email: 'bianca@daemon.dev', role: 'Developer' },
      { id: 'm3', name: 'Andrei', email: 'andrei@daemon.dev', role: 'Analyst' },
    ],
  },
  {
    id: 'team_b',
    name: 'TEAM B',
    description: 'Support, QA, and operations.',
    members: [
      { id: 'm4', name: 'Jasmine', email: 'jasmine@daemon.dev', role: 'Team Lead' },
      { id: 'm5', name: 'Aida', email: 'aida.dev@daemon.dev', role: 'Developer' },
    ],
  },
  {
    id: 'team_c',
    name: 'TEAM C',
    description: 'Security and infrastructure.',
    members: [],
  }
];

const generateRandomPassword = () => {
  const length = 12;
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  let password = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }
  return password;
};

type SortField = 'name' | 'members';
type SortDirection = 'asc' | 'desc';

const AccountAdminPage = () => {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [username, setUsername] = useState('');
  const [isCreateAccountModalOpen, setIsCreateAccountModalOpen] = useState(false);
  const [accountFormData, setAccountFormData] = useState({
    username: '',
    email: '',
  });
  const [createdPassword, setCreatedPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [emailFailed, setEmailFailed] = useState(false);

  // Initialize with initialTeams
  const [teams, setTeams] = useState<Team[]>(initialTeams);

  // Load teams from localStorage on component mount
  useEffect(() => {
    const savedTeams = localStorage.getItem('teams');
    if (savedTeams) {
      setTeams(JSON.parse(savedTeams));
    }
  }, []);

  // Save teams to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('teams', JSON.stringify(teams));
  }, [teams]);

  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);

  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [teamFormData, setTeamFormData] = useState({ name: '', description: '' });

  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [memberFormData, setMemberFormData] = useState<Omit<Member, 'id'>>({ name: '', email: '', role: AVAILABLE_ROLES[2] });

  const [isDeleteTeamModalOpen, setIsDeleteTeamModalOpen] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState<Team | null>(null);
  const [isDeleteMemberModalOpen, setIsDeleteMemberModalOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<Member | null>(null);

  const [searchQuery, setSearchQuery] = useState('');

  const [showMembersModal, setShowMembersModal] = useState(false);

  const [sortBy, setSortBy] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  type Notification = {
    id: string;
    message: string;
    type: 'success' | 'error';
  };

  const [notifications, setNotifications] = useState<Notification[]>([]);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 3000);
  };

  const sidebarIcons = [
    { icon: <FiGrid />, label: 'Dashboard', onClick: () => router.push('/dashboard') },
    { icon: <FiTag />, label: 'Ticket Charts', onClick: () => router.push('/dashboard/ticket-charts') },
    { icon: <FiUsers />, label: 'Team Charts', onClick: () => router.push('/dashboard/team-charts') },
    { icon: <FiShield />, label: 'Account Admin', onClick: () => router.push('/dashboard/account-administrator')},
  ];

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('http://localhost:8080/api/check-auth', {
          method: 'GET',
          credentials: 'include'
        });
        if (res.ok) {
          const data = await res.json();
          setUsername(data.user.username);
        } else {
          router.push('/login');
        }
      } catch (err) {
        console.error('Auth check failed', err);
        router.push('/login');
      }
    };
    fetchUser();
  }, [router]);

  const handleLogout = () => router.push('/login');
  const handleProfileClick = () => router.push('/dashboard/profile');

  const handleSelectTeam = (team: Team) => {
    setSelectedTeam(team);
    setShowMembersModal(true);
  };

  const openAddTeamModal = () => {
    setEditingTeam(null);
    setTeamFormData({ name: '', description: '' });
    setIsTeamModalOpen(true);
  };

  const openEditTeamModal = (team: Team, event: React.MouseEvent) => {
    event.stopPropagation();
    setEditingTeam(team);
    setTeamFormData({ name: team.name, description: team.description });
    setIsTeamModalOpen(true);
  };

  const handleSaveTeam = () => {
    if (editingTeam) { 
      const updatedTeams = teams.map(t => t.id === editingTeam.id ? { ...t, ...teamFormData } : t);
      setTeams(updatedTeams);
      if (selectedTeam?.id === editingTeam.id) {
        setSelectedTeam(prev => prev ? {...prev, ...teamFormData} : null);
      }
      showNotification(`Team "${teamFormData.name}" updated successfully`);
    } else { 
      const newTeam: Team = { 
        id: `team_${Date.now()}`, 
        ...teamFormData, 
        members: [] 
      };
      setTeams(prevTeams => [...prevTeams, newTeam]);
      showNotification(`Team "${teamFormData.name}" created successfully`);
    }
    setIsTeamModalOpen(false);
    setTeamFormData({ name: '', description: '' });
  };

  const handleDeleteTeam = (teamId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    const teamToDelete = teams.find(t => t.id === teamId);
    if (teamToDelete) {
      setTeamToDelete(teamToDelete);
      setIsDeleteTeamModalOpen(true);
    }
  };

  const confirmDeleteTeam = () => {
    if (teamToDelete) {
      const updatedTeams = teams.filter(t => t.id !== teamToDelete.id);
      setTeams(updatedTeams);
      if (selectedTeam?.id === teamToDelete.id) setSelectedTeam(null);
      showNotification(`Team "${teamToDelete.name}" deleted successfully`);
      setIsDeleteTeamModalOpen(false);
      setTeamToDelete(null);
    }
  };

  const openAddMemberModal = () => {
    if (!selectedTeam) return;
    setEditingMember(null);
    setMemberFormData({ name: '', email: '', role: AVAILABLE_ROLES[2] });
    setIsMemberModalOpen(true);
  };

  const openEditMemberModal = (member: Member, event: React.MouseEvent) => {
    event.stopPropagation();
    setEditingMember(member);
    setMemberFormData({ name: member.name, email: member.email, role: member.role });
    setIsMemberModalOpen(true);
  };

  const handleSaveMember = () => {
    if (!selectedTeam) return;
    let updatedMembers: Member[];
    if (editingMember) { 
      updatedMembers = selectedTeam.members.map(m =>
        m.id === editingMember.id ? { ...m, ...memberFormData } : m
      );
      showNotification(`Member "${memberFormData.name}" updated successfully`);
    } else { 
      const newMember: Member = { id: `member_${Date.now()}`, ...memberFormData };
      updatedMembers = [...selectedTeam.members, newMember];
      showNotification(`Member "${memberFormData.name}" added to team "${selectedTeam.name}"`);
    }
    const updatedTeam = { ...selectedTeam, members: updatedMembers };
    const updatedTeams = teams.map(t => t.id === selectedTeam.id ? updatedTeam : t);
    setTeams(updatedTeams);
    setSelectedTeam(updatedTeam);
    setIsMemberModalOpen(false);
    setMemberFormData({ name: '', email: '', role: AVAILABLE_ROLES[2] });
  };

  const handleDeleteMember = (memberId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (!selectedTeam) return;
    const memberToDelete = selectedTeam.members.find(m => m.id === memberId);
    if (memberToDelete) {
      setMemberToDelete(memberToDelete);
      setIsDeleteMemberModalOpen(true);
    }
  };

  const confirmDeleteMember = () => {
    if (!selectedTeam || !memberToDelete) return;
    const updatedMembers = selectedTeam.members.filter(m => m.id !== memberToDelete.id);
    const updatedTeam = { ...selectedTeam, members: updatedMembers };
    const updatedTeams = teams.map(t => t.id === selectedTeam.id ? updatedTeam : t);
    setTeams(updatedTeams);
    setSelectedTeam(updatedTeam);
    showNotification(`Member "${memberToDelete.name}" removed from team "${selectedTeam.name}"`);
    setIsDeleteMemberModalOpen(false);
    setMemberToDelete(null);
  };

  const handleCreateAccount = async () => {
    const generatedPassword = generateRandomPassword();
    try {
      const response = await fetch('http://localhost:8080/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          username: accountFormData.username,
          email: accountFormData.email,
          password: generatedPassword
        }),
      });

      if (response.ok) {
        setCreatedPassword(generatedPassword);
        showNotification(`Account created successfully for ${accountFormData.username}`);
      } else {
        const data: { message: string } = await response.json();
        showNotification(data.message || 'Failed to create account', 'error');
      }
    } catch (error) {
      console.error('Error creating account:', error);
      showNotification('Failed to create account', 'error');
    }
  };

  const filteredTeams = teams.filter(team => 
    team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    team.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedTeams = [...filteredTeams].sort((a, b) => {
    if (sortBy === 'name') {
      return sortDirection === 'asc' 
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name);
    } else if (sortBy === 'members') {
      return sortDirection === 'asc'
        ? a.members.length - b.members.length
        : b.members.length - a.members.length;
    }
    return 0;
  });

  const toggleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDirection('asc');
    }
  };

  return (
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
          <SidebarButton key={idx} title={label} onClick={onClick}>
            {icon}
          </SidebarButton>
        ))}
      </Sidebar>

      <Content $isSidebarOpen={sidebarOpen}>
        <Header>
          <LeftHeader>
            <SidebarToggle onClick={() => setSidebarOpen(!sidebarOpen)}>
              {sidebarOpen ? <FiX size={20} /> : <FiMenu size={20} />}
            </SidebarToggle>
          </LeftHeader>
          <TitleImage src="/images/daemonview.png" alt="DaemonView Admin" />
          <UserArea>
            <ProfileIcon onClick={handleProfileClick} /> {username}
            <LogoutIcon onClick={handleLogout} />
          </UserArea>
        </Header>

        <AdminSection>
          <SectionContainer>
            <SectionHeader>
              <SectionTitle><FiUserPlus /> Account Creation</SectionTitle>
              <ActionButton onClick={() => setIsCreateAccountModalOpen(true)}><FiPlus /> Create New Account</ActionButton>
            </SectionHeader>
          </SectionContainer>

          <SectionContainer>
            <SectionHeader>
              <SectionTitle><FiUsers /> Teams Management</SectionTitle>
              <HeaderActions>
                <SearchContainer>
                  <SearchInput 
                    type="text"
                    placeholder="Search teams..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <SearchIcon />
                </SearchContainer>
                <ActionButton onClick={openAddTeamModal}><FiPlus /> Add Team</ActionButton>
              </HeaderActions>
            </SectionHeader>
            <div style={{ display: 'flex', gap: '12px', marginTop: '15px', marginBottom: '20px' }}>
              <SortButton 
                onClick={() => toggleSort('name')}
                $active={sortBy === 'name'}
                $direction={sortBy === 'name' ? sortDirection : undefined}
              >
                Name
                <span className="sort-icon">
                  <ChevronUpIcon />
                  <ChevronDownIcon />
                </span>
              </SortButton>
              <SortButton 
                onClick={() => toggleSort('members')}
                $active={sortBy === 'members'}
                $direction={sortBy === 'members' ? sortDirection : undefined}
              >
                Members
                <span className="sort-icon">
                  <ChevronUpIcon />
                  <ChevronDownIcon />
                </span>
              </SortButton>
            </div>
            {teams.length > 0 ? (
              <ItemList>
                {sortedTeams.map(team => (
                  <ItemCard 
                    key={team.id} 
                    onClick={() => handleSelectTeam(team)} 
                    $selected={selectedTeam?.id === team.id}
                    $members={team.members.length}
                  >
                    <TeamInfo>
                      <TeamMainContent>
                        <ItemName>{team.name}</ItemName>
                        <TeamDescription>{team.description || "No description"}</TeamDescription>
                      </TeamMainContent>
                    </TeamInfo>
                    <TeamMeta>
                      <MetaBadge $type="members">
                        <FiUsers />
                        {team.members.length}
                      </MetaBadge>
                      <MetaBadge $type="lead">
                        <FiShield />
                        {(() => {
                          const teamLead = team.members.find(m => m.role === 'Team Lead');
                          return teamLead ? `${teamLead.name}` : 'No lead';
                        })()}
                      </MetaBadge>
                    </TeamMeta>
                    <ItemActions>
                      <EditActionButton 
                        title="Edit Team" 
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditTeamModal(team, e);
                        }}
                      >
                        <FiEdit3 />
                      </EditActionButton>
                      <DeleteActionButton 
                        title="Delete Team" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTeam(team.id, e);
                        }}
                      >
                        <FiTrash2 />
                      </DeleteActionButton>
                    </ItemActions>
                  </ItemCard>
                ))}
              </ItemList>
            ) : (
              <p style={{textAlign: 'center', color: '#888'}}>No teams created yet. Click "Add Team" to get started.</p>
            )}
          </SectionContainer>
        </AdminSection>
      </Content>

      {/* Team Members Modal */}
      {showMembersModal && selectedTeam && (
        <ModalOverlay onClick={() => setShowMembersModal(false)}>
          <MemberModalContent onClick={e => e.stopPropagation()}>
            <SectionHeader style={{ marginBottom: '20px', paddingBottom: '15px' }}>
              <SectionTitle><FiUser /> Members of: {selectedTeam.name}</SectionTitle>
              <ActionButton onClick={openAddMemberModal}><FiUserPlus /> Add Member</ActionButton>
            </SectionHeader>
            {selectedTeam.members.length > 0 ? (
              <MemberTable>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th style={{textAlign: 'right'}}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedTeam.members.map(member => (
                    <tr key={member.id}>
                      <td>{member.name}</td>
                      <td>{member.email}</td>
                      <td>{member.role}</td>
                      <td style={{textAlign: 'right'}}>
                        <ItemActions style={{justifyContent: 'flex-end'}}>
                          <EditActionButton 
                            title="Edit Member" 
                            onClick={(e: React.MouseEvent) => openEditMemberModal(member, e)}
                          >
                            <FiEdit3 />
                          </EditActionButton>
                          <DeleteActionButton 
                            title="Remove Member" 
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
            ) : (
              <p style={{textAlign: 'center', color: '#888'}}>No members in this team yet. Click "Add Member" to get started.</p>
            )}
          </MemberModalContent>
        </ModalOverlay>
      )}

      {isTeamModalOpen && (
        <ModalOverlay onClick={() => setIsTeamModalOpen(false)}>
          <ModalContent onClick={e => e.stopPropagation()}>
            <h3>{editingTeam ? 'Edit Team' : 'Add New Team'}</h3>
            <FormGroup>
              <label htmlFor="teamName">Team Name</label>
              <input type="text" id="teamName" value={teamFormData.name}
                     onChange={e => setTeamFormData({...teamFormData, name: e.target.value})} />
            </FormGroup>
            <FormGroup>
              <label htmlFor="teamDescription">Description (Optional)</label>
              <input type="text" id="teamDescription" value={teamFormData.description}
                     onChange={e => setTeamFormData({...teamFormData, description: e.target.value})} />
            </FormGroup>
            <ModalActions>
              <ModalButton variant="secondary" onClick={() => setIsTeamModalOpen(false)}>Cancel</ModalButton>
              <ModalButton onClick={handleSaveTeam}>{editingTeam ? 'Save Changes' : 'Create Team'}</ModalButton>
            </ModalActions>
          </ModalContent>
        </ModalOverlay>
      )}

      {isMemberModalOpen && selectedTeam && (
        <ModalOverlay onClick={() => setIsMemberModalOpen(false)}>
          <ModalContent onClick={e => e.stopPropagation()}>
            <h3>{editingMember ? 'Edit Member Role' : `Add Member to ${selectedTeam.name}`}</h3>
            <FormGroup>
              <label htmlFor="memberName">Name</label>
              <input type="text" id="memberName" value={memberFormData.name}
                     onChange={e => setMemberFormData({...memberFormData, name: e.target.value})} />
            </FormGroup>
            <FormGroup>
              <label htmlFor="memberEmail">Email</label>
              <input type="email" id="memberEmail" value={memberFormData.email}
                     onChange={e => setMemberFormData({...memberFormData, email: e.target.value})} />
            </FormGroup>
            <FormGroup>
              <label htmlFor="memberRole">Role</label>
              <select id="memberRole" value={memberFormData.role}
                      onChange={e => setMemberFormData({...memberFormData, role: e.target.value as Role})}>
                {AVAILABLE_ROLES.map(role => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </FormGroup>
            <ModalActions>
              <ModalButton variant="secondary" onClick={() => setIsMemberModalOpen(false)}>Cancel</ModalButton>
              <ModalButton onClick={handleSaveMember}>{editingMember ? 'Save Changes' : 'Add Member'}</ModalButton>
            </ModalActions>
          </ModalContent>
        </ModalOverlay>
      )}

      {isDeleteTeamModalOpen && teamToDelete && (
        <ModalOverlay onClick={() => setIsDeleteTeamModalOpen(false)}>
          <ModalContent onClick={e => e.stopPropagation()}>
            <h3>Delete Team</h3>
            <p style={{ textAlign: 'center', marginBottom: '20px' }}>
              Are you sure you want to delete {teamToDelete.name}?
              {teamToDelete.members.length > 0 && (
                <span style={{ display: 'block', color: '#ff6b6b', marginTop: '10px' }}>
                  This team has {teamToDelete.members.length} member{teamToDelete.members.length !== 1 ? 's' : ''}.
                  They will be removed from the team.
                </span>
              )}
            </p>
            <ModalActions>
              <ModalButton variant="secondary" onClick={() => {
                setIsDeleteTeamModalOpen(false);
                setTeamToDelete(null);
              }}>Cancel</ModalButton>
              <ModalButton variant="danger" onClick={confirmDeleteTeam}>Delete Team</ModalButton>
            </ModalActions>
          </ModalContent>
        </ModalOverlay>
      )}

      {isDeleteMemberModalOpen && memberToDelete && (
        <ModalOverlay onClick={() => setIsDeleteMemberModalOpen(false)}>
          <ModalContent onClick={e => e.stopPropagation()}>
            <h3>Delete Member</h3>
            <p>Are you sure you want to remove {memberToDelete.name} from the team?</p>
            <ModalActions>
              <ModalButton variant="secondary" onClick={() => setIsDeleteMemberModalOpen(false)}>Cancel</ModalButton>
              <ModalButton variant="danger" onClick={confirmDeleteMember}>Delete</ModalButton>
            </ModalActions>
          </ModalContent>
        </ModalOverlay>
      )}

      {isCreateAccountModalOpen && (
        <ModalOverlay onClick={() => setIsCreateAccountModalOpen(false)}>
          <ModalContent onClick={e => e.stopPropagation()}>
            <h3>Create New Account</h3>
            <FormGroup>
              <label htmlFor="accountUsername">Username</label>
              <input 
                type="text" 
                id="accountUsername" 
                value={accountFormData.username}
                onChange={e => setAccountFormData({...accountFormData, username: e.target.value})} 
              />
            </FormGroup>
            <FormGroup>
              <label htmlFor="accountEmail">Email</label>
              <input 
                type="email" 
                id="accountEmail" 
                value={accountFormData.email}
                onChange={e => setAccountFormData({...accountFormData, email: e.target.value})} 
              />
            </FormGroup>
            {createdPassword && (
              <FormGroup>
                <label>Generated Password</label>
                <div style={{ padding: '10px', background: '#2a274f', borderRadius: '8px', marginTop: '5px' }}>
                  {createdPassword}
                </div>
                <p style={{ fontSize: '0.8em', color: '#888', marginTop: '5px' }}>
                  Please save this password securely. It will not be shown again.
                </p>
              </FormGroup>
            )}
            <ModalActions>
              <ModalButton variant="secondary" onClick={() => {
                setIsCreateAccountModalOpen(false);
                setCreatedPassword('');
                setAccountFormData({ username: '', email: '' });
              }}>Cancel</ModalButton>
              <ModalButton onClick={handleCreateAccount}>Create Account</ModalButton>
            </ModalActions>
          </ModalContent>
        </ModalOverlay>
      )}
    </Container>
  );
};

export default AccountAdminPage;