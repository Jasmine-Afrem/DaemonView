'use client';

import { useEffect, useState, useRef } from 'react';
import styled, { keyframes, css } from 'styled-components';
import * as XLSX from 'xlsx';
import { useRouter } from 'next/navigation';
import {
  FiUserCheck, FiBarChart2, FiAlertCircle,
  FiClock, FiServer, FiSettings, FiRefreshCcw, FiHelpCircle, FiMenu, FiX,
  FiFilter, FiDownload
} from 'react-icons/fi';
import { Bar, Doughnut, getElementAtEvent } from 'react-chartjs-2';
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
  ChartType, // Keep ChartType if used, otherwise can be removed
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';

ChartJS.register(
  BarElement,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  ArcElement,
  Tooltip,
  Legend,
  ChartDataLabels
);

interface ActiveFilterDisplay {
  key: 'startDate' | 'endDate' | 'priority' | 'assignedTo';
  label: string;
  value: string;
}

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

interface DrillDownTicket {
  id: number;
  description: string;
  status: string;
  priority: 'Critical' | 'High' | 'Medium' | 'Low' | string;
  createdAt: string;
  updatedAt: string;
  submittedBy: string;
  assignedTo: string;
  closeDate?: string;
  resolveDate?: string;
  slaHours: string;
  deadline: string;
  withinSla: string;
  relatedIncidents?: string;
  relatedDevices?: string;
  notes?: string;
}

const mockDrillDownTickets: DrillDownTicket[] = [
  { id: 101, description: 'Login issue after password reset', status: 'Open', priority: 'High', createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], submittedBy: 'user_jane', assignedTo: 'Support Tier 1', slaHours: '4', deadline: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString().split('T')[0], withinSla: 'Pending', relatedIncidents: 'INC-00123', notes: 'User cannot log in after HR initiated a password reset.' },
  { id: 102, description: 'Cannot access shared drive "PROJECT_ALPHA"', status: 'In Progress', priority: 'Medium', createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], updatedAt: new Date().toISOString().split('T')[0], submittedBy: 'user_john', assignedTo: 'Network Team', slaHours: '8', deadline: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], withinSla: 'Yes', relatedDevices: 'FS01, PC-John', notes: 'Permissions seem to be missing for this user.' },
  { id: 103, description: 'Printer not working - HR department, 3rd floor', status: 'Resolved', priority: 'Low', createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], submittedBy: 'user_alice', assignedTo: 'IT Support', closeDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], resolveDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], slaHours: '24', deadline: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], withinSla: 'Yes', notes: 'Paper jam cleared, printer tested.' },
  { id: 104, description: 'Critical: CRM Software license expired, sales team blocked', status: 'Open', priority: 'Critical', createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString().split('T')[0], updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString().split('T')[0], submittedBy: 'system_admin', assignedTo: 'Procurement', slaHours: '2', deadline: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString().split('T')[0], withinSla: 'No', relatedIncidents: 'INC-00125', notes: 'Urgent renewal required.' },
  { id: 105, description: 'New employee onboarding IT setup', status: 'In Progress', priority: 'Medium', createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], updatedAt: new Date().toISOString().split('T')[0], submittedBy: 'hr_manager', assignedTo: 'Desktop Support', slaHours: '16', deadline: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], withinSla: 'Yes', notes: 'Laptop, monitor, and account access needed for new hire starting tomorrow.' }
];

const mapApiTicketToDrillDownTicket = (apiTicket: any): DrillDownTicket => {
  const formatDateTime = (dateString?: string | null): string | undefined => {
    if (!dateString) return undefined;
    try {
      const dateObj = new Date(dateString);
      if (isNaN(dateObj.getTime())) {
          console.warn(`Invalid date string received from API: ${dateString}`);
          return dateString; 
      }
      return dateObj.toLocaleString(undefined, { 
        year: 'numeric', month: 'numeric', day: 'numeric',
        hour: 'numeric', minute: '2-digit', second: '2-digit',
        hour12: true 
      });
    } catch (e) {
      console.warn(`Could not parse or format date-time: ${dateString}`, e);
      return dateString;
    }
  };

  let withinSlaStatus: string;
  if (typeof apiTicket['Within SLA'] === 'number') {
    withinSlaStatus = apiTicket['Within SLA'] === 1 ? 'Yes' : 'No';
  } else if (apiTicket['SLA Status']) { // Check for an alternative field if 'Within SLA' is not a number
    withinSlaStatus = apiTicket['SLA Status'].toLowerCase() === 'compliant' ? 'Yes' : 'No';
  } else {
    withinSlaStatus = 'Pending'; // Default if status cannot be determined
  }

  return {
    id: apiTicket['Ticket ID'] || apiTicket.id || 0,
    description: apiTicket['Description'] || apiTicket.description || '',
    status: apiTicket['Status'] || apiTicket.status || 'Unknown',
    priority: apiTicket['Priority'] || apiTicket.priority || 'Unknown',
    createdAt: formatDateTime(apiTicket['Created At'] || apiTicket.createdAt) || 'N/A',
    updatedAt: formatDateTime(apiTicket['Updated At'] || apiTicket.updatedAt) || 'N/A',
    submittedBy: apiTicket['Submitted By'] || apiTicket.submittedBy || 'N/A',
    assignedTo: apiTicket['Assigned To'] || apiTicket.assignedTo || 'N/A',
    closeDate: formatDateTime(apiTicket['Close Date'] || apiTicket.closeDate),
    resolveDate: formatDateTime(apiTicket['Completed Date'] || apiTicket.resolveDate), // API example uses "Completed Date"
    slaHours: String(apiTicket['SLA (Hours)'] || apiTicket.slaHours || 'N/A'),
    deadline: formatDateTime(apiTicket['Deadline'] || apiTicket.deadline) || 'N/A',
    withinSla: withinSlaStatus,
    relatedIncidents: apiTicket['Related Incidents'] || apiTicket.relatedIncidents,
    relatedDevices: apiTicket['Related Devices'] || apiTicket.relatedDevices,
    notes: apiTicket['Notes'] || apiTicket.notes, // Assuming 'Notes' might exist
  };
};

const fetchDrillDownData = async (criteria: any): Promise<DrillDownTicket[]> => {
  console.log("[DEBUG FRONTEND] Initial criteria for fetchDrillDownData:", JSON.stringify(criteria));
  const queryParams = new URLSearchParams();

  // Common filters applied to all API calls
  if (criteria.startDate) queryParams.append('start_date', criteria.startDate);
  if (criteria.endDate) queryParams.append('end_date', criteria.endDate);
  if (criteria.priority && typeof criteria.priority === 'string' && criteria.priority.toLowerCase() !== 'all') {
    queryParams.append('priority', criteria.priority);
  }

  let apiUrl = '';
  let callApi = false; // Flag to determine if we should proceed with an API call

  if (criteria.type === 'slaStatus') {
    apiUrl = `http://localhost:8080/api/sla-compliance-tickets`;
    let slaFilterValue = '';
    if (criteria.sla === 'Within SLA') {
      slaFilterValue = 'Yes';
    } else if (criteria.sla === 'Outside SLA') {
      slaFilterValue = 'No';
    }
    if (slaFilterValue) {
      queryParams.append('sla_status', slaFilterValue);
      callApi = true;
    } else {
      console.warn("[DEBUG FRONTEND] slaStatus: Invalid criteria.sla provided:", criteria.sla);
    }
  } else if (criteria.type === 'resolvedStatus') {
    apiUrl = `http://localhost:8080/api/tickets-resolved-tickets`;
    if (criteria.status === 'Resolved') {
      queryParams.append('resolved', 'yes');
      callApi = true;
    } else if (criteria.status === 'Unresolved') {
      queryParams.append('resolved', 'no');
      callApi = true;
    } else {
      // This means the label from the chart was not 'Resolved' or 'Unresolved'
      console.warn("[DEBUG FRONTEND] resolvedStatus: Unknown criteria.status for API call:", criteria.status);
      // callApi will remain false, leading to mock data path
    }
  } else if (criteria.type === 'ticketStatus') {
    apiUrl = `http://localhost:8080/api/tickets-by-status-tickets`;
    if (criteria.status && typeof criteria.status === 'string') {
      queryParams.append('status', criteria.status.toLowerCase());
      callApi = true;
    } else {
      console.warn("[DEBUG FRONTEND] ticketStatus: Missing or invalid criteria.status:", criteria.status);
    }
  } else {
    console.warn("[DEBUG FRONTEND] Unknown criteria.type, cannot determine API endpoint:", criteria.type);
  }

  console.log(`[DEBUG FRONTEND] After criteria check: callApi = ${callApi}, apiUrl = "${apiUrl}"`);

  if (callApi && apiUrl) {
    try {
      const fullApiUrl = `${apiUrl}?${queryParams.toString()}`;
      console.log(`[DEBUG FRONTEND] Fetching drill-down from: ${fullApiUrl}`);
      const response = await fetch(fullApiUrl, { method: 'GET', credentials: 'include' });

      console.log(`[DEBUG FRONTEND] API Response Status for ${criteria.type}:`, response.status);
      const responseText = await response.text(); // Get raw text first
      // Log only a snippet if responseText is very long to avoid cluttering console too much
      const logResponseText = responseText.length > 500 ? responseText.substring(0, 500) + "..." : responseText;
      console.log(`[DEBUG FRONTEND] Raw API Response Text for ${criteria.type}:`, logResponseText);

      if (!response.ok) {
        console.error(`[DEBUG FRONTEND] API Error: Failed to fetch drill-down data for ${criteria.type}. Status: ${response.status}, Full Response: ${responseText}`);
        throw new Error(`API Error ${response.status}: ${responseText || `Failed to fetch ${criteria.type} drill-down data`}`);
      }
      
      let apiTickets;
      try {
          apiTickets = JSON.parse(responseText); // Manually parse the text
      } catch (parseError) {
          console.error(`[DEBUG FRONTEND] Failed to parse JSON response for ${criteria.type}:`, parseError, "Response text was:", responseText);
          return []; // Return empty array if JSON parsing fails
      }

      console.log(`[DEBUG FRONTEND] Parsed API Tickets (apiTickets) for ${criteria.type}:`, apiTickets);
      console.log(`[DEBUG FRONTEND] Is apiTickets an array for ${criteria.type}?`, Array.isArray(apiTickets));

      if (Array.isArray(apiTickets)) {
        const mappedTickets = apiTickets.map(mapApiTicketToDrillDownTicket); // Ensure mapApiTicketToDrillDownTicket is robust
        console.log(`[DEBUG FRONTEND] Mapped tickets for ${criteria.type} (count: ${mappedTickets.length}):`, mappedTickets.length > 0 ? mappedTickets[0] : 'No tickets mapped (empty array received or after mapping)');
        return mappedTickets;
      } else {
        console.error(`[DEBUG FRONTEND] Drill-down API for ${criteria.type} did NOT return an array. Actual (parsed) response:`, apiTickets);
        return []; // Return empty if not an array
      }
    } catch (error) {
      // This will catch network errors, parsing errors if thrown, or errors from new Error()
      console.error(`[DEBUG FRONTEND] Catch block error in fetchDrillDownData for ${criteria.type}:`, error);
      return []; // Return empty array on any error during fetch/processing
    }
  } else {
    // Fallback to mock data if API call is not made (callApi is false or apiUrl is empty)
    console.warn(`[DEBUG FRONTEND] Fallback: API call NOT made for type "${criteria.type}". callApi: ${callApi}, apiUrl: "${apiUrl}". Using mock data path.`);
    await new Promise(resolve => setTimeout(resolve, 300)); // Simulate network delay

    // Basic mock data filtering
    let filteredMockTickets = [...mockDrillDownTickets];
    
    if (criteria.priority && typeof criteria.priority === 'string' && criteria.priority.toLowerCase() !== 'all') {
        filteredMockTickets = filteredMockTickets.filter(t => t.priority && typeof t.priority === 'string' && t.priority.toLowerCase() === criteria.priority.toLowerCase());
    }
    // Add more specific mock filters if needed for testing the UI with mock data
    if (criteria.type === 'resolvedStatus') {
        if (criteria.status === 'Resolved') {
            filteredMockTickets = filteredMockTickets.filter(t => t.status && (t.status.toLowerCase() === 'resolved' || t.status.toLowerCase() === 'closed'));
        } else if (criteria.status === 'Unresolved') { // Assuming "Unresolved" means not "Resolved" or "Closed" for mock data
            filteredMockTickets = filteredMockTickets.filter(t => t.status && !(t.status.toLowerCase() === 'resolved' || t.status.toLowerCase() === 'closed'));
        }
    }
    // You can add similar mock filters for criteria.type === 'slaStatus' and criteria.type === 'ticketStatus'

    console.log(`[DEBUG FRONTEND] Fallback: Returning ${filteredMockTickets.length} mock tickets after filtering.`);
    return Promise.resolve(filteredMockTickets.slice(0, 50).map(mapApiTicketToDrillDownTicket));
  }
};

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

  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterPriority, setFilterPriority] = useState('All');

  const [tempFilterStartDate, setTempFilterStartDate] = useState('');
  const [tempFilterEndDate, setTempFilterEndDate] = useState('');
  const [tempFilterPriority, setTempFilterPriority] = useState('All');

  const [activeFiltersForDisplay, setActiveFiltersForDisplay] = useState<ActiveFilterDisplay[]>([]);
  const [filtersApplied, setFiltersApplied] = useState(false);

  const priorityOptions = ['All', 'Low', 'Medium', 'High', 'Critical'];

  const [isDrillDownModalOpen, setIsDrillDownModalOpen] = useState(false);
  const [drillDownTitle, setDrillDownTitle] = useState('');
  const [drillDownTickets, setDrillDownTickets] = useState<DrillDownTicket[]>([]);
  const [isDrillDownLoading, setIsDrillDownLoading] = useState(false);

  const ticketsResolvedChartRef = useRef<ChartJS<'bar', number[], string> | null>(null);
  const slaComplianceChartRef = useRef<ChartJS<'doughnut', number[], string> | null>(null);
  const ticketsByStatusChartRef = useRef<ChartJS<'doughnut', number[], string> | null>(null);

  const [avgResTimeInMinutes, setAvgResTimeInMinutes] = useState(0);
  const MAX_RESOLUTION_TIME_MINUTES = 8 * 60; // Example: 8 hours

  const timeStringToMinutes = (timeStr: string | null | undefined): number => {
    if (!timeStr) return 0;
    const parts = timeStr.split(':');
    if (parts.length === 3) { // HH:MM:SS
      const [h, m, s] = parts.map(Number);
      if (isNaN(h) || isNaN(m) || isNaN(s)) return 0;
      return (h * 60) + m + (s / 60);
    } else if (parts.length === 2) { // MM:SS or HH:MM (less common for resolution time)
      // Assuming MM:SS format, or if first part > 59, treat as HH:MM
      const [p1, p2] = parts.map(Number);
      if (isNaN(p1) || isNaN(p2)) return 0;
      // Heuristic: if p1 (minutes or hours) > 59, it's likely hours.
      return p1 > 59 ? (p1 * 60) + p2 : p1 + (p2 / 60) ; 
    } else if (parts.length === 1 && !isNaN(Number(timeStr))) { // Just minutes
        return Number(timeStr);
    }
    console.warn("Could not parse time string:", timeStr);
    return 0;
  };

  useEffect(() => {
    if (averageResolutionTime) {
      setAvgResTimeInMinutes(timeStringToMinutes(averageResolutionTime));
    } else {
      setAvgResTimeInMinutes(0);
    }
  }, [averageResolutionTime]);

  const buildChartApiQueryString = (): string => {
    const params = new URLSearchParams();
    if (filterStartDate) params.append('start_date', filterStartDate);
    if (filterEndDate) params.append('end_date', filterEndDate);
    if (filterPriority && filterPriority !== 'All') {
      params.append('priority', filterPriority);
    }
    return params.toString();
  };

  const handleDrillDownExport = () => {
    if (!drillDownTickets || drillDownTickets.length === 0) {
      alert("No data to export.");
      return;
    }

    const worksheetData = drillDownTickets.map(t => ({
      'Ticket ID': t.id,
      'Description': t.description,
      'Status': t.status,
      'Priority': t.priority,
      'Created At': t.createdAt,
      'Updated At': t.updatedAt,
      'Submitted By': t.submittedBy,
      'Assigned To': t.assignedTo,
      'Close Date': t.closeDate || '',
      'Resolved Date': t.resolveDate || '', // Corrected from 'resolveDate' to 'Resolved Date' for header
      'SLA Hours': t.slaHours,
      'Deadline': t.deadline,
      'Within SLA': t.withinSla,
      'Related Incidents': t.relatedIncidents || '',
      'Related Devices': t.relatedDevices || '',
      'Notes': t.notes || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Tickets');

    // Sanitize title for filename
    let fileNameBase = 'DrillDown_Tickets';
    if (drillDownTitle) {
      fileNameBase = drillDownTitle.replace(/[^a-z0-9_]/gi, '_').replace(/_{2,}/g, '_');
    }
    const fileName = `${fileNameBase}.xlsx`;

    XLSX.writeFile(workbook, fileName); 
  };
  
  const fetchTicketsByStatus = async () => {
    const queryString = buildChartApiQueryString();
    try {
      const res = await fetch(`http://localhost:8080/api/tickets-by-status${queryString ? `?${queryString}` : ''}`, { credentials: 'include' });
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
      const res = await fetch(`http://localhost:8080/api/tickets-resolved${queryString ? `?${queryString}` : ''}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json(); // Assuming this returns ResolvedTicketStats[]
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
      const res = await fetch(`http://localhost:8080/api/sla-compliance${queryString ? `?${queryString}` : ''}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json(); // Assuming this returns SlaCompliance[]
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
      const res = await fetch(`http://localhost:8080/api/resolution-time${queryString ? `?${queryString}` : ''}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        // Assuming data is [{ average_resolution_time_in_time_format: "HH:MM:SS" }]
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
    setLoading(true);
    try {
      await Promise.all([
        fetchTicketsByStatus(),
        fetchResolvedTickets(),
        fetchSLACompliance(),
        fetchAvgResolutionTime()
      ]);
    } catch (error) {
      // Individual fetches already log their errors.
      console.error("TicketCharts: Error in refreshAllChartData Promise.all:", error);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    refreshAllChartData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Initial fetch

  useEffect(() => {
    if (filtersApplied) {
      refreshAllChartData();
      setFiltersApplied(false); // Reset flag
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStartDate, filterEndDate, filterPriority, filtersApplied]);


  const closePopup = () => { setIsClosingPopup(true); setTimeout(() => { setShowFilterPopup(false); setIsClosingPopup(false); }, 300); };
  const toggleFilterPopup = () => { if (showFilterPopup) { closePopup(); } else { setTempFilterStartDate(filterStartDate); setTempFilterEndDate(filterEndDate); setTempFilterPriority(filterPriority); setShowFilterPopup(true); setIsClosingPopup(false); } };

  const handleApplyPopupFilters = () => {
    setFilterStartDate(tempFilterStartDate);
    setFilterEndDate(tempFilterEndDate);
    setFilterPriority(tempFilterPriority);

    const activeFilters: ActiveFilterDisplay[] = [];
    if (tempFilterStartDate) activeFilters.push({ key: 'startDate', label: 'Start Date', value: tempFilterStartDate });
    if (tempFilterEndDate) activeFilters.push({ key: 'endDate', label: 'End Date', value: tempFilterEndDate });
    if (tempFilterPriority && tempFilterPriority !== 'All') activeFilters.push({ key: 'priority', label: 'Priority', value: tempFilterPriority });
    setActiveFiltersForDisplay(activeFilters);
    setFiltersApplied(true); // Trigger data refresh
    closePopup();
  };

  const handleClearPopupAndApplyFilters = () => {
    setTempFilterStartDate(''); setTempFilterEndDate(''); setTempFilterPriority('All'); // Clear temps
    setFilterStartDate(''); setFilterEndDate(''); setFilterPriority('All'); // Clear actual filters
    setActiveFiltersForDisplay([]);
    setFiltersApplied(true); // Trigger data refresh
    closePopup();
  };

  const handleRemoveActiveFilterTag = (filterToRemoveKey: ActiveFilterDisplay['key']) => {
    let newStartDate = filterStartDate, newEndDate = filterEndDate, newPriority = filterPriority;

    if (filterToRemoveKey === 'startDate') newStartDate = '';
    if (filterToRemoveKey === 'endDate') newEndDate = '';
    if (filterToRemoveKey === 'priority') newPriority = 'All';
    
    setFilterStartDate(newStartDate); setFilterEndDate(newEndDate); setFilterPriority(newPriority);

    const activeFilters: ActiveFilterDisplay[] = [];
    if (newStartDate) activeFilters.push({ key: 'startDate', label: 'Start Date', value: newStartDate });
    if (newEndDate) activeFilters.push({ key: 'endDate', label: 'End Date', value: newEndDate });
    if (newPriority && newPriority !== 'All') activeFilters.push({ key: 'priority', label: 'Priority', value: newPriority });
    setActiveFiltersForDisplay(activeFilters);
    setFiltersApplied(true); // Trigger data refresh
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('http://localhost:8080/api/check-auth', { method: 'GET', credentials: 'include' });
        if (res.ok) { const data = await res.json(); setUsername(data.user.username); }
        else { router.push('/login'); }
      } catch (err) { console.error('Auth check failed', err); router.push('/login'); }
    };
    fetchUser();
  }, [router]);

  const handleProfileClick = () => router.push('/dashboard/profile');
  const handleLogout = async () => { try { await fetch('http://localhost:8080/api/logout', { method: 'POST', credentials: 'include' }); router.push('/login'); } catch (error) { console.error('Logout failed:', error); } };

  const sidebarIcons = [
    { icon: <FiGrid />, label: 'Dashboard', onClick: () => router.push('/dashboard') },
    { icon: <FiTag />, label: 'Ticket Charts', onClick: () => router.push('/dashboard/ticket-charts') },
    { icon: <FiUsers />, label: 'Team Charts', onClick: () => router.push('/dashboard/team-charts') },
    { icon: <FiAlertCircle />, label: 'Alerts' }, { icon: <FiClock />, label: 'History' },
    { icon: <FiServer />, label: 'Servers' }, { icon: <FiSettings />, label: 'Settings' },
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
      borderWidth: 0,
      hoverBackgroundColor: ['#2ecc71', '#e74c3c'],
      hoverBorderColor: ['#27ae60', '#c0392b'],
      barThickness: 75,
    }],
  };

  const customChartOptions = {
    responsive: true, maintainAspectRatio: false,
    layout: { padding: { top: 10, bottom: 20, left: 20, right: 20 } },
    scales: {
      x: { grid: { display: false, }, ticks: { color: '#FFFFFF', font: { size: 14, weight: 'bold' as const }, padding: 10, } },
      y: { grace: '15%', grid: { color: '#302552', borderColor: '#3a2d63', borderWidth: 1, drawTicks: false, }, ticks: { color: '#FFFFFF', font: { size: 14, weight: 'bold' as const }, beginAtZero: true, padding: 10, stepSize: 5, }, }
    },
    plugins: {
      legend: { position: 'top' as const, align: 'center' as const, labels: { color: '#FFFFFF', font: { size: 14, weight: 'bold' as const }, boxWidth: 18, padding: 15, usePointStyle: false, }, },
      tooltip: { backgroundColor: 'rgba(0, 0, 0, 0.8)', titleColor: '#FFFFFF', bodyColor: '#FFFFFF', borderColor: '#635bff', borderWidth: 1, padding: 12, displayColors: false, callbacks: { label: (tooltipItem: any) => `${tooltipItem.dataset.label}: ${tooltipItem.raw}`, title: (tooltipItems: any[]) => tooltipItems.length > 0 ? tooltipItems[0].label : '' } },
      datalabels: { display: true, color: 'white', anchor: 'end' as const, align: 'top' as const, offset: 8, font: { weight: 'bold' as const, size: 14, }, formatter: (value: number) => value > 0 ? value.toString() : '', }
    }
  };

  const slaDoughnutData = {
    labels: ['Within SLA', 'Outside SLA'],
    datasets: [{
      data: slaComplianceData.length > 0 && slaComplianceData[0].total_tickets > 0
        ? [parseInt(slaComplianceData[0].within_sla), slaComplianceData[0].total_tickets - parseInt(slaComplianceData[0].within_sla)]
        : [0, 0], // Provide default empty data
      backgroundColor: ['#24d16d', '#c0392b'], hoverOffset: 6,
    }],
  };

  const slaDoughnutOptions = {
    maintainAspectRatio: false, responsive: true,
    plugins: {
      legend: { position: 'bottom' as const, labels: { color: '#fff', font: { size: 14 } } },
      tooltip: { bodyColor: 'white', titleColor: 'white' },
      datalabels: { display: true, color: 'white', font: { weight: 'bold' as const, size: 12, }, formatter: (value: number, context: any) => { if (value === 0 && context.chart.data.datasets[0].data.every((v: number) => v === 0)) return ''; if (value === 0) return '0'; const total = context.chart.data.datasets[0].data.reduce((a: number, b: number) => a + b, 0); const percentage = total > 0 ? ((value / total) * 100).toFixed(0) + '%' : '0%'; return `${value}\n(${percentage})`; }, }
    }
  };

  const statusLabels = ticketsByStatus.map(item => item.status);
  const statusCounts = ticketsByStatus.map(item => item.ticket_count);
  const ticketsByStatusChartData = {
    labels: statusLabels,
    datasets: [{ label: 'Ticket Volume by Status', data: statusCounts, backgroundColor: ['#FF6384', '#36A2EB', '#f0b629', '#4BC0C0', '#9966FF', '#FF9F40'], borderWidth: 1, }],
  };
  const ticketsByStatusChartOptions = {
    responsive: true, layout: { padding: { top: 0, bottom: 0, left: 0, right: 0 } }, // Adjusted padding
    plugins: {
      legend: { position: 'right' as const, labels: { color: 'white' } },
      tooltip: { bodyColor: 'white', titleColor: 'white' },
      datalabels: { display: true, color: 'white', font: { weight: 'bold' as const, size: 12, }, formatter: (value: number, context: any) => { if (value === 0 && context.chart.data.datasets[0].data.every((v: number) => v === 0)) return ''; if (value === 0) return '0'; const total = context.chart.data.datasets[0].data.reduce((a: number, b: number) => a + b, 0); const percentage = total > 0 ? ((value / total) * 100).toFixed(0) + '%' : '0%'; return `${value}\n(${percentage})`; }, anchor: 'center' as const, align: 'center' as const, }
    }
  };

  const avgResTimeDoughnutData = {
    datasets: [{
      data: [
        Math.min(avgResTimeInMinutes, MAX_RESOLUTION_TIME_MINUTES),
        Math.max(0, MAX_RESOLUTION_TIME_MINUTES - avgResTimeInMinutes)
      ],
      backgroundColor: [
        avgResTimeInMinutes > MAX_RESOLUTION_TIME_MINUTES * 0.8 
          ? '#f39c12' // Warning color (Orange)
          : (avgResTimeInMinutes > MAX_RESOLUTION_TIME_MINUTES ? '#e74c3c' : '#635bff'), // Critical (Red) or Good (Purple)
        '#302552', // Background color for the "empty" part
      ],
      borderColor: [
        avgResTimeInMinutes > MAX_RESOLUTION_TIME_MINUTES * 0.8 
          ? '#c0392b' // Darker warning/critical
          : (avgResTimeInMinutes > MAX_RESOLUTION_TIME_MINUTES ? '#c0392b' : '#4e49c4'),
        '#2a274f',
      ],
      borderWidth: 1, circumference: 270, rotation: -135, cutout: '70%',
    }],
  };
  const avgResTimeDoughnutOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false, }, tooltip: { enabled: false, }, datalabels: { display: false, } },
    animation: { animateRotate: true, animateScale: false, },
  };

  const openDrillDownModal = async (title: string, ticketsToFetchCriteria: any) => {
    setDrillDownTitle(title); setIsDrillDownModalOpen(true); setDrillDownTickets([]); setIsDrillDownLoading(true);
    try { const tickets = await fetchDrillDownData(ticketsToFetchCriteria); setDrillDownTickets(tickets); }
    catch (error) { console.error("Failed to fetch drill down data", error); setDrillDownTickets([]); }
    finally { setIsDrillDownLoading(false); }
  };
  const closeDrillDownModal = () => { setIsDrillDownModalOpen(false); setDrillDownTitle(''); setDrillDownTickets([]); setIsDrillDownLoading(false); };

  const handleChartClick = (event: React.MouseEvent<HTMLCanvasElement>, chartRef: React.RefObject<ChartJS | null>, chartType: 'ticketsResolved' | 'slaCompliance' | 'volumeByStatus') => {
    if (!chartRef.current) return;
    const chartInstance = chartRef.current as ChartJS; // Type assertion
    const elements = getElementAtEvent(chartInstance, event);

    if (elements.length > 0) {
      const { datasetIndex, index } = elements[0];
      let label: string = '';
      let value: number = 0; // Or string, depending on data
      let title: string = 'Default Modal Title'; // Fallback title
      let fetchCriteria: any = {};

      if (chartType === 'ticketsResolved') {
        // Ensure data is available for barData
        if (barData.labels && barData.labels[index] && barData.datasets[datasetIndex]?.data[index] !== undefined) {
          label = barData.labels[index];
          value = barData.datasets[datasetIndex].data[index] as number; // Assuming data is number[]
          title = `Tickets: ${label} (${value})`;
        } else {
          console.error("Data missing for ticketsResolved chart click");
          title = "Tickets Resolved: Error"; // More informative error title
        }
        fetchCriteria = { 
          type: 'resolvedStatus', 
          status: label, // This will be "Resolved" or "Unresolved"
          ...getGlobalFiltersForDrilldown() 
        };
      } else if (chartType === 'slaCompliance') {
        // Ensure data for slaDoughnutData
        if (slaDoughnutData.labels && slaDoughnutData.labels[index] && slaDoughnutData.datasets[datasetIndex]?.data[index] !== undefined) {
          label = slaDoughnutData.labels[index];
          value = slaDoughnutData.datasets[datasetIndex].data[index] as number; // Assuming data is number[]
          title = `SLA Compliance: ${label} (${value} tickets)`;
        } else {
          console.error("Data missing for slaCompliance chart click");
          title = "SLA Compliance: Error";
        }
        fetchCriteria = { type: 'slaStatus', sla: label, ...getGlobalFiltersForDrilldown() };
      } else if (chartType === 'volumeByStatus') {
        // Ensure data for ticketsByStatusChartData
        if (ticketsByStatusChartData.labels && ticketsByStatusChartData.labels[index] && ticketsByStatusChartData.datasets[datasetIndex]?.data[index] !== undefined) {
          label = ticketsByStatusChartData.labels[index] as string;
          value = ticketsByStatusChartData.datasets[datasetIndex].data[index] as number;
          title = `Volume by Status: ${label} (${value} tickets)`;
        } else {
          console.error("Data missing for volumeByStatus chart click");
          title = "Volume by Status: Error";
        }
        fetchCriteria = { type: 'ticketStatus', status: label, ...getGlobalFiltersForDrilldown() };
      }

      console.log("[handleChartClick] Attempting to open modal with title:", title, "and criteria:", fetchCriteria); 
      // Only open modal if a meaningful title was generated (not default or error)
      if (title && title !== 'Default Modal Title' && !title.includes("Error")) { 
          openDrillDownModal(title, fetchCriteria);
      } else {
          console.error("[handleChartClick] Meaningful title not generated or error in data, not opening modal or using fallback.");
          // Optionally, provide user feedback here if appropriate
      }
    }
  };

  const getGlobalFiltersForDrilldown = () => ({ startDate: filterStartDate, endDate: filterEndDate, priority: filterPriority === 'All' ? undefined : filterPriority, });

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
              <TableActions onClick={toggleFilterPopup}><FiFilter /></TableActions>
              {showFilterPopup && (
                <NewFilterPopup $isClosing={isClosingPopup} onClick={(e) => e.stopPropagation()}>
                  <h4>Filter Options</h4>
                  <label className={tempFilterStartDate ? 'active' : ''}>Start Date:
                    <input type="date" value={tempFilterStartDate} onChange={(e) => setTempFilterStartDate(e.target.value)} max={tempFilterEndDate || new Date().toISOString().split('T')[0]} />
                  </label>
                  <label className={tempFilterEndDate ? 'active' : ''}>End Date:
                    <input type="date" value={tempFilterEndDate} onChange={(e) => setTempFilterEndDate(e.target.value)} min={tempFilterStartDate} max={new Date().toISOString().split('T')[0]} />
                  </label>
                  <label className={tempFilterPriority && tempFilterPriority !== 'All' ? 'active' : ''}>Priority:
                    <select value={tempFilterPriority} onChange={(e) => setTempFilterPriority(e.target.value)}>
                      {priorityOptions.map((priority) => (<option key={priority} value={priority}>{priority}</option>))}
                    </select>
                  </label>
                  <FilterPopupActions>
                    <ClearFilterButton onClick={handleClearPopupAndApplyFilters}>Clear All</ClearFilterButton>
                    <ApplyFilterButton onClick={handleApplyPopupFilters}>Apply</ApplyFilterButton>
                  </FilterPopupActions>
                </NewFilterPopup>
              )}
            </FilterWrapper>
          </FilterControls>
        </ControlsBar>

        <ChartSection>
          <Card>
            <CardTitle><FiClock /> Avg. Resolution Time</CardTitle>
            <AvgResTimeCardContent>
              {loading && !averageResolutionTime ? (
                <AvgResTimeText>Loading...</AvgResTimeText>
              ) : (
                <>
                  <AvgResTimeDoughnutWrapper>
                    <Doughnut data={avgResTimeDoughnutData} options={avgResTimeDoughnutOptions} />
                  </AvgResTimeDoughnutWrapper>
                  <AvgResTimeText>{averageResolutionTime || 'N/A'}</AvgResTimeText>
                </>
              )}
            </AvgResTimeCardContent>
          </Card>
          <Card>
            <CardTitle><FiAlertCircle /> Volume by Status</CardTitle>
            {loading && ticketsByStatus.length === 0 ? (<NoDataMessage>Loading chart...</NoDataMessage>)
              : ticketsByStatus.length > 0 && ticketsByStatus.some(s => s.ticket_count > 0) ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', height: '100%' }}> 
                  <div style={{ width: '350px', height: '350px' }}> 
                    <Doughnut ref={ticketsByStatusChartRef} data={ticketsByStatusChartData} options={ticketsByStatusChartOptions} onClick={(event) => handleChartClick(event, ticketsByStatusChartRef, 'volumeByStatus')} />
                  </div>
                </div>
              ) : (<NoDataMessage>No data for Volume by Status.</NoDataMessage>)}
          </Card>
        </ChartSection>

        <ChartSection>
          <Card>
            <CardTitle><FiBarChart2 /> Tickets Resolved</CardTitle>
            {loading && resolvedTickets.length === 0 ? (<NoDataMessage>Loading chart...</NoDataMessage>)
              : resolvedTickets.length > 0 && (parseInt(resolvedTickets[0]?.resolved_count || '0') > 0 || parseInt(resolvedTickets[0]?.unresolved_count || '0') > 0) ? (
                <Bar ref={ticketsResolvedChartRef} data={barData} options={customChartOptions} onClick={(event) => handleChartClick(event, ticketsResolvedChartRef, 'ticketsResolved')} />
              ) : (<NoDataMessage>No data for Tickets Resolved.</NoDataMessage>)}
          </Card>
          <Card>
            <CardTitle><FiUserCheck /> SLA Compliance</CardTitle>
            {loading && slaComplianceData.length === 0 ? (<NoDataMessage>Loading SLA data...</NoDataMessage>)
              : slaComplianceData.length > 0 && slaComplianceData[0].total_tickets > 0 ? (
                <>
                  <StyledDoughnutWrapper>
                    <Doughnut ref={slaComplianceChartRef} data={slaDoughnutData} options={slaDoughnutOptions} onClick={(event) => handleChartClick(event, slaComplianceChartRef, 'slaCompliance')} />
                  </StyledDoughnutWrapper>
                  <StyledParagraph2>{slaComplianceData[0].sla_percent}% Compliance</StyledParagraph2>
                </>
              ) : (<NoDataMessage>No SLA data available.</NoDataMessage>)}
          </Card>
        </ChartSection>
      </Content>

      {isDrillDownModalOpen && (
        <DrillDownModalOverlay onClick={closeDrillDownModal}>
          <DrillDownModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>{drillDownTitle}</ModalTitle>
                <ModalHeaderActions> 
                  {drillDownTickets.length > 0 && !isDrillDownLoading && (
                    <ExportButton onClick={handleDrillDownExport}>
                      <FiDownload />
                      Export
                    </ExportButton>
                  )}
                <CloseModalButton onClick={closeDrillDownModal}><FiX size={24} /></CloseModalButton>
              </ModalHeaderActions>
            </ModalHeader>
            <TableContainer>
              {isDrillDownLoading ? (<NoDataMessageModal>Loading tickets...</NoDataMessageModal>)
                : drillDownTickets.length > 0 ? (
                  <StyledTable>
                    <thead><tr><th>Ticket ID</th><th>Description</th><th>Status</th><th>Priority</th><th>Created</th><th>Updated</th><th>Submitted By</th><th>Assigned To</th><th>Closed</th><th>Resolved</th><th>SLA (Hrs)</th><th>Deadline</th><th>Within SLA</th></tr></thead>
                    <tbody>
                      {drillDownTickets.map((ticket) => (
                        <tr key={ticket.id}>
                          <td>{`${ticket.id}`}</td><td>{ticket.description}</td><td>{ticket.status}</td><td><PriorityPill priority={ticket.priority}>{ticket.priority}</PriorityPill></td><td>{ticket.createdAt}</td><td>{ticket.updatedAt}</td><td>{ticket.submittedBy}</td><td>{ticket.assignedTo}</td><td>{ticket.closeDate || 'N/A'}</td><td>{ticket.resolveDate || 'N/A'}</td><td>{ticket.slaHours}</td><td>{ticket.deadline}</td><td><WithinSLAPill $within={ticket.withinSla && ticket.withinSla.toLowerCase() === 'yes'}>{ticket.withinSla}</WithinSLAPill></td>
                        </tr>
                      ))}
                    </tbody>
                  </StyledTable>
                ) : (<NoDataMessageModal>No ticket data available for this selection.</NoDataMessageModal>)}
            </TableContainer>
          </DrillDownModalContent>
        </DrillDownModalOverlay>
      )}
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

const AvgResTimeCardContent = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  flex-grow: 1; 
  padding-top: 10px; 
`;

const AvgResTimeDoughnutWrapper = styled.div`
  width: 220px; 
  height: 220px; 
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  opacity: 0.6; 
`;

const AvgResTimeText = styled.p`
  font-size: 2.8em; 
  font-weight: bold;
  color: #fff;
  text-shadow: 0 0 10px rgba(99, 91, 255, 0.6), 0 0 20px rgba(99, 91, 255, 0.3); 
  margin: 0;
  z-index: 1; 
  position: relative; 
  line-height: 1; 
`;

const WithinSLAPill = styled.span<{ $within: boolean }>`
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 11.5px;
  font-weight: 600;
  color: white;
  display: inline-flex; 
  align-items: center;    
  justify-content: center; 
  text-align: center;  
  line-height: 1.3;
  min-width: 50px;
  text-align: center;
  background-color: ${({ $within }) => ($within ? '#4cd137' : '#c23616')};
`;

const ModalHeader = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 18px;
  padding-bottom: 18px;
  border-bottom: 1px solid #2c2a58; 
  flex-shrink: 0; 
`;

const ModalTitle = styled.h2`
  color: #dad7f7; 
  font-size: 20px;
  font-weight: 600; 
  font-family: 'Orbitron', sans-serif; 
  margin: 0;
  letter-spacing: 0.5px;
`;

const CloseModalButton = styled.button`
  background: transparent;
  border: none;
  color: #8a82ff; 
  cursor: pointer;
  font-size: 26px; 
  padding: 5px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease-in-out;

  &:hover {
    color: #fff;
    background-color: rgba(138, 130, 255, 0.15); 
    transform: scale(1.1) rotate(90deg);
  }
`;

const NoDataMessageModal = styled.p`
  text-align: center;
  font-style: normal; /
  color: #8882a7; 
  font-size: 16px; 
  padding: 60px 25px;
  width: 100%;
  font-family: 'Inter', sans-serif;
  letter-spacing: 0.3px;
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

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const DrillDownModalContent = styled.div`
  background-color: #100e27; 
  padding: 20px 28px;
  border-radius: 12px; 
  box-shadow: 0 15px 45px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(75, 66, 153, 0.2); /* Softer shadow, subtle border */
  width: 90%; 
  max-width: 1600px; 
  height: 85vh; 
  max-height: 700px; 
  display: flex;
  flex-direction: column;
  animation: ${slideDownFadeIn} 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
  border: 1px solid #2a274f; 
`;

const TableContainer = styled.div`
  overflow: auto; 
  flex-grow: 1; 
  border: 1px solid #2c2a58;
  border-radius: 8px;
  margin-bottom: 15px;

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

const DrillDownModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  backdrop-filter: blur(1px); 
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 20px;
  animation: ${fadeIn} 0.3s ease-out forwards;
`;

const PriorityPill = styled.span<{ priority: string }>`
  padding: 5px 0; 
  border-radius: 15px;
  font-size: 12px;
  font-weight: bold;
  color: white; 
  text-transform: capitalize;
  
  display: inline-flex; 
  align-items: center;    
  justify-content: center; 
  text-align: center;      

  width: 4.4rem;          
  height: auto;            
  line-height: 1.3;        
  box-sizing: border-box;  

  background-color: ${({ priority }) => {
    const p = priority ? priority.toLowerCase() : 'unknown'; 
    switch (p) {
      case 'critical':
        return '#650213'; 
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

  /* Conditional text color for medium priority for better contrast against #f5a623 */
  ${({ priority }) => 
    priority && priority.toLowerCase() === 'medium' ? 'color: #fff;' : 'color: #fff;'
  }
`;

const StyledTable = styled.table`
  width: 100%;
  border-collapse: collapse; 
  color: #c0bcdf; 
  font-size: 13.5px; 
  font-family: 'Inter', sans-serif; 
  
  th, td {
    padding: 14px 18px; 
    text-align: left;
    border-bottom: 1px solid #2c2a58; 
    white-space: nowrap;
    vertical-align: middle; 
  }

  th {
    background-color: #1c1a3a; 
    color: #a09cc9; 
    font-weight: 600; 
    font-size: 13px;
    text-transform: uppercase; 
    letter-spacing: 0.5px;
    position: sticky;
    top: 0;
    z-index: 1;
    border-bottom-width: 2px;
    border-bottom-color: #39356b;
  }

  tbody tr {
    transition: background-color 0.15s ease-in-out;
    &:last-child td {
      border-bottom: none;
    }
    &:hover {
      background-color: #1f1d3e; 
    }
  }

  td {
    color: #d0cce7;
  }

  td:nth-child(1) { 
    font-weight: 500;
    color: #e8e7ef;
  }
  td:nth-child(2) { 
    white-space: normal; 
    word-break: break-word;
    min-width: 250px; 
    max-width: 400px;
    line-height: 1.4;
  }
  td:last-child { 
    white-space: normal;
    word-break: break-word;
    min-width: 150px;
    max-width: 300px;
    line-height: 1.4;
    font-style: italic;
    color: #a09cc9;
  }
`;

const ExportButton = styled.button`
  background-color: transparent; /* Make it look more like an icon button */
  color: #8a82ff; /* Match close button's initial color */
  border: 1px solid #4b4299; /* Subtle border like other icon buttons */
  padding: 8px 12px; /* Adjust padding */
  border-radius: 8px; /* Match other buttons if desired, or keep pill shape */
  font-size: 13px; /* Smaller font for header action */
  font-weight: 500;
  font-family: 'Inter', 'Orbitron', sans-serif;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px; /* Smaller gap */
  transition: all 0.25s ease-in-out;

  &:hover {
    background-color: rgba(138, 130, 255, 0.1);
    color: #fff; /* Brighter on hover */
    border-color: #635bff;
    /* box-shadow: 0 2px 8px rgba(99, 91, 255, 0.2); */ /* Optional shadow */
  }

  &:active {
    background-color: rgba(138, 130, 255, 0.2);
  }

  svg {
    font-size: 1.1em; /* Slightly smaller icon */
  }
`;

const ModalHeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 12px; // Space between Export and Close buttons
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
  z-index: 10; /* Ensure sidebar is above background but below modal */
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
  justify-content: center; /* Center the icon */
  color: white; /* Icon color */
  border: none; /* Remove default border */
  cursor: pointer;
  transition: 0.3s ease;
  /* position: relative; */ /* Removed as it might not be needed */
  /* overflow: hidden; */ /* Removed as it might not be needed */
  /* margin-right: 2.4rem; */ /* Adjusted margin if needed or remove */

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

  option {
    background-color: #1a1839;  
    color: #e0e0e0;   
    /* border-radius: 30px;  */ /* Options usually don't support border-radius well */
    padding: 10px 15px; /* Adjusted padding */
  }

  option:hover { /* Standard select option hover is browser-dependent */
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
  margin-right: 8px; /* Add some space before the filter icon */
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
  /* margin-right: 0.5rem; */ /* Removed, gap in AppliedFilters handles spacing */

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
  position: relative; /* For z-indexing context if needed */
  z-index: 1; /* Ensure content is above ::before pseudo-element */
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
  /* gap: 20px; */ /* Gap is handled by Card margin now */
  animation: ${fadeIn} 0.6s ease forwards;
  width: 100%; /* Ensure it takes full width to align cards properly */
`;

const Card = styled.div`
  background-color: rgba(19, 18, 48, 0.85);
  border-radius: 20px;
  padding: 15px;  
  padding-bottom: 2rem;  
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  margin-left: 1rem; /* Adjusted from 2.5rem */
  margin-right: 1rem; /* Added for spacing between cards */
  margin-bottom: 1.5rem;
  /* max-width: 90%; */ /* Removed to allow grid to manage width */
  height: 400px; /* Fixed height for cards */
  /* width: 90%; */ /* Removed */   
  overflow: hidden; /* Keep this if content might overflow */
  box-sizing: border-box; /* Important for consistent padding/border behavior */

  &:last-child {
     margin-right: 1rem; /* Ensure right margin for the last card in a row */
  }
`;

const CardTitle = styled.h3`
  font-size: 20px;
  margin-top: 10px;
  margin-bottom: 15px; /* Added space below title */
  display: flex;
  align-items: center;
  gap: 10px;
  color: #fff;
`;

const StyledDoughnutWrapper = styled.div`
  position: relative;
  width: 100%;
  max-width: 280px; /* Adjusted for better fit */
  height: 280px; /* Adjusted for better fit */
  margin: 0 auto;
  /* border-radius: 10px; */ /* Not necessary for wrapper */
  /* padding: 10px; */ /* Not necessary for wrapper */
  display: flex; /* For centering chart if smaller */
  align-items: center; /* For centering chart if smaller */
  justify-content: center; /* For centering chart if smaller */
`;

const NoDataMessage = styled.p`
  text-align: center;
  font-style: italic;
  color: #aaa;
  font-size: 16px;
  margin: auto; /* Center it vertically and horizontally in flex container */
  padding: 20px;
`;

const StyledParagraph2 = styled.p`
  margin-top: 1rem;
  text-align: center;
  font-size: 18px;
  font-weight: bold;
  color: #fff;
`;

const StyledParagraph = styled.p`
  font-size: 24px; /* Adjusted size */
  /* margin-top: 8rem; */ /* Removed fixed margin */
  /* margin-left: 35%; */ /* Removed fixed margin */
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin: auto; /* Center it in the card */
  
  color: #fff;
  text-shadow: 0 0 5px rgba(115, 18, 153, 0.6), 0 0 10px rgba(255, 255, 255, 0.4), 0 0 15px rgba(255, 255, 255, 0.2);
  
  background: linear-gradient(45deg,rgb(167, 130, 226),rgb(128, 60, 218));
  padding: 15px 25px; /* Adjusted padding */
  border-radius: 100px;
  /* width: 13rem; */ /* Removed fixed width, let content define it */
  min-width: 150px; /* Ensure a minimum width */
  
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
  margin-left: 1rem; /* Adjusted from 2.5rem */
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 6px;
  /* width: 7%; */ /* Removed fixed percentage width */
  min-width: 120px; /* Set a min-width */
  margin-bottom: 1rem;
  /* transition: background-color 0.2s ease, box-shadow 0.2s ease; */ /* Already in all */

  &:hover:not(:disabled) {
    background-color: #4e46d4;
    box-shadow: 0 0 8px rgba(99, 91, 255, 0.6),
                0 0 15px rgba(99, 91, 255, 0.4),
                0 0 25px rgba(99, 91, 255, 0.2);
  }
  &:disabled {
    background-color: #2a274f;
    color: #555;
    cursor: not-allowed;
  }
`;
const FilterControls = styled.div`
  display: flex;
  /* justify-content: flex-end; */ /* Let AppliedFilters grow */
  align-items: center; /* Vertically align items */
  /* margin-bottom: 15px; */ /* Handled by ControlsBar */
  position: relative;
  flex-grow: 1; /* Allow FilterControls to take space */
  justify-content: flex-end; /* Push content (tags and icon) to the right */
`;
