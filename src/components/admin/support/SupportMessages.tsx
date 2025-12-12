import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useSupportTickets, useSupportMessages, useTicketFilters, useChatState } from './hooks';
import { useAdvancedFilters } from './hooks/useAdvancedFilters';
import { useBulkActions } from './hooks/useBulkActions';
import { TicketSummary } from './components/TicketSummary';
import { TicketTable } from './components/TicketTable';
import { TicketChat } from './components/TicketChat';
import { AdvancedFiltersComponent } from './components/AdvancedFiltersComponent';
import { FilterPresets } from './components/FilterPresets';
import { BulkActionsBar } from './components/BulkActionsBar';
import { SupportTicket, TicketStatus, TicketPriority, SortConfig } from './types';
import { useAdmin } from '@/hooks/useAdmin';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { SupportService } from './services/supportService';

const SupportMessages: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const { isAdmin } = useAdmin(user);
  const currentUserId = user?.id;

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });
  }, []);

  const {
    tickets,
    loading,
    fetchTickets,
    updateTicketStatus,
    updateTicketPriority,
    assignTicket
  } = useSupportTickets();

  const { messages, loading: loadingMessages, fetchMessages, sendMessage } = useSupportMessages();

  // New hooks
  const {
    filters,
    setFilters,
    filteredTickets,
    applyPreset,
    resetFilters,
    activePreset
  } = useAdvancedFilters(tickets, currentUserId);

  const {
    selectedTickets,
    selectedCount,
    toggleTicket,
    selectAll,
    clearSelection,
    bulkUpdateStatus,
    bulkUpdatePriority,
    bulkAssign
  } = useBulkActions();

  const {
    selectedTicket,
    openChat,
    closeChat,
    updateMessages,
    addMessage,
    setLoading: setChatLoading
  } = useChatState();

  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);

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

  // Handle sorting
  const handleSort = (config: SortConfig) => {
    setSortConfig(config);
    // Note: Actual sorting is currently handled by the table or backend
    // For now we'll implement simple client-side sorting in the filtered tickets calculation
    // This logic should ideally move to the useAdvancedFilters hook
    filteredTickets.sort((a, b) => {
      const field = config.field;
      let valA = a[field];
      let valB = b[field];

      if (field === 'user_profile') {
        valA = a.user_profile?.company_name || '';
        valB = b.user_profile?.company_name || '';
      }

      if (valA < valB) return config.direction === 'asc' ? -1 : 1;
      if (valA > valB) return config.direction === 'asc' ? 1 : -1;
      return 0;
    });
  };

  return (
    <div className="space-y-6 relative pb-20">
      {/* Ticket Summary */}
      <TicketSummary tickets={tickets} />

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>Tickets de Soporte</CardTitle>
              <CardDescription>
                Gestiona todos los tickets de soporte de los clientes
              </CardDescription>
            </div>
            <FilterPresets
              onPresetSelect={applyPreset}
              activePreset={activePreset}
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <AdvancedFiltersComponent
            filters={filters}
            onFiltersChange={setFilters}
            onReset={resetFilters}
          />

          <TicketTable
            tickets={filteredTickets}
            loading={loading}
            onTicketSelect={handleTicketSelect}
            onStatusUpdate={handleStatusUpdate}
            onRefresh={fetchTickets}
            // Enhanced props
            selectedTickets={selectedTickets}
            onToggleSelect={toggleTicket}
            onSelectAll={selectAll}
            sortConfig={sortConfig}
            onSort={handleSort}
            onAssignToMe={(ticketId) => user?.id && assignTicket(ticketId, user.id)}
            onPriorityUpdate={updateTicketPriority}
          />
        </CardContent>
      </Card>

      {/* Floating Bulk Actions Bar */}
      <BulkActionsBar
        selectedCount={selectedCount}
        onClearSelection={clearSelection}
        onBulkStatusChange={(status) => bulkUpdateStatus(status, async (ids, s) => {
          await SupportService.bulkUpdateStatus(ids, s);
          await fetchTickets();
        })}
        onBulkPriorityChange={(priority) => bulkUpdatePriority(priority, async (ids, p) => {
          await SupportService.bulkUpdatePriority(ids, p);
          await fetchTickets();
        })}
        onBulkAssign={async () => {
          // For now assign to current user as a quick action, or we could open a modal
          if (currentUserId) {
            bulkAssign(currentUserId, async (ids, adminId) => {
              await SupportService.bulkAssignTickets(ids, adminId);
              await fetchTickets();
            });
          }
        }}
        onBulkClose={() => bulkUpdateStatus('closed', async (ids) => {
          await SupportService.bulkUpdateStatus(ids, 'closed');
          await fetchTickets();
        })}
      />
      {/* 
        Wait, I need to properly implement the bulk/assign callbacks. 
        I'll do:
        onBulkStatusChange={(status) => bulkUpdateStatus(status, async (ids, s) => {
           await SupportService.bulkUpdateStatus(ids, s);
           await fetchTickets();
        })}
        etc.
        
        I need to import SupportService.
      */}

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
