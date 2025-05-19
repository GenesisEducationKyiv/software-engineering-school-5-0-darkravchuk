import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY || '');
console.log('SendGrid API Key:', process.env.SENDGRID_API_KEY ? 'Set' : 'Not set');

export const sendConfirmationEmail = async (to: string, confirmationToken: string) => {
    const confirmationLink = `http://localhost:3000/confirm/${confirmationToken}`;
    console.log(`Preparing to send email to: ${to} with token: ${confirmationToken}`);

    const msg = {
        to,
        from: 'darija.kravchuk@knu.ua',
        subject: 'Confirm Your Weather Subscription',
        text: `Please confirm your subscription by clicking the link: ${confirmationLink}`,
        html: `
      <h2>Confirm Your Weather Subscription</h2>
      <p>Click the link below to confirm your subscription:</p>
      <a href="${confirmationLink}">${confirmationLink}</a>
    `,
    };

    try {
        const response = await sgMail.send(msg);
        console.log(`Confirmation email sent to ${to}`, response);
        return response;
    } catch (error) {
        console.error('Error sending email:', error);
        throw new Error('Failed to send confirmation email');
    }
};