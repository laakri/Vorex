import { Injectable } from '@nestjs/common';
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

  constructor(private configService: ConfigService) {
    this.initializeTransporter();
    this.loadTemplates();
  }

  private initializeTransporter() {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('EMAIL_HOST'),
      port: this.configService.get('EMAIL_PORT'),
      secure: true,
      auth: {
        user: this.configService.get('EMAIL_USER'),
        pass: this.configService.get('EMAIL_PASSWORD'),
      },
    });
  }

  private loadTemplates() {
    this.templates = new Map();
    Object.values(EmailTemplate).forEach((template) => {
      try {
        const templatePath = join(__dirname, 'templates', `${template}.hbs`);
        const templateContent = readFileSync(templatePath, 'utf-8');
        this.templates.set(template, Handlebars.compile(templateContent));
      } catch (error) {
        console.warn(`Template ${template} not found or could not be loaded`);
      }
    });
  }

  async sendEmail(options: EmailOptions) {
    const template = this.templates.get(options.template);
    if (!template) {
      throw new Error(`Template ${options.template} not found`);
    }

    const html = template(options.context);

    await this.transporter.sendMail({
      from: this.configService.get('EMAIL_FROM'),
      to: options.to,
      subject: options.subject,
      html,
    });
  }

  async sendVerificationEmail(email: string, name: string, token: string) {
    const verificationLink = `${this.configService.get('FRONTEND_URL')}/auth/verify-email?token=${token}`;
    
    await this.sendEmail({
      to: email,
      subject: 'Verify Your Email Address',
      template: EmailTemplate.EMAIL_VERIFICATION,
      context: {
        name,
        verificationLink,
      },
    });
  }

  async sendPasswordResetEmail(email: string, name: string, token: string) {
    const resetLink = `${this.configService.get('FRONTEND_URL')}/auth/reset-password?token=${token}`;
    
    await this.sendEmail({
      to: email,
      subject: 'Reset Your Password',
      template: EmailTemplate.PASSWORD_RESET,
      context: {
        name,
        resetLink,
      },
    });
  }
} 