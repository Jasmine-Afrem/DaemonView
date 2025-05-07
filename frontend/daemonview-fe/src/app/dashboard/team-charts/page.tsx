'use client';

import { useEffect, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { useRouter } from 'next/navigation';
import {
  FiUserCheck, FiBarChart2, FiHome, FiAlertCircle,
  FiClock, FiServer, FiSettings, FiHelpCircle, FiMenu, FiX, FiRefreshCcw
} from 'react-icons/fi';
import { Chart, Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, BarElement, LineElement, CategoryScale,
  LinearScale, PointElement, Tooltip, Legend, ArcElement
} from 'chart.js';
import type { ChartOptions } from 'chart.js';
import {
  FiLogOut,
  FiUser,
  FiUsers,
  FiGrid,
  FiTag
} from 'react-icons/fi';

ChartJS.register(
  BarElement, LineElement, CategoryScale,
  LinearScale, PointElement, Tooltip, Legend, ArcElement
);
ChartJS.register({
  id: 'customLabels',
  beforeDraw(chart, args, options) {
    const {
      ctx,
      chartArea: { top },
      scales: { x },
    } = chart;

    const teamNames = options.teamNames || [];
    const statusCount = options.statusCount || 4;

    ctx.save();
    ctx.fillStyle = 'white';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';

    teamNames.forEach((team: string, i: number) => {
      const firstIndex = i * statusCount;
      const lastIndex = firstIndex + statusCount - 1;
      const x1 = x.getPixelForTick(firstIndex);
      const x2 = x.getPixelForTick(lastIndex);
      const center = (x1 + x2) / 2;
      ctx.fillText(team, center, top - 10);
    });

    ctx.restore();
  },
});

const TeamCharts = () => {
  const router = useRouter();
  const [teamStats, setTeamStats] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [username, setUsername] = useState('');
  const [resolvedStats, setResolvedStats] = useState([]);
  const [statusStats, setStatusStats] = useState<StatusEntry[]>([]);
  const [resolutionStats, setResolutionStats] = useState([]);

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

  const fetchSLAData = async () => {
    try {
      const res = await fetch(`http://localhost:8080/api/sla-compliance-teams`, {
        method: 'GET',
        credentials: 'include'
      });

      if (res.ok) {
        const data = await res.json();
        setTeamStats(data);
      } else {
        console.error('Failed to fetch SLA data');
      }
    } catch (error) {
      console.error('Error fetching SLA data', error);
    }
  };

  useEffect(() => {
    fetchSLAData();
  }, []);


  const fetchResolvedData = async () => {
    try {
      const res = await fetch(`http://localhost:8080/api/tickets-resolved-teams`, {
        method: 'GET',
        credentials: 'include'
      });

      if (res.ok) {
        const data = await res.json();
        setResolvedStats(data);
      } else {
        console.error('Failed to fetch resolved tickets data');
      }
    } catch (error) {
      console.error('Error fetching resolved tickets', error);
    }
  };

  useEffect(() => {
    fetchResolvedData();
  }, []);

  const fetchStatusVolume = async () => {
    try {
      const res = await fetch(`http://localhost:8080/api/tickets-by-status-teams`, {
        method: 'GET',
        credentials: 'include'
      });

      if (res.ok) {
        const data = await res.json();
        setStatusStats(data);
      } else {
        console.error('Failed to fetch status volume data');
      }
    } catch (error) {
      console.error('Error fetching status volume data', error);
    }
  };

  useEffect(() => {
    fetchStatusVolume();
  }, []);

  const fetchResolutionTimes = async () => {
    try {
      const res = await fetch('http://localhost:8080/api/resolution-time-teams', {
        method: 'GET',
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        const converted = data.map((entry: any) => ({
          team: entry.team_name,
          timeInMinutes: convertHHMMSStoMinutes(entry.average_resolution_time)
        }));
        setResolutionStats(converted);
      } else {
        console.error('Failed to fetch resolution times');
      }
    } catch (error) {
      console.error('Error fetching resolution times:', error);
    }
  };

  useEffect(() => {
    fetchResolutionTimes();
  }, []);

  const convertHHMMSStoMinutes = (str: string) => {
    const [hours, minutes, seconds] = str.split(':').map(Number);
    return hours * 60 + minutes + seconds / 60;
  };

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

  const getColorForStatus = (label: string) => {
    if (label.includes('open')) return '#f39c12';
    if (label.includes('in_progress')) return '#3498db';
    if (label.includes('resolved')) return '#2ecc71';
    if (label.includes('closed')) return '#9b59b6';
    return '#7f8c8d';
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

  const combinedData = {
    labels: teamStats.map((team: any) => team.team_name),
    datasets: [
      {
        type: 'bar' as const,
        label: 'Total Tickets',
        data: teamStats.map((team: any) => Number(team.total_tickets)),
        backgroundColor: '#635bff'
      },
      {
        type: 'line' as const,
        label: 'SLA Compliance (%)',
        data: teamStats.map((team: any) => Number(team.sla_percent)),
        borderColor: '#27ae60',
        borderWidth: 2,
        tension: 0.4,
        fill: false,
        yAxisID: 'y1',
        pointBackgroundColor: '#27ae60',
      }
    ]
  };

  const combinedOptions: ChartOptions<'bar' | 'line'> = {
    responsive: true,
    interaction: {
      mode: 'index' as const,
      intersect: false
    },
    scales: {
      y: {
        type: 'linear' as const,
        position: 'left',
        stacked: false,
        title: {
          display: true,
          text: 'Total Tickets',
          color: '#fff'
        },
        ticks: {
          color: '#fff'
        }
      },
      y1: {
        type: 'linear' as const,
        position: 'right',
        stacked: false,
        title: {
          display: true,
          text: 'SLA (%)',
          color: '#fff'
        },
        ticks: {
          color: '#fff'
        },
        grid: {
          drawOnChartArea: false
        }
      },
      x: {
        stacked: false,
        ticks: {
          color: '#fff'
        }
      }
    },
    plugins: {
      legend: {
        labels: {
          color: '#fff'
        }
      }
    }
  };

  const barData = {
    labels: teamStats.map((m: any) => m.member),
    datasets: [{
      label: 'Tickets Resolved',
      data: teamStats.map((m: any) => m.ticketsResolved),
      backgroundColor: '#635bff'
    }]
  };

  const lineData = {
    labels: teamStats.map((m: any) => m.member),
    datasets: [{
      label: 'SLA Compliance (%)',
      data: teamStats.map((m: any) => m.slaCompliance),
      fill: false,
      borderColor: '#27ae60',
      tension: 0.3
    }]
  };

  const resolutionTimeData = {
    labels: teamStats.map((m: any) => m.member),
    datasets: [{
      label: 'Avg. Resolution Time (min)',
      data: teamStats.map((m: any) => m.avgResolutionTime),
      fill: false,
      borderColor: '#f39c12',
      tension: 0.3
    }]
  };

  const reassignmentsData = {
    labels: teamStats.map((m: any) => m.member),
    datasets: [{
      label: 'Reassignments',
      data: teamStats.map((m: any) => m.reassignments),
      backgroundColor: '#e74c3c'
    }]
  };

  const statusTeams = Array.from(new Set(statusStats.map((s: any) => s.team_name)));
  const statusLabels = Array.from(new Set(statusStats.map((s: any) => s.status)));

  const teamIndexMap = Object.fromEntries(statusTeams.map((t, i) => [t, i]));
  const datasetsStatus: any[] = statusLabels.map((status) => ({
    label: status,
    data: new Array(statusTeams.length).fill(0),
    backgroundColor:
      status === 'open' ? '#f39c12' :
        status === 'in_progress' ? '#3498db' :
          status === 'resolved' ? '#2ecc71' :
            '#9b59b6'
  }));

  interface StatusEntry {
    team_name: string;
    status: 'open' | 'in_progress' | 'resolved' | 'closed';
    ticket_count: number;
    percentage: string;
  }

  statusStats.forEach((entry: any) => {
    const teamIdx = teamIndexMap[entry.team_name];
    const dataset = datasetsStatus.find(d => d.label === entry.status);
    if (dataset) dataset.data[teamIdx] = entry.ticket_count;
  });

  const statusOrder = ['open', 'in_progress', 'resolved', 'closed'];
  const teamNames = Array.from(new Set(statusStats.map((s: any) => s.team_name))).filter(Boolean);

  const orderedLabels = teamNames.flatMap(team =>
    statusOrder.map(status => `${team} - ${status}`)
  );

  const backgroundColors: Record<string, string> = {
    open: '#f39c12',
    in_progress: '#3498db',
    resolved: '#2ecc71',
    closed: '#9b59b6',
  };

  const orderedColors = orderedLabels.map((label) => {
    const status = label.split(' - ')[1];
    return backgroundColors[status] || '#ccc';
  });

  const volumeDataset = {
    labels: orderedLabels,
    datasets: [
      {
        label: 'Ticket Count',
        data: orderedLabels.map((label) => {
          const [team, status] = label.split(' - ');
          const match = statusStats.find(
            (entry: any) => entry.team_name === team && entry.status === status
          );
          return match ? match.ticket_count : 0;
        }),
        backgroundColor: orderedLabels.map((label) => {
          const status = label.split(' - ')[1];
          return backgroundColors[status] || '#ccc';
        }),
      },
    ],
  };

  const statusByTeamData = {
    labels: statusTeams,
    datasets: datasetsStatus
  };

  const handleRefresh = async () => {
    await fetchSLAData();
    await fetchResolvedData();
    await fetchStatusVolume();
    await fetchResolutionTimes();
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
        <RefreshButton onClick={handleRefresh}>
          <FiRefreshCcw size={16} /> Refresh
        </RefreshButton>


        <ChartSection>
          <Card style={{ gridColumn: 'span 2' }}>
            <CardTitle><FiBarChart2 /> Tickets Resolved</CardTitle>
            <PieChartsWrapper>
              {resolvedStats.map((team: any, idx: number) => (
                <PieChartContainer key={`pie-${idx}`}>
                  <TeamLabel>{team.team_name}</TeamLabel>
                  <Chart
                    type="pie"
                    data={{
                      labels: ['Resolved', 'Unresolved'],
                      datasets: [{
                        data: [Number(team.resolved_count), Number(team.unresolved_count)],
                        backgroundColor: ['#27ae60', '#e74c3c']
                      }]
                    }}
                    options={{
                      plugins: {
                        legend: {
                          labels: { color: '#fff', font: { size: 12 } },
                          position: 'bottom'
                        }
                      }
                    }}
                  />
                </PieChartContainer>
              ))}
            </PieChartsWrapper>
          </Card>

          <Card style={{ gridColumn: 'span 2' }}>
            <CardTitle><FiBarChart2 /> SLA Compliance per Team</CardTitle>
            <ChartWrapper>
              <Bar
                data={{
                  labels: teamStats.map((team: any) => team.team_name),
                  datasets: [
                    {
                      label: 'Within SLA',
                      data: teamStats.map((team: any) => Number(team.within_sla)),
                      backgroundColor: '#27ae60'
                    },
                    {
                      label: 'Outside SLA',
                      data: teamStats.map((team: any) =>
                        Number(team.total_tickets) - Number(team.within_sla)
                      ),
                      backgroundColor: '#e74c3c'
                    }
                  ]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      stacked: true,
                      beginAtZero: true,
                      ticks: { color: '#fff' },
                      title: {
                        display: true,
                        text: 'Number of Tickets',
                        color: '#fff'
                      }
                    },
                    x: {
                      stacked: true,
                      ticks: { color: '#fff' }
                    }
                  },
                  plugins: {
                    legend: {
                      labels: {
                        color: '#fff'
                      }
                    },
                    tooltip: {
                      callbacks: {
                        label: function (context) {
                          const label = context.dataset.label || '';
                          const value = context.parsed.y;
                          return `${label}: ${value} tickets`;
                        }
                      }
                    }
                  }
                }}
              />
            </ChartWrapper>
          </Card>

          <Card>
            <CardTitle><FiClock /> Avg. Resolution Time (Minutes)</CardTitle>
            <ChartWrapper>
              <Bar
                data={{
                  labels: resolutionStats.map((r: any) => r.team),
                  datasets: [{
                    label: 'Resolution Time (min)',
                    data: resolutionStats.map((r: any) => r.timeInMinutes),
                    backgroundColor: '#f39c12'
                  }]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: { color: '#fff' },
                      title: {
                        display: true,
                        text: 'Minutes',
                        color: '#fff'
                      }
                    },
                    x: {
                      ticks: { color: '#fff' }
                    }
                  },
                  plugins: {
                    legend: {
                      labels: { color: '#fff' }
                    }
                  }
                }}
              />
            </ChartWrapper>
          </Card>


          <Card style={{ gridColumn: 'span 2' }}>
            <CardTitle><FiBarChart2 /> Volume by Status Per Team</CardTitle>
            <ChartWrapper>
              <Bar
                data={volumeDataset}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true,
                      stacked: false,
                      ticks: { color: '#fff' },
                      title: {
                        display: true,
                        text: 'Ticket Count',
                        color: '#fff',
                      },
                    },
                    x: {
                      ticks: {
                        color: '#fff',
                        callback: (val, index) => {
                          const label = volumeDataset.labels[index];
                          return label?.split(' - ')[1] || '';
                        },
                      },
                    },
                  },
                  plugins: {
                    legend: { display: false },
                    // @ts-ignore
                    customLabels: {
                      teamNames,
                      statusCount: statusOrder.length,
                    },
                  },
                }}
              />
            </ChartWrapper>
          </Card>
        </ChartSection>
      </Content>
    </Wrapper>
  );
};

export default TeamCharts;
const glow = keyframes`
  0% { box-shadow: 0 0 10px rgba(99, 91, 255, 0.4); }
  50% { box-shadow: 0 0 20px rgba(99, 91, 255, 0.7); }
  100% { box-shadow: 0 0 10px rgba(99, 91, 255, 0.4); }
`;

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const redGlow = keyframes`
  0% { box-shadow: 0 0 10px rgba(255, 91, 91, 0.4); }
  50% { box-shadow: 0 0 20px rgba(255, 91, 91, 0.7); }
  100% { box-shadow: 0 0 10px rgba(255, 91, 91, 0.4); }
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
  gap: 30px;
  animation: ${fadeIn} 0.6s ease forwards;
`;

const Card = styled.div`
  background-color: rgba(19, 18, 48, 0.85);
  border-radius: 20px;
  padding: 20px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
  display: block;
  flex-direction: column;
`;

const CardTitle = styled.h3`
  font-size: 18px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const PieWrapper = styled.div`
  width: 250px;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const PieTitle = styled.h4`
  color: #fff;
  margin-bottom: 10px;
  text-align: center;
`;

const PieChartsWrapper = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: center;
  gap: 40px;
`;

const PieChartContainer = styled.div`
  width: 370px;
  height: 370px;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const TeamLabel = styled.div`
  margin-bottom: 8px;
  font-size: 14px;
  color: white;
  font-weight: bold;
  text-align: center;
`;
const ChartWrapper = styled.div`
  height: 450px;
  display: flex;
  align-items: flex-end;
`;

const RefreshButton = styled.button`
  background-color: #1a1839;
  color: #fff;
  border: none;
  padding: 8px 14px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  width: 7%;
  margin-bottom: 1rem;
  transition: background-color 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    background-color: #4e46d4;
    box-shadow: 0 0 6px rgba(99, 91, 255, 0.4);
  }
`;
