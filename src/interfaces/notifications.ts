export type NotificationCategory = 'pedido' | 'evento' | 'sistema';

export type NotificationItem = {
  id: number;
  title: string;
  body: string;
  category: NotificationCategory;
  trigger_type?: string | null;
  id_pedido?: number | null;
  id_evento?: number | null;
  created_by?: string | null;
  created_by_name?: string | null;
  created_at: string;
  is_read: boolean;
  read_at?: string | null;
};
