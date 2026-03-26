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

  private buildVerificationEmailHtml(verifyUrl: string): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Confirm Email</title></head>
<body style="font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; padding: 32px;">
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
