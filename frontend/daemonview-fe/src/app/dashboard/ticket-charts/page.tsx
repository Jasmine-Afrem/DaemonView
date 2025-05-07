'use client';

import { useEffect, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { useRouter } from 'next/navigation';
import {
  FiUserCheck, FiBarChart2, FiHome, FiAlertCircle,
  FiClock, FiServer, FiSettings, FiRefreshCcw, FiHelpCircle, FiMenu, FiX
} from 'react-icons/fi';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import {
  FiLogOut,
  FiUser,
  FiUsers,
  FiGrid,
  FiTag,
} from 'react-icons/fi';

import {
  Chart as ChartJS,
  BarElement,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  ArcElement,
  Tooltip,
  Legend,
  TooltipItem
} from 'chart.js';

ChartJS.register(
  BarElement,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  ArcElement,
  Tooltip,
  Legend
);

const TicketCharts = () => {
  const router = useRouter();
  const [teamStats, setTeamStats] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [username, setUsername] = useState('');
  const [resolvedTickets, setResolvedTickets] = useState<ResolvedTicketStats[]>([]);
  const [slaComplianceData, setSlaComplianceData] = useState<SlaCompliance[]>([]);
  const [ticketsByStatus, setTicketsByStatus] = useState<TicketByStatus[]>([]);
  const [averageResolutionTime, setAverageResolutionTime] = useState(null);
  const [loading, setLoading] = useState(true);

  interface ResolvedTicketStats {
    total_tickets: number;
    resolved_count: string;
    unresolved_count: string;
    resolved_percent: string;
  }  

  interface SlaCompliance {
    within_sla: string;
    total_tickets: number;
    sla_percent: string;
  }  

  interface TicketByStatus {
    status: string;
    ticket_count: number;
    percentage: string;
  }

  const fetchTicketsByStatus = async () => {
    try {
      const res = await fetch('http://localhost:8080/api/tickets-by-status');
      if (res.ok) {
        const data: TicketByStatus[] = await res.json();
        setTicketsByStatus(data);
      } else {
        console.error('Failed to fetch tickets by status');
      }
    } catch (error) {
      console.error('Error fetching tickets by status:', error);
    }
  };

  const fetchResolvedTickets = async () => {
    try {
      const res = await fetch('http://localhost:8080/api/tickets-resolved');
      if (res.ok) {
        const data = await res.json();
        setResolvedTickets(data); 
      } else {
        console.error('Failed to fetch resolved tickets');
      }
    } catch (err) {
      console.error('Error fetching resolved tickets:', err);
    }
  };  

  const fetchSLACompliance = async () => {
    try {
      const res = await fetch('http://localhost:8080/api/sla-compliance');
      if (res.ok) {
        const data = await res.json();
        setSlaComplianceData(data);
      } else {
        console.error('Failed to fetch SLA data');
      }
    } catch (err) {
      console.error('Error fetching SLA data', err);
    }
  };
  
  const fetchTeamStats = async () => {
    try {
      const res = await fetch('http://localhost:8080/api/team-stats'); // Replace with correct API endpoint
      if (res.ok) {
        const data = await res.json();
        setTeamStats(data);
      } else {
        console.error('Failed to fetch team stats');
      }
    } catch (err) {
      console.error('Error fetching team stats', err);
    }
  };
  
  const fetchAvgResolutionTime = async () => {
    try {
      const res = await fetch('http://localhost:8080/api/resolution-time');  // Adjust your API endpoint as needed
      if (res.ok) {
        const data = await res.json();
        const resolutionTime = data[0]?.average_resolution_time_in_time_format;
        setAverageResolutionTime(resolutionTime);
      } else {
        console.error('Failed to fetch average resolution time');
      }
    } catch (err) {
      console.error('Error fetching average resolution time:', err);
    } finally {
      setLoading(false);  
    }
  };

  const refreshButton = async () => {
    await fetchTicketsByStatus();
    await fetchResolvedTickets();
    await fetchSLACompliance();
    await fetchAvgResolutionTime();
  };  

  useEffect(() => {
    fetchAvgResolutionTime();
    fetchTicketsByStatus();
    fetchResolvedTickets();
    fetchSLACompliance(); 
  }, []);
   

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
  }, []); 

  const handleProfileClick = () => {
    router.push('/dashboard/profile');
  };

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

  const sidebarIcons = [
    { icon: <FiGrid />, label: 'Dashboard', onClick: () => router.push('/dashboard') },
    { icon: <FiTag />, label: 'Ticket Charts', onClick: () => router.push('/dashboard/ticket-charts') },
    { icon: <FiUsers />, label: 'Team Charts', onClick: () => router.push('/dashboard/team-charts') }, 
    { icon: <FiAlertCircle />, label: 'Alerts' },
    { icon: <FiClock />, label: 'History' },
    { icon: <FiServer />, label: 'Servers' },
    { icon: <FiSettings />, label: 'Settings' },
    { icon: <FiHelpCircle />, label: 'Help' }
  ];

  const barData = {
    labels: ['Resolved', 'Unresolved'],
    datasets: [{
      label: 'Ticket Status',
      data: [
        parseInt(resolvedTickets[0]?.resolved_count || '0'),
        parseInt(resolvedTickets[0]?.unresolved_count || '0')
      ],
      backgroundColor: ['#27ae60', '#c0392b'],
      borderColor: ['#2ecc71', '#e74c3c'],
      borderWidth: 2,
      hoverBackgroundColor: ['#2ecc71', '#e74c3c'],
      hoverBorderColor: ['#27ae60', '#c0392b'],
      hoverBorderWidth: 3,
      barThickness: 80,  
    }],
  };
  
  const customChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: {
        top: 20,
        bottom: 10,
        left: 0,
        right: 0,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#FFFFFF',
          font: {
            size: 14,
            weight: 'bold' as const, 
          },
        },
      },
      y: {
        grid: {
          color: '#444',
          borderColor: '#444',
          borderWidth: 1,
        },
        ticks: {
          color: '#FFFFFF',
          font: {
            size: 14,
            weight: 'bold' as const, 
          },
        },
      },
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#FFFFFF',
          font: {
            size: 14,
            weight: 'bold' as const, 
          },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        titleColor: '#FFFFFF',
        bodyColor: '#FFFFFF',
        borderColor: '#FFFFFF',
        borderWidth: 1,
        callbacks: {
          label: function (tooltipItem: any) {
            return `${tooltipItem.dataset.label}: ${tooltipItem.raw}`;
          },
        },
      },
    },
  };  

  const doughnutData = {
    labels: ['Within SLA', 'Outside SLA'],
    datasets: [
      {
        data: slaComplianceData.length > 0
          ? [parseInt(slaComplianceData[0].within_sla), slaComplianceData[0].total_tickets - parseInt(slaComplianceData[0].within_sla)]
          : [0, 0],
        backgroundColor: ['#27ae60', '#c0392b'],
        hoverOffset: 6,
      },
    ],
  };  

  const ticketKpiStats = {
    avgResolutionTime: '3.2h',
    slaClosureRate: '92%',
    openVsClosed: '28 / 152',
    volumeByPriority: {
      high: 12,
      medium: 35,
      low: 85
    },
    timeToFirstResponse: '1.4h'
  };
  
  const statusLabels = ticketsByStatus.map(item => item.status);
  const statusCounts = ticketsByStatus.map(item => item.ticket_count);
  
  const chartData = {
    labels: statusLabels,
    datasets: [
      {
        label: 'Ticket Volume by Status',
        data: statusCounts,
        backgroundColor: [
          '#FF6384', // pink
          '#36A2EB', // blue
          '#FFCE56', // yellow
          '#4BC0C0', // teal
          '#9966FF', // purple
          '#FF9F40', // orange
        ],
        borderWidth: 1,
      },
    ],
  };
  
  const chartOptions = {
    responsive: true,
    layout: {
      padding: {
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
      },
    },
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          color: 'white', 
        },
      },
      tooltip: {
        bodyColor: 'white', 
        titleColor: 'white', 
      },
      datalabels: {
        color: '#fff',  
        font: {
          weight: 'bold' as const,
          size: 14,
        },
        formatter: (value: number) => value,
      },
    },
  };  

  return (
    <Wrapper>
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

          <TitleImage src="/images/daemonview.png" alt="DaemonView" />

          <UserArea>
            <ProfileIcon onClick={handleProfileClick} />
            {username}
            <LogoutIcon onClick={handleLogout} />
          </UserArea>
        </Header>

        <RefreshButton onClick={refreshButton}>
                <FiRefreshCcw size={16} /> Refresh
        </RefreshButton>

        <ChartSection>
          <Card>
            <CardTitle><FiClock /> Avg. Resolution Time</CardTitle>
            {loading ? (
              <StyledParagraph>Loading...</StyledParagraph>
            ) : (
              <StyledParagraph>{averageResolutionTime}</StyledParagraph>
            )}
          </Card>

          <Card>
            <CardTitle><FiAlertCircle /> Volume by Status</CardTitle>
            {ticketsByStatus.length > 0 ? (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
                <div style={{ width: '350px', height: '350px' }}>
                  <Doughnut data={chartData} options={chartOptions} />
                </div>
              </div>
            ) : (
              <p>Loading chart...</p>
            )}
          </Card>
        </ChartSection>

        <ChartSection>
          <Card>
            <CardTitle><FiBarChart2 /> Tickets Resolved</CardTitle>
            <Bar data={barData} options={customChartOptions} /> {/* Pass customChartOptions here */}
          </Card>

          <Card>
            <CardTitle><FiUserCheck /> SLA Compliance</CardTitle>
            {slaComplianceData.length > 0 && slaComplianceData[0].total_tickets > 0 ? (
              <>
                <StyledDoughnutWrapper>
                  <Doughnut
                    data={doughnutData}
                    options={{
                      maintainAspectRatio: false,
                      responsive: true,
                      plugins: {
                        legend: {
                          labels: {
                            color: '#fff',
                            font: { size: 14 },
                          },
                        },
                      },
                    }}
                  />
                </StyledDoughnutWrapper>
                <StyledParagraph2>
                  {slaComplianceData[0].sla_percent}% Compliance
                </StyledParagraph2>
              </>
            ) : (
              <NoDataMessage>
                Oops, no data :(
              </NoDataMessage>
            )}
          </Card>
        </ChartSection>
      </Content>
    </Wrapper>
  );
};

export default TicketCharts;

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

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const Wrapper = styled.div`
  display: flex;
  height: 100vh;
  background-color: #090821;
  color: white;
  font-family: 'Orbitron', sans-serif;

  &::before {
    content: "";
    position: absolute;
    inset: 0;
    background-image: url('/images/background.png');
    background-size: cover;
    background-position: center;
    opacity: 0.15;
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
  transition: 0.3s ease;

  &:hover {
    background: #635bff;
    transform: scale(1.1);
    animation: ${glow} 2s ease-in-out infinite;
  }
`;

const Content = styled.div<{ $isSidebarOpen: boolean }>`
  flex: 1;
  padding: 30px;
  margin-left: ${({ $isSidebarOpen }) => ($isSidebarOpen ? '70px' : '0')};
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  position: relative;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
`;

const LeftHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const SidebarToggle = styled.button`
  background: #1a1839;
  border: none;
  padding: 8px;
  border-radius: 50%;
  color: white;
  cursor: pointer;
  transition: 0.3s ease;

  &:hover {
    background: #635bff;
    animation: ${glow} 2s ease-in-out infinite;
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

const UserArea = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  background: #1a1839;
  padding: 8px 12px;
  border-radius: 20px;
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

const ChartSection = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  animation: ${fadeIn} 0.6s ease forwards;
`;

const Card = styled.div`
  background-color: rgba(19, 18, 48, 0.85);
  border-radius: 20px;
  padding: 15px;  
  padding-bottom: 2rem;  
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  margin-left: 2.5rem;
  margin-bottom: 1.5rem;
  max-width: 90%;  
  height: 88%; 
  width: 90%;    

  overflow: hidden;
`;

const CardTitle = styled.h3`
  font-size: 20px;
  margin-top: 10px;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const StyledDoughnutWrapper = styled.div`
  position: relative;
  width: 100%;
  max-width: 300px;
  height: 300px;
  margin: 0 auto;
  border-radius: 10px;
  padding: 10px;
`;

const NoDataMessage = styled.p`
  text-align: center;
  font-style: italic;
  color: #aaa;
  font-size: 16px;
`;

const StyledParagraph2 = styled.p`
  margin-top: 1rem;
  text-align: center;
  font-size: 18px;
  font-weight: bold;
  color: #fff;
`;

const StyledParagraph = styled.p`
  font-size: 30px;
  margin-top: 8rem;
  margin-left: 35%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  
  color: #fff;
  text-shadow: 0 0 5px rgba(115, 18, 153, 0.6), 0 0 10px rgba(255, 255, 255, 0.4), 0 0 15px rgba(255, 255, 255, 0.2);
  
  background: linear-gradient(45deg,rgb(167, 130, 226),rgb(128, 60, 218));
  padding: 20px;
  border-radius: 100px;
  width: 13rem;
  
  box-shadow: 0px 0px 15px 10px rgba(184, 132, 226, 0.2);
  
  text-align: center;
  font-weight: bold;
`;

const RefreshButton = styled.button`
  background-color: #1a1839;
  color: #fff;
  border: none;
  padding: 8px 14px;
  border-radius: 10px;
  margin-left: 2.5rem;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 6px;
  width: 7%;
  margin-bottom: 1rem;
  transition: background-color 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    background-color: #4e46d4;
    box-shadow: 0 0 8px rgba(99, 91, 255, 0.6),
                0 0 15px rgba(99, 91, 255, 0.4),
                0 0 25px rgba(99, 91, 255, 0.2);
  }
`;