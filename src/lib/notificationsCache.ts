import { NotificationItem } from '@/interfaces/notifications';

const CACHE_KEY = 'notifications_cache';

export type NotificationsCache = {
  data: NotificationItem[];
  unreadCount: number;
  updatedAt: number;
};

export const loadNotificationsCache = (): NotificationsCache | null => {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as NotificationsCache;
    if (!parsed || !Array.isArray(parsed.data)) return null;
    return parsed;
  } catch {
    return null;
  }
};

export const saveNotificationsCache = (data: NotificationItem[], unreadCount: number) => {
  const payload: NotificationsCache = {
    data,
    unreadCount,
    updatedAt: Date.now(),
  };
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
  } catch {
    // Ignore storage errors (e.g., quota)
  }
};

export const updateNotificationReadInCache = (id: number, nextRead: boolean) => {
  const cache = loadNotificationsCache();
  if (!cache) return;
  const data = cache.data.map((item) =>
    item.id === id ? { ...item, is_read: nextRead, read_at: nextRead ? new Date().toISOString() : null } : item,
  );
  const unreadCount = data.filter((n) => !n.is_read).length;
  saveNotificationsCache(data, unreadCount);
};

export const markAllReadInCache = () => {
  const cache = loadNotificationsCache();
  if (!cache) return;
  const data = cache.data.map((item) => ({ ...item, is_read: true, read_at: new Date().toISOString() }));
  saveNotificationsCache(data, 0);
};
