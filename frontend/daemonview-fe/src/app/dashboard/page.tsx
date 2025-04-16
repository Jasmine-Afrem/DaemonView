'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useEffect } from 'react';
import styled from 'styled-components';
import {
  FiSearch,
  FiInfo,
  FiFilter,
  FiLogOut,
  FiUser,
  FiMenu,
  FiX,
  FiHome,
  FiBarChart2,
  FiAlertCircle,
  FiClock,
  FiServer,
  FiSettings,
  FiHelpCircle,
} from 'react-icons/fi';
import '../globals.css';

type Ticket = {
  ticket_title: string;
  description: string;
  status: string;
  priority: string;
  created_at: Date;
  updated_at: Date;
  submitted_by: string;
  related_incident_title: string;
  related_device_name: string;
};


// sidebar items array
const sidebarIcons = [
  { icon: <FiHome />, label: 'Home' },
  { icon: <FiBarChart2 />, label: 'Stats' },
  { icon: <FiAlertCircle />, label: 'Alerts' },
  { icon: <FiClock />, label: 'History' },
  { icon: <FiServer />, label: 'Servers' },
  { icon: <FiSettings />, label: 'Settings' },
  { icon: <FiHelpCircle />, label: 'Help' },
];

const DaemonView = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true); // sidebar open/close status
  const [username, setUsername] = useState('');
  const [showFilterPopup, setShowFilterPopup] = useState(false);
  const [isClosingPopup, setIsClosingPopup] = useState(false);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const closePopup = () => {
    setIsClosingPopup(true);
    setTimeout(() => {
      setShowFilterPopup(false);
      setIsClosingPopup(false);
    }, 300);
  };

  const fillTable = async () => {
    try {
      const res = await fetch('http://localhost:8080/api/get-tickets', {
        method: 'GET',
      });
      const data = await res.json();
      const parsed = data.map((t: any) => ({
        ...t,
        created_at: new Date(t.created_at),
        updated_at: new Date(t.updated_at),
      }));

      setTickets(parsed);
      console.log(parsed);
    } catch (err) {
      console.error('Error loading tickets', err);
    }
  };


  const router = useRouter();
  const tableHeaders = [
    'Info',
    'Title',
    'Description',
    'Status',
    'Priority',
    'Created At',
    'Updated At',
    'Submitted By',
    'Related Incidents',
    'Related Devices'
  ];

  const selectColumns = [
    'No Filter',
    'Title',
    'Status',
    'Priority',
    'Created At',
    'Updated At',
    'Submitted By'
  ];


  const handleLogout = async () => {
    try {
      await fetch('http://localhost:8080/api/logout', {
        method: 'POST',
        credentials: 'include',
      });

      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };
  const handleProfileClick = () => {
    router.push('/dashboard/profile');
  };
  {
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
          }
          else {
            router.push('/login')
          }
        }
        catch (err) {
          console.error('Auth check failed', err);
          router.push('/login')
        }
      };

      fetchUser();
    })
  }

  useEffect(() => {
    fillTable();

    const fetchUser = async () => {
      try {
        const res = await fetch('http://localhost:8080/api/check-auth', {
          method: 'GET',
          credentials: 'include',
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
  }, []);


  return (
    <Container>
      {/* sidebar is conditionally rendered based on sidebarOpen state */}
      <Sidebar $isOpen={sidebarOpen}>
        {sidebarIcons.map(({ icon, label }, idx) => (
          <SidebarButton key={idx} title={label}>
            {icon}
          </SidebarButton>
        ))}
      </Sidebar>


      {/* main content area */}
      <Content $isSidebarOpen={sidebarOpen}>
        <Header>
          <LeftHeader>
            {/* button to toggle sidebar open/close */}
            <SidebarToggle onClick={() => setSidebarOpen(!sidebarOpen)}>
              {/* conditionally render the close or menu icon based on sidebarOpen state */}
              {sidebarOpen ? <FiX size={20} /> : <FiMenu size={20} />}
            </SidebarToggle>
          </LeftHeader>

          {/* title image */}
          <TitleImage src="/images/daemonview.png" alt="DaemonView" />

          {/* user area showing user profile icon and username */}
          <UserArea>
            <ProfileIcon onClick={handleProfileClick} /> {username}
            <LogoutIcon onClick={handleLogout} />
          </UserArea>

        </Header>

        {/* main action buttons */}
        <MainButtons>
          {/* iterating through 7 buttons */}
          {Array.from({ length: 7 }, (_, idx) => (
            <MainButton key={`main-btn-${idx}`}>
              Button {idx + 1}
            </MainButton>
          ))}
        </MainButtons>

        {/* table section */}
        <TableSection>
          <TableHeader>
            <TableSearch>
              <input type="text" placeholder="Search for ..." />
              <FiSearch />
            </TableSearch>
            {/* filter button for table */}
            <FilterWrapper>
              <TableActions onClick={() => {
                if (showFilterPopup) {
                  closePopup();
                } else {
                  setShowFilterPopup(true);
                }
              }}>
                <FiFilter />
              </TableActions>


              {showFilterPopup && (
                <FilterPopup $isClosing={isClosingPopup}>
                  <h4>Filter Options</h4>
                  <label>
                    Column:
                    <select>
                      {selectColumns.map((header, idx) => (
                        <option key={idx} value={header}>{header}</option>
                      ))}
                    </select>

                  </label>
                  <label>
                    Value:
                    <input type="text" placeholder="Enter value" />
                  </label>
                  <button onClick={closePopup}>Apply</button>
                </FilterPopup>
              )}

            </FilterWrapper>


          </TableHeader>

          {/* table for data */}
          <Table>
            <thead>
              <tr>
                {tableHeaders.map((header, idx) => (
                  <th key={`col-${idx}`}>{header}</th>
                ))}

              </tr>
            </thead>
            <tbody>
              {/* creating table rows dynamically */}
              {tickets.map((ticket, idx) => (
                <tr key={`ticket-${idx}`}>
                  <td><FiInfo /></td>
                  <td>{ticket.ticket_title}</td>
                  <td>{ticket.description}</td>
                  <td>{ticket.status}</td>
                  <td>
                    <PriorityBadge level={ticket.priority}>
                      {ticket.priority}
                    </PriorityBadge>
                  </td>
                  <td>{ticket.created_at.toLocaleString()}</td>
                  <td>{ticket.updated_at.toLocaleString()}</td>
                  <td>{ticket.submitted_by}</td>
                  <td>{ticket.related_incident_title}</td>
                  <td>{ticket.related_device_name}</td>
                </tr>
              ))}

            </tbody>
          </Table>
        </TableSection>
      </Content>
    </Container>
  );
};

export default DaemonView;

import { keyframes } from 'styled-components';

const glow = keyframes`
  0% {
    box-shadow: 0 0 10px rgba(99, 91, 255, 0.4);
  }
  50% {
    box-shadow: 0 0 20px rgba(99, 91, 255, 0.7);
  }
  100% {
    box-shadow: 0 0 10px rgba(99, 91, 255, 0.4);
  }
`;

const slideDownFadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const slideUpFadeOut = keyframes`
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(-10px);
  }
`;



// styled components

const Container = styled.div`
  display: flex;
  height: 100vh;
  background-color: #090821;
  color: #fff;
  font-family: 'Orbitron', sans-serif;
  transition: background-color 0.3s ease;

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
    opacity: 0.15; /* Lower = more faded */
    pointer-events: none;
    z-index: 0;
  }
`;

const Sidebar = styled.div<{ $isOpen: boolean }>`
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: 70px;
  background-color: #2a274f;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 20px;
  gap: 15px;
  box-shadow: ${({ $isOpen }) =>
    $isOpen ? '4px 0px 10px rgba(0, 0, 0, 0.1)' : 'none'};
  transition: transform 0.4s ease-in-out;
  transform: ${({ $isOpen }) => ($isOpen ? 'translateX(0)' : 'translateX(-100%)')};
  z-index: 10;
`;

const SidebarButton = styled.button`
  background: #1e1b3a;
  border: none;
  color: #fff;
  padding: 14px;
  border-radius: 10px;
  cursor: pointer;
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  transition: 0.3s ease;

  &:hover {
    background: #635bff;
    transform: scale(1.1);
    animation: ${glow} 2s ease-in-out infinite;
  }
`;

const Content = styled.div<{ $isSidebarOpen: boolean }>`
  flex: 1;
  padding: 20px;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  min-width: 0;
  transition: margin-left 0.4s ease-in-out;
  margin-left: ${({ $isSidebarOpen }) => ($isSidebarOpen ? '70px' : '0')};
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  position: relative;
`;

const SidebarToggle = styled.button`
  background: #1a1839;
  border: none;
  padding: 8px;
  border-radius: 50%;
  color: white;
  cursor: pointer;
  margin-right: 10px;
  transition: 0.3s ease;
  position: relative;
  overflow: hidden;

  &:hover {
    background: #635bff;
    animation: ${glow} 2s ease-in-out infinite;
  }
`;

const SearchBar = styled.input`
  padding: 10px 20px;
  background-color: #1a1839;
  border: none;
  border-radius: 30px;
  color: #fff;
  width: 240px;
  font-size: 14px;
`;

const UserArea = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  background: #1a1839;
  padding: 8px 12px;
  border-radius: 20px;
`;

const MainButtons = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
`;

const MainButton = styled.button<{ selected?: boolean }>`
  padding: 12px 24px;
  border-radius: 12px;
  border: none;
  cursor: pointer;
  font-weight: bold;
  transition: 0.3s ease;
  background-color: ${({ selected }) => (selected ? '#635bff' : '#2a274f')};
  color: #fff;
  position: relative;
  overflow: hidden;

  &:hover {
    background-color: #4e49c4;
    animation: ${glow} 2s ease-in-out infinite;
  }
`;


const TableSection = styled.div`
  flex: 1;
  background-color: rgba(19, 18, 48, 0.85);
  backdrop-filter: blur(10px);
  padding: 24px;
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
`;

const TableHeader = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 15px;
`;

const TableSearch = styled.div`
  background-color: #1a1839;
  padding: 6px 12px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  gap: 6px;

  input {
    background: none;
    border: none;
    color: #fff;
    outline: none;
    font-size: 14px;
    width: 160px;
  }
`;

const TableActions = styled.div`
  background: #1a1839;
  padding: 8px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  cursor: pointer;
  transition: 0.3s ease;
  position: relative;
  overflow: hidden;

  &:hover {
    background: #635bff;
    animation: ${glow} 2s ease-in-out infinite;
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;

  th,
  td {
    padding: 12px;
    text-align: center;
    border-bottom: 1px solid #2a274f;
  }

  tbody tr:hover {
    background-color: #1d1b3c;
  }

  td {
    font-family: 'BPReplay', sans-serif;
  }
`;

const TitleImage = styled.img`
  height: 60px;
  object-fit: contain;
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  filter: drop-shadow(0 2px 8px rgba(255, 255, 255, 0.2));
`;

const LeftHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const redGlow = keyframes`
  0% {
    box-shadow: 0 0 10px rgba(255, 91, 91, 0.4);
  }
  50% {
    box-shadow: 0 0 20px rgba(255, 91, 91, 0.7);
  }
  100% {
    box-shadow: 0 0 10px rgba(255, 91, 91, 0.4);
  }
`;


const ProfileIcon = styled(FiUser)`
  cursor: pointer;
  transition: 0.3s ease;
  font-size: 20px;

  &:hover {
    color: #635bff;
    animation: ${glow} 2s ease-in-out infinite;
  }
`;

const LogoutIcon = styled(FiLogOut)`
  cursor: pointer;
  transition: 0.3s ease;
  font-size: 20px;

  &:hover {
    color: #ff5b5b;
    animation: ${redGlow} 2s ease-in-out infinite;
  }
`;

const FilterPopup = styled.div<{ $isClosing: boolean }>`
  position: absolute;
  top: 40px;
  right: 0;
  background-color: #1a1839;
  border: 1px solid #635bff;
  border-radius: 12px;
  padding: 16px;
  z-index: 99;
  box-shadow: 0 8px 16px rgba(0,0,0,0.2);
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 220px;
  animation: ${({ $isClosing }) => $isClosing ? slideUpFadeOut : slideDownFadeIn} 0.3s ease forwards;

  h4 {
    margin: 0;
    color: #fff;
    font-size: 16px;
  }

  label {
    display: flex;
    flex-direction: column;
    color: #aaa;
    font-size: 14px;
  }

  input, select {
    margin-top: 4px;
    padding: 10px 12px;
    border-radius: 10px;
    border: none;
    background-color: #2a274f;
    color: #fff;
    font-family: 'Orbitron', sans-serif;
    font-size: 14px;
    appearance: none;
    -webkit-appearance: none;
    -moz-appearance: none;
    background-image: url("data:image/svg+xml;charset=UTF-8,%3Csvg width='12' height='8' viewBox='0 0 12 8' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1.41.59L6 5.17l4.59-4.58L12 2l-6 6-6-6z' fill='%23ffffff'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 12px center;
    background-size: 12px 8px;
    padding-right: 32px;
    cursor: pointer;
  }

  button {
    margin-top: 8px;
    background-color: #635bff;
    border: none;
    padding: 8px;
    border-radius: 8px;
    color: white;
    cursor: pointer;
    transition: 0.3s ease;

    &:hover {
      background-color: #4e49c4;
    }
  }
`;

const FilterWrapper = styled.div`
  position: relative;
  display: inline-block;
`;

const PriorityBadge = styled.span<{ level: string }>`
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: bold;
  text-transform: capitalize;
  color: white;

  background-color: ${({ level }) => {
    switch (level.toLowerCase()) {
      case 'high':
        return '#ff4d4d';
      case 'medium':
        return '#f5a623';
      case 'low':
        return '#27ae60';
      default:
        return '#555';
    }
  }};
`;
