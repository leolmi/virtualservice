import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';
import {
  DEFAULT_BASE_URL,
  DEFAULT_SMTP_FROM,
  DEFAULT_SMTP_HOST,
  DEFAULT_SMTP_PASS,
  DEFAULT_SMTP_PORT,
  DEFAULT_SMTP_USER,
} from '../../defaults';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: Transporter;
  private readonly logoDataUri =
    'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiA/PjwhRE9DVFlQRSBzdmcgIFBVQkxJQyAnLS8vVzNDLy9EVEQgU1ZHIDEuMS8vRU4nICAnaHR0cDovL3d3dy53My5vcmcvR3JhcGhpY3MvU1ZHLzEuMS9EVEQvc3ZnMTEuZHRkJz48c3ZnIGhlaWdodD0iMzJweCIgaWQ9IkxheWVyXzEiIHN0eWxlPSJlbmFibGUtYmFja2dyb3VuZDpuZXcgMCAwIDMyIDMyOyIgdmVyc2lvbj0iMS4xIiB2aWV3Qm94PSIwIDAgMzIgMzIiIHdpZHRoPSIzMnB4IiB4bWw6c3BhY2U9InByZXNlcnZlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIj48ZyB0cmFuc2Zvcm09InRyYW5zbGF0ZSg1NzYgNDgpIj48cGF0aCBkPSJNLTU0OC4wNzEtMzQuOTQ1Qy01NDguMDIyLTM1LjI5My01NDgtMzUuNjQ2LTU0OC0zNmMwLTQuNDEtMy41ODgtOC04LThjLTIuNTU5LDAtNC45MDcsMS4yMDgtNi4zOTYsMy4xODkgICBDLTU2Mi45MTktNDAuOTM4LTU2My40NTUtNDEtNTY0LTQxYy0zLjg1OCwwLTcsMy4xNDEtNyw3YzAsMC4wOTgsMC4wMDIsMC4xOTEsMC4wMDcsMC4yODhDLTU3My44ODctMzIuODU0LTU3Ni0zMC4xNjgtNTc2LTI3ICAgYzAsMy44NTcsMy4xNDIsNyw3LDdoMTdjNC40MTIsMCw4LTMuNTg4LDgtOEMtNTQ0LTMwLjkxNy01NDUuNjA0LTMzLjU1MS01NDguMDcxLTM0Ljk0NXogTS01NTItMjJoLTE3Yy0yLjc2MiwwLTUtMi4yMzgtNS01ICAgYzAtMi43NjMsMi4yMzgtNSw1LTVjMC4xNTIsMCwwLjI5OCwwLjAzMSwwLjQ0NSwwLjA0NUMtNTY4LjgzNi0zMi41OC01NjktMzMuMjctNTY5LTM0YzAtMi43NjMsMi4yMzgtNSw1LTUgICBjMC45MDIsMCwxLjczOCwwLjI1OCwyLjQ3LDAuNjc1Qy01NjAuNjI1LTQwLjQ4NC01NTguNDg5LTQyLTU1Ni00MmMzLjMxMywwLDYsMi42ODYsNiw2YzAsMC43ODgtMC4xNjEsMS41MzgtMC40MzgsMi4yMjkgICBjMi41NTUsMC42OSw0LjQzOCwzLDQuNDM4LDUuNzcxQy01NDYtMjQuNjg4LTU0OC42ODctMjItNTUyLTIyeiIvPjxwYXRoIGQ9Ik0tNTYxLjQxNC0zMGwtMi44MjctMi44MjlMLTU2Ny4wNjktMzBsNS42NTUsNS42NTZsOC40ODQtOC40ODVsLTIuODI4LTIuODI3TC01NjEuNDE0LTMweiIvPjwvZz48L3N2Zz4=';

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.getOrThrow<string>(
        'SMTP_HOST',
        DEFAULT_SMTP_HOST,
      ),
      port: this.configService.get<number>('SMTP_PORT', DEFAULT_SMTP_PORT),
      secure:
        this.configService.get<number>('SMTP_PORT', DEFAULT_SMTP_PORT) === 465,
      auth: {
        user: this.configService.getOrThrow<string>(
          'SMTP_USER',
          DEFAULT_SMTP_USER,
        ),
        pass: this.configService.getOrThrow<string>(
          'SMTP_PASS',
          DEFAULT_SMTP_PASS,
        ),
      },
    });
  }

  async sendVerificationEmail(
    toEmail: string,
    verificationToken: string,
  ): Promise<void> {
    const baseUrl = this.configService.get<string>(
      'BASE_URL',
      DEFAULT_BASE_URL,
    );
    const verifyUrl = `${baseUrl}/auth/verify-email?token=${verificationToken}`;
    const from = this.configService.get<string>('SMTP_FROM', DEFAULT_SMTP_FROM);

    try {
      await this.transporter.sendMail({
        from,
        to: toEmail,
        subject: 'Confirm your email address — VirtualService',
        html: this.buildVerificationEmailHtml(verifyUrl),
        text: `Welcome to VirtualService!\n\nConfirm your email by visiting this link (valid for 48 hours):\n${verifyUrl}`,
      });
      this.logger.log(`Verification email sent to ${toEmail}`);
    } catch (error) {
      this.logger.error(
        `Error sending verification email to ${toEmail}`,
        error,
      );
      throw error;
    }
  }

  async sendPasswordResetEmail(
    toEmail: string,
    resetToken: string,
    isMigration = false,
  ): Promise<void> {
    const frontendUrl = this.configService.get<string>(
      'FRONTEND_URL',
      DEFAULT_BASE_URL,
    );
    const resetUrl = `${frontendUrl}/auth/reset-password?token=${resetToken}`;
    const from = this.configService.get<string>('SMTP_FROM', DEFAULT_SMTP_FROM);

    const subject = isMigration
      ? 'Set your password — VirtualService'
      : 'Reset your password — VirtualService';

    try {
      await this.transporter.sendMail({
        from,
        to: toEmail,
        subject,
        html: this.buildPasswordResetEmailHtml(resetUrl, isMigration),
        text: isMigration
          ? `We've updated our platform.\n\nSet your new password by visiting this link (valid for 48 hours):\n${resetUrl}`
          : `Reset your password by visiting this link (valid for 48 hours):\n${resetUrl}`,
      });
      this.logger.log(`Password reset email sent to ${toEmail}`);
    } catch (error) {
      this.logger.error(
        `Error sending password reset email to ${toEmail}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Invia una mail generica (testo libero) a uno o più destinatari.
   * Il body viene inserito in un template HTML semplice.
   */
  async sendBulkEmail(
    recipients: string[],
    subject: string,
    body: string,
  ): Promise<{ sent: number; failed: number }> {
    const from = this.configService.get<string>('SMTP_FROM', DEFAULT_SMTP_FROM);
    const html = this.buildGenericEmailHtml(subject, body);
    const text = body;

    let sent = 0;
    let failed = 0;

    for (const to of recipients) {
      try {
        await this.transporter.sendMail({ from, to, subject, html, text });
        this.logger.log(`Bulk email sent to ${to}`);
        sent++;
      } catch (error) {
        this.logger.error(`Failed to send bulk email to ${to}`, error);
        failed++;
      }
    }

    return { sent, failed };
  }

  private get logoHtml(): string {
    return `<div style="text-align: center; margin-bottom: 24px;">
      <img src="${this.logoDataUri}" alt="VirtualService" width="48" height="48" style="display: inline-block;">
    </div>`;
  }

  private buildGenericEmailHtml(title: string, body: string): string {
    // Converte \n in <br> per il body
    const htmlBody = body.replace(/\n/g, '<br>');
    return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>${title}</title></head>
<body style="font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; padding: 32px;">
    ${this.logoHtml}
    <h1 style="color: #333; margin-top: 0;">${title}</h1>
    <div style="color: #555; line-height: 1.6;">${htmlBody}</div>
    <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
    <p style="color: #999; font-size: 11px;">
      This email was sent by VirtualService administration.
    </p>
  </div>
</body>
</html>`;
  }

  private buildPasswordResetEmailHtml(resetUrl: string, isMigration: boolean): string {
    const title = isMigration ? 'Set your new password' : 'Reset your password';
    const intro = isMigration
      ? `We've updated our platform and you need to set a new password to continue.
         Click the button below — the link is valid for <strong>48 hours</strong>.`
      : `We received a request to reset your password.
         Click the button below — the link is valid for <strong>48 hours</strong>.`;

    return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>${title}</title></head>
<body style="font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; padding: 32px;">
    ${this.logoHtml}
    <h1 style="color: #333; margin-top: 0;">${title}</h1>
    <p style="color: #555; line-height: 1.6;">${intro}</p>
    <div style="text-align: center; margin: 32px 0;">
      <a href="${resetUrl}"
         style="background: #4F46E5; color: white; padding: 14px 28px; text-decoration: none;
                border-radius: 6px; font-weight: bold; display: inline-block;">
        ${isMigration ? 'Set my password' : 'Reset my password'}
      </a>
    </div>
    <p style="color: #888; font-size: 12px;">
      If you did not request this, please ignore this email.
    </p>
    <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
    <p style="color: #999; font-size: 11px;">
      If the button does not work, copy and paste this link into your browser:<br>
      <a href="${resetUrl}" style="color: #4F46E5;">${resetUrl}</a>
    </p>
  </div>
</body>
</html>`;
  }

  private buildVerificationEmailHtml(verifyUrl: string): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Confirm Email</title></head>
<body style="font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; padding: 32px;">
    ${this.logoHtml}
    <h1 style="color: #333; margin-top: 0;">Welcome to VirtualService</h1>
    <p style="color: #555; line-height: 1.6;">
      Thank you for signing up! Click the button below to activate your account.
      The link is valid for <strong>48 hours</strong>.
    </p>
    <div style="text-align: center; margin: 32px 0;">
      <a href="${verifyUrl}"
         style="background: #4F46E5; color: white; padding: 14px 28px; text-decoration: none;
                border-radius: 6px; font-weight: bold; display: inline-block;">
        Confirm my email address
      </a>
    </div>
    <p style="color: #888; font-size: 12px;">
      If you did not create an account on VirtualService, please ignore this email.
    </p>
    <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
    <p style="color: #999; font-size: 11px;">
      If the button does not work, copy and paste this link into your browser:<br>
      <a href="${verifyUrl}" style="color: #4F46E5;">${verifyUrl}</a>
    </p>
  </div>
</body>
</html>`;
  }
}
