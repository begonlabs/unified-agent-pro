import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Flame,
    Inbox,
    Clock,
    User,
    CheckCircle2,
    AlertCircle
} from 'lucide-react';
import { FilterPreset } from '../types';

interface FilterPresetsProps {
    onPresetSelect: (preset: FilterPreset) => void;
    activePreset?: string;
}

const FILTER_PRESETS: FilterPreset[] = [
    {
        id: 'urgent',
        label: 'Urgentes',
        icon: 'flame',
        filters: {
            priority: ['urgent', 'high'],
            status: ['open', 'in_progress']
        }
    },
    {
        id: 'new',
        label: 'Nuevos',
        icon: 'inbox',
        filters: {
            status: ['open'],
            assigned: 'unassigned'
        }
    },
    {
        id: 'needs_response',
        label: 'Necesitan Respuesta',
        icon: 'clock',
        filters: {
            status: ['open', 'waiting_response']
        }
    },
    {
        id: 'my_tickets',
        label: 'Mis Tickets',
        icon: 'user',
        filters: {
            assigned: 'me'
        }
    },
    {
        id: 'all_active',
        label: 'Todos Activos',
        icon: 'alert-circle',
        filters: {
            status: ['open', 'in_progress', 'waiting_response']
        }
    }
];

const getIcon = (iconName: string) => {
    const icons: Record<string, React.ComponentType<{ className?: string }>> = {
        flame: Flame,
        inbox: Inbox,
        clock: Clock,
        user: User,
        'check-circle': CheckCircle2,
        'alert-circle': AlertCircle
    };
    return icons[iconName] || AlertCircle;
};

export const FilterPresets: React.FC<FilterPresetsProps> = ({
    onPresetSelect,
    activePreset
}) => {
    return (
        <div className="flex flex-wrap gap-2">
            {FILTER_PRESETS.map((preset) => {
                const Icon = getIcon(preset.icon);
                const isActive = activePreset === preset.id;

                return (
                    <Button
                        key={preset.id}
                        variant={isActive ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => onPresetSelect(preset)}
                        className="gap-2"
                    >
                        <Icon className="h-4 w-4" />
                        {preset.label}
                    </Button>
                );
            })}
        </div>
    );
};
