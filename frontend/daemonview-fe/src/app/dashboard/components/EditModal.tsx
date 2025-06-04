import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FiX } from 'react-icons/fi';
import { Ticket } from '../page';

interface EditTicketModalProps {
  ticket: Ticket;
  onClose: () => void;
  onSave: (updated: Partial<Ticket> & { notes?: string }) => void;
}

const MASTER_STATUS_VALUES = ['Open', 'In_Progress', 'Resolved', 'Closed'];

const getCanonicalStatus = (inputStatus: string): string => {
  if (!inputStatus) return MASTER_STATUS_VALUES[0];
  const normalizedInput = inputStatus.trim().toLowerCase().replace(/ /g, '_');
  const found = MASTER_STATUS_VALUES.find(
    masterValue => masterValue.trim().toLowerCase().replace(/ /g, '_') === normalizedInput
  );
  return found || inputStatus;
};

const EditTicketModal: React.FC<EditTicketModalProps> = ({ ticket, onClose, onSave }) => {
  if (!ticket || !ticket.ticket_id) return null;

  const initialTicketStatus = getCanonicalStatus(ticket.status);

  const getOtherAllowedTransitionStatuses = (currentCanonStatus: string): string[] => {
    let nextStatuses: string[] = [];

    switch (currentCanonStatus) {
      case 'Open':
        nextStatuses = ['In_Progress', 'Resolved', 'Closed'];
        break;
      case 'In_Progress':
        nextStatuses = ['Resolved', 'Closed'];
        break;
      case 'Resolved':
        nextStatuses = ['In_Progress', 'Closed'];
        break;
      default:
        console.warn(`Unknown/default ticket status for transitions: ${currentCanonStatus}. Allowing all others.`);
        nextStatuses = MASTER_STATUS_VALUES.filter(s => s !== currentCanonStatus);
    }
    return nextStatuses;
  };

  const possibleTransitions = getOtherAllowedTransitionStatuses(initialTicketStatus);

  let optionsForDropdown: string[];
  let initialSelectValueForDropdown: string;

  optionsForDropdown = Array.from(new Set([initialTicketStatus, ...possibleTransitions]));
  initialSelectValueForDropdown = initialTicketStatus;


  const [status, setStatus] = useState(initialSelectValueForDropdown);
  const [assignedTo, setAssignedTo] = useState(ticket.assigned_to || '');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const res = await fetch(`http://localhost:8080/api/get-notes/${ticket.ticket_id}`);
        if (!res.ok) throw new Error('Failed to fetch notes');
        const data = await res.json();
        setNotes(data.notes || '');
      } catch (err) {
        console.error('Error fetching notes:', err);
      }
    };
    fetchNotes();
  }, [ticket.ticket_id]);

  const handleSubmit = () => {
    onSave({
      ticket_id: ticket.ticket_id,
      status,
      assigned_to: assignedTo,
      notes
    });
    onClose();
  };

  const getDisplayStatusText = (canonicalValue: string): string => {
    return canonicalValue.replace(/_/g, ' ');
  };

  return (
    <Overlay>
      <Modal>
        <Header>
          <h3>Edit Ticket {ticket.ticket_id}</h3>
          <FiX onClick={onClose} style={{ cursor: 'pointer' }} />
        </Header>
        <Label>
          Status:
          <StyledSelect value={status} onChange={(e) => setStatus(e.target.value)}>
            {optionsForDropdown.map((canonicalOptValue, idx) => (
              <option key={idx} value={canonicalOptValue}>
                {getDisplayStatusText(canonicalOptValue)}
              </option>
            ))}
          </StyledSelect>
        </Label>

        <Label>
          Assigned To:
          <input type="text" value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} />
        </Label>
        <Label>
          Notes:
          <Textarea
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add or update notes..."
          />
        </Label>

        <SaveButton onClick={handleSubmit}>Save Changes</SaveButton>
      </Modal>
    </Overlay>
  );
};

export default EditTicketModal;

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const Modal = styled.div`
  background: #1a1839;
  padding: 24px;
  border-radius: 16px;
  width: 320px;
  color: white;
  box-shadow: 0 0 20px rgba(0,0,0,0.5);
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;

  h3 {
    margin: 0;
  }
`;

const Label = styled.label`
  display: block;
  margin-bottom: 12px;
  font-size: 14px;

  select, input {
    width: 100%;
    padding: 8px;
    border-radius: 8px;
    border: none;
    background: #2a274f;
    color: white;
    margin-top: 4px;
  }
`;

const SaveButton = styled.button`
  width: 100%;
  padding: 10px;
  background: #635bff;
  border: none;
  border-radius: 8px;
  color: white;
  font-weight: bold;
  cursor: pointer;
  margin-top: 12px;

  &:hover {
    background: #4e49c4;
  }
`;

const StyledSelect = styled.select`
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
`;

const Textarea = styled.textarea`
  width: 100%;
  padding: 10px;
  border-radius: 8px;
  border: none;
  background: #2a274f;
  color: white;
  margin-top: 4px;
  resize: vertical;
  font-family: 'Orbitron', sans-serif;
  font-size: 14px;
`;