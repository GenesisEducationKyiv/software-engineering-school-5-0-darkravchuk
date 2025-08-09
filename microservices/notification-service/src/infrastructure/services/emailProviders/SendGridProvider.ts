import sgMail from '@sendgrid/mail';
import {IEmailProvider} from '../IEmailProvider';

export class SendGridProvider implements IEmailProvider {
  configure(config: { apiKey: string }) {
    sgMail.setApiKey(config.apiKey);
  }

  async send(msg: {
        to: string;
        from: string;
        subject: string;
        text: string;
        html: string;
    }): Promise<any> {
    try {
      if (process.env.NODE_ENV === 'e2e_test')
        return;

      console.log(msg.from);
      const response = await sgMail.send(msg);
      console.log(`Email sent to ${msg.to}`, response);
      return response;
    } catch (error) {
      console.error('Error sending email via SendGrid:', JSON.stringify((error as any).response.body));
      throw new Error('Failed to send email via SendGrid');
    }
  }
}