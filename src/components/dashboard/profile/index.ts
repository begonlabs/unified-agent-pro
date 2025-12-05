// Tipos
export * from './types';

// Servicios
export { ProfileService } from './services/profileService';

// Hooks
export { useProfile } from './hooks/useProfile';
export { useProfileForm } from './hooks/useProfileForm';
export { useNotifications } from './hooks/useNotifications';

// Componentes principales
export { ProfileHeader } from './components/ProfileHeader';
export { ProfileTabs } from './components/ProfileTabs';
export { ProfileTab } from './components/ProfileTab';
export { SubscriptionContent } from './components/SubscriptionContent';
export { NotificationsTab } from './components/NotificationsTab';
export { SecurityTab } from './components/SecurityTab';
export { default as ChangePasswordDialog } from './components/ChangePasswordDialog';
