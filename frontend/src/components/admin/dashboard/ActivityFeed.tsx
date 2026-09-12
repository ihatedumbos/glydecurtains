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
      return 'bg-[#a06b3a]/15';
    case 'USER_REGISTERED':
    case 'USER_APPROVED':
      return 'bg-[#3a6b3f]/15';
    case 'PRODUCT_CREATED':
    case 'PRODUCT_UPDATED':
      return 'bg-[#6b5544]/15';
    case 'LOGIN':
    case 'LOGOUT':
      return 'bg-[#b5895a]/20';
    default:
      return 'bg-[#f4ede1]';
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
            <div className="w-9 h-9 rounded-full bg-[#e8dfcd]" />
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-[#e8dfcd] rounded w-3/4" />
              <div className="h-2 bg-[#e8dfcd] rounded w-1/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-[#8a7a6b] text-sm">
        No recent activity
      </div>
    );
  }

  return (
    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
      {activities.map((activity) => (
        <div
          key={activity.id}
          className="flex items-start gap-3 p-2 rounded-lg hover:bg-[#f4ede1] transition-colors"
        >
          <div className={`flex items-center justify-center w-9 h-9 rounded-full text-sm ${getActivityColor(activity.actionType)}`}>
            {getActivityIcon(activity.actionType)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-[#2c2c2c] truncate">
              {activity.details || `${activity.actionType.replace(/_/g, ' ').toLowerCase()} on ${activity.entityType}`}
            </p>
            <p className="text-xs text-[#8a7a6b] mt-0.5">
              {formatTimeAgo(activity.timestamp)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
