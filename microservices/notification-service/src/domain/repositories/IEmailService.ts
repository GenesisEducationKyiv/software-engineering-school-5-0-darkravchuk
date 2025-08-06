import { EmailAddress } from '../value-objects/EmailAddress';

export interface EmailDeliveryResult {
  success: boolean;
  messageId?: string;
  error?: string;
  deliveredAt?: Date;
}

export interface IEmailService {
  sendEmail(params: {
    to: EmailAddress;
    subject: string;
    body: string;
    isHtml?: boolean;
  }): Promise<EmailDeliveryResult>;
  
  sendBulkEmails(emails: Array<{
    to: EmailAddress;
    subject: string;
    body: string;
    isHtml?: boolean;
  }>): Promise<EmailDeliveryResult[]>;
  
  isServiceAvailable(): Promise<boolean>;
  getRemainingQuota(): Promise<number | null>;
  
  validateEmailAddress(email: EmailAddress): Promise<boolean>;
  
  sendTemplateEmail(params: {
    to: EmailAddress;
    templateId: string;
    variables: Record<string, any>;
  }): Promise<EmailDeliveryResult>;
}
