// Client Management Module - Types

// Client interface
export interface Client {
  id: string;
  user_id: string;
  company_name: string;
  email: string;
  phone: string | null;
  plan_type: string;
  subscription_start: string;
  subscription_end: string | null;
  is_active: boolean;
  created_at: string;
  role?: string;
}

// Role interface
export interface Role {
  id: string;
  name: string;
  description: string;
}

// Edit form data interface
export interface EditFormData {
  company_name: string;
  email: string;
  phone: string;
  plan_type: string;
  role: string;
  is_active: boolean;
}

// Component props interfaces
export interface ClientManagementProps {
  className?: string;
}

export interface ClientTableProps {
  clients: Client[];
  loading: boolean;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onEditClient: (client: Client) => void;
  onToggleStatus: (clientId: string, currentStatus: boolean) => void;
  onDeleteClient: (clientId: string) => void;
}

export interface ClientEditDialogProps {
  isOpen: boolean;
  client: Client | null;
  formData: EditFormData;
  loading: boolean;
  onClose: () => void;
  onFormChange: (formData: EditFormData) => void;
  onSave: () => void;
}

export interface ClientDeleteDialogProps {
  isOpen: boolean;
  clientId: string | null;
  loading: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

// Hook return types
export interface UseClientsReturn {
  clients: Client[];
  loading: boolean;
  fetchClients: () => Promise<void>;
}

export interface UseClientActionsReturn {
  isUpdating: boolean;
  isDeleting: boolean;
  toggleClientStatus: (clientId: string, currentStatus: boolean) => Promise<void>;
  updateClient: (clientId: string, formData: EditFormData) => Promise<void>;
  deleteClient: (clientId: string) => Promise<void>;
}

export interface UseClientFormReturn {
  formData: EditFormData;
  setFormData: (formData: EditFormData) => void;
  resetForm: () => void;
  validateForm: (formData: EditFormData) => { isValid: boolean; errors: string[] };
}

// Service response types
export interface FetchClientsResponse {
  clients: Client[];
  success: boolean;
  error?: string;
}

export interface UpdateClientResponse {
  success: boolean;
  message: string;
  error?: string;
}

export interface DeleteClientResponse {
  success: boolean;
  message: string;
  error?: string;
}

// Utility types
export type PlanType = 'free' | 'basico' | 'avanzado' | 'pro' | 'empresarial';
export type RoleType = 'admin' | 'moderator' | 'user';
export type ClientStatus = 'active' | 'inactive';

// Badge color functions
export type BadgeColorFunction = (value: string) => string;
