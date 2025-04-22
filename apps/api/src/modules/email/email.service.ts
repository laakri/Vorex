import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as Handlebars from 'handlebars';
import { join } from 'path';
import { readFileSync } from 'fs';

interface EmailOptions {
  to: string;
  subject: string;
  template: EmailTemplate;
  context: Record<string, any>;
}

export enum EmailTemplate {
  ORDER_CREATED = 'order-created',
  ORDER_STATUS_UPDATED = 'order-status-updated',
  DELIVERY_ASSIGNED = 'delivery-assigned',
  DELIVERY_STATUS_UPDATED = 'delivery-status-updated',
  WAREHOUSE_ARRIVAL = 'warehouse-arrival',
  DRIVER_WELCOME = 'driver-welcome',
  DRIVER_REJECTED = 'driver-rejected',
  ADMIN_DRIVER_REVIEW = 'admin-driver-review',
  SELLER_WELCOME = 'seller-welcome',
  EMAIL_VERIFICATION = 'email-verification',
  PASSWORD_RESET = 'password-reset'
}

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;
  private templates: Map<EmailTemplate, Handlebars.TemplateDelegate>;
  private readonly logger = new Logger(EmailService.name);
  private isDevMode: boolean;
  private etherealAccount: { user: string; pass: string } | null = null;

  constructor(private configService: ConfigService) {
    this.isDevMode = this.configService.get('NODE_ENV') !== 'production';
    this.initializeTransporter();
    this.loadTemplates();
  }

  private async initializeTransporter() {
    try {
      if (this.isDevMode && !this.configService.get('EMAIL_HOST')) {
        this.logger.log('Development mode detected - using Ethereal for email testing');
        
        // Create test account on Ethereal
        this.etherealAccount = await nodemailer.createTestAccount();
        this.logger.log(`Ethereal account created: ${this.etherealAccount.user}`);
        
        this.transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: this.etherealAccount.user,
            pass: this.etherealAccount.pass,
          },
        });
        
        this.logger.log('Ethereal email transporter configured');
        return;
      }
      
      this.transporter = nodemailer.createTransport({
        host: this.configService.get('EMAIL_HOST'),
        port: parseInt(this.configService.get('EMAIL_PORT') || '587'),
        secure: this.configService.get('EMAIL_PORT') === '465',
        auth: {
          user: this.configService.get('EMAIL_USER'),
          pass: this.configService.get('EMAIL_PASSWORD'),
        },
      });

      // Verify connection
      await this.transporter.verify();
      this.logger.log('Email transporter initialized successfully');
    } catch (error) {
      this.logger.error(`Failed to initialize email transporter: ${error.message}`, error.stack);
      if (this.isDevMode) {
        this.logger.warn('Email sending will be mocked in development mode');
      } else {
        throw error; // Rethrow in production
      }
    }
  }

  private loadTemplates() {
    this.templates = new Map();
    Object.values(EmailTemplate).forEach((template) => {
      try {
        const templatePath = join(__dirname, 'templates', `${template}.hbs`);
        const templateContent = readFileSync(templatePath, 'utf-8');
        this.templates.set(template, Handlebars.compile(templateContent));
      } catch (error) {
        this.logger.warn(`Template ${template} not found or could not be loaded`);
      }
    });

    this.logger.log(`Loaded ${this.templates.size} email templates`);
  }

  async sendEmail(options: EmailOptions) {
    const template = this.templates.get(options.template);
    if (!template) {
      throw new Error(`Template ${options.template} not found`);
    }

    const html = template(options.context);

    try {
      // In dev mode without a working transporter, just log the email
      if (this.isDevMode && !this.transporter) {
        this.logger.log(`[MOCK EMAIL] To: ${options.to}, Subject: ${options.subject}`);
        this.logger.debug(`[MOCK EMAIL CONTENT] ${html.substring(0, 100)}...`);
        return;
      }

      const info = await this.transporter.sendMail({
        from: this.configService.get('EMAIL_FROM') || 'noreply@vorex.com',
        to: options.to,
        subject: options.subject,
        html,
      });

      // Log ethereal URL in development
      if (this.isDevMode && this.etherealAccount) {
        const previewUrl = nodemailer.getTestMessageUrl(info);
        this.logger.log(`Email sent! Preview it at: ${previewUrl}`);
      } else {
        this.logger.log(`Email sent to ${options.to}, messageId: ${info.messageId}`);
      }
      
      return info;
    } catch (error) {
      this.logger.error(`Failed to send email to ${options.to}: ${error.message}`, error.stack);
      if (!this.isDevMode) {
        throw error; // Rethrow in production
      }
    }
  }

  async sendVerificationEmail(email: string, name: string, token: string) {
    const frontendUrl = this.configService.get('FRONTEND_URL') || 'http://localhost:4200';
    const verificationLink = `${frontendUrl}/auth/verify-email?token=${token}`;
    
    await this.sendEmail({
      to: email,
      subject: 'Verify Your Email Address',
      template: EmailTemplate.EMAIL_VERIFICATION,
      context: {
        name,
        verificationLink,
      },
    });
    
    this.logger.log(`Verification email sent to ${email}`);
  }

  async sendPasswordResetEmail(email: string, name: string, token: string) {
    const frontendUrl = this.configService.get('FRONTEND_URL') || 'http://localhost:4200';
    const resetLink = `${frontendUrl}/auth/reset-password?token=${token}`;
    
    await this.sendEmail({
      to: email,
      subject: 'Reset Your Password',
      template: EmailTemplate.PASSWORD_RESET,
      context: {
        name,
        resetLink,
      },
    });
    
    this.logger.log(`Password reset email sent to ${email}`);
  }
} 