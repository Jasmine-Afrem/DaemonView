'use client';

import React from 'react';
import styled from 'styled-components';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { keyframes } from 'styled-components';
import { FiX } from 'react-icons/fi';
import { FiDownload } from 'react-icons/fi';



type Ticket = {
    ticket_id: string;
    description: string;
    status: string;
    priority: string;
    created_at: string;
    updated_at: string;
    submitted_by: string;
    assigned_to: string;
    close_date?: string;
    completed_date?: string;
    sla_hours: number;
    deadline: string;
    within_sla: boolean;
    related_incidents?: string;
    related_devices?: string;
};

type DrillData = {
    team: string;
    category: string;
    tickets?: Ticket[];
};

type Props = {
    data: DrillData;
    onClose: () => void;
};

const TeamDrillModal = ({ data, onClose }: Props) => {

    const handleExport = () => {
        const worksheetData = (data.tickets || []).map(t => ({
            ID: t.ticket_id,
            Description: t.description,
            Status: t.status,
            Priority: t.priority,
            'Created At': new Date(t.created_at).toLocaleString(),
            'Updated At': new Date(t.updated_at).toLocaleString(),
            'Submitted By': t.submitted_by,
            'Assigned To': t.assigned_to,
            'Close Date': t.close_date ? new Date(t.close_date).toLocaleString() : '',
            'Completed Date': t.completed_date ? new Date(t.completed_date).toLocaleString() : '',
            'SLA Hours': t.sla_hours,
            Deadline: new Date(t.deadline).toLocaleString(),
            'Within SLA': t.within_sla ? 'Yes' : 'No',
            Incidents: t.related_incidents || '',
            Devices: t.related_devices || ''
        }));

        const worksheet = XLSX.utils.json_to_sheet(worksheetData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Tickets');

        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const fileName = `${data.team.replace(/\s+/g, '_')}_tickets.xlsx`;

        const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
        saveAs(blob, fileName);
    };


    return (
        <ModalOverlay>
            <ModalContainer>
                <ModalHeaderWithControls>
                    <ModalTitle>
                        {data.team} – {data.category}
                        {data.tickets && ` (${data.tickets.length})`}
                    </ModalTitle>
                    <ActionsGroup>
                        <ExportButton onClick={handleExport}><FiDownload /> Export</ExportButton>
                        <CloseButton onClick={onClose}><FiX /></CloseButton>
                    </ActionsGroup>
                </ModalHeaderWithControls>


                <TableContainer>
                    <StyledTable>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Description</th>
                                <th>Status</th>
                                <th>Priority</th>
                                <th>Created At</th>
                                <th>Updated At</th>
                                <th>Submitted By</th>
                                <th>Assigned To</th>
                                <th>Close Date</th>
                                <th>Completed Date</th>
                                <th>SLA Hours</th>
                                <th>Deadline</th>
                                <th>Within SLA</th>
                                <th>Incidents</th>
                                <th>Devices</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.tickets?.map((t, i) => (
                                <tr key={i}>
                                    <td>{t.ticket_id}</td>
                                    <td>{t.description}</td>
                                    <td>{t.status}</td>
                                    <td><PriorityPill priority={t.priority}>{t.priority}</PriorityPill></td>
                                    <td>{new Date(t.created_at).toLocaleString()}</td>
                                    <td>{new Date(t.updated_at).toLocaleString()}</td>
                                    <td>{t.submitted_by}</td>
                                    <td>{t.assigned_to}</td>
                                    <td>{t.close_date ? new Date(t.close_date).toLocaleString() : '—'}</td>
                                    <td>{t.completed_date ? new Date(t.completed_date).toLocaleString() : '—'}</td>
                                    <td>{t.sla_hours}</td>
                                    <td>{new Date(t.deadline).toLocaleString()}</td>
                                    <td>
                                        <WithinSLAPill $within={t.within_sla}>{t.within_sla ? 'Yes' : 'No'}</WithinSLAPill>
                                    </td>

                                    <td>{t.related_incidents || '—'}</td>
                                    <td>{t.related_devices || '—'}</td>
                                </tr>
                            ))}
                            {data.tickets?.length === 0 && (
                                <tr>
                                    <td colSpan={15} style={{ textAlign: 'center', padding: '2rem', fontStyle: 'italic', color: '#aaa' }}>
                                        No tickets available.
                                    </td>
                                </tr>
                            )}

                        </tbody>
                    </StyledTable>
                </TableContainer>
            </ModalContainer>
        </ModalOverlay>
    );
};

export default TeamDrillModal;
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
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


const ModalOverlay = styled.div`
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


const ModalContainer = styled.div`
  background-color: #100e27; 
  padding: 20px 28px;
  border-radius: 12px; 
  box-shadow: 0 15px 45px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(75, 66, 153, 0.2);
  width: 90%;
  max-width: 1600px;
  height: 85vh;
  max-height: 700px;
  display: flex;
  flex-direction: column;
  animation: ${slideDownFadeIn} 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
  border: 1px solid #2a274f;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  h2 {
    margin: 0;
  }
`;

const CloseButton = styled.button`
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

const StatsSection = styled.div`
  display: flex;
  gap: 40px;
  margin: 20px 0;
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


const StyledTable = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  color: #ccc;
  font-size: 13px;

  th, td {
    padding: 12px 15px;
    text-align: left;
    border-bottom: 1px solid #2a274f;
    white-space: nowrap;
  }
td {
  color: #d0cce7;
  font-family: 'Inter', sans-serif; 
  font-size: 13.5px;
}

  th {
  background-color: #1c1a3a;
  color: #a09cc9;
  font-weight: 600;
  font-size: 13px;
  font-family: 'Inter', sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  position: sticky;
  top: 0;
  z-index: 1;
  border-bottom-width: 2px;
  border-bottom-color: #39356b;
}


  tr:last-child td {
      border-bottom: none;
  }

  tbody tr:hover {
    background-color: #252345;
  }

  td:nth-child(2), /* Description */
  td:last-child    /* Devices */
   {
    white-space: pre-wrap;
    word-break: break-word;
    min-width: 200px;
  }
`;


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

const ExportButton = styled.button`
  background-color: transparent;
  color: #8a82ff;
  border: 1px solid #4b4299;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  font-family: 'Inter', 'Orbitron', sans-serif;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: all 0.25s ease-in-out;

  &:hover {
    background-color: rgba(138, 130, 255, 0.1);
    color: #fff;
    border-color: #635bff;
  }

  &:active {
    background-color: rgba(138, 130, 255, 0.2);
  }

  svg {
    font-size: 1.1em;
  }
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
  background-color: ${({ $within }) => ($within ? '#4cd137' : '#c23616')};
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
  line-height: 1.3;

  background-color: ${({ priority }) => {
        const p = priority ? priority.toLowerCase() : 'unknown';
        switch (p) {
            case 'critical': return '#650213';
            case 'high': return '#ff4d4d';
            case 'medium': return '#f5a623';
            case 'low': return '#27ae60';
            default: return '#555';
        }
    }};
`;

const TopControls = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-bottom: 20px;
`;
const ModalHeaderWithControls = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #2a274f;
`;

const ModalTitle = styled.h2`
  color: #dad7f7;
  font-size: 20px;
  font-weight: 600;
  font-family: 'Orbitron', sans-serif;
  margin: 0;
  letter-spacing: 0.5px;
`;

const ActionsGroup = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
`;
