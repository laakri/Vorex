import * as nodemailer from 'nodemailer';
import * as dotenv from 'dotenv';
import { join } from 'path';
import * as fs from 'fs';
import * as Handlebars from 'handlebars';

// Load environment variables from .env file
dotenv.config();

async function testEmailSending() {
  console.log('Email Test: Starting...');
  
  // Log environment variables (without passwords)
  console.log('Email Configuration:');
  console.log(`- HOST: ${process.env.EMAIL_HOST || 'Not set'}`);
  console.log(`- PORT: ${process.env.EMAIL_PORT || 'Not set'}`);
  console.log(`- USER: ${process.env.EMAIL_USER || 'Not set'}`);
  console.log(`- FROM: ${process.env.EMAIL_FROM || 'Not set'}`);
  console.log(`- FRONTEND_URL: ${process.env.FRONTEND_URL || 'Not set'}`);
  
  // Create test email template if it doesn't exist
  const templateDir = join(__dirname, '..', 'modules', 'email', 'templates');
  const testTemplatePath = join(templateDir, 'test-email.hbs');
  
  if (!fs.existsSync(testTemplatePath)) {
    const testTemplate = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Test Email</title>
</head>
<body>
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee;">
    <h1 style="color: #4F46E5;">Email Test</h1>
    <p>Hello {{name}},</p>
    <p>This is a test email from Vorex.</p>
    <p>If you're seeing this, the email service is working correctly!</p>
    <p>Timestamp: {{timestamp}}</p>
  </div>
</body>
</html>
`;
    // Ensure directory exists
    if (!fs.existsSync(templateDir)) {
      fs.mkdirSync(templateDir, { recursive: true });
    }
    fs.writeFileSync(testTemplatePath, testTemplate);
    console.log(`Created test template at ${testTemplatePath}`);
  }

  try {
    // Create a transporter for testing
    console.log('Creating test transporter...');
    const testTransporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_PORT === '465', // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
      // Debug options
      logger: true,
      debug: true // Include SMTP traffic in the logs
    });

    // Verify connection configuration
    console.log('Verifying connection...');
    await testTransporter.verify();
    console.log('Connection verified successfully!');

    // Compile template
    console.log('Compiling template...');
    const templateContent = fs.readFileSync(testTemplatePath, 'utf-8');
    const template = Handlebars.compile(templateContent);
    
    // Set test email details
    const testEmail = process.env.EMAIL_USER || process.env.TEST_EMAIL || '';
    if (!testEmail) {
      throw new Error('No test email address found. Set EMAIL_USER or TEST_EMAIL in your .env file.');
    }
    
    // Generate HTML content
    const html = template({
      name: 'Test User',
      timestamp: new Date().toISOString()
    });

    // Send test email
    console.log(`Sending test email to ${testEmail}...`);
    const info = await testTransporter.sendMail({
      from: process.env.EMAIL_FROM || testEmail,
      to: testEmail,
      subject: 'Vorex Email Service Test',
      html
    });

    console.log('Email sent successfully!');
    console.log('Message ID:', info.messageId);
    console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
  } catch (error) {
    console.error('ERROR: Failed to send test email.');
    console.error(error);
  }
}

// Run the test function
testEmailSending(); 