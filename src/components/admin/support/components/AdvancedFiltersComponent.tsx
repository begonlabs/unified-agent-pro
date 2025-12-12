import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Search, X, Calendar as CalendarIcon, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { AdvancedFilters } from '../types';

interface AdvancedFiltersProps {
    filters: AdvancedFilters;
    onFiltersChange: (filters: AdvancedFilters) => void;
    onReset: () => void;
}

const STATUS_OPTIONS = [
    { value: 'open', label: 'Abierto' },
    { value: 'in_progress', label: 'En Progreso' },
    { value: 'waiting_response', label: 'Esperando Respuesta' },
    { value: 'closed', label: 'Cerrado' }
];

const PRIORITY_OPTIONS = [
    { value: 'urgent', label: 'Urgente' },
    { value: 'high', label: 'Alta' },
    { value: 'normal', label: 'Normal' },
    { value: 'low', label: 'Baja' }
];

const ASSIGNMENT_OPTIONS = [
    { value: 'all', label: 'Todos' },
    { value: 'me', label: 'Asignados a mí' },
    { value: 'unassigned', label: 'Sin asignar' }
];

export const AdvancedFiltersComponent: React.FC<AdvancedFiltersProps> = ({
    filters,
    onFiltersChange,
    onReset
}) => {
    const handleStatusToggle = (status: string) => {
        const newStatus = filters.status.includes(status)
            ? filters.status.filter(s => s !== status)
            : [...filters.status, status];
        onFiltersChange({ ...filters, status: newStatus });
    };

    const handlePriorityToggle = (priority: string) => {
        const newPriority = filters.priority.includes(priority)
            ? filters.priority.filter(p => p !== priority)
            : [...filters.priority, priority];
        onFiltersChange({ ...filters, priority: newPriority });
    };

    const activeFiltersCount =
        filters.status.length +
        filters.priority.length +
        (filters.assigned !== 'all' ? 1 : 0) +
        (filters.dateRange.from || filters.dateRange.to ? 1 : 0) +
        (filters.search ? 1 : 0);

    return (
        <div className="space-y-4">
            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Buscar por asunto, empresa o email..."
                    value={filters.search}
                    onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
                    className="pl-9"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Status Filter */}
                <div className="space-y-2">
                    <Label>Estado</Label>
                    <div className="flex flex-wrap gap-2">
                        {STATUS_OPTIONS.map((option) => (
                            <Badge
                                key={option.value}
                                variant={filters.status.includes(option.value) ? 'default' : 'outline'}
                                className="cursor-pointer"
                                onClick={() => handleStatusToggle(option.value)}
                            >
                                {option.label}
                            </Badge>
                        ))}
                    </div>
                </div>

                {/* Priority Filter */}
                <div className="space-y-2">
                    <Label>Prioridad</Label>
                    <div className="flex flex-wrap gap-2">
                        {PRIORITY_OPTIONS.map((option) => (
                            <Badge
                                key={option.value}
                                variant={filters.priority.includes(option.value) ? 'default' : 'outline'}
                                className="cursor-pointer"
                                onClick={() => handlePriorityToggle(option.value)}
                            >
                                {option.label}
                            </Badge>
                        ))}
                    </div>
                </div>

                {/* Assignment Filter */}
                <div className="space-y-2">
                    <Label>Asignación</Label>
                    <Select
                        value={filters.assigned}
                        onValueChange={(value) => onFiltersChange({ ...filters, assigned: value })}
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {ASSIGNMENT_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Date Range */}
            <div className="flex items-center gap-2">
                <Label>Rango de fechas:</Label>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-2">
                            <CalendarIcon className="h-4 w-4" />
                            {filters.dateRange.from ? (
                                filters.dateRange.to ? (
                                    <>
                                        {format(filters.dateRange.from, 'dd MMM', { locale: es })} -{' '}
                                        {format(filters.dateRange.to, 'dd MMM', { locale: es })}
                                    </>
                                ) : (
                                    format(filters.dateRange.from, 'dd MMM yyyy', { locale: es })
                                )
                            ) : (
                                'Seleccionar fechas'
                            )}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            mode="range"
                            selected={{
                                from: filters.dateRange.from,
                                to: filters.dateRange.to
                            }}
                            onSelect={(range) =>
                                onFiltersChange({
                                    ...filters,
                                    dateRange: { from: range?.from, to: range?.to }
                                })
                            }
                            locale={es}
                        />
                    </PopoverContent>
                </Popover>
                {(filters.dateRange.from || filters.dateRange.to) && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onFiltersChange({ ...filters, dateRange: {} })}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                )}
            </div>

            {/* Active filters and reset */}
            {activeFiltersCount > 0 && (
                <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-sm text-muted-foreground">
                        {activeFiltersCount} filtro{activeFiltersCount > 1 ? 's' : ''} activo{activeFiltersCount > 1 ? 's' : ''}
                    </span>
                    <Button variant="ghost" size="sm" onClick={onReset}>
                        <X className="h-4 w-4 mr-2" />
                        Limpiar filtros
                    </Button>
                </div>
            )}
        </div>
    );
};
