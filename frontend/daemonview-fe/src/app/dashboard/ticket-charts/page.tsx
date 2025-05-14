'use client';

import { useEffect, useState } from 'react';
import styled, { keyframes, css } from 'styled-components'; // Keep css if used in full styled-components list
import { useRouter } from 'next/navigation';
import {
  FiUserCheck, FiBarChart2, FiAlertCircle,
  FiClock, FiServer, FiSettings, FiRefreshCcw, FiHelpCircle, FiMenu, FiX,
  FiFilter
} from 'react-icons/fi';
import { Bar, Doughnut } from 'react-chartjs-2';
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

interface ActiveFilterDisplay {
  key: 'startDate' | 'endDate' | 'priority' | 'assignedTo'; // Added assignedTo if you use it
  label: string;
  value: string;
}


const TicketCharts = () => {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [username, setUsername] = useState('');
  const [resolvedTickets, setResolvedTickets] = useState<ResolvedTicketStats[]>([]);
  const [slaComplianceData, setSlaComplianceData] = useState<SlaCompliance[]>([]);
  const [ticketsByStatus, setTicketsByStatus] = useState<TicketByStatus[]>([]);
  const [averageResolutionTime, setAverageResolutionTime] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [showFilterPopup, setShowFilterPopup] = useState(false);
  const [isClosingPopup, setIsClosingPopup] = useState(false);

  // --- ACTUAL APPLIED FILTERS ---
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterPriority, setFilterPriority] = useState('All'); // Default to 'All'

  // --- TEMPORARY FILTERS FOR THE POPUP ---
  const [tempFilterStartDate, setTempFilterStartDate] = useState('');
  const [tempFilterEndDate, setTempFilterEndDate] = useState('');
  const [tempFilterPriority, setTempFilterPriority] = useState('All');

  const [activeFiltersForDisplay, setActiveFiltersForDisplay] = useState<ActiveFilterDisplay[]>([]);

  // NEW: Add filtersApplied state, similar to TeamCharts
  const [filtersApplied, setFiltersApplied] = useState(false);

  const priorityOptions = ['All', 'Low', 'Medium', 'High', 'Critical'];

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

  const buildChartApiQueryString = (): string => {
    const params = new URLSearchParams();
    if (filterStartDate) params.append('start_date', filterStartDate);
    if (filterEndDate) params.append('end_date', filterEndDate);
    if (filterPriority && filterPriority !== 'All') {
      params.append('priority', filterPriority);
    }
    return params.toString();
  };

  const fetchTicketsByStatus = async () => {
    const queryString = buildChartApiQueryString();
    try {
      const res = await fetch(`http://localhost:8080/api/tickets-by-status${queryString ? `?${queryString}` : ''}`);
      if (res.ok) {
        const data: TicketByStatus[] = await res.json();
        setTicketsByStatus(data);
      } else {
        console.error('Failed to fetch tickets by status:', await res.text());
        setTicketsByStatus([]);
      }
    } catch (error) {
      console.error('Error fetching tickets by status:', error);
      setTicketsByStatus([]);
    }
  };

  const fetchResolvedTickets = async () => {
    const queryString = buildChartApiQueryString();
    try {
      const res = await fetch(`http://localhost:8080/api/tickets-resolved${queryString ? `?${queryString}` : ''}`);
      if (res.ok) {
        const data = await res.json();
        setResolvedTickets(data);
      } else {
        console.error('Failed to fetch resolved tickets:', await res.text());
        setResolvedTickets([]);
      }
    } catch (err) {
      console.error('Error fetching resolved tickets:', err);
      setResolvedTickets([]);
    }
  };

  const fetchSLACompliance = async () => {
    const queryString = buildChartApiQueryString();
    try {
      const res = await fetch(`http://localhost:8080/api/sla-compliance${queryString ? `?${queryString}` : ''}`);
      if (res.ok) {
        const data = await res.json();
        setSlaComplianceData(data);
      } else {
        console.error('Failed to fetch SLA data:', await res.text());
        setSlaComplianceData([]);
      }
    } catch (err) {
      console.error('Error fetching SLA data', err);
      setSlaComplianceData([]);
    }
  };

  const fetchAvgResolutionTime = async () => {
    const queryString = buildChartApiQueryString();
    try {
      const res = await fetch(`http://localhost:8080/api/resolution-time${queryString ? `?${queryString}` : ''}`);
      if (res.ok) {
        const data = await res.json();
        const resolutionTime = data[0]?.average_resolution_time_in_time_format;
        setAverageResolutionTime(resolutionTime);
      } else {
        console.error('Failed to fetch average resolution time:', await res.text());
        setAverageResolutionTime(null);
      }
    } catch (err) {
      console.error('Error fetching average resolution time:', err);
      setAverageResolutionTime(null);
    }
  };

  const refreshAllChartData = async () => {
    console.log("TicketCharts: Refreshing chart data with filters:", { filterStartDate, filterEndDate, filterPriority });
    setLoading(true);
    try {
      await Promise.all([
          fetchTicketsByStatus(),
          fetchResolvedTickets(),
          fetchSLACompliance(),
          fetchAvgResolutionTime()
      ]);
    } catch (error) {
        console.error("TicketCharts: Error in refreshAllChartData Promise.all:", error);
    } finally {
        setLoading(false);
    }
  };

  // CHANGED: Replaced old useEffect with two new ones for filter logic
  // useEffect for initial data load
  useEffect(() => {
    console.log("TicketCharts: Initial data load on component mount.");
    refreshAllChartData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array for initial mount

  // useEffect to refresh data when filter values change AND filtersApplied is true
  useEffect(() => {
    if (filtersApplied) {
      console.log("TicketCharts: filtersApplied is true, triggering data refresh via useEffect.");
      refreshAllChartData();
      setFiltersApplied(false); // Reset the flag after refreshing
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStartDate, filterEndDate, filterPriority, filtersApplied]);


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
      setTempFilterStartDate(filterStartDate);
      setTempFilterEndDate(filterEndDate);
      setTempFilterPriority(filterPriority);
      setShowFilterPopup(true);
      setIsClosingPopup(false);
    }
  };

  const handleApplyPopupFilters = () => {
    setFilterStartDate(tempFilterStartDate);
    setFilterEndDate(tempFilterEndDate);
    setFilterPriority(tempFilterPriority);

    const activeFilters: ActiveFilterDisplay[] = [];
    if (tempFilterStartDate) activeFilters.push({ key: 'startDate', label: 'Start Date', value: tempFilterStartDate });
    if (tempFilterEndDate) activeFilters.push({ key: 'endDate', label: 'End Date', value: tempFilterEndDate });
    if (tempFilterPriority && tempFilterPriority !== 'All') activeFilters.push({ key: 'priority', label: 'Priority', value: tempFilterPriority });
    setActiveFiltersForDisplay(activeFilters);

    // refreshAllChartData(); // REMOVE THIS
    setFiltersApplied(true); // ADD THIS
    closePopup();
  };


  const handleClearPopupAndApplyFilters = () => {
    setTempFilterStartDate('');
    setTempFilterEndDate('');
    setTempFilterPriority('All');

    setFilterStartDate('');
    setFilterEndDate('');
    setFilterPriority('All');

    setActiveFiltersForDisplay([]);

    // refreshAllChartData(); // REMOVE THIS
    setFiltersApplied(true); // ADD THIS
    closePopup();
  };

  const handleRemoveActiveFilterTag = (filterToRemoveKey: ActiveFilterDisplay['key']) => {
    let newStartDate = filterStartDate;
    let newEndDate = filterEndDate;
    let newPriority = filterPriority;

    if (filterToRemoveKey === 'startDate') newStartDate = '';
    if (filterToRemoveKey === 'endDate') newEndDate = '';
    if (filterToRemoveKey === 'priority') newPriority = 'All';

    setFilterStartDate(newStartDate);
    setFilterEndDate(newEndDate);
    setFilterPriority(newPriority);

    const activeFilters: ActiveFilterDisplay[] = [];
    if (newStartDate) activeFilters.push({ key: 'startDate', label: 'Start Date', value: newStartDate });
    if (newEndDate) activeFilters.push({ key: 'endDate', label: 'End Date', value: newEndDate });
    if (newPriority && newPriority !== 'All') activeFilters.push({ key: 'priority', label: 'Priority', value: newPriority });
    setActiveFiltersForDisplay(activeFilters);

    // refreshAllChartData(); // REMOVE THIS
    setFiltersApplied(true); // ADD THIS
  };

  const handleClearAllFilters = () => {
    setFilterStartDate('');
    setFilterEndDate('');
    setFilterPriority('All');
    setActiveFiltersForDisplay([]);
    
    setFiltersApplied(true); // ADD THIS
    closePopup();
    // NO explicit refreshAllChartData() call needed here.
  };

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
    responsive: true, maintainAspectRatio: false,
    layout: { padding: { top: 20, bottom: 10, left: 0, right: 0 } },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#FFFFFF', font: { size: 14, weight: 'bold' as const }}},
      y: { grid: { color: '#444', borderColor: '#444', borderWidth: 1 }, ticks: { color: '#FFFFFF', font: { size: 14, weight: 'bold' as const }}}
    },
    plugins: {
      legend: { position: 'top' as const, labels: { color: '#FFFFFF', font: { size: 14, weight: 'bold' as const }}},
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.7)', titleColor: '#FFFFFF', bodyColor: '#FFFFFF', borderColor: '#FFFFFF', borderWidth: 1,
        callbacks: { label: (tooltipItem: any) => `${tooltipItem.dataset.label}: ${tooltipItem.raw}` }
      }
    }
  };

  const slaDoughnutData = {
    labels: ['Within SLA', 'Outside SLA'],
    datasets: [{
        data: slaComplianceData.length > 0 && slaComplianceData[0].total_tickets > 0
          ? [parseInt(slaComplianceData[0].within_sla), slaComplianceData[0].total_tickets - parseInt(slaComplianceData[0].within_sla)]
          : [0, 0],
        backgroundColor: ['#27ae60', '#c0392b'], hoverOffset: 6,
      }],
  };

  const statusLabels = ticketsByStatus.map(item => item.status);
  const statusCounts = ticketsByStatus.map(item => item.ticket_count);

  const ticketsByStatusChartData = {
    labels: statusLabels,
    datasets: [{
        label: 'Ticket Volume by Status', data: statusCounts,
        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'],
        borderWidth: 1,
      }],
  };

  const ticketsByStatusChartOptions = {
    responsive: true, layout: { padding: { top: 0, bottom: 0, left: 0, right: 0 }},
    plugins: {
      legend: { position: 'right' as const, labels: { color: 'white' }},
      tooltip: { bodyColor: 'white', titleColor: 'white' },
    }
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
            <RefreshButton onClick={refreshAllChartData} disabled={loading}>
                <FiRefreshCcw size={16} /> {loading ? 'Refreshing...' : 'Refresh'}
            </RefreshButton>

            <FilterControls>
              {activeFiltersForDisplay.length > 0 && (
                <AppliedFilters>
                  {activeFiltersForDisplay.map((filter) => (
                    <FilterTag key={filter.key}>
                      {filter.label}: {filter.value}
                      <FilterTagX onClick={() => handleRemoveActiveFilterTag(filter.key)} />
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

                    <label className={tempFilterStartDate ? 'active' : ''}>
                      Start Date:
                      <input
                        type="date"
                        value={tempFilterStartDate}
                        onChange={(e) => setTempFilterStartDate(e.target.value)}
                        max={tempFilterEndDate || new Date().toISOString().split('T')[0]}
                      />
                    </label>

                    <label className={tempFilterEndDate ? 'active' : ''}>
                      End Date:
                      <input
                        type="date"
                        value={tempFilterEndDate}
                        onChange={(e) => setTempFilterEndDate(e.target.value)}
                        min={tempFilterStartDate}
                        max={new Date().toISOString().split('T')[0]}
                      />
                    </label>

                    <label className={tempFilterPriority && tempFilterPriority !== 'All' ? 'active' : ''}>
                      Priority:
                      <select
                        value={tempFilterPriority}
                        onChange={(e) => setTempFilterPriority(e.target.value)}
                      >
                        {priorityOptions.map((priority) => (
                          <option key={priority} value={priority}>{priority}</option>
                        ))}
                      </select>
                    </label>

                    <FilterPopupActions>
                        <ClearFilterButton onClick={handleClearPopupAndApplyFilters}>
                            Clear All
                        </ClearFilterButton>
                        <ApplyFilterButton onClick={handleApplyPopupFilters}>
                            Apply
                        </ApplyFilterButton>
                    </FilterPopupActions>
                  </NewFilterPopup>
                )}
              </FilterWrapper>
            </FilterControls>
        </ControlsBar>

        <ChartSection>
          <Card>
            <CardTitle><FiClock /> Avg. Resolution Time</CardTitle>
            {loading && !averageResolutionTime ? (
              <StyledParagraph>Loading...</StyledParagraph>
            ) : (
              <StyledParagraph>{averageResolutionTime || 'N/A'}</StyledParagraph>
            )}
          </Card>

          <Card>
            <CardTitle><FiAlertCircle /> Volume by Status</CardTitle>
            {loading && ticketsByStatus.length === 0 ? (
                <NoDataMessage>Loading chart...</NoDataMessage>
            ) : ticketsByStatus.length > 0 ? (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
                <div style={{ width: '350px', height: '350px' }}>
                  <Doughnut data={ticketsByStatusChartData} options={ticketsByStatusChartOptions} />
                </div>
              </div>
            ) : (
              <NoDataMessage>No data for Volume by Status.</NoDataMessage>
            )}
          </Card>
        </ChartSection>

        <ChartSection>
          <Card>
            <CardTitle><FiBarChart2 /> Tickets Resolved</CardTitle>
            {loading && resolvedTickets.length === 0 ? (
                <NoDataMessage>Loading chart...</NoDataMessage>
            ) : resolvedTickets.length > 0 && (resolvedTickets[0]?.resolved_count || resolvedTickets[0]?.unresolved_count) ? (
                <Bar data={barData} options={customChartOptions} />
            ) : (
                <NoDataMessage>No data for Tickets Resolved.</NoDataMessage>
            )}
          </Card>

          <Card>
            <CardTitle><FiUserCheck /> SLA Compliance</CardTitle>
            {loading && slaComplianceData.length === 0 ? (
                <NoDataMessage>Loading SLA data...</NoDataMessage>
            ) : slaComplianceData.length > 0 && slaComplianceData[0].total_tickets > 0 ? (
              <>
                <StyledDoughnutWrapper>
                  <Doughnut data={slaDoughnutData} options={{ maintainAspectRatio: false, responsive: true, plugins: { legend: { labels: { color: '#fff', font: { size: 14 }}}}}} />
                </StyledDoughnutWrapper>
                <StyledParagraph2>
                  {slaComplianceData[0].sla_percent}% Compliance
                </StyledParagraph2>
              </>
            ) : (
              <NoDataMessage>No SLA data available.</NoDataMessage>
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

const ControlsBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 0 10px; 
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
  cursor: pointer;
  transition: 0.3s ease;
  position: relative;
  overflow: hidden;
  margin-right: 2.4rem;

  &:hover {
    background: #635bff;
    animation: ${glow} 2s ease-in-out infinite;
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
  gap: 16px; // Increased gap slightly for better spacing
  width: 250px; // Slightly wider for date inputs
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
    border: 1px solidrgb(155, 153, 175); 
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

  option {
    background-color: #1a1839;  
    color: #e0e0e0;   
    border-radius: 30px;        
    padding: 15px 15px;     
  }

  option:hover {
    background-color:rgb(48, 44, 87);
    color: #ffffff;
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
    background-color: #27ae60; // Green for apply
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
    background-color: #c0392b; // Red for clear
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
  margin-right: 0.5rem;

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
  position: relative;
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
const FilterControls = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-bottom: 15px;
  position: relative;
`;

const FilterButton = styled.button`
  background-color: #635bff;
  border: none;
  color: white;
  padding: 8px 14px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;

  &:hover {
    background-color: #7a70ff;
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
    label.active select,

    label.active input {
      box-shadow: 0 0 6px #635bff;
      border: 1px solid #635bff;
    }
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

const FilterActions = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 10px;

  button {
    flex: 1;
    padding: 8px;
    border: none;
    border-radius: 6px;
    font-weight: bold;
    cursor: pointer;
  }

  button:first-child {
    background: #27ae60;
    color: white;
  }

  button:last-child {
    background: #c0392b;
    color: white;
  }
`;
