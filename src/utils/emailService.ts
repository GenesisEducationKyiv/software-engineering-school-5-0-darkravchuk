import { ServerClient } from 'postmark';

const client = new ServerClient(process.env.POSTMARK_API_KEY || '');
console.log('Postmark API Key:', process.env.POSTMARK_API_KEY ? 'Set' : 'Not set');

export const sendConfirmationEmail = async (to: string, confirmationToken: string) => {
    const confirmationLink = `http://localhost:3000/confirm/${confirmationToken}`;
    console.log(`Preparing to send email from: darija.kravchuk@knu.ua to: ${to} with token: ${confirmationToken}`);

    const msg = {
        From: 'darija.kravchuk@knu.ua',
        To: to,
        Subject: 'Confirm Your Weather Subscription',
        TextBody: `Please confirm your subscription by clicking the link: ${confirmationLink}`,
        HtmlBody: `
            <h2>Confirm Your Weather Subscription</h2>
            <p>Click the link below to confirm your subscription:</p>
            <a href="${confirmationLink}">${confirmationLink}</a>
        `,
        MessageStream: 'outbound',
    };

    try {
        const response = await client.sendEmail(msg);
        console.log(`Confirmation email sent to ${to} with MessageID:`, response.MessageID);
        return response;
    } catch (error) {
        console.error('Error sending email:', error);
        throw new Error('Failed to send confirmation email');
    }
};