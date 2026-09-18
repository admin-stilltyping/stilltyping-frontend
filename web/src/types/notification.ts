export type NotificationSeverity = 'info' | 'warning' | 'critical'

export interface AppNotification {
  id: string
  type: string
  title: string
  message: string
  url: string
  severity: NotificationSeverity
  is_read: boolean
  created_at: string
}
