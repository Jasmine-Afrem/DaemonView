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
} from 'react-icons/fi';
import '../../globals.css'; 


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
  cursor: pointer; transition: 0.3s ease; font-size: 20px;
  &:hover { color: #635bff; animation: ${glow} 2s ease-in-out infinite; }
`;

const LogoutIcon = styled(FiLogOut)`
  cursor: pointer; transition: 0.3s ease; font-size: 20px;
  &:hover { color: #ff5b5b; animation: ${redGlow} 2s ease-in-out infinite; }
`;

const AdminSection = styled.div`
  flex: 1; background-color: rgba(19, 18, 48, 0.85);
  backdrop-filter: blur(10px); padding: 24px; border-radius: 20px;
  display: flex; flex-direction: column; gap: 30px; 
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
`;

const SectionContainer = styled.div``;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #3a376f;
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
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const ItemCard = styled.li<{ $selected?: boolean }>`
  background-color: #1e1b3a;
  padding: 15px 20px;
  border-radius: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  transition: background-color 0.3s, border-color 0.3s, transform 0.2s;
  border: 1px solid ${({ $selected }) => $selected ? '#635bff' : '#2a274f'};
  box-shadow: ${({ $selected }) => $selected ? '0 0 15px rgba(99, 91, 255, 0.5)' : 'none'};

  &:hover {
    background-color: #2a274f;
    border-color: #4e49c4;
    transform: translateY(-2px);
  }
`;

const ItemName = styled.span`
  font-size: 1.1em;
  font-weight: 500;
`;

const ItemActions = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;

  svg {
    font-size: 1.2em;
    color: #a0a0c0;
    transition: color 0.2s, transform 0.2s;
    &:hover {
      transform: scale(1.15);
    }
  }
`;

const EditActionIcon = styled(FiEdit3)`&:hover { color: #76c7f7; }`;
const DeleteActionIcon = styled(FiTrash2)`&:hover { color: #ff6b6b; }`;

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

const ModalOverlay = styled.div`
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background-color: rgba(0, 0, 0, 0.75);
  display: flex; justify-content: center; align-items: center;
  z-index: 1001; backdrop-filter: blur(4px);
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

const ModalButton = styled(ActionButton)<{ variant?: 'secondary' }>`
  padding: 9px 18px;
  animation: none;
  ${({ variant }) => variant === 'secondary' && `
    background-color: #3a376f;
    &:hover { background-color: #4f4c8f; transform: translateY(-1px); animation: none; }
  `}
`;

const DeleteButton = styled(ActionButton)`
  background-color: #ff6b6b;
  &:hover {
    background-color: #ff8787;
    animation: none;
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

const AccountAdminPage = () => {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [username, setUsername] = useState('AdminUser');

  const [teams, setTeams] = useState<Team[]>(initialTeams);
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

  const sidebarIcons = [
    { icon: <FiGrid />, label: 'Dashboard', onClick: () => router.push('/dashboard') },
    { icon: <FiTag />, label: 'Ticket Charts', onClick: () => router.push('/dashboard/ticket-charts') },
    { icon: <FiUsers />, label: 'Team Charts', onClick: () => router.push('/dashboard/team-charts') },
    { icon: <FiShield />, label: 'Account Admin', onClick: () => router.push('/dashboard/account-admin')},
    { icon: <FiSettings />, label: 'Settings' },
    { icon: <FiHelpCircle />, label: 'Help' },
  ];

  useEffect(() => {
    console.log("Auth check would run here");
  }, [router]);

  const handleLogout = () => router.push('/login');
  const handleProfileClick = () => router.push('/dashboard/profile');

  const handleSelectTeam = (team: Team) => {
    setSelectedTeam(team.id === selectedTeam?.id ? null : team);
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
      setTeams(teams.map(t => t.id === editingTeam.id ? { ...t, ...teamFormData } : t));
      if (selectedTeam?.id === editingTeam.id) {
        setSelectedTeam(prev => prev ? {...prev, ...teamFormData} : null);
      }
    } else { 
      const newTeam: Team = { id: `team_${Date.now()}`, ...teamFormData, members: [] };
      setTeams([...teams, newTeam]);
    }
    setIsTeamModalOpen(false);
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
      setTeams(teams.filter(t => t.id !== teamToDelete.id));
      if (selectedTeam?.id === teamToDelete.id) setSelectedTeam(null);
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
    } else { 
      const newMember: Member = { id: `member_${Date.now()}`, ...memberFormData };
      updatedMembers = [...selectedTeam.members, newMember];
    }
    const updatedTeam = { ...selectedTeam, members: updatedMembers };
    setTeams(teams.map(t => t.id === selectedTeam.id ? updatedTeam : t));
    setSelectedTeam(updatedTeam);
    setIsMemberModalOpen(false);
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
    setTeams(teams.map(t => t.id === selectedTeam.id ? updatedTeam : t));
    setSelectedTeam(updatedTeam);
    setIsDeleteMemberModalOpen(false);
    setMemberToDelete(null);
  };

  return (
    <Container>
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
              <SectionTitle><FiUsers /> Teams Management</SectionTitle>
              <ActionButton onClick={openAddTeamModal}><FiPlus /> Add Team</ActionButton>
            </SectionHeader>
            {teams.length > 0 ? (
              <ItemList>
                {teams.map(team => (
                  <ItemCard key={team.id} onClick={() => handleSelectTeam(team)} $selected={selectedTeam?.id === team.id}>
                    <div>
                      <ItemName>{team.name}</ItemName>
                      <p style={{fontSize: '0.8em', color: '#a0a0c0', margin: '4px 0 0'}}>{team.description || "No description"}</p>
                    </div>
                    <ItemActions>
                      <EditActionIcon title="Edit Team" onClick={(e) => openEditTeamModal(team, e)} />
                      <DeleteActionIcon title="Delete Team" onClick={(e) => handleDeleteTeam(team.id, e)} />
                    </ItemActions>
                  </ItemCard>
                ))}
              </ItemList>
            ) : (
              <p style={{textAlign: 'center', color: '#888'}}>No teams created yet. Click "Add Team" to get started.</p>
            )}
          </SectionContainer>

          {selectedTeam && (
            <SectionContainer style={{marginTop: '20px', borderTop: '1px dashed #3a376f', paddingTop: '20px'}}>
              <SectionHeader>
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
                            <EditActionIcon title="Edit Member" onClick={(e) => openEditMemberModal(member, e)} />
                            <DeleteActionIcon title="Remove Member" onClick={(e) => handleDeleteMember(member.id, e)} />
                          </ItemActions>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </MemberTable>
              ) : (
                <p style={{textAlign: 'center', color: '#888'}}>No members in this team yet. Click "Add Member" to get started.</p>
              )}
            </SectionContainer>
          )}
        </AdminSection>
      </Content>

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
              <label htmlFor="memberName">Member Name</label>
              <input type="text" id="memberName" value={memberFormData.name}
                     onChange={e => setMemberFormData({...memberFormData, name: e.target.value})}
                     disabled={!!editingMember} 
              />
            </FormGroup>
            <FormGroup>
              <label htmlFor="memberEmail">Member Email</label>
              <input type="email" id="memberEmail" value={memberFormData.email}
                     onChange={e => setMemberFormData({...memberFormData, email: e.target.value})}
                     disabled={!!editingMember} 
              />
            </FormGroup>
            <FormGroup>
              <label htmlFor="memberRole">Role</label>
              <select id="memberRole" value={memberFormData.role}
                      onChange={e => setMemberFormData({...memberFormData, role: e.target.value as Role})}>
                {AVAILABLE_ROLES.map(role => <option key={role} value={role}>{role}</option>)}
              </select>
            </FormGroup>
            <ModalActions>
              <ModalButton variant="secondary" onClick={() => setIsMemberModalOpen(false)}>Cancel</ModalButton>
              <ModalButton onClick={handleSaveMember}>{editingMember ? 'Save Role' : 'Add Member'}</ModalButton>
            </ModalActions>
          </ModalContent>
        </ModalOverlay>
      )}

      {isDeleteTeamModalOpen && teamToDelete && (
        <ModalOverlay onClick={() => setIsDeleteTeamModalOpen(false)}>
          <ModalContent onClick={e => e.stopPropagation()}>
            <h3>Delete Team</h3>
            <p style={{color: '#ff6b6b', marginBottom: '20px', textAlign: 'center'}}>
              Are you sure you want to delete team "{teamToDelete.name}" and remove all its members?
            </p>
            <p style={{color: '#a0a0c0', fontSize: '0.9em', marginBottom: '20px', textAlign: 'center'}}>
              This action cannot be undone.
            </p>
            <ModalActions>
              <ModalButton variant="secondary" onClick={() => setIsDeleteTeamModalOpen(false)}>
                Cancel
              </ModalButton>
              <DeleteButton onClick={confirmDeleteTeam}>
                Delete Team
              </DeleteButton>
            </ModalActions>
          </ModalContent>
        </ModalOverlay>
      )}

      {isDeleteMemberModalOpen && memberToDelete && (
        <ModalOverlay onClick={() => setIsDeleteMemberModalOpen(false)}>
          <ModalContent onClick={e => e.stopPropagation()}>
            <h3>Remove Member</h3>
            <p style={{color: '#ff6b6b', marginBottom: '20px', textAlign: 'center'}}>
              Are you sure you want to remove {memberToDelete.name} from the team?
            </p>
            <p style={{color: '#a0a0c0', fontSize: '0.9em', marginBottom: '20px', textAlign: 'center'}}>
              This action cannot be undone.
            </p>
            <ModalActions>
              <ModalButton variant="secondary" onClick={() => setIsDeleteMemberModalOpen(false)}>
                Cancel
              </ModalButton>
              <DeleteButton onClick={confirmDeleteMember}>
                Remove Member
              </DeleteButton>
            </ModalActions>
          </ModalContent>
        </ModalOverlay>
      )}
    </Container>
  );
};

export default AccountAdminPage;