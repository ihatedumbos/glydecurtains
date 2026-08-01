interface ActivityItem {
  id: number;
  userId: number | null;
  actionType: string;
  entityType: string;
  entityId: number | null;
  details: string;
  ipAddress: string | null;
  timestamp: string;
}

interface ActivityFeedProps {
  activities: ActivityItem[];
  loading?: boolean;
}

function getActivityIcon(actionType: string): string {
  switch (actionType) {
    case 'ORDER_PLACED':
    case 'ORDER_UPDATED':
      return '🛒';
    case 'USER_REGISTERED':
      return '👤';
    case 'PRODUCT_CREATED':
    case 'PRODUCT_UPDATED':
      return '📦';
    case 'LOGIN':
      return '🔑';
    case 'LOGOUT':
      return '🚪';
    case 'USER_APPROVED':
      return '✅';
    case 'USER_REJECTED':
      return '❌';
    default:
      return '📋';
  }
}

function getActivityColor(actionType: string): string {
  switch (actionType) {
    case 'ORDER_PLACED':
    case 'ORDER_UPDATED':
      return 'bg-blue-100 dark:bg-blue-900/30';
    case 'USER_REGISTERED':
    case 'USER_APPROVED':
      return 'bg-green-100 dark:bg-green-900/30';
    case 'PRODUCT_CREATED':
    case 'PRODUCT_UPDATED':
      return 'bg-purple-100 dark:bg-purple-900/30';
    case 'LOGIN':
    case 'LOGOUT':
      return 'bg-amber-100 dark:bg-amber-900/30';
    default:
      return 'bg-gray-100 dark:bg-gray-700';
  }
}

function formatTimeAgo(timestamp: string): string {
  const now = new Date();
  const date = new Date(timestamp);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHrs = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHrs < 24) return `${diffHrs}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export default function ActivityFeed({ activities, loading = false }: ActivityFeedProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 animate-pulse">
            <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-700" />
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
        No recent activity
      </div>
    );
  }

  return (
    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
      {activities.map((activity) => (
        <div
          key={activity.id}
          className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
        >
          <div className={`flex items-center justify-center w-9 h-9 rounded-full text-sm ${getActivityColor(activity.actionType)}`}>
            {getActivityIcon(activity.actionType)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-700 dark:text-gray-200 truncate">
              {activity.details || `${activity.actionType.replace(/_/g, ' ').toLowerCase()} on ${activity.entityType}`}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              {formatTimeAgo(activity.timestamp)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
