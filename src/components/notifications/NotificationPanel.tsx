import { useState, useEffect } from 'react';

interface Notification {
    id: number;
    type: 'info' | 'success' | 'warning' | 'error' | 'reminder' | 'achievement';
    title: string;
    message: string;
    isRead: boolean;
    priority: 'low' | 'medium' | 'high';
    actionUrl: string | null;
    createdAt: string;
    expiresAt: string | null;
}

interface NotificationPanelProps {
    notifications: Notification[];
    onMarkRead: (id: number) => void;
    onMarkAllRead: () => void;
    onDelete: (id: number) => void;
    onClose: () => void;
}

const typeConfig = {
    info: { icon: '💡', bg: 'bg-blue-500', text: 'text-blue-600' },
    success: { icon: '✅', bg: 'bg-green-500', text: 'text-green-600' },
    warning: { icon: '⚠️', bg: 'bg-amber-500', text: 'text-amber-600' },
    error: { icon: '❌', bg: 'bg-red-500', text: 'text-red-600' },
    reminder: { icon: '🔔', bg: 'bg-purple-500', text: 'text-purple-600' },
    achievement: { icon: '🏆', bg: 'bg-yellow-500', text: 'text-yellow-600' },
};

const priorityBadge = {
    low: 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400',
    medium: 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300',
    high: 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300',
};

export default function NotificationPanel({
    notifications,
    onMarkRead,
    onMarkAllRead,
    onDelete,
    onClose,
}: NotificationPanelProps) {
    const [filter, setFilter] = useState<'all' | 'unread' | typeConfig['info']['type']>('all');

    const filteredNotifications = notifications.filter(n => {
        if (filter === 'all') return true;
        if (filter === 'unread') return !n.isRead;
        return n.type === filter;
    });

    const unreadCount = notifications.filter(n => !n.isRead).length;

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-end p-4">
            <div
                className="absolute inset-0 bg-black/30 backdrop-blur-sm"
                onClick={onClose}
            />
            <div className="relative w-full max-w-md bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-gray-700/30 overflow-hidden animate-slide-up">
                <div className="p-6 border-b border-gray-200/30 dark:border-gray-700/30">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <h2 className="text-xl font-bold text-gray-800 dark:text-white">Notifications</h2>
                            {unreadCount > 0 && (
                                <span className="px-2 py-1 text-xs font-semibold bg-gradient-to-r from-violet-500 to-purple-500 text-white rounded-full">
                                    {unreadCount} new
                                </span>
                            )}
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-xl hover:bg-gray-100/50 dark:hover:bg-gray-700/50 transition-colors"
                        >
                            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <div className="flex gap-2 flex-wrap">
                        {(['all', 'unread', 'info', 'warning', 'reminder', 'achievement'] as const).map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                                    filter === f
                                        ? 'bg-gradient-to-r from-violet-500 to-purple-500 text-white shadow-lg'
                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                }`}
                            >
                                {f === 'all' ? 'All' : f === 'unread' ? 'Unread' : f.charAt(0).toUpperCase() + f.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="max-h-96 overflow-y-auto">
                    {filteredNotifications.length === 0 ? (
                        <div className="p-8 text-center">
                            <span className="text-4xl mb-4 block">🔔</span>
                            <p className="text-gray-500 dark:text-gray-400">No notifications</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-200/30 dark:divide-gray-700/30">
                            {filteredNotifications.map(notification => {
                                const config = typeConfig[notification.type];
                                return (
                                    <div
                                        key={notification.id}
                                        className={`p-4 hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors group ${
                                            !notification.isRead ? 'bg-violet-50/30 dark:bg-violet-900/10' : ''
                                        }`}
                                        onClick={() => !notification.isRead && onMarkRead(notification.id)}
                                    >
                                        <div className="flex gap-3">
                                            <div className={`w-10 h-10 rounded-xl ${config.bg} bg-opacity-20 flex items-center justify-center flex-shrink-0`}>
                                                <span className="text-xl">{config.icon}</span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="font-semibold text-gray-800 dark:text-white text-sm">
                                                            {notification.title}
                                                        </h4>
                                                        <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${priorityBadge[notification.priority]}`}>
                                                            {notification.priority}
                                                        </span>
                                                    </div>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onDelete(notification.id);
                                                        }}
                                                        className="p-1 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 transition-all"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </div>
                                                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                                                    {notification.message}
                                                </p>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <span className="text-[10px] text-gray-400">
                                                        {formatTime(notification.createdAt)}
                                                    </span>
                                                    {notification.actionUrl && (
                                                        <span className="text-[10px] text-violet-500 hover:underline cursor-pointer">
                                                            View →
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        {!notification.isRead && (
                                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-violet-500 to-purple-500 rounded-l-xl" />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {unreadCount > 0 && (
                    <div className="p-4 border-t border-gray-200/30 dark:border-gray-700/30">
                        <button
                            onClick={onMarkAllRead}
                            className="w-full py-2 text-sm font-medium text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 transition-colors"
                        >
                            Mark all as read
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}