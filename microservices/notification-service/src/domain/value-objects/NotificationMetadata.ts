export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';
export type NotificationStatus = 'pending' | 'processing' | 'sent' | 'failed' | 'cancelled';

export class NotificationMetadata {
  private constructor(
    private readonly _priority: NotificationPriority,
    private readonly _maxRetries: number,
    private readonly _retryDelay: number,
    private readonly _expiresAt?: Date,
    private readonly _tags: string[] = []
  ) {}

  public static create(params: {
    priority?: NotificationPriority;
    maxRetries?: number;
    retryDelay?: number;
    expiresAt?: Date;
    tags?: string[];
  } = {}): NotificationMetadata {
    const priority = params.priority || 'normal';
    const maxRetries = Math.max(0, Math.min(params.maxRetries || 3, 10));
    const retryDelay = Math.max(1000, Math.min(params.retryDelay || 5000, 300000)); // 1s to 5min

    if (params.expiresAt && params.expiresAt <= new Date()) {
      throw new Error('Expiration date must be in the future');
    }

    return new NotificationMetadata(
      priority,
      maxRetries,
      retryDelay,
      params.expiresAt,
      params.tags || []
    );
  }

  public isExpired(): boolean {
    return this._expiresAt ? this._expiresAt <= new Date() : false;
  }

  public hasTag(tag: string): boolean {
    return this._tags.includes(tag);
  }

  public shouldRetry(currentAttempt: number): boolean {
    return currentAttempt < this._maxRetries && !this.isExpired();
  }

  public getNextRetryAt(currentAttempt: number): Date {
    // Exponential backoff with jitter
    const baseDelay = this._retryDelay;
    const exponentialDelay = baseDelay * Math.pow(2, currentAttempt);
    const jitter = Math.random() * 0.1 * exponentialDelay; // 10% jitter
    const finalDelay = exponentialDelay + jitter;

    return new Date(Date.now() + finalDelay);
  }

  public getPriorityWeight(): number {
    const weights = {
      urgent: 100,
      high: 75,
      normal: 50,
      low: 25
    };
    return weights[this._priority];
  }

  // Getters
  public get priority(): NotificationPriority {
    return this._priority;
  }

  public get maxRetries(): number {
    return this._maxRetries;
  }

  public get retryDelay(): number {
    return this._retryDelay;
  }

  public get expiresAt(): Date | undefined {
    return this._expiresAt ? new Date(this._expiresAt) : undefined;
  }

  public get tags(): ReadonlyArray<string> {
    return [...this._tags];
  }

  // Factory methods for common scenarios
  public static urgent(expiresAt?: Date): NotificationMetadata {
    return NotificationMetadata.create({
      priority: 'urgent',
      maxRetries: 5,
      retryDelay: 2000,
      expiresAt,
      tags: ['urgent']
    });
  }

  public static realTime(expiresInMinutes: number = 15): NotificationMetadata {
    const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);
    return NotificationMetadata.create({
      priority: 'high',
      maxRetries: 3,
      retryDelay: 3000,
      expiresAt,
      tags: ['realtime']
    });
  }

  public static batch(): NotificationMetadata {
    return NotificationMetadata.create({
      priority: 'low',
      maxRetries: 1,
      retryDelay: 30000,
      tags: ['batch']
    });
  }
}
