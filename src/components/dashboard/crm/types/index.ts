import { User } from '@supabase/supabase-js';

export interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  phone_country_code?: string;
  status: string;
  custom_status?: string;
  country?: string;
  address?: string;
  city?: string;
  notes?: string;
  tags?: string[];
  last_interaction?: string;
  created_at: string;
  source?: string;
  avatar_url?: string;
}

export interface ClientFormData {
  name: string;
  email: string;
  phone: string;
  status: string;
  custom_status: string;
  country: string;
  address: string;
  city: string;
  notes: string;
  tags: string[];
}

export interface ClientFilters {
  searchTerm: string;
  filterStatus: string;
  filterSource: string;
}

export interface ClientStats {
  total: number;
  leads: number;
  prospects: number;
  active: number;
  inactive: number;
}

export interface ClientCardProps {
  client: Client;
  onEdit: (client: Client) => void;
  onStatusChange: (clientId: string, status: string) => void;
  crmLevel?: 'none' | 'basic' | 'complete';
}

export interface ClientFiltersProps {
  filters: ClientFilters;
  onFiltersChange: (filters: ClientFilters) => void;
  onExportCSV: () => void;
  onExportExcel: () => void;
  filteredClientsCount: number;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  crmLevel?: 'none' | 'basic' | 'complete';
}

export interface ClientStatsProps {
  stats: ClientStats;
}

export interface EditClientDialogProps {
  isOpen: boolean;
  client: Client | null;
  formData: ClientFormData;
  onClose: () => void;
  onSave: () => void;
  onFormChange: (formData: ClientFormData) => void;
}

export interface CRMViewProps {
  user: User | null;
}

export type ClientStatus = 'lead' | 'prospect' | 'client' | 'inactive';
export type ClientSource = 'manual' | 'whatsapp' | 'facebook' | 'instagram';
export type ViewMode = 'grid' | 'list';

export interface ClientListProps {
  clients: Client[];
  onEdit: (client: Client) => void;
  onStatusChange: (clientId: string, status: string) => void;
  onDelete: (clientId: string) => void;
  crmLevel?: 'none' | 'basic' | 'complete';
}

export type { User };
