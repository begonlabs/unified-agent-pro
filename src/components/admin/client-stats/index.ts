// Client Stats Module
export { default as ClientStats } from './ClientStats';

// Types
export type {
  ClientWithStats,
  ChannelStats,
  ClientStatsProps,
  ClientStatsTableProps,
  ClientDetailsModalProps,
  ChannelStatsCardProps,
  ActivitySummaryProps,
  UseClientStatsReturn,
  UseClientDetailsReturn,
  FetchClientStatsResponse,
  ChannelType,
  PlanType,
  BadgeColorFunction,
  ChannelIconFunction
} from './types';

// Hooks
export { useClientStats, useClientDetails } from './hooks';

// Services
export { ClientStatsService } from './services';

// Components
export {
  ClientStatsTable,
  ClientDetailsModal,
  ChannelStatsCard,
  ActivitySummary
} from './components';
