import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    X,
    CheckCircle2,
    UserPlus,
    AlertCircle,
    Tag,
    Trash2
} from 'lucide-react';
import { TicketStatus, TicketPriority } from '../types';

interface BulkActionsBarProps {
    selectedCount: number;
    onClearSelection: () => void;
    onBulkStatusChange: (status: TicketStatus) => void;
    onBulkPriorityChange: (priority: TicketPriority) => void;
    onBulkAssign: () => void;
    onBulkClose: () => void;
}

export const BulkActionsBar: React.FC<BulkActionsBarProps> = ({
    selectedCount,
    onClearSelection,
    onBulkStatusChange,
    onBulkPriorityChange,
    onBulkAssign,
    onBulkClose
}) => {
    if (selectedCount === 0) return null;

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
            <div className="bg-primary text-primary-foreground rounded-lg shadow-lg px-4 py-3 flex items-center gap-4">
                {/* Selection count */}
                <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-white/20">
                        {selectedCount} seleccionado{selectedCount > 1 ? 's' : ''}
                    </Badge>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClearSelection}
                        className="h-8 px-2 hover:bg-white/10"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                <div className="h-6 w-px bg-white/20" />

                {/* Bulk actions */}
                <div className="flex items-center gap-2">
                    {/* Change Status */}
                    <Select onValueChange={(value) => onBulkStatusChange(value as TicketStatus)}>
                        <SelectTrigger className="h-8 w-[160px] bg-white/10 border-white/20 hover:bg-white/20">
                            <SelectValue placeholder="Cambiar estado" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="in_progress">
                                <div className="flex items-center gap-2">
                                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                                    En Progreso
                                </div>
                            </SelectItem>
                            <SelectItem value="waiting_response">
                                <div className="flex items-center gap-2">
                                    <AlertCircle className="h-4 w-4 text-blue-500" />
                                    Esperando Respuesta
                                </div>
                            </SelectItem>
                            <SelectItem value="closed">
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                                    Cerrado
                                </div>
                            </SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Change Priority */}
                    <Select onValueChange={(value) => onBulkPriorityChange(value as TicketPriority)}>
                        <SelectTrigger className="h-8 w-[160px] bg-white/10 border-white/20 hover:bg-white/20">
                            <SelectValue placeholder="Cambiar prioridad" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="urgent">
                                <div className="flex items-center gap-2">
                                    <Tag className="h-4 w-4 text-red-500" />
                                    Urgente
                                </div>
                            </SelectItem>
                            <SelectItem value="high">
                                <div className="flex items-center gap-2">
                                    <Tag className="h-4 w-4 text-orange-500" />
                                    Alta
                                </div>
                            </SelectItem>
                            <SelectItem value="normal">
                                <div className="flex items-center gap-2">
                                    <Tag className="h-4 w-4 text-blue-500" />
                                    Normal
                                </div>
                            </SelectItem>
                            <SelectItem value="low">
                                <div className="flex items-center gap-2">
                                    <Tag className="h-4 w-4 text-gray-500" />
                                    Baja
                                </div>
                            </SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Assign */}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onBulkAssign}
                        className="h-8 hover:bg-white/10"
                    >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Asignar
                    </Button>

                    {/* Close all */}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onBulkClose}
                        className="h-8 hover:bg-white/10"
                    >
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Cerrar Todos
                    </Button>
                </div>
            </div>
        </div>
    );
};
