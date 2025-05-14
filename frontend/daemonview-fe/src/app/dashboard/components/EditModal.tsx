import React, { useState } from 'react';
import styled from 'styled-components';
import { FiX } from 'react-icons/fi';
import { Ticket } from '../page';
import { useEffect } from 'react';

const statusOptions = ['Open', 'In_Progress', 'Resolved', 'Closed'];

interface EditTicketModalProps {
  ticket: Ticket;
  onClose: () => void;
  onSave: (updated: Partial<Ticket>) => void;
}

const EditTicketModal: React.FC<EditTicketModalProps> = ({ ticket, onClose, onSave }) => {
  if (!ticket || !ticket.ticket_id) return null;
  const [status, setStatus] = useState(ticket.status);
  const [assignedTo, setAssignedTo] = useState(ticket.assigned_to || '');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!ticket?.ticket_id) return;
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
  }, [ticket?.ticket_id]);

  const handleSubmit = () => {
    onSave({
      ticket_id: ticket.ticket_id,
      status,
      assigned_to: assignedTo,
      notes
    });
    onClose();
  };

  const statusOrder = ['Open', 'In_Progress', 'Resolved', 'Closed'];
  const normalizedStatus = ticket.status.replace(/ /g, '_');
  const currentStatusIndex = statusOrder.findIndex(s => s.toLowerCase() === normalizedStatus.toLowerCase());
  const allowedStatuses = statusOrder.slice(currentStatusIndex);

  return (
    <Overlay>
      <Modal>
        <Header>
          <h3>Edit Ticket</h3>
          <FiX onClick={onClose} style={{ cursor: 'pointer' }} />
        </Header>
        <Label>
          <Label>
            Status:
            <StyledSelect value={status} onChange={(e) => setStatus(e.target.value)}>
              {allowedStatuses.map((s, idx) => (
                <option key={idx} value={s}>
                  {s}
                </option>
              ))}
            </StyledSelect>
          </Label>

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
          />
        </Label>

        <SaveButton onClick={handleSubmit}>Save Changes</SaveButton>
      </Modal>
    </Overlay>
  );
};

export default EditTicketModal;

// Styled Components
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