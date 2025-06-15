import sgMail from '@sendgrid/mail';

export interface EmailService {
  send: (msg: any) => Promise<any>;
  setApiKey: (apiKey: string) => void;
}

export class EmailSender {
  private sgMail: EmailService;
  private domain: string;
  private emailFrom: string;

  constructor(sgMail: EmailService, domain: string, emailFrom: string) {
    this.sgMail = sgMail;
    this.domain = domain;
    this.emailFrom = emailFrom;
    this.sgMail.setApiKey(process.env.SENDGRID_API_KEY || '');
  }

  async sendConfirmationEmail(to: string, confirmationToken: string) {
    const confirmationLink = `${this.domain}/confirm/${confirmationToken}`;
    console.log(`Preparing to send email to: ${to} with token: ${confirmationToken}`);

    const msg = {
      to,
      from: this.emailFrom,
      subject: 'Confirm Your Weather Subscription',
      text: `Please confirm your subscription by clicking the link: ${confirmationLink}`,
      html: `
        <h2>Confirm Your Weather Subscription</h2>
        <p>Click the link below to confirm your subscription:</p>
        <a href="${confirmationLink}">${confirmationLink}</a>
      `,
    };

    try {
      const response = await this.sgMail.send(msg);
      console.log(`Confirmation email sent to ${to}`, response);
      return response;
    } catch (error) {
      console.error('Error sending email:', error);
      throw new Error('Failed to send confirmation email');
    }
  }
}

const emailService: EmailService = sgMail;
const sender = new EmailSender(emailService, process.env.DOMAIN || '', process.env.EMAIL || '');
export default sender;