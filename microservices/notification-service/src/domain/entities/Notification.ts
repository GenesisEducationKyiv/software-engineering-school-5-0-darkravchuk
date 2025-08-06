import { EmailAddress } from '../value-objects/EmailAddress';
import { NotificationTemplate, NotificationType } from '../value-objects/NotificationTemplate';
import { NotificationMetadata, NotificationStatus } from '../value-objects/NotificationMetadata';

export class Notification {
  private _status: NotificationStatus = 'pending';
  private _attemptCount: number = 0;
  private _lastAttemptAt?: Date;
  private _sentAt?: Date;
  private _failureReason?: string;
  private _nextRetryAt?: Date;

  private constructor(
    private readonly _id: string,
    private readonly _recipient: EmailAddress,
    private readonly _template: NotificationTemplate,
    private readonly _context: Record<string, any>,
    private readonly _metadata: NotificationMetadata,
    private readonly _createdAt: Date = new Date()
  ) {}

  public static create(params: {
    id: string;
    recipient: EmailAddress;
    template: NotificationTemplate;
    context: Record<string, any>;
    metadata?: NotificationMetadata;
  }): Notification {

    const template = params.template;
    const missingVariables = template.getMissingVariables(params.context);
    
    if (missingVariables.length > 0) {
      throw new Error(`Missing required template variables: ${missingVariables.join(', ')}`);
    }

    const metadata = params.metadata || NotificationMetadata.create();

    return new Notification(
      params.id,
      params.recipient,
      params.template,
      params.context,
      metadata
    );
  }

  public markAsProcessing(): void {
    if (this._status !== 'pending') {
      throw new Error(`Cannot mark notification as processing. Current status: ${this._status}`);
    }

    this._status = 'processing';
    this._attemptCount++;
    this._lastAttemptAt = new Date();
  }

  public markAsSent(): void {
    if (this._status !== 'processing') {
      throw new Error(`Cannot mark notification as sent. Current status: ${this._status}`);
    }

    this._status = 'sent';
    this._sentAt = new Date();
    this._nextRetryAt = undefined;
  }

  public markAsFailed(reason: string): void {
    if (this._status !== 'processing') {
      throw new Error(`Cannot mark notification as failed. Current status: ${this._status}`);
    }

    this._status = 'failed';
    this._failureReason = reason;

    if (this._metadata.shouldRetry(this._attemptCount)) {
      this._nextRetryAt = this._metadata.getNextRetryAt(this._attemptCount);
      this._status = 'pending'; // Reset to pending for retry
    }
  }

  public cancel(reason?: string): void {
    if (this._status === 'sent') {
      throw new Error('Cannot cancel notification that has already been sent');
    }

    this._status = 'cancelled';
    this._failureReason = reason || 'Notification cancelled';
    this._nextRetryAt = undefined;
  }

  public canBeRetried(): boolean {
    return this._status === 'pending' && 
           this._metadata.shouldRetry(this._attemptCount) && 
           !this._metadata.isExpired();
  }

  public isReadyForRetry(): boolean {
    if (!this.canBeRetried()) {
      return false;
    }

    if (!this._nextRetryAt) {
      return true; // First attempt
    }

    return Date.now() >= this._nextRetryAt.getTime();
  }

  public isExpired(): boolean {
    return this._metadata.isExpired();
  }

  public getRenderedContent(): { subject: string; body: string } {
    return {
      subject: this._template.renderSubject(this._context),
      body: this._template.renderBody(this._context)
    };
  }

  public getDeliveryInfo(): {
    attempts: number;
    canRetry: boolean;
    nextRetryAt?: Date;
    isExpired: boolean;
    priority: string;
    } {
    return {
      attempts: this._attemptCount,
      canRetry: this.canBeRetried(),
      nextRetryAt: this._nextRetryAt ? new Date(this._nextRetryAt) : undefined,
      isExpired: this.isExpired(),
      priority: this._metadata.priority
    };
  }

  public validateForDelivery(): void {
    if (this._status === 'sent') {
      throw new Error('Notification has already been sent');
    }

    if (this._status === 'cancelled') {
      throw new Error('Notification has been cancelled');
    }

    if (this.isExpired()) {
      throw new Error('Notification has expired');
    }

    if (!this.isReadyForRetry()) {
      throw new Error('Notification is not ready for delivery yet');
    }
  }

  public get id(): string {
    return this._id;
  }

  public get recipient(): EmailAddress {
    return this._recipient;
  }

  public get template(): NotificationTemplate {
    return this._template;
  }

  public get context(): Record<string, any> {
    return { ...this._context };
  }

  public get metadata(): NotificationMetadata {
    return this._metadata;
  }

  public get status(): NotificationStatus {
    return this._status;
  }

  public get attemptCount(): number {
    return this._attemptCount;
  }

  public get createdAt(): Date {
    return new Date(this._createdAt);
  }

  public get lastAttemptAt(): Date | undefined {
    return this._lastAttemptAt ? new Date(this._lastAttemptAt) : undefined;
  }

  public get sentAt(): Date | undefined {
    return this._sentAt ? new Date(this._sentAt) : undefined;
  }

  public get failureReason(): string | undefined {
    return this._failureReason;
  }

  public get nextRetryAt(): Date | undefined {
    return this._nextRetryAt ? new Date(this._nextRetryAt) : undefined;
  }

  public toApiResponse(): object {
    const rendered = this.getRenderedContent();
    
    return {
      id: this._id,
      recipient: this._recipient.toString(),
      type: this._template.type,
      subject: rendered.subject,
      status: this._status,
      priority: this._metadata.priority,
      createdAt: this._createdAt.toISOString(),
      lastAttemptAt: this._lastAttemptAt?.toISOString(),
      sentAt: this._sentAt?.toISOString(),
      attemptCount: this._attemptCount,
      canRetry: this.canBeRetried(),
      nextRetryAt: this._nextRetryAt?.toISOString(),
      isExpired: this.isExpired(),
      failureReason: this._failureReason,
      tags: this._metadata.tags
    };
  }
}
