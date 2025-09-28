// Main component
export { default as StatsView } from './StatsView';

// Types
export type {
  ChannelStat,
  DailyStat,
  FormattedDailyStat,
  StatsData,
  AutomationData,
  StatCardProps,
  StatsViewProps,
  TimeRange,
  ConversationData,
  MessageData,
  ClientData,
  ChartData,
  StatsServiceResponse,
  User
} from './types';

// Hooks
export {
  useStats,
  useTimeRange
} from './hooks';

// Services
export { StatsService } from './services/statsService';

// Components
export {
  StatCard,
  StatsHeader,
  StatsKPIs,
  ChannelChart,
  AutomationChart,
  ChannelDetails,
  DailyActivityChart,
  LoadingState,
  AuthErrorState,
  AuthLoadingState
} from './components';
