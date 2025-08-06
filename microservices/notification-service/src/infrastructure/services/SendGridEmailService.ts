import sgMail from '@sendgrid/mail';
import { IEmailService, EmailDeliveryResult } from '../../domain/repositories/IEmailService';
import { EmailAddress } from '../../domain/value-objects/EmailAddress';

export class SendGridEmailService implements IEmailService {
  private readonly apiKey: string;
  private readonly fromEmail: string;
  private isInitialized = false;

  constructor() {
    this.apiKey = process.env.SENDGRID_API_KEY || '';
    this.fromEmail = process.env.FROM_EMAIL || 'noreply@weatherapp.com';
    
    if (!this.apiKey) {
      console.warn('SENDGRID_API_KEY not found in environment variables. Email service will not work.');
    } else {
      sgMail.setApiKey(this.apiKey);
      this.isInitialized = true;
      console.log('SendGrid email service initialized');
    }
  }

  async sendEmail(params: {
    to: EmailAddress;
    subject: string;
    body: string;
    isHtml?: boolean;
  }): Promise<EmailDeliveryResult> {
    try {
      if (!this.isInitialized) {
        console.log('\n =============== EMAIL (SendGrid Not Configured) ===============');
        console.log(` To: ${params.to.toString()}`);
        console.log(` Subject: ${params.subject}`);
        console.log(' Body:');
        console.log(params.body);
        console.log('==============================================================\n');
        
        return {
          success: true,
          messageId: `fallback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          deliveredAt: new Date()
        };
      }

      const msg = {
        to: params.to.toString(),
        from: this.fromEmail,
        subject: params.subject,
        ...(params.isHtml ? { html: params.body } : { text: params.body })
      };

      const [response] = await sgMail.send(msg);
      
      console.log(` Email sent successfully to ${params.to.toString()}`);
      
      return {
        success: true,
        messageId: response.headers['x-message-id'] || `sg_${Date.now()}`,
        deliveredAt: new Date()
      };

    } catch (error: any) {
      console.error(' Failed to send email via SendGrid:', error);
      
      let errorMessage = 'Unknown SendGrid error';
      if (error.response?.body?.errors) {
        errorMessage = error.response.body.errors.map((e: any) => e.message).join(', ');
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  async sendBulkEmails(emails: Array<{
    to: EmailAddress;
    subject: string;
    body: string;
    isHtml?: boolean;
  }>): Promise<EmailDeliveryResult[]> {
    const results: EmailDeliveryResult[] = [];

    for (const email of emails) {
      const result = await this.sendEmail(email);
      results.push(result);
    }

    return results;
  }

  async isServiceAvailable(): Promise<boolean> {
    if (!this.isInitialized) {
      return false;
    }

    try {
      return true;
    } catch {
      return false;
    }
  }

  async getRemainingQuota(): Promise<number | null> {
    return null;
  }

  async validateEmailAddress(email: EmailAddress): Promise<boolean> {
    return EmailAddress.isValid(email.toString());
  }

  async sendTemplateEmail(params: {
    to: EmailAddress;
    templateId: string;
    variables: Record<string, any>;
  }): Promise<EmailDeliveryResult> {
    try {
      if (!this.isInitialized) {
        console.log('\n📧 =============== TEMPLATE EMAIL (SendGrid Not Configured) ===============');
        console.log(`To: ${params.to.toString()}`);
        console.log(`Template ID: ${params.templateId}`);
        console.log(`Variables: ${JSON.stringify(params.variables, null, 2)}`);
        console.log('=========================================================================\n');
        
        return {
          success: true,
          messageId: `fallback_template_${Date.now()}`,
          deliveredAt: new Date()
        };
      }

      const msg = {
        to: params.to.toString(),
        from: this.fromEmail,
        templateId: params.templateId,
        dynamicTemplateData: params.variables
      };

      const [response] = await sgMail.send(msg);
      
      console.log(`Template email sent successfully to ${params.to.toString()}`);
      
      return {
        success: true,
        messageId: response.headers['x-message-id'] || `sg_template_${Date.now()}`,
        deliveredAt: new Date()
      };

    } catch (error: any) {
      console.error('Failed to send template email via SendGrid:', error);
      
      let errorMessage = 'Unknown SendGrid template error';
      if (error.response?.body?.errors) {
        errorMessage = error.response.body.errors.map((e: any) => e.message).join(', ');
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }
}
