import { useState, useMemo } from 'react';
import { SupportTicket } from '../types';
import { SupportService } from '../services/supportService';

export const useTicketFilters = (tickets: SupportTicket[]) => {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const filteredTickets = useMemo(() => {
    return SupportService.filterTickets(tickets, statusFilter, priorityFilter, searchTerm);
  }, [tickets, statusFilter, priorityFilter, searchTerm]);

  return {
    statusFilter,
    priorityFilter,
    searchTerm,
    filteredTickets,
    setStatusFilter,
    setPriorityFilter,
    setSearchTerm
  };
};
