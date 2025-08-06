import { Notification } from '../entities/Notification';
import { EmailAddress } from '../value-objects/EmailAddress';
import { NotificationStatus } from '../value-objects/NotificationMetadata';

export interface INotificationRepository {
  save(notification: Notification): Promise<void>;
  findById(id: string): Promise<Notification | null>;
  update(notification: Notification): Promise<void>;
  delete(id: string): Promise<void>;
  
  findByStatus(status: NotificationStatus, limit?: number): Promise<Notification[]>;
  findByRecipient(recipient: EmailAddress, limit?: number): Promise<Notification[]>;
  findPendingForRetry(): Promise<Notification[]>;
  findExpiredNotifications(): Promise<Notification[]>;
  
  saveMultiple(notifications: Notification[]): Promise<void>;
  updateMultiple(notifications: Notification[]): Promise<void>;
  
  getStatusCounts(): Promise<Record<NotificationStatus, number>>;
  getFailuresByReason(): Promise<Record<string, number>>;
  
  deleteOldNotifications(olderThanDays: number): Promise<number>;
  deleteByStatus(status: NotificationStatus): Promise<number>;
}
