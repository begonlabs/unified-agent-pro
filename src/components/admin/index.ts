// Admin Module - Barrel Export
// Centralized exports for all admin components

// Main Components
export { default as AdminPanel } from './AdminPanel';
export { default as AdminSidebar } from './sidebar/AdminSidebar';
export { default as ResponsiveAdminSidebar } from './sidebar/ResponsiveAdminSidebar';
export { default as AdminSettings } from './AdminSettings';
export { default as ClientManagement } from './ClientManagement';
export { default as ClientStats } from './ClientStats';
export { default as GeneralStats } from './GeneralStats';
export { default as SupportMessages } from './SupportMessages';
export { default as SupportStats } from './SupportStats';

// Admin Panel Module
export {
  AdminPanel as AdminPanelComponent,
  AdminPanelHeader,
  AdminPanelNavigation,
  AdminPanelContent,
  SupportSubNavigation,
  useAdminPanel,
  AdminPanelService
} from './admin-panel';

// Admin Sidebar Module
export {
  AdminSidebar as AdminSidebarComponent,
  ResponsiveAdminSidebar as ResponsiveAdminSidebarComponent,
  AdminSidebarHeader,
  AdminSidebarNavigation,
  AdminSidebarStatus,
  AdminSidebarActions,
  useAdminSidebar,
  AdminSidebarService
} from './sidebar';

// Admin Settings Module
export {
  AdminSettings as AdminSettingsComponent,
  NotificationSettingsComponent,
  EmailSettingsComponent,
  SecuritySettingsComponent,
  MaintenanceSettingsComponent,
  SettingsSaveButtonComponent,
  useAdminSettings,
  AdminSettingsService
} from './settings';

// Client Management Module
export {
  ClientManagement as ClientManagementComponent,
  ClientTable,
  ClientEditDialog,
  ClientDeleteDialog,
  useClients,
  useClientActions,
  useClientForm,
  ClientManagementService
} from './users';

// Client Stats Module
export {
  ClientStats as ClientStatsComponent,
  ClientStatsTable,
  ClientDetailsModal,
  ChannelStatsCard,
  ActivitySummary,
  useClientStats,
  useClientDetails,
  ClientStatsService
} from './client-stats';

// General Stats Module
export {
  GeneralStats as GeneralStatsComponent,
  StatCard,
  ChannelCard,
  ClientStatsSection,
  PlatformActivitySection,
  ChannelActivitySection,
  LoadingSkeleton,
  ErrorState,
  useGeneralStats,
  GeneralStatsService
} from './general-stats';

// Support Module
export {
  SupportMessages as SupportMessagesComponent,
  SupportStats as SupportStatsComponent,
  TicketSummary,
  TicketFilters as TicketFiltersComponent,
  TicketTable,
  TicketChat,
  MessageBubble,
  StatusBadge,
  PriorityBadge,
  StatsCard as SupportStatsCard,
  TicketDistribution,
  TicketTrends,
  useSupportTickets,
  useSupportMessages,
  useSupportStats,
  useTicketFilters,
  useChatState,
  SupportService
} from './support';

// Types
export type {
  // Admin Panel Types
  AdminTab,
  AdminPanelProps,
  AdminPanelHeaderProps,
  AdminPanelNavigationProps,
  AdminPanelContentProps,
  SupportSubNavigationProps,
  UseAdminPanelReturn,
  TabConfiguration
} from './admin-panel/types';

export type {
  // Admin Sidebar Types
  AdminMenuItem,
  AdminSidebarProps,
  AdminSidebarNavigationProps,
  AdminSidebarActionsProps,
  UseAdminSidebarReturn
} from './sidebar/types';

export type {
  // Admin Settings Types
  NotificationSettings,
  EmailSettings,
  SecuritySettings,
  MaintenanceSettings,
  AdminSettingsData,
  AdminSettingsProps,
  NotificationSettingsProps,
  EmailSettingsProps,
  SecuritySettingsProps,
  MaintenanceSettingsProps,
  SettingsSaveButtonProps,
  UseAdminSettingsReturn,
  SaveSettingsResponse,
  LoadSettingsResponse
} from './settings/types';

export type {
      // Client Management Types
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
    } from './users/types';

export type {
      // Client Stats Types
      ClientWithStats,
      ClientStats as ClientStatsType,
      ClientStatsProps,
      ClientStatsTableProps,
      ClientDetailsModalProps,
      ChannelStatsCardProps,
      ActivitySummaryProps,
      UseClientStatsReturn,
      UseClientDetailsReturn,
      FetchClientStatsResponse,
      ChannelType,
      PlanType as ClientStatsPlanType,
      BadgeColorFunction as ClientStatsBadgeColorFunction,
      ChannelIconFunction
    } from './client-stats/types';

export type {
      // General Stats Types
      GeneralStatsData,
      PlanCounts,
      ChannelStats,
      GeneralStatsProps,
      ClientStatsSectionProps,
      PlatformActivitySectionProps,
      ChannelActivitySectionProps,
      StatCardProps,
      ChannelCardProps,
      UseGeneralStatsReturn,
      FetchGeneralStatsResponse,
      PlanType as GeneralStatsPlanType,
      ChannelType as GeneralStatsChannelType,
      IconColorFunction,
      ChannelIconColorFunction
    } from './general-stats/types';

export type {
      // Support Types
      SupportTicket,
      SupportMessage,
      SupportStats as SupportStatsType,
      TicketTrend,
      SupportMessagesProps,
      SupportStatsProps,
      TicketTableProps,
      TicketChatProps,
      TicketFiltersProps,
      TicketSummaryProps,
      MessageBubbleProps,
      StatusBadgeProps,
      PriorityBadgeProps,
      StatsCardProps as SupportStatsCardProps,
      TicketDistributionProps,
      TicketTrendsProps,
      UseSupportTicketsReturn,
      UseSupportMessagesReturn,
      UseSupportStatsReturn,
      UseTicketFiltersReturn,
      FetchTicketsResponse,
      FetchMessagesResponse,
      SendMessageResponse,
      UpdateTicketResponse,
      FetchSupportStatsResponse,
      TicketStatus,
      TicketPriority,
      MessageType,
      StatusBadgeColorFunction,
      PriorityBadgeColorFunction,
      TicketFilters,
      ChatState
    } from './support/types';
