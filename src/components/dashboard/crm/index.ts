// Main component
export { default as CRMView } from './CRMView';

// Types
export type {
  Client,
  ClientFormData,
  ClientCardProps,
  ClientFiltersProps,
  ClientStatsProps,
  EditClientDialogProps,
  CRMViewProps,
  ClientStatus,
  ClientSource,
  User
} from './types';

// Hooks
export {
  useClients,
  useClientFilters,
  useClientActions,
  useExport,
  useClientForm
} from './hooks';

// Services
export { CRMService } from './services';

// Components
export {
  ClientStats,
  ClientFilters,
  ClientCard,
  EditClientDialog
} from './components';
