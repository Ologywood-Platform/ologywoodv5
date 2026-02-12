import sgMail from '@sendgrid/mail';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'noreply@ologywood.com';

if (!SENDGRID_API_KEY) {
  console.error('❌ SENDGRID_API_KEY not configured in environment variables');
  process.exit(1);
}

sgMail.setApiKey(SENDGRID_API_KEY);

const getConfirmationEmailTemplate = (userName) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Account Deletion Confirmation</h2>
      <p>Hi ${userName},</p>
      <p>Your Ologywood account has been successfully deleted. All your personal data, bookings, messages, and preferences have been permanently removed from our system.</p>
      
      <h3>What Was Deleted:</h3>
      <ul>
        <li>Your profile information and settings</li>
        <li>All booking history and contracts</li>
        <li>Messages and conversations</li>
        <li>Reviews and ratings</li>
        <li>Saved preferences and notifications</li>
        <li>All other associated data</li>
      </ul>

      <p>If you have any questions or believe this was done in error, please contact our support team within 30 days.</p>

      <p>Thank you for being part of the Ologywood community.</p>

      <hr style="margin-top: 40px; border: none; border-top: 1px solid #ccc;">
      <p style="font-size: 12px; color: #666;">
        This is an automated message. Please do not reply to this email.
      </p>
    </div>
  `;
};

async function sendTestEmail() {
  try {
    console.log('📧 Sending test account deletion email...');
    console.log(`   To: garychisolm30@gmail.com`);
    console.log(`   From: ${SENDGRID_FROM_EMAIL}`);

    const message = {
      to: 'garychisolm30@gmail.com',
      from: SENDGRID_FROM_EMAIL,
      subject: 'Your Ologywood Account Has Been Deleted',
      html: getConfirmationEmailTemplate('Gary Chisolm'),
    };

    const response = await sgMail.send(message);
    
    console.log('\n✅ Email sent successfully!');
    console.log(`   Message ID: ${response[0].headers['x-message-id']}`);
    console.log(`   Status: ${response[0].statusCode}`);
    console.log('\n📬 Check your email at garychisolm30@gmail.com for the test message.');
    
  } catch (error) {
    console.error('\n❌ Error sending email:');
    console.error(error.message);
    if (error.response) {
      console.error('Response:', error.response.body);
    }
    process.exit(1);
  }
}

sendTestEmail();
