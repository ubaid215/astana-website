'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Bell, BellOff } from 'lucide-react';
import { useSocket } from '@/hooks/useSocket';
import { useToast } from '@/components/ui/use-toast';

export function NotificationBadge() {
  const { notifications, setNotifications } = useSocket();
  const { toast } = useToast();
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const count = notifications.filter(n => !n.read).length;
    setUnreadCount(count);
  }, [notifications]);

  const markAllAsRead = async () => {
    try {
      const res = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'markAllAsRead' }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete notifications');
      }

      const data = await res.json();
      setNotifications([]); // Clear all notifications
      setShowNotifications(false); // Hide dropdown
      console.log('[NotificationBadge] Notifications deleted:', data);

      toast({
        title: 'Notifications Cleared',
        description: `${data.deletedCount} notifications deleted successfully.`,
        variant: 'success',
      });
    } catch (err) {
      console.error('[NotificationBadge] Failed to delete notifications:', err);
      toast({
        title: 'Error',
        description: `Failed to delete notifications: ${err.message}`,
        variant: 'destructive',
      });
    }
  };

  const getScreenshotUrl = (screenshot) => {
    if (!screenshot) return null;
    if (screenshot.startsWith('http://') || screenshot.startsWith('https://')) {
      return screenshot;
    }
    const cleanPath = screenshot.replace(/^\/*(uploads\/)?/, '');
    const url = `/uploads/${cleanPath}`;
    console.log('[NotificationBadge] Generated screenshot URL:', url);
    return url;
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => {
          setShowNotifications(!showNotifications);
          if (!showNotifications && unreadCount > 0) markAllAsRead();
        }}
        className="relative"
      >
        {unreadCount > 0 ? (
          <>
            <Bell className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {unreadCount}
            </span>
          </>
        ) : (
          <BellOff className="h-5 w-5" />
        )}
      </Button>

      {showNotifications && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-md shadow-lg z-50 border border-gray-200">
          <div className="p-2 border-b border-gray-200 flex justify-between items-center">
            <h3 className="font-medium">Notifications</h3>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                Mark all as read
              </Button>
            )}
          </div>
          <div className="max-h-60 overflow-y-auto">
            {notifications.length > 0 ? (
              notifications.map((notification, index) => (
                <div
                  key={notification._id || index}
                  className={`p-3 border-b border-gray-100 ${!notification.read ? 'bg-blue-50' : ''}`}
                >
                  {notification.type === 'payment' && (
                    <div>
                      <p className="text-sm">
                        <strong>{notification.userName}</strong> submitted payment
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Participation ID: {notification.participationId}
                      </p>
                      <p className="text-xs text-gray-500">
                        Transaction ID: {notification.transactionId}
                      </p>
                      {notification.installmentNumber && (
                        <p className="text-xs text-gray-500">
                          Installment: {notification.installmentNumber}
                        </p>
                      )}
                      {notification.allScreenshots?.length > 0 ? (
                        notification.allScreenshots.map((screenshot, sIndex) => {
                          const screenshotUrl = getScreenshotUrl(screenshot);
                          return (
                            <a
                              key={sIndex}
                              href={screenshotUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-500 hover:underline block mt-1"
                            >
                              View Proof {sIndex + 1}
                            </a>
                          );
                        })
                      ) : (
                        <span className="text-xs text-gray-500">No Proof Available</span>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(notification.createdAt || notification.timestamp).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="p-3 text-sm text-gray-500">No notifications yet</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}