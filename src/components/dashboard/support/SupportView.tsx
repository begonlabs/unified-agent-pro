import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { SupportViewProps, SupportTicket } from './types';
import { useSupportTickets, useSupportMessages, useSupportForm, useSupportChat } from './hooks';
import { SupportService } from './services/supportService';
import {
  SupportHeader,
  TicketForm,
  TicketList,
  ChatView
} from './components';

const SupportView: React.FC<SupportViewProps> = ({ user: propUser }) => {
  // Get user from auth if not provided as prop
  const { user: authUser } = useAuth();
  const user = propUser || authUser;

  // State for selected ticket
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);

  // Hooks
  const { tickets, setTickets, loading: loadingTickets, fetchTickets } = useSupportTickets(user);
  const { messages, loading: loadingMessages, fetchMessages } = useSupportMessages(user);
  const { formData, loading: formLoading, updateFormData, submitTicket } = useSupportForm(user);
  const { newMessage, sendingMessage, updateMessage, sendMessage } = useSupportChat(user);

  // Get current ticket data
  const currentTicket = selectedTicket ? tickets.find(t => t.id === selectedTicket) : null;

  // Load messages when ticket is selected
  useEffect(() => {
    if (selectedTicket) {
      fetchMessages(selectedTicket);
    }
  }, [selectedTicket, fetchMessages]);

  // Handlers
  const handleTicketSelect = (ticket: SupportTicket) => {
    setSelectedTicket(ticket.id);
  };

  const handleBack = () => {
    setSelectedTicket(null);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitTicket();
    // Refresh tickets after creating new one
    await fetchTickets();
  };

  const handleSendMessage = async () => {
    if (!selectedTicket) return;
    
    await sendMessage(selectedTicket, async () => {
      // Refresh messages and tickets after sending
      await fetchMessages(selectedTicket);
      await fetchTickets();
    });
  };

  // Utility functions
  const getPriorityColor = SupportService.getPriorityColor;
  const getStatusColor = SupportService.getStatusColor;
  const formatDate = SupportService.formatDate;

  // Show chat view if ticket is selected
  if (currentTicket) {
    return (
      <ChatView
        ticket={currentTicket}
        messages={messages}
        newMessage={newMessage}
        loadingMessages={loadingMessages}
        sendingMessage={sendingMessage}
        onBack={handleBack}
        onMessageChange={updateMessage}
        onSendMessage={handleSendMessage}
        getPriorityColor={getPriorityColor}
        getStatusColor={getStatusColor}
        formatDate={formatDate}
      />
    );
  }

  // Show main support view
  return (
    <div className="p-6 max-w-6xl mx-auto min-h-screen">
      <SupportHeader />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Formulario de Contacto */}
        <TicketForm
          formData={formData}
          loading={formLoading}
          onSubmit={handleFormSubmit}
          onFormChange={updateFormData}
        />

        {/* Lista de Tickets */}
        <TicketList
          tickets={tickets}
          loading={loadingTickets}
          onTicketSelect={handleTicketSelect}
          getPriorityColor={getPriorityColor}
          getStatusColor={getStatusColor}
          formatDate={formatDate}
        />
      </div>
    </div>
  );
};

export default SupportView;
