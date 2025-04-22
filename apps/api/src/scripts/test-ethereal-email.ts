import * as nodemailer from 'nodemailer';
import * as Handlebars from 'handlebars';

async function testEtherealEmail() {
  console.log('Testing email with Ethereal...');

  try {
    // Create a test account at Ethereal.email
    console.log('Creating test account...');
    const testAccount = await nodemailer.createTestAccount();
    console.log('Test account created:');
    console.log(`- Email: ${testAccount.user}`);
    console.log(`- Password: ${testAccount.pass}`);

    // Create a reusable transporter using the test account
    const transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });

    // Compile a simple template
    const template = Handlebars.compile(`
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee;">
        <h1 style="color: #4F46E5;">Ethereal Email Test</h1>
        <p>Hello {{name}},</p>
        <p>This is a test email using Ethereal.</p>
        <p>If this test is successful, you can use Ethereal for testing your email functionality without needing a real SMTP server.</p>
        <p>Timestamp: {{timestamp}}</p>
      </div>
    `);

    // Render HTML
    const html = template({
      name: 'Test User',
      timestamp: new Date().toISOString()
    });

    // Send mail with defined transport object
    console.log('Sending test email...');
    const info = await transporter.sendMail({
      from: '"Vorex Test" <test@vorex.com>',
      to: 'recipient@example.com',
      subject: 'Test Email from Vorex (Ethereal)',
      html: html,
    });

    console.log('Email sent successfully!');
    console.log('Message ID:', info.messageId);
    
    // Preview URL (this is the key benefit of Ethereal)
    console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
    console.log('Open the above URL to see your test email in the Ethereal web interface');
  } catch (error) {
    console.error('ERROR: Failed to send test email with Ethereal.');
    console.error(error);
  }
}

// Run the test
testEtherealEmail(); 