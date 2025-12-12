import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { TicketStatus, TicketPriority } from '../types';

export const useBulkActions = () => {
    const [selectedTickets, setSelectedTickets] = useState<Set<string>>(new Set());
    const { toast } = useToast();

    const toggleTicket = useCallback((ticketId: string) => {
        setSelectedTickets(prev => {
            const newSet = new Set(prev);
            if (newSet.has(ticketId)) {
                newSet.delete(ticketId);
            } else {
                newSet.add(ticketId);
            }
            return newSet;
        });
    }, []);

    const selectAll = useCallback((ticketIds: string[]) => {
        setSelectedTickets(new Set(ticketIds));
    }, []);

    const clearSelection = useCallback(() => {
        setSelectedTickets(new Set());
    }, []);

    const isSelected = useCallback((ticketId: string) => {
        return selectedTickets.has(ticketId);
    }, [selectedTickets]);

    const bulkUpdateStatus = useCallback(async (
        status: TicketStatus,
        updateFn: (ticketIds: string[], status: TicketStatus) => Promise<void>
    ) => {
        if (selectedTickets.size === 0) return;

        try {
            await updateFn(Array.from(selectedTickets), status);
            toast({
                title: "Tickets actualizados",
                description: `${selectedTickets.size} ticket(s) actualizado(s) exitosamente.`,
            });
            clearSelection();
        } catch (error) {
            toast({
                title: "Error",
                description: "No se pudieron actualizar los tickets.",
                variant: "destructive",
            });
        }
    }, [selectedTickets, toast, clearSelection]);

    const bulkUpdatePriority = useCallback(async (
        priority: TicketPriority,
        updateFn: (ticketIds: string[], priority: TicketPriority) => Promise<void>
    ) => {
        if (selectedTickets.size === 0) return;

        try {
            await updateFn(Array.from(selectedTickets), priority);
            toast({
                title: "Prioridad actualizada",
                description: `${selectedTickets.size} ticket(s) actualizado(s) exitosamente.`,
            });
            clearSelection();
        } catch (error) {
            toast({
                title: "Error",
                description: "No se pudo actualizar la prioridad.",
                variant: "destructive",
            });
        }
    }, [selectedTickets, toast, clearSelection]);

    const bulkAssign = useCallback(async (
        adminId: string,
        updateFn: (ticketIds: string[], adminId: string) => Promise<void>
    ) => {
        if (selectedTickets.size === 0) return;

        try {
            await updateFn(Array.from(selectedTickets), adminId);
            toast({
                title: "Tickets asignados",
                description: `${selectedTickets.size} ticket(s) asignado(s) exitosamente.`,
            });
            clearSelection();
        } catch (error) {
            toast({
                title: "Error",
                description: "No se pudieron asignar los tickets.",
                variant: "destructive",
            });
        }
    }, [selectedTickets, toast, clearSelection]);

    return {
        selectedTickets,
        selectedCount: selectedTickets.size,
        toggleTicket,
        selectAll,
        clearSelection,
        isSelected,
        bulkUpdateStatus,
        bulkUpdatePriority,
        bulkAssign
    };
};
