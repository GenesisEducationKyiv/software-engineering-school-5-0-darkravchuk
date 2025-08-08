import { INotificationRepository } from '../../domain/repositories/INotificationRepository';
import { Notification } from '../../domain/entities/Notification';
import { EmailAddress } from '../../domain/value-objects/EmailAddress';
import { NotificationStatus } from '../../domain/value-objects/NotificationMetadata';

interface StoredNotification {
  id: string;
  data: any;
  createdAt: Date;
  updatedAt: Date;
}

export class InMemoryNotificationRepository implements INotificationRepository {
  private notifications = new Map<string, StoredNotification>();

  async save(notification: Notification): Promise<void> {
    const stored: StoredNotification = {
      id: notification.id,
      data: this.serializeNotification(notification),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.notifications.set(notification.id, stored);
  }

  async findById(id: string): Promise<Notification | null> {
    const stored = this.notifications.get(id);
    if (!stored) {
      return null;
    }

    return this.deserializeNotification(stored.data);
  }

  async update(notification: Notification): Promise<void> {
    const existing = this.notifications.get(notification.id);
    if (!existing) {
      throw new Error(`Notification not found: ${notification.id}`);
    }

    const updated: StoredNotification = {
      ...existing,
      data: this.serializeNotification(notification),
      updatedAt: new Date()
    };

    this.notifications.set(notification.id, updated);
  }

  async delete(id: string): Promise<void> {
    this.notifications.delete(id);
  }

  async findByStatus(status: NotificationStatus, limit?: number): Promise<Notification[]> {
    const results: Notification[] = [];
    let count = 0;

    for (const stored of this.notifications.values()) {
      if (limit && count >= limit) break;

      const notification = this.deserializeNotification(stored.data);
      if (notification.status === status) {
        results.push(notification);
        count++;
      }
    }

    return results;
  }

  async findByRecipient(recipient: EmailAddress, limit?: number): Promise<Notification[]> {
    const results: Notification[] = [];
    let count = 0;

    for (const stored of this.notifications.values()) {
      if (limit && count >= limit) break;

      const notification = this.deserializeNotification(stored.data);
      if (notification.recipient.equals(recipient)) {
        results.push(notification);
        count++;
      }
    }

    return results;
  }

  async findPendingForRetry(): Promise<Notification[]> {
    const results: Notification[] = [];

    for (const stored of this.notifications.values()) {
      const notification = this.deserializeNotification(stored.data);
      if (notification.status === 'pending' && notification.isReadyForRetry()) {
        results.push(notification);
      }
    }

    return results.sort((a, b) => {
      const priorityDiff = b.metadata.getPriorityWeight() - a.metadata.getPriorityWeight();
      if (priorityDiff !== 0) return priorityDiff;
      
      return a.createdAt.getTime() - b.createdAt.getTime();
    });
  }

  async findExpiredNotifications(): Promise<Notification[]> {
    const results: Notification[] = [];

    for (const stored of this.notifications.values()) {
      const notification = this.deserializeNotification(stored.data);
      if (notification.isExpired()) {
        results.push(notification);
      }
    }

    return results;
  }

  async saveMultiple(notifications: Notification[]): Promise<void> {
    for (const notification of notifications) {
      await this.save(notification);
    }
  }

  async updateMultiple(notifications: Notification[]): Promise<void> {
    for (const notification of notifications) {
      await this.update(notification);
    }
  }

  async getStatusCounts(): Promise<Record<NotificationStatus, number>> {
    const counts: Record<NotificationStatus, number> = {
      pending: 0,
      processing: 0,
      sent: 0,
      failed: 0,
      cancelled: 0
    };

    for (const stored of this.notifications.values()) {
      const notification = this.deserializeNotification(stored.data);
      counts[notification.status]++;
    }

    return counts;
  }

  async getFailuresByReason(): Promise<Record<string, number>> {
    const failures: Record<string, number> = {};

    for (const stored of this.notifications.values()) {
      const notification = this.deserializeNotification(stored.data);
      if (notification.status === 'failed' && notification.failureReason) {
        const reason = notification.failureReason;
        failures[reason] = (failures[reason] || 0) + 1;
      }
    }

    return failures;
  }

  async deleteOldNotifications(olderThanDays: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    let deletedCount = 0;
    const toDelete: string[] = [];

    for (const [id, stored] of this.notifications.entries()) {
      if (stored.createdAt < cutoffDate) {
        toDelete.push(id);
      }
    }

    for (const id of toDelete) {
      this.notifications.delete(id);
      deletedCount++;
    }

    return deletedCount;
  }

  async deleteByStatus(status: NotificationStatus): Promise<number> {
    let deletedCount = 0;
    const toDelete: string[] = [];

    for (const [id, stored] of this.notifications.entries()) {
      const notification = this.deserializeNotification(stored.data);
      if (notification.status === status) {
        toDelete.push(id);
      }
    }

    for (const id of toDelete) {
      this.notifications.delete(id);
      deletedCount++;
    }

    return deletedCount;
  }

  private serializeNotification(notification: Notification): any {
    return notification.toApiResponse();
  }

  private deserializeNotification(data: any): Notification {

    const notification = {
      ...data,
      _status: data.status,
      _attemptCount: data.attemptCount,
      _createdAt: new Date(data.createdAt),
      _lastAttemptAt: data.lastAttemptAt ? new Date(data.lastAttemptAt) : undefined,
      _sentAt: data.sentAt ? new Date(data.sentAt) : undefined,
      _nextRetryAt: data.nextRetryAt ? new Date(data.nextRetryAt) : undefined
    };

    return notification as any;
  }

  getSize(): number {
    return this.notifications.size;
  }

  clear(): void {
    this.notifications.clear();
  }
}
