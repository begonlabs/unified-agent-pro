import { useState, useMemo, useCallback } from 'react';
import { SupportTicket, AdvancedFilters, FilterPreset } from '../types';

const DEFAULT_FILTERS: AdvancedFilters = {
    status: [],
    priority: [],
    assigned: 'all',
    dateRange: {},
    search: '',
    tags: []
};

export const useAdvancedFilters = (tickets: SupportTicket[], currentUserId?: string) => {
    const [filters, setFilters] = useState<AdvancedFilters>(DEFAULT_FILTERS);
    const [activePreset, setActivePreset] = useState<string | undefined>();

    const applyPreset = useCallback((preset: FilterPreset) => {
        const newFilters = { ...DEFAULT_FILTERS, ...preset.filters };

        // Handle 'me' assignment
        if (newFilters.assigned === 'me' && currentUserId) {
            // This will be handled in the filtering logic
        }

        setFilters(newFilters);
        setActivePreset(preset.id);
    }, [currentUserId]);

    const resetFilters = useCallback(() => {
        setFilters(DEFAULT_FILTERS);
        setActivePreset(undefined);
    }, []);

    const filteredTickets = useMemo(() => {
        return tickets.filter(ticket => {
            // Status filter
            if (filters.status.length > 0 && !filters.status.includes(ticket.status)) {
                return false;
            }

            // Priority filter
            if (filters.priority.length > 0 && !filters.priority.includes(ticket.priority)) {
                return false;
            }

            // Assignment filter
            if (filters.assigned === 'unassigned' && ticket.assigned_to) {
                return false;
            }
            if (filters.assigned === 'me' && ticket.assigned_to !== currentUserId) {
                return false;
            }

            // Date range filter
            if (filters.dateRange.from) {
                const ticketDate = new Date(ticket.created_at);
                if (ticketDate < filters.dateRange.from) {
                    return false;
                }
            }
            if (filters.dateRange.to) {
                const ticketDate = new Date(ticket.created_at);
                if (ticketDate > filters.dateRange.to) {
                    return false;
                }
            }

            // Search filter
            if (filters.search) {
                const searchLower = filters.search.toLowerCase();
                const matchesSubject = ticket.subject.toLowerCase().includes(searchLower);
                const matchesCompany = ticket.user_profile?.company_name.toLowerCase().includes(searchLower);
                const matchesEmail = ticket.user_profile?.email.toLowerCase().includes(searchLower);

                if (!matchesSubject && !matchesCompany && !matchesEmail) {
                    return false;
                }
            }

            // Tags filter
            if (filters.tags.length > 0) {
                const ticketTags = ticket.tags || [];
                const hasMatchingTag = filters.tags.some(tag => ticketTags.includes(tag));
                if (!hasMatchingTag) {
                    return false;
                }
            }

            return true;
        });
    }, [tickets, filters, currentUserId]);

    return {
        filters,
        setFilters,
        filteredTickets,
        applyPreset,
        resetFilters,
        activePreset
    };
};
