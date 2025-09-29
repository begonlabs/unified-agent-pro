// Client Management Module
export { default as ClientManagement } from './ClientManagement';

// Types
export type {
  Client,
  Role,
  EditFormData,
  ClientManagementProps,
  ClientTableProps,
  ClientEditDialogProps,
  ClientDeleteDialogProps,
  UseClientsReturn,
  UseClientActionsReturn,
  UseClientFormReturn,
  FetchClientsResponse,
  UpdateClientResponse,
  DeleteClientResponse,
  PlanType,
  RoleType,
  ClientStatus,
  BadgeColorFunction
} from './types';

// Hooks
export { useClients, useClientActions, useClientForm } from './hooks';

// Services
export { ClientManagementService } from './services';

// Components
export {
  ClientTable,
  ClientEditDialog,
  ClientDeleteDialog
} from './components';
