import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useSupportTickets, useSupportMessages, useTicketFilters, useChatState } from './hooks';
import { TicketSummary } from './components/TicketSummary';
import { TicketFilters } from './components/TicketFilters';
import { TicketTable } from './components/TicketTable';
import { TicketChat } from './components/TicketChat';
import { SupportTicket, TicketStatus } from './types';

const SupportMessages: React.FC = () => {
  const { tickets, loading, fetchTickets, updateTicketStatus } = useSupportTickets();
  const { messages, loading: loadingMessages, fetchMessages, sendMessage } = useSupportMessages();
  const {
    statusFilter,
    priorityFilter,
    searchTerm,
    filteredTickets,
    setStatusFilter,
    setPriorityFilter,
    setSearchTerm
  } = useTicketFilters(tickets);
  
  const {
    selectedTicket,
    openChat,
    closeChat,
    updateMessages,
    addMessage,
    setLoading: setChatLoading
  } = useChatState();

  // Handle ticket selection
  const handleTicketSelect = async (ticket: SupportTicket) => {
    openChat(ticket);
    setChatLoading(true);
    const response = await fetchMessages(ticket.id);
    if (response.success) {
      updateMessages(response.messages);
    }
    setChatLoading(false);
  };

  // Handle sending message
  const handleSendMessage = async (message: string) => {
    if (selectedTicket) {
      const response = await sendMessage(selectedTicket.id, message, selectedTicket);
      if (response.success) {
        addMessage(response.message);
      }
    }
  };

  // Handle status update
  const handleStatusUpdate = async (ticketId: string, status: TicketStatus) => {
    await updateTicketStatus(ticketId, status);
  };

  return (
    <div className="space-y-6">
      {/* Ticket Summary */}
      <TicketSummary tickets={tickets} />

      {/* Filters and Table */}
      <Card>
        <CardHeader>
          <CardTitle>Tickets de Soporte</CardTitle>
          <CardDescription>
            Gestiona todos los tickets de soporte de los clientes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TicketFilters
            statusFilter={statusFilter}
            priorityFilter={priorityFilter}
            searchTerm={searchTerm}
            onStatusFilterChange={setStatusFilter}
            onPriorityFilterChange={setPriorityFilter}
            onSearchChange={setSearchTerm}
            onRefresh={fetchTickets}
          />

          <TicketTable
            tickets={filteredTickets}
            loading={loading}
            onTicketSelect={handleTicketSelect}
            onStatusUpdate={handleStatusUpdate}
            onRefresh={fetchTickets}
          />
        </CardContent>
      </Card>

      {/* Chat Modal */}
      {selectedTicket && (
        <TicketChat
          ticket={selectedTicket}
          messages={messages}
          loading={loadingMessages}
          onClose={closeChat}
          onSendMessage={handleSendMessage}
          onStatusUpdate={(status) => handleStatusUpdate(selectedTicket.id, status)}
        />
      )}
    </div>
  );
};

export default SupportMessages;
