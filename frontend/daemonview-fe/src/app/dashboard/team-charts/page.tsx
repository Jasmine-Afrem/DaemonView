'use client';

import { useEffect, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { useRouter } from 'next/navigation';
import {
  FiBarChart2,
  FiAlertCircle,
  FiClock, FiServer, FiSettings, FiHelpCircle, FiMenu, FiX, FiRefreshCcw,
  FiFilter
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
  FiTag,
  FiShield
} from 'react-icons/fi';
import TeamDrillModal from '../components/TeamDrillModal';
import ChartDataLabels from 'chartjs-plugin-datalabels';
ChartJS.register(ChartDataLabels);

ChartJS.register(
  BarElement, LineElement, CategoryScale,
  LinearScale, PointElement, Tooltip, Legend, ArcElement
);
ChartJS.register({
  id: 'customLabels',
  beforeDraw(chart, args, options: any) {
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

interface ActiveFilterDisplay {
  key: 'startDate' | 'endDate' | 'priority';
  label: string;
  value: string;
}

interface StatusEntry {
  team_name: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  ticket_count: number;
  percentage: string;
}

const TeamCharts = () => {
  const router = useRouter();
  const [teamStats, setTeamStats] = useState<any[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [username, setUsername] = useState('');
  const [resolvedStats, setResolvedStats] = useState<any[]>([]);
  const [statusStats, setStatusStats] = useState<StatusEntry[]>([]);
  const [resolutionStats, setResolutionStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [showFilterPopup, setShowFilterPopup] = useState(false);
  const [isClosingPopup, setIsClosingPopup] = useState(false);
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [activeFiltersForDisplay, setActiveFiltersForDisplay] = useState<ActiveFilterDisplay[]>([]);
  const [filtersApplied, setFiltersApplied] = useState(false); // Flag to trigger useEffect

  const [drillData, setDrillData] = useState<any | null>(null);
  const [showDrillModal, setShowDrillModal] = useState(false);
  const handleDrillClick = async (teamName: string, category: string, drillType: string) => {
    let tickets: any[] = [];
  
    if (drillType === 'slaCompliance' && (category === 'Within SLA' || category === 'Outside SLA')) {
    const slaStatus = category === 'Within SLA' ? 'Yes' : 'No';
    tickets = await fetchDrillTicketsForSLA({
      start_date: filterStartDate,
      end_date: filterEndDate,
      priority: filterPriority,
      sla_status: slaStatus,
      team: teamName
    });
  } else if (drillType === 'resolutionState' && (category === 'Resolved' || category === 'Unresolved')) {
    const resolvedValue = category === 'Resolved' ? 'yes' : 'no';
    tickets = await fetchDrillTicketsForResolved({
      start_date: filterStartDate,
      end_date: filterEndDate,
      priority: filterPriority,
      resolved: resolvedValue,
      team: teamName
    });
  } else if (drillType === 'ticketStatus' && ['Open', 'In_progress', 'Resolved', 'Closed'].includes(category)) {
    const normalizedStatus = category.toLowerCase();
    tickets = await fetchDrillTicketsByStatus({
      start_date: filterStartDate,
      end_date: filterEndDate,
      priority: filterPriority,
      status: normalizedStatus,
      team: teamName
    });
    }
    
    setDrillData({ team: teamName, category, tickets });
    setShowDrillModal(true);
  };

  const buildChartApiQueryString = (): string => {
    const params = new URLSearchParams();
    if (filterStartDate) params.append('start_date', filterStartDate);
    if (filterEndDate) params.append('end_date', filterEndDate);
    if (filterPriority) params.append('priority', filterPriority);
    return params.toString();
  };


  const closePopup = () => {
    setIsClosingPopup(true);
    setTimeout(() => {
      setShowFilterPopup(false);
      setIsClosingPopup(false);
    }, 300);
  };

  const toggleFilterPopup = () => {
    if (showFilterPopup) {
      closePopup();
    } else {
      setShowFilterPopup(true);
      setIsClosingPopup(false);
    }
  };

  const handleApplyFilters = () => {
    const activeFilters: ActiveFilterDisplay[] = [];

    if (filterStartDate) {
      activeFilters.push({ key: 'startDate', label: 'Start Date', value: filterStartDate });
    }
    if (filterEndDate) {
      activeFilters.push({ key: 'endDate', label: 'End Date', value: filterEndDate });
    }
    if (filterPriority) {
      activeFilters.push({ key: 'priority', label: 'Priority', value: filterPriority });
    }
    setActiveFiltersForDisplay(activeFilters);
    setFiltersApplied(true);
    // refreshAllTeamChartData();
    closePopup();
  };


  const handleRemoveFilter = (filterToRemoveKey: ActiveFilterDisplay['key']) => {
    let newStartDate = filterStartDate;
    let newEndDate = filterEndDate;
    let newPriority = filterPriority;

    if (filterToRemoveKey === 'startDate') newStartDate = '';
    if (filterToRemoveKey === 'endDate') newEndDate = '';
    if (filterToRemoveKey === 'priority') newPriority = '';

    setFilterStartDate(newStartDate);
    setFilterEndDate(newEndDate);
    setFilterPriority(newPriority);

    const updatedFiltersForDisplay: ActiveFilterDisplay[] = [];
    if (newStartDate) updatedFiltersForDisplay.push({ key: 'startDate', label: 'Start Date', value: newStartDate });
    if (newEndDate) updatedFiltersForDisplay.push({ key: 'endDate', label: 'End Date', value: newEndDate });
    if (newPriority) updatedFiltersForDisplay.push({ key: 'priority', label: 'Priority', value: newPriority });
    setActiveFiltersForDisplay(updatedFiltersForDisplay);

    setFiltersApplied(true);
    // setTimeout(() => { refreshAllTeamChartData(); }, 0); 
  };

  const handleClearAllFilters = () => {
    setFilterStartDate('');
    setFilterEndDate('');
    setFilterPriority('');
    setActiveFiltersForDisplay([]);
    setFiltersApplied(true);
    closePopup();
  };


  useEffect(() => {
    if (filtersApplied) {
      refreshAllTeamChartData();
      setFiltersApplied(false);
    }
  }, [filterStartDate, filterEndDate, filterPriority, filtersApplied]);


  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('http://localhost:8080/api/check-auth', {
          method: 'GET', credentials: 'include'
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

  const fetchSLAData = async () => {
    const queryString = buildChartApiQueryString();
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:8080/api/sla-compliance-teams${queryString ? `?${queryString}` : ''}`, {
        method: 'GET', credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        setTeamStats(data);
      } else {
        console.error('Failed to fetch SLA data:', await res.text());
        setTeamStats([]);
      }
    } catch (error) {
      console.error('Error fetching SLA data', error);
      setTeamStats([]);
    }
    // setLoading(false);
  };

  const fetchDrillTicketsForSLA = async ({
    start_date,
    end_date,
    priority,
    sla_status,
    team
  }: {
    start_date?: string;
    end_date?: string;
    priority?: string;
    sla_status?: string;
    team: string;
  }) => {
    try {
      const params = new URLSearchParams();
  
      if (start_date) params.append('start_date', start_date);
      if (end_date) params.append('end_date', end_date);
      if (priority) params.append('priority', priority);
      if (sla_status) params.append('sla_status', sla_status);
      params.append('team', team);
  
      const response = await fetch(`http://localhost:8080/api/sla-compliance-teams-tickets?${params.toString()}`, {
        method: 'GET',
        credentials: 'include'
      });
  
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error ${response.status}: ${errorText}`);
      }
  
      const rawData = await response.json();
  
      // Convertim datele primite în format compatibil cu `Ticket` (folosit de `TeamDrillModal`)
      const mappedTickets = rawData.map((t: any) => ({
        ticket_id: String(t['Ticket ID']),
        description: t['Description'],
        status: t['Status'],
        priority: t['Priority'],
        created_at: t['Created At'],
        updated_at: t['Updated At'],
        submitted_by: t['Submitted By'],
        assigned_to: t['Assigned To'],
        close_date: t['Close Date'],
        completed_date: t['Completed Date'],
        sla_hours: t['SLA (Hours)'],
        deadline: t['Deadline'],
        within_sla: t['Within SLA'] === 1,
        related_incidents: t['Related Incidents'],
        related_devices: t['Related Devices'],
        notes: t['Info'] || ''  // opțional
      }));
  
      return mappedTickets;
    } catch (err) {
      console.error('Failed to fetch SLA drill tickets:', err);
      return [];
    }
  };
  

  const fetchResolvedData = async () => {
    const queryString = buildChartApiQueryString();
    // setLoading(true);
    try {
      const res = await fetch(`http://localhost:8080/api/tickets-resolved-teams${queryString ? `?${queryString}` : ''}`, {
        method: 'GET', credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        setResolvedStats(data);
      } else {
        console.error('Failed to fetch resolved tickets data:', await res.text());
        setResolvedStats([]);
      }
    } catch (error) {
      console.error('Error fetching resolved tickets', error);
      setResolvedStats([]);
    }
    // setLoading(false);
  };

  const fetchDrillTicketsForResolved = async ({
    start_date,
    end_date,
    priority,
    resolved,
    team
  }: {
    start_date?: string;
    end_date?: string;
    priority?: string;
    resolved?: string;  // trebuie să fie 'Resolved' sau 'Unresolved'
    team: string;
  }) => {
    try {
      const params = new URLSearchParams();
  
      if (start_date) params.append('start_date', start_date);
      if (end_date) params.append('end_date', end_date);
      if (priority) params.append('priority', priority);
      if (resolved) params.append('resolved', resolved); // atenție: trebuie să fie 'Resolved'/'Unresolved'
      params.append('team', team);
  
      const response = await fetch(`http://localhost:8080/api/tickets-resolved-teams-tickets?${params.toString()}`, {
        method: 'GET',
        credentials: 'include'
      });
  
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error ${response.status}: ${errorText}`);
      }
  
      const rawData = await response.json();
  
      const mappedTickets = rawData.map((t: any) => ({
        ticket_id: String(t['Ticket ID']),
        description: t['Description'],
        status: t['Status'],
        priority: t['Priority'],
        created_at: t['Created At'],
        updated_at: t['Updated At'],
        submitted_by: t['Submitted By'],
        assigned_to: t['Assigned To'],
        close_date: t['Close Date'],
        completed_date: t['Completed Date'],
        sla_hours: t['SLA (Hours)'],
        deadline: t['Deadline'],
        within_sla: t['Within SLA'] === 1,
        related_incidents: t['Related Incidents'],
        related_devices: t['Related Devices'],
        notes: t['Info'] || ''
      }));
  
      return mappedTickets;
    } catch (err) {
      console.error('Failed to fetch resolved tickets drill:', err);
      return [];
    }
  };
  

  const fetchStatusVolume = async () => {
    const queryString = buildChartApiQueryString();
    // setLoading(true);
    try {
      const res = await fetch(`http://localhost:8080/api/tickets-by-status-teams${queryString ? `?${queryString}` : ''}`, {
        method: 'GET', credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        setStatusStats(data);
      } else {
        console.error('Failed to fetch status volume data:', await res.text());
        setStatusStats([]);
      }
    } catch (error) {
      console.error('Error fetching status volume data', error);
      setStatusStats([]);
    }
    // setLoading(false);
  };

  const fetchDrillTicketsByStatus = async ({
    start_date,
    end_date,
    priority,
    status,
    team
  }: {
    start_date?: string;
    end_date?: string;
    priority?: string;
    status?: string;
    team: string;
  }) => {
    try {
      const params = new URLSearchParams();
  
      if (start_date) params.append('start_date', start_date);
      if (end_date) params.append('end_date', end_date);
      if (priority) params.append('priority', priority);
      if (status) params.append('status', status);
      params.append('team', team);
  
      const response = await fetch(`http://localhost:8080/api/tickets-by-status-teams-tickets?${params.toString()}`, {
        method: 'GET',
        credentials: 'include'
      });
  
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error ${response.status}: ${errorText}`);
      }
      console.log(response);
      const rawData = await response.json();
  
      const mappedTickets = rawData.map((t: any) => ({
        ticket_id: String(t['Ticket ID']),
        description: t['Description'],
        status: t['Status'],
        priority: t['Priority'],
        created_at: t['Created At'],
        updated_at: t['Updated At'],
        submitted_by: t['Submitted By'],
        assigned_to: t['Assigned To'],
        close_date: t['Close Date'],
        completed_date: t['Completed Date'],
        sla_hours: t['SLA (Hours)'],
        deadline: t['Deadline'],
        within_sla: t['Within SLA'] === 1,
        related_incidents: t['Related Incidents'],
        related_devices: t['Related Devices'],
        notes: t['Info'] || ''
      }));
  
      return mappedTickets;
    } catch (err) {
      console.error('Failed to fetch tickets by status drill:', err);
      return [];
    }
  };
  

  const convertHHMMSStoMinutes = (str: string | null | undefined): number => {
    if (!str) return 0;
    const [hours, minutes, seconds] = str.split(':').map(Number);
    return hours * 60 + minutes + seconds / 60;
  };

  const fetchResolutionTimes = async () => {
    const queryString = buildChartApiQueryString();
    // setLoading(true);
    try {
      const res = await fetch(`http://localhost:8080/api/resolution-time-teams${queryString ? `?${queryString}` : ''}`, {
        method: 'GET', credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        const converted = data.map((entry: any) => ({
          team: entry.team_name,
          timeInMinutes: convertHHMMSStoMinutes(entry.average_resolution_time)
        }));
        setResolutionStats(converted);
      } else {
        console.error('Failed to fetch resolution times:', await res.text());
        setResolutionStats([]);
      }
    } catch (error) {
      console.error('Error fetching resolution times:', error);
      setResolutionStats([]);
    }
    // setLoading(false);
  };

  const refreshAllTeamChartData = async () => {
    console.log("Refreshing data with filters:", { filterStartDate, filterEndDate, filterPriority }); // For debugging
    setLoading(true);
    await Promise.all([
      fetchSLAData(),
      fetchResolvedData(),
      fetchStatusVolume(),
      fetchResolutionTimes(),
    ]);
    setLoading(false);
  };

  useEffect(() => {
    refreshAllTeamChartData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const handleProfileClick = () => router.push('/dashboard/profile');
  const handleLogout = async () => {
    try {
      await fetch('http://localhost:8080/api/logout', { method: 'POST', credentials: 'include' });
      router.push('/login');
    } catch (error) { console.error('Logout failed:', error); }
  };

  const sidebarIcons = [
    { icon: <FiGrid />, label: 'Dashboard', onClick: () => router.push('/dashboard') },
    { icon: <FiTag />, label: 'Ticket Charts', onClick: () => router.push('/dashboard/ticket-charts') },
    { icon: <FiUsers />, label: 'Team Charts', onClick: () => router.push('/dashboard/team-charts') },
    { icon: <FiShield />, label: 'Account Admin', onClick: () => router.push('/dashboard/account-administrator')},
  ];
  const statusTeams = Array.from(new Set(statusStats.map((s: StatusEntry) => s.team_name)));
  const statusOrder = ['open', 'in_progress', 'resolved', 'closed'];
  const teamNamesForCustomLabel = Array.from(new Set(statusStats.map((s: StatusEntry) => s.team_name))).filter(Boolean);

  const orderedLabelsForVolumeChart = teamNamesForCustomLabel.flatMap(team =>
    statusOrder.map(status => `${team} - ${status}`)
  );

  const backgroundColorsForVolume: Record<string, string> = {
    open: '#f39c12',
    in_progress: '#3498db',
    resolved: '#2ecc71',
    closed: '#9b59b6',
  };

  const volumeDataset = {
    labels: orderedLabelsForVolumeChart,
    datasets: [
      {
        label: 'Ticket Count',
        data: orderedLabelsForVolumeChart.map((label) => {
          const [team, status] = label.split(' - ');
          const match = statusStats.find(
            (entry: StatusEntry) => entry.team_name === team && entry.status.toLowerCase().replace(/\s/g, '_') === status.toLowerCase()

          );
          return match ? match.ticket_count : 0;
        }),
        backgroundColor: orderedLabelsForVolumeChart.map((label) => {
          const statusKey = label.split(' - ')[1];
          return backgroundColorsForVolume[statusKey] || '#ccc';
        }),
      },
    ],
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
        <ControlsBar>
          <RefreshButton onClick={refreshAllTeamChartData} disabled={loading}>
            <FiRefreshCcw size={16} /> {loading ? 'Refreshing...' : 'Refresh'}
          </RefreshButton>

          <FilterControls>
            {activeFiltersForDisplay.length > 0 && (
              <AppliedFilters>
                {activeFiltersForDisplay.map((filter) => (
                  <FilterTag key={filter.key}>
                    {filter.label}: {filter.value}
                    <FilterTagX onClick={() => handleRemoveFilter(filter.key)} />
                  </FilterTag>
                ))}
              </AppliedFilters>
            )}

            <FilterWrapper>
              <TableActions onClick={toggleFilterPopup}>
                <FiFilter />
              </TableActions>
              {showFilterPopup && (
                <NewFilterPopup
                  $isClosing={isClosingPopup}
                  onClick={(e) => e.stopPropagation()}
                >
                  <h4>Filter Options</h4>
                  <label className={filterStartDate ? 'active' : ''}>
                    Start Date:
                    <input
                      type="date"
                      value={filterStartDate}
                      onChange={(e) => setFilterStartDate(e.target.value)}
                      max={filterEndDate || new Date().toISOString().split('T')[0]}
                    />
                  </label>
                  <label className={filterEndDate ? 'active' : ''}>
                    End Date:
                    <input
                      type="date"
                      value={filterEndDate}
                      onChange={(e) => setFilterEndDate(e.target.value)}
                      min={filterStartDate}
                      max={new Date().toISOString().split('T')[0]}
                    />
                  </label>
                  <label className={filterPriority ? 'active' : ''}>
                    Priority:
                    <select
                      value={filterPriority}
                      onChange={(e) => setFilterPriority(e.target.value)}
                    >
                      <option value="">Select priority</option>
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Critical">Critical</option>
                    </select>
                  </label>

                  <FilterPopupActions>
                    <ClearFilterButton onClick={handleClearAllFilters}>
                      Clear All
                    </ClearFilterButton>
                    <ApplyFilterButton onClick={handleApplyFilters}>
                      Apply
                    </ApplyFilterButton>
                  </FilterPopupActions>
                </NewFilterPopup>
              )}
            </FilterWrapper>
          </FilterControls>
        </ControlsBar>

        <ChartSection>
          <Card style={{ gridColumn: 'span 2' }}>
            <CardTitle><FiBarChart2 /> Tickets Resolved by Team</CardTitle>
            {loading && resolvedStats.length === 0 ? (
              <NoDataMessage>Loading charts...</NoDataMessage>
            ) : resolvedStats.length > 0 ? (
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
                          backgroundColor: ['#27ae60', '#e74c3c'],
                          hoverOffset: 4,
                        }]
                      }}
                      
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        onClick: (_, elements) => {
                          if (elements.length > 0) {
                            const category = elements[0].index === 0 ? 'Resolved' : 'Unresolved';
                            handleDrillClick(team.team_name, category, 'resolutionState');
                          }
                        },
                        plugins: {
                          legend: {
                            labels: {
                              color: '#fff',
                              font: { size: 12 }
                            },
                            position: 'bottom'
                          },
                          tooltip: {
                            callbacks: {
                              label: (context) => {
                                let label = context.label || '';
                                if (label) label += ': ';
                                if (context.parsed !== null) label += context.parsed;
                                return label;
                              }
                            }
                          },
                          datalabels: {
                            color: 'white',
                            font: {
                              weight: 'bold',
                              size: 13,
                            },
                            formatter: (value: number, context) => {
                              const total = context.chart.data.datasets[0].data.reduce((sum, val) => sum + val, 0);
                              const percentage = ((value / total) * 100).toFixed(0);
                              return `${value} (${percentage}%)`;
                            }
                          }
                        }
                      }}
                      
                    />

                  </PieChartContainer>
                ))}
              </PieChartsWrapper>
            ) : (
              <NoDataMessage>No data for Tickets Resolved by Team.</NoDataMessage>
            )}
          </Card>

          <Card style={{ gridColumn: 'span 2' }}>
            <CardTitle><FiBarChart2 /> SLA Compliance per Team</CardTitle>
            {loading && teamStats.length === 0 ? (
              <NoDataMessage>Loading chart...</NoDataMessage>
            ) : teamStats.length > 0 ? (
              <ChartWrapper>
                <Bar
                  data={{
                    labels: teamStats.map((team: any) => team.team_name),
                    datasets: [
                      {
                        label: 'Within SLA',
                        data: teamStats.map((team: any) => Number(team.within_sla)),
                        backgroundColor: '#27ae60',
                        barThickness: 70
                      },
                      {
                        label: 'Outside SLA',
                        data: teamStats.map((team: any) =>
                          Number(team.total_tickets) - Number(team.within_sla)
                        ),
                        backgroundColor: '#e74c3c',
                        barThickness: 70
                      }
                    ]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    onClick: (_, elements) => {
                      if (elements.length > 0) {
                        const clickedBar = elements[0];
                        const teamIndex = clickedBar.index;
                        const datasetIndex = clickedBar.datasetIndex;
                  
                        const teamName = teamStats[teamIndex].team_name;
                        const slaLabel = datasetIndex === 0 ? 'Within SLA' : 'Outside SLA';
                  
                        handleDrillClick(teamName, slaLabel, 'slaCompliance'); // apelează funcția ta
                      }
                    },
                    plugins: {
                      datalabels: {
                        display: true,
                        color: '#fff',
                        anchor: 'center',
                        align: 'center',
                        font: {
                          weight: 'bold',
                          size: 13,
                        },
                        formatter: (value) => value > 0 ? value : '',
                      },
                      legend: {
                        labels: {
                          color: '#fff',
                          font: { size: 14 }
                        },
                        position: 'top'
                      },
                      tooltip: {
                        callbacks: {
                          label: function (context) {
                            const label = context.dataset.label || '';
                            const value = context.parsed.y;
                            return `${label}: ${value} tickets`;
                          }
                        },
                        backgroundColor: 'rgba(0,0,0,0.7)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        borderColor: '#fff',
                        borderWidth: 1,
                      }
                    },
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
                    layout: {
                      padding: { top: 10, bottom: 10 }
                    }
                  }}
                  
                  
                />
              </ChartWrapper>
            ) : (
              <NoDataMessage>No SLA data available for teams.</NoDataMessage>
            )}
          </Card>

          <Card>
            <CardTitle><FiClock /> Avg. Resolution Time (Minutes) by Team</CardTitle>
            {loading && resolutionStats.length === 0 ? (
              <NoDataMessage>Loading chart...</NoDataMessage>
            ) : resolutionStats.length > 0 ? (
              <ChartWrapper>
                <Bar
                  data={{
                    labels: resolutionStats.map((r: any) => r.team),
                    datasets: [{
                      label: 'Resolution Time (min)',
                      data: resolutionStats.map((r: any) => r.timeInMinutes),
                      backgroundColor: '#f39c12',
                      barThickness: 30
                    }]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom',
                        labels: {
                          color: '#fff',
                          font: { size: 14 },
                          padding: 20
                        }
                      },
                      
                      tooltip: {
                        callbacks: {
                          label: function (context) {
                            const value = context.parsed.y;
                            const hours = Math.floor(value / 60);
                            const minutes = Math.round(value % 60);
                            return `Resolution Time: ${hours}h ${minutes}m`;
                          }
                        },
                        backgroundColor: 'rgba(0,0,0,0.7)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        borderColor: '#fff',
                        borderWidth: 1,
                      },
                      datalabels: {
                        display: true,
                        color: 'white',
                        anchor: 'end',         // se ancorează la capătul barei
                        align: 'top',          // eticheta apare deasupra barei
                        offset: 6,             // spațiu între bară și etichetă
                        font: {
                          size: 13,
                          weight: 'bold'
                        },
                        formatter: function (value: number) {
                          const hours = Math.floor(value / 60);
                          const minutes = Math.round(value % 60);
                          return `${hours}h ${minutes}m`;
                        }
                      }
                      
                      
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          color: '#fff',
                          callback: function (value: number) {
                            return `${value}m`;
                          }
                        },
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
                    layout: {
                      padding: { top: 20, bottom: 10 }
                    }
                  }}
                  
                />
              </ChartWrapper>
            ) : (
              <NoDataMessage>No resolution time data available for teams.</NoDataMessage>
            )}
          </Card>


          <Card style={{ gridColumn: 'span 2' }}>
            <CardTitle><FiBarChart2 /> Volume by Status Per Team</CardTitle>
            {loading && statusStats.length === 0 ? (
              <NoDataMessage>Loading chart...</NoDataMessage>
            ) : statusStats.length > 0 ? (
              <ChartWrapper>
                <Bar
                  data={volumeDataset}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    onClick: (_, elements) => {
                      console.log("Clicked bar elements:", elements);
                    
                      if (elements.length > 0) {
                        const index = elements[0].index;
                        const label = volumeDataset.labels[index];
                    
                        console.log("Clicked label:", label); 
                    
                        if (label) {
                          const [teamName, status] = label.split(' - ');
                          const capitalizedStatus = status.charAt(0).toUpperCase() + status.slice(1);
                    
                          console.log("Drill into:", teamName, capitalizedStatus);
                          handleDrillClick(teamName, capitalizedStatus, 'ticketStatus');
                        }
                      }
                    },                    
                    scales: {
                      y: {
                        beginAtZero: true,
                        stacked: false,
                        ticks: { color: '#fff' },
                        title: { display: true, text: 'Ticket Count', color: '#fff' },
                      },
                      x: {
                        ticks: {
                          color: '#fff',
                          callback: (val: any, index: number) => {
                            const label = volumeDataset.labels[index];
                            return label?.split(' - ')[1] || '';
                          },
                        },
                      },
                    },
                    plugins: {
                      legend: { display: false },
                      tooltip: {
                        callbacks: {
                          title: (tooltipItems) => tooltipItems[0].label,
                          label: (context) => `Count: ${context.parsed.y}`,
                        },
                      },
                      customLabels: {
                        teamNames: teamNamesForCustomLabel,
                        statusCount: statusOrder.length,
                      },
                      datalabels: {
                        color: 'white',
                        anchor: 'center',
                        align: 'center',
                        font: {
                          weight: 'bold',
                          size: 11
                        },
                        formatter: (value: number) => value > 0 ? value : ''
                      }
                    }
                    ,
                  }}
                />

              </ChartWrapper>
            ) : (
              <NoDataMessage>No volume by status data available for teams.</NoDataMessage>
            )}
          </Card>
        </ChartSection>
        {showDrillModal && drillData && (
          <TeamDrillModal data={drillData} onClose={() => setShowDrillModal(false)} />
        )}

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

const ControlsBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px; 
  padding: 0 10px; 
`;

const FilterControls = styled.div` 
  display: flex;
  align-items: center;
  gap: 10px; 
  justify-content: flex-end;
  position: relative;
`;

const FilterWrapper = styled.div` 
  position: relative; 
  display: inline-block; 
`;

const TableActions = styled.button` 
  background: #1a1839;
  padding: 8px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center; 
  color: white; 
  border: none; 
  cursor: pointer;
  transition: 0.3s ease;

  &:hover {
    background: #635bff;
    animation: ${glow} 2s ease-in-out infinite;
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

const NewFilterPopup = styled.div<{ $isClosing: boolean }>` 
  position: absolute;
  top: calc(100% + 10px); 
  right: 0;
  background-color: #1a1839;
  border: 1px solid #635bff;
  border-radius: 12px;
  padding: 20px; 
  z-index: 1000; 
  box-shadow: 0 8px 25px rgba(0,0,0,0.3); 
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 250px;
  animation: ${({ $isClosing }) => $isClosing ? slideUpFadeOut : slideDownFadeIn} 0.3s ease forwards;

  h4 {
    margin: 0 0 10px 0; 
    color: #fff;
    font-size: 18px; 
    text-align: center;
    border-bottom: 1px solid #2a274f;
    padding-bottom: 10px;
  }

  label {
    display: flex;
    flex-direction: column;
    color: #fff; 
    font-size: 14px;
    font-weight: 500;
    
    &.active { color: #635bff; }
    &.active select,
    &.active input {
      box-shadow: 0 0 8px rgba(99, 91, 255, 0.7);
      border: 1px solid #635bff;
    }
  }

  input, select {
    margin-top: 6px; 
    padding: 12px 15px; 
    border-radius: 15px; 
    border: 1px solid rgb(155, 153, 175); 
    background-color: #0e0c28; 
    color: #ccc;
    font-family: 'Orbitron', sans-serif;
    font-size: 14px;
    transition: border-color 0.3s ease, box-shadow 0.3s ease;

    &:focus {
      outline: none;
      border-color: #635bff;
      box-shadow: 0 0 8px rgba(99, 91, 255, 0.5);
    }
  }
  
  select {
    appearance: none;
    -webkit-appearance: none;
    -moz-appearance: none;
    background-image: url("data:image/svg+xml;charset=UTF-8,%3Csvg width='12' height='8' viewBox='0 0 12 8' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1.41.59L6 5.17l4.59-4.58L12 2l-6 6-6-6z' fill='%23cccccc'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 15px center;
    background-size: 12px 8px;
    padding-right: 40px; 
    cursor: pointer;
  }

  input[type="date"]::-webkit-calendar-picker-indicator {
    filter: invert(1); 
    cursor: pointer;
  }
`;

const FilterPopupActions = styled.div` 
  display: flex;
  justify-content: space-between;
  gap: 10px;
  margin-top: 10px;
`;

const ApplyFilterButton = styled.button` 
    flex: 1;
    background-color: #27ae60;
    border: none;
    padding: 10px; 
    border-radius: 8px;
    color: white;
    cursor: pointer;
    font-weight: bold;
    font-size: 14px;
    transition: background-color 0.3s ease, transform 0.2s ease;

    &:hover:not(:disabled) {
      background-color: #229954;
      transform: translateY(-1px);
    }
    &:disabled {
      background-color: #2a274f;
      color: #555;
      cursor: not-allowed;
    }
`;

const ClearFilterButton = styled.button` 
    flex: 1;
    background-color: #c0392b;
    border: none;
    padding: 10px;
    border-radius: 8px;
    color: white;
    cursor: pointer;
    font-weight: bold;
    font-size: 14px;
    transition: background-color 0.3s ease, transform 0.2s ease;

    &:hover:not(:disabled) {
      background-color: #a93226;
      transform: translateY(-1px);
    }
`;

const AppliedFilters = styled.div` 
  display: flex;
  flex-wrap: wrap; 
  gap: 8px;
  align-items: center;
`;

const FilterTag = styled.div` 
  background-color: #635bff;
  color: white;
  padding: 6px 12px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: 'Orbitron', sans-serif;
  font-size: 13px; 
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  box-shadow: 0 2px 5px rgba(0,0,0,0.2);

  &:hover {
    transform: scale(1.05);
    box-shadow: 0 0 10px #635bff, 0 0 20px #635bff;
  }
`;

const FilterTagX = styled(FiX)` 
  font-size: 18px;
  color: #ffffff;
  cursor: pointer;
  transition: color 0.3s ease, transform 0.3s ease;
  border-radius: 50%;
  padding: 2px;
  margin-bottom: 0.1rem;

  &:hover {
    color: #ff5b5b; 
    transform: scale(1.2) rotate(90deg);
    background-color: rgba(255,255,255,0.1);
  }
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
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 6px;

  &:hover:not(:disabled) { // Added :not(:disabled)
    background-color: #4e46d4;
    box-shadow: 0 0 8px rgba(99, 91, 255, 0.6),
                0 0 15px rgba(99, 91, 255, 0.4),
                0 0 25px rgba(99, 91, 255, 0.2);
  }
   &:disabled { // Style for disabled state
    background-color: #2a274f;
    color: #555;
    cursor: not-allowed;
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
  display: flex; 
  flex-direction: column;
  overflow: hidden; 
`;

const CardTitle = styled.h3`
  font-size: 18px; 
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
  color: #fff; 
`;

const PieChartsWrapper = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: space-around; 
  align-items: flex-start;
  gap: 20px; 
  width: 100%; 
  flex: 1; 
`;

const PieChartContainer = styled.div`
  width: clamp(280px, 30%, 370px); 
  min-height: 300px; 
  height: auto; 
  display: flex;
  flex-direction: column;
  align-items: center;
  
  canvas { 
    max-width: 100%;
    max-height: 300px; 
  }
`;

const TeamLabel = styled.div`
  margin-bottom: 10px; 
  font-size: 16px; 
  color: white;
  font-weight: bold;
  text-align: center;
`;

const ChartWrapper = styled.div`
  height: 400px; 
  width: 100%;
  display: flex;
  justify-content: center; 
  flex: 1; 
`;

const NoDataMessage = styled.p`
  text-align: center;
  font-style: italic;
  color: #aaa;
  font-size: 16px;
  margin: auto; 
  padding: 20px;
`;