'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useEffect } from 'react';

import styled from 'styled-components';
import {
  FiRefreshCcw,
  FiEdit,
  FiGrid,
  FiTag,
  FiUsers,
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
import EditTicketModal from './components/EditModal';

export type Ticket = {
  ticket_id: string;
  description: string;
  status: string;
  priority: string;
  created_at: Date;
  updated_at: Date;
  submitted_by: string;
  assigned_to?: string;
  close_date?: Date;
  completed_date?: Date;
  sla_hours: number;
  deadline: Date;
  within_sla: boolean;
  related_incidents?: string;
  related_devices?: string;
  notes?: string;
};

// sidebar items array

const DaemonView = () => {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true); // sidebar open/close status
  const [username, setUsername] = useState('');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [currentPage, setCurrentPage] = useState(1);  // Current page index
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedColumn, setSelectedColumn] = useState('');
  const [filterValue, setFilterValue] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [showFilterPopup, setShowFilterPopup] = useState(false);
  const [isClosingPopup, setIsClosingPopup] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<Map<string, string>>(new Map());

  const statusOptions = ['In_Progress', 'Closed', 'Resolved', 'Open'];
  const priorityOptions = ['Low', 'Medium', 'High', 'Critical'];

  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [successPopupVisible, setSuccessPopupVisible] = useState(false);

  const sidebarIcons = [
    { icon: <FiGrid />, label: 'Dashboard', onClick: () => router.push('/dashboard') },
    { icon: <FiTag />, label: 'Ticket Charts', onClick: () => router.push('/dashboard/ticket-charts') },
    { icon: <FiUsers />, label: 'Team Charts', onClick: () => router.push('/dashboard/team-charts') },
    { icon: <FiAlertCircle />, label: 'Alerts' },
    { icon: <FiClock />, label: 'History' },
    { icon: <FiServer />, label: 'Servers' },
    { icon: <FiSettings />, label: 'Settings' },
    { icon: <FiHelpCircle />, label: 'Help' },
  ];

  useEffect(() => {
    setFilterValue('');
    setFilterDate('');
  }, [selectedColumn]);

  const refreshTableWithFilters = async () => {
    const queryParams = new URLSearchParams();

    appliedFilters.forEach((column, filterKey) => {
      const [filterColumn, value] = filterKey.split(': ');
      if (filterColumn && value) {
        queryParams.append(filterColumn.toLowerCase(), value);
      }
    });

    queryParams.append('page', currentPage.toString());
    queryParams.append('limit', pageSize.toString());

    try {
      const res = await fetch(`http://localhost:8080/api/get-tickets?${queryParams.toString()}`);
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Invalid JSON response');
      }

      const data = await res.json();

      if (res.ok) {
        const ticketsWithDates = data.tickets.map((t: any) => ({
          ...t,
          created_at: t.created_at ? new Date(t.created_at) : null,
          updated_at: t.updated_at ? new Date(t.updated_at) : null,
          close_date: t.close_date ? new Date(t.close_date) : null,
          completed_date: t.completed_date ? new Date(t.completed_date) : null,
          deadline: t.deadline ? new Date(t.deadline) : null,
        }));

        setTickets(ticketsWithDates);
        setTotalPages(data.totalPages);
      } else {
        console.error('API error:', data);
      }
    } catch (err) {
      if (err instanceof Error) {
        console.error('Failed to fetch tickets:', err.message);
      } else {
        console.error('Failed to fetch tickets:', err);
      }
    }
  };


  const handleUpdateTicket = async (updatedTicket: Partial<Ticket> & { notes?: string }) => {
    try {
      const res = await fetch('http://localhost:8080/api/update-ticket', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ticket_id: updatedTicket.ticket_id,
          status: updatedTicket.status,
          assigned_to_name: updatedTicket.assigned_to,
          notes: updatedTicket.notes,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error('Update failed:', data.message);
        return;
      }

      await refreshTableWithFilters();

      setSuccessPopupVisible(true);
      setTimeout(() => {
        setSuccessPopupVisible(false);
      }, 3000);

      setShowEditModal(false);
    } catch (err) {
      console.error('Update error:', err);
    }
  };



  const handleApplyFilter = async () => {
    if (selectedColumn && (filterValue || filterDate)) {
      const newKey = `${selectedColumn}: ${filterValue || filterDate}`;

      const updatedFilters = new Map(appliedFilters);
      for (let [key, column] of updatedFilters.entries()) {
        if (column === selectedColumn) {
          updatedFilters.delete(key);
        }
      }
      updatedFilters.set(newKey, selectedColumn);

      setAppliedFilters(updatedFilters);

      const queryParams = new URLSearchParams();
      updatedFilters.forEach((column, filterKey) => {
        const [filterColumn, value] = filterKey.split(': ');
        if (filterColumn && value) {
          queryParams.append(filterColumn.toLowerCase(), value);
        }
      });

      queryParams.append('page', currentPage.toString());
      queryParams.append('limit', pageSize.toString());

      try {
        const res = await fetch(`http://localhost:8080/api/get-tickets?${queryParams.toString()}`);

        const contentType = res.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('Invalid JSON response');
        }

        const data = await res.json();

        if (res.ok) {
          const ticketsWithDates = data.tickets.map((t: any) => ({
            ...t,
            created_at: t.created_at ? new Date(t.created_at) : null,
            updated_at: t.updated_at ? new Date(t.updated_at) : null,
            close_date: t.close_date ? new Date(t.close_date) : null,
            completed_date: t.completed_date ? new Date(t.completed_date) : null,
            deadline: t.deadline ? new Date(t.deadline) : null,
          }));

          setTickets(ticketsWithDates);
          setTotalPages(data.totalPages);
        } else {
          console.error('API error:', data);
        }
      } catch (err) {
        if (err instanceof Error) {
          console.error('Failed to fetch tickets:', err.message);
        } else {
          console.error('Failed to fetch tickets:', err);
        }
      }
    }
  };

  const handleRemoveFilter = async (filterKey: string) => {
    const updatedFilters = new Map(appliedFilters);
    updatedFilters.delete(filterKey);
    setAppliedFilters(updatedFilters);

    const queryParams = new URLSearchParams();

    if (updatedFilters.size > 0) {
      updatedFilters.forEach((column, key) => {
        const [filterColumn, value] = key.split(': ');
        if (filterColumn && value) {
          queryParams.append(filterColumn.toLowerCase(), value);
        }
      });
    }

    queryParams.append('page', currentPage.toString());
    queryParams.append('limit', pageSize.toString());

    try {
      const res = await fetch(`http://localhost:8080/api/get-tickets?${queryParams.toString()}`);

      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Invalid JSON response');
      }

      const data = await res.json();

      if (res.ok) {
        const ticketsWithDates = data.tickets.map((t: any) => ({
          ...t,
          created_at: t.created_at ? new Date(t.created_at) : null,
          updated_at: t.updated_at ? new Date(t.updated_at) : null,
          close_date: t.close_date ? new Date(t.close_date) : null,
          completed_date: t.completed_date ? new Date(t.completed_date) : null,
          deadline: t.deadline ? new Date(t.deadline) : null,
        }));

        setTickets(ticketsWithDates);
        setTotalPages(data.totalPages);
      } else {
        console.error('API error:', data);
      }
    } catch (err) {
      if (err instanceof Error) {
        console.error('Failed to fetch tickets:', err.message);
      } else {
        console.error('Failed to fetch tickets:', err);
      }
    }
  };

  const closePopup = () => {
    setIsClosingPopup(true);
    setTimeout(() => {
      setShowFilterPopup(false);
      setIsClosingPopup(false);
    }, 300);
  };

  useEffect(() => {
    handlePageChange(currentPage);
  }, [currentPage]);

  const handlePageChange = async (page: number) => {
    setCurrentPage(page);

    const queryParams = new URLSearchParams();

    appliedFilters.forEach((column, key) => {
      const [filterColumn, value] = key.split(': ');
      if (filterColumn && value) {
        queryParams.append(filterColumn.toLowerCase(), value);
      }
    });

    queryParams.append('page', page.toString());
    queryParams.append('limit', pageSize.toString());

    try {
      const res = await fetch(`http://localhost:8080/api/get-tickets?${queryParams.toString()}`);
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Invalid JSON response');
      }

      const data = await res.json();

      if (res.ok) {
        const ticketsWithDates = data.tickets.map((t: any) => ({
          ...t,
          created_at: t.created_at ? new Date(t.created_at) : 'N/A',
          updated_at: t.updated_at ? new Date(t.updated_at) : 'N/A',
          close_date: t.close_date ? new Date(t.close_date) : null,
          completed_date: t.completed_date ? new Date(t.completed_date) : null,
          deadline: t.deadline ? new Date(t.deadline) : null,
        }));

        setTickets(ticketsWithDates);
        setTotalPages(data.totalPages);
      } else {
        console.error('API error:', data);
      }
    } catch (err) {
      console.error('Failed to fetch tickets:', err);
    }
  };

  const tableHeaders = [
    'Info',
    'Ticket ID',
    'Description',
    'Status',
    'Priority',
    'Created At',
    'Updated At',
    'Submitted By',
    'Assigned To',
    'Close Date',
    'Resolve Date',
    'SLA (Hours)',
    'Deadline',
    'Within SLA',
    'Related Incidents',
    'Related Devices'
  ];

  const selectColumns = [
    'Status',
    'Priority',
    'Created_At',
    'Submitted_By'
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

  const handleInfoClick = (ticket: Ticket) => {
    if (ticket.status !== 'closed' && ticket.assigned_to === username) {
      setSelectedTicket(ticket);
      setShowEditModal(true);
    } else {
      alert('You can only edit tickets assigned to you.');
    }

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

  return (
    <Container>
      {/* sidebar is conditionally rendered based on sidebarOpen state */}
      <Sidebar $isOpen={sidebarOpen}>
        {sidebarIcons.map(({ icon, label, onClick }, idx) => (
          <SidebarButton key={idx} title={label} onClick={onClick}>
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

        {/* table section */}
        <TableSection>
          <TableHeader>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              <RefreshButton onClick={() => handlePageChange(currentPage)}>
                <FiRefreshCcw size={16} /> Refresh
              </RefreshButton>
              {appliedFilters.size > 0 && (
                <AppliedFilters>
                  {Array.from(appliedFilters.keys()).map((filterKey, idx) => (
                    <FilterTag key={idx}>
                      {filterKey}
                      <FilterTagX onClick={() => handleRemoveFilter(filterKey)} />
                    </FilterTag>
                  ))}
                </AppliedFilters>
              )}
            </div>

            <FilterWrapper>
              <TableActions
                onClick={() => {
                  if (showFilterPopup) {
                    closePopup();
                  } else {
                    setShowFilterPopup(true);
                  }
                }}
              >
                <FiFilter />
              </TableActions>
              {showFilterPopup && (
                <FilterPopup
                  $isClosing={isClosingPopup}
                  onClick={(e) => e.stopPropagation()}
                >
                  <h4>Filter Options</h4>
                  <label className={selectedColumn ? 'active' : ''}>
                    Column:
                    <select
                      value={selectedColumn}
                      onChange={(e) => setSelectedColumn(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <option value="" disabled>Select column</option>
                      {selectColumns.map((header, idx) => (
                        <option key={idx} value={header}>{header}</option>
                      ))}
                    </select>
                  </label>

                  {/* Status filter */}
                  {selectedColumn === 'Status' && (
                    <label className={filterValue ? 'active' : ''}>
                      Status:
                      <select
                        value={filterValue}
                        onChange={(e) => setFilterValue(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <option value="" disabled>Select status</option>
                        {statusOptions.map((status, idx) => (
                          <option key={idx} value={status}>{status}</option>
                        ))}
                      </select>
                    </label>
                  )}

                  {/* Priority filter */}
                  {selectedColumn === 'Priority' && (
                    <label className={filterValue ? 'active' : ''}>
                      Priority:
                      <select
                        value={filterValue}
                        onChange={(e) => setFilterValue(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <option value="" disabled>Select priority</option>
                        {priorityOptions.map((priority, idx) => (
                          <option key={idx} value={priority}>{priority}</option>
                        ))}
                      </select>
                    </label>
                  )}

                  {/* Created At filter */}
                  {selectedColumn === 'Created_At' && (
                    <label className={filterDate ? 'active' : ''}>
                      Created At:
                      <input
                        type="date"
                        value={filterDate || ''}
                        onChange={(e) => setFilterDate(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        max={new Date().toISOString().split('T')[0]}
                      />
                    </label>
                  )}

                  {/* Submitted By filter */}
                  {selectedColumn === 'Submitted_By' && (
                    <label className={filterValue ? 'active' : ''}>
                      Submitted By:
                      <input
                        type="text"
                        placeholder="Enter name"
                        value={filterValue}
                        onChange={(e) => setFilterValue(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </label>
                  )}

                  <button
                    disabled={!selectedColumn || (!filterValue && !filterDate)}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleApplyFilter();
                    }}
                  >
                    Apply
                  </button>
                </FilterPopup>
              )}
            </FilterWrapper>
          </TableHeader>

          <TableContainer>
            <Table>
              <thead>
                <tr>
                  {tableHeaders.map((header, idx) => (
                    <th key={`col-${idx}`}>{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tickets.map((ticket, idx) => (
                  <tr key={`ticket-${idx}`}>
                    <td>
                      {ticket.status !== 'closed' && ticket.assigned_to === username ? (
                        <FiEdit
                          style={{ cursor: 'pointer' }}
                          onClick={() => handleInfoClick(ticket)}
                        />
                      ) : (
                        <FiEdit
                          style={{
                            opacity: 0.3,
                            cursor: 'not-allowed'
                          }}
                          title="Not editable"
                        />
                      )}
                    </td>

                    <td>{ticket.ticket_id || 'No ID'}</td>
                    <td>{ticket.description || 'No Description'}</td>
                    <td>{ticket.status || 'No Status'}</td>
                    <td>
                      {ticket.priority ? (
                        <PriorityBadge level={ticket.priority}>
                          {ticket.priority}
                        </PriorityBadge>
                      ) : (
                        <PriorityBadge level="unknown">Not Set</PriorityBadge>
                      )}
                    </td>
                    <td>{ticket.created_at ? ticket.created_at.toLocaleString() : 'N/A'}</td>
                    <td>{ticket.updated_at ? ticket.updated_at.toLocaleString() : 'N/A'}</td>
                    <td>{ticket.submitted_by || 'Anonymous'}</td>
                    <td>{ticket.assigned_to || 'Unassigned'}</td>
                    <td>{ticket.close_date ? ticket.close_date.toLocaleString() : 'Not Closed'}</td>
                    <td>{ticket.completed_date ? ticket.completed_date.toLocaleString() : 'Incomplete'}</td>
                    <td>{ticket.sla_hours} hrs</td>
                    <td>{ticket.deadline ? ticket.deadline.toLocaleString() : 'No Deadline'}</td>
                    <td>
                      {ticket.within_sla ? (
                        <SLAStatusBadge status="within">Yes</SLAStatusBadge>
                      ) : (
                        <SLAStatusBadge status="expired">No</SLAStatusBadge>
                      )}
                    </td>
                    <td>{ticket.related_incidents || 'No Related Incident'}</td>
                    <td>{ticket.related_devices || 'No Device Name'}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </TableContainer>

          <StyledPagination>
            <PageNavButton
              disabled={currentPage <= 1}
              onClick={() => handlePageChange(currentPage - 1)}
            >
              ←
            </PageNavButton>
            <PageNumberButton
              $active={currentPage === 1}
              onClick={() => handlePageChange(1)}
            >
              1
            </PageNumberButton>
            {currentPage > 3 && <span>...</span>}
            {Array.from({ length: 3 }, (_, i) => currentPage - 1 + i)
              .filter((page) => page > 1 && page < totalPages)
              .map((page) => (
                <PageNumberButton
                  key={page}
                  $active={page === currentPage}
                  onClick={() => handlePageChange(page)}
                >
                  {page}
                </PageNumberButton>
              ))}
            {currentPage < totalPages - 2 && <span>...</span>}
            {totalPages > 1 && (
              <PageNumberButton
                $active={currentPage === totalPages}
                onClick={() => handlePageChange(totalPages)}
              >
                {totalPages}
              </PageNumberButton>
            )}

            <PageNavButton
              disabled={currentPage >= totalPages}
              onClick={() => handlePageChange(currentPage + 1)}
            >
              →
            </PageNavButton>
          </StyledPagination>

        </TableSection>
        {successPopupVisible && (
          <PopupContainer>
            <PopupMessage>Ticket updated successfully!</PopupMessage>
          </PopupContainer>
        )}

        {showEditModal && selectedTicket && (
          <EditTicketModal
            ticket={selectedTicket}
            onClose={() => setShowEditModal(false)}
            onSave={handleUpdateTicket}
          />

        )}
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

const SidebarButton = styled.button.attrs(() => ({
  type: 'button'
}))`
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
  thead th {
    position: sticky;
    top: 0;
    background-color: #1a1839;
    z-index: 5;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
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

const FilterWrapper = styled.div`
  position: relative;
  display: inline-block;
`;

const SelectedFilters = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
`;

const redGlowFilter = keyframes`
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

const FilterTag = styled.div`
  background-color: #635bff;
  color: white;
  padding: 5px 12px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: 'Orbitron', sans-serif;
  font-size: 14px;
  transition: transform 0.2s ease;

  &:hover {
    transform: scale(1.05);
    box-shadow: 0 0 10px #635bff, 0 0 20px #635bff; /* Added hover effect */
  }

  /* Hover effect on "X" button */
  svg {
    cursor: pointer;
    transition: 0.3s ease;
    &:hover {
      color: #ff5b5b;  /* Red color on hover */
      animation: ${redGlowFilter} 0.5s ease-in-out;
      transform: scale(1.2);  /* Grow slightly */
    }
  }
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
`;

const StyledPagination = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 20px;
  gap: 10px;
  flex-wrap: wrap;
`;

const PageNavButton = styled.button`
  background-color: #1a1839;
  color: #fff;
  border: none;
  padding: 10px 14px;
  border-radius: 10px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 14px;

  &:hover:not(:disabled) {
    background-color: #635bff;
    animation: ${glow} 2s ease-in-out infinite;
    transform: scale(1.05);
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

const PageNumberButton = styled(PageNavButton) <{ $active: boolean }>`
  background-color: ${({ $active }) => ($active ? '#635bff' : '#1a1839')};
  box-shadow: ${({ $active }) =>
    $active ? '0 0 10px #635bff, 0 0 20px #635bff' : 'none'};
`;

const AppliedFilters = styled.div`
  display: flex;
  gap: 10px;
  margin-left: auto;
  margin-right: 0.5rem;
  flex-wrap: wrap; /* Allow wrapping for longer filter lists */
  padding: 6px;
  border-radius: 15px;
  align-items: center;
`;

const FilterTagX = styled(FiX)`
  font-size: 17px;
  color: #ffffff;
  transition: color 0.3s ease, transform 0.3s ease;
`;

const SLAStatusBadge = styled.span<{ status: 'within' | 'expired' }>`
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: bold;
  color: white;
  background-color: ${({ status }) => status === 'within' ? '#27ae60' : '#ff4d4d'};
`;

const TableContainer = styled.div`
  flex: 1;
  min-height: 500px;
  max-height: calc(100vh - 250px); 
  overflow: auto;
  width: 100%;
  border-radius: 10px;
  border: 1px solid #2a274f;

  scrollbar-width: thin;
  scrollbar-color: #635bff #1a1839;

  &::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  &::-webkit-scrollbar-track {
    background: #1a1839;
    border-radius: 10px;
  }

  &::-webkit-scrollbar-thumb {
    background-color: #635bff;
    border-radius: 10px;
    border: 2px solid #1a1839;
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

  &:hover {
    background-color: #635bff;
    transform: scale(1.05);
    animation: ${glow} 2s ease-in-out infinite;
  }
`;
const PopupContainer = styled.div`
  position: fixed;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  background: #1c1b3a;
  padding: 20px 30px;
  color: white;
  border-radius: 12px;
  box-shadow: 0 0 20px rgba(99, 91, 255, 0.4);
  z-index: 9999;
  animation: fadeIn 0.3s ease, fadeOut 0.3s ease 2.7s;

  @keyframes fadeIn {
    from { opacity: 0; transform: translateX(-50%) translateY(10px); }
    to { opacity: 1; transform: translateX(-50%) translateY(0); }
  }

  @keyframes fadeOut {
    from { opacity: 1; transform: translateX(-50%) translateY(0); }
    to { opacity: 0; transform: translateX(-50%) translateY(10px); }
  }
`;

const PopupMessage = styled.div`
  font-size: 16px;
  font-weight: bold;
  text-align: center;
`;
