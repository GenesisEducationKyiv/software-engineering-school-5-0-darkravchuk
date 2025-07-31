import sgMail from '@sendgrid/mail';
import {IEmailProvider} from '../../interfaces/IEmailProvider';

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
            const response = await sgMail.send({
                ...msg, mailSettings: {
                    sandboxMode: {
                        enable: process.env.NODE_ENV === 'e2e_test',
                    }
                }
            });
            console.log(`Email sent to ${msg.to}`, response);
            return response;
        } catch (error) {
            console.error('Error sending email via SendGrid:', error);
            throw new Error('Failed to send email via SendGrid');
        }
    }
}