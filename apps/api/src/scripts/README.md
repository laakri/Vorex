# Email Testing Scripts

This directory contains scripts to test the email functionality of the Vorex platform.

## Setup

Before running the scripts, make sure your `.env` file is properly configured with email settings:

```
# Email Configuration
EMAIL_HOST=your-smtp-server.com
EMAIL_PORT=587  # or 465 for secure
EMAIL_USER=your-email@example.com
EMAIL_PASSWORD=your-password
EMAIL_FROM=noreply@your-domain.com
FRONTEND_URL=http://localhost:5173

# Node Environment
NODE_ENV=development
```

## Available Test Scripts

### 1. Test with Your SMTP Server

This script tests email sending using your configured SMTP server:

```bash
# Navigate to the API directory
cd vorex/apps/api

# Run the script with Bun
bun run src/scripts/test-email.ts
```

### 2. Test with Ethereal (Fake SMTP Service)

This script uses Ethereal.email, a fake SMTP service that lets you test email sending without actually sending emails:

```bash
# Navigate to the API directory
cd vorex/apps/api

# Run the script with Bun
bun run src/scripts/test-ethereal-email.ts
```

The script will create a temporary Ethereal account and show you a preview URL where you can see the email that would have been sent.

## Troubleshooting Common Email Issues

1. **Connection Refused**: Check if your EMAIL_HOST is correct and if your network allows connections to the specified port.

2. **Authentication Failed**: Verify your EMAIL_USER and EMAIL_PASSWORD are correct.

3. **Secure Connection Required**: Some providers require secure connections. Try setting EMAIL_PORT to 465 and check your provider's documentation.

4. **Development Environment**: Use the Ethereal testing script which doesn't require a real SMTP server.

5. **Google/Gmail Accounts**: If using Gmail, you might need to:
   - Enable "Less secure app access" (not recommended for production)
   - Use an App Password instead of your regular password
   - Use OAuth2 authentication (requires additional setup)

6. **Microsoft/Outlook Accounts**: Similar to Gmail, you might need to use an App Password or adjust security settings.

## Using the Updated EmailService

The EmailService has been updated to automatically handle development environments:

1. In development mode without email configuration, it will use Ethereal or mock emails
2. Email previews are available when using Ethereal
3. Proper error handling and logging is implemented

For local development, you can simply run the application without configuring real email credentials, and the service will automatically adapt. 