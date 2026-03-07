import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: Transporter;

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.getOrThrow<string>('SMTP_HOST'),
      port: this.configService.get<number>('SMTP_PORT', 587),
      secure: this.configService.get<number>('SMTP_PORT', 587) === 465,
      auth: {
        user: this.configService.getOrThrow<string>('SMTP_USER'),
        pass: this.configService.getOrThrow<string>('SMTP_PASS'),
      },
    });
  }

  async sendVerificationEmail(
    toEmail: string,
    verificationToken: string,
  ): Promise<void> {
    const baseUrl = this.configService.get<string>(
      'BASE_URL',
      'http://localhost:3000',
    );
    const verifyUrl = `${baseUrl}/api/auth/verify-email?token=${verificationToken}`;
    const from = this.configService.get<string>(
      'SMTP_FROM',
      'VirtualService <noreply@virtualservice.app>',
    );

    try {
      await this.transporter.sendMail({
        from,
        to: toEmail,
        subject: 'Conferma il tuo indirizzo email — VirtualService',
        html: this.buildVerificationEmailHtml(verifyUrl),
        text: `Benvenuto su VirtualService!\n\nConferma la tua email visitando questo link (valido 48 ore):\n${verifyUrl}`,
      });
      this.logger.log(`Email di verifica inviata a ${toEmail}`);
    } catch (error) {
      this.logger.error(
        `Errore nell'invio dell'email di verifica a ${toEmail}`,
        error,
      );
      throw error;
    }
  }

  private buildVerificationEmailHtml(verifyUrl: string): string {
    return `
<!DOCTYPE html>
<html lang="it">
<head><meta charset="UTF-8"><title>Conferma Email</title></head>
<body style="font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; padding: 32px;">
    <h1 style="color: #333; margin-top: 0;">Benvenuto su VirtualService</h1>
    <p style="color: #555; line-height: 1.6;">
      Grazie per esserti registrato! Per attivare il tuo account clicca sul pulsante qui sotto.
      Il link è valido per <strong>48 ore</strong>.
    </p>
    <div style="text-align: center; margin: 32px 0;">
      <a href="${verifyUrl}"
         style="background: #4F46E5; color: white; padding: 14px 28px; text-decoration: none;
                border-radius: 6px; font-weight: bold; display: inline-block;">
        Conferma il mio indirizzo email
      </a>
    </div>
    <p style="color: #888; font-size: 12px;">
      Se non hai creato un account su VirtualService, ignora questa email.
    </p>
    <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
    <p style="color: #999; font-size: 11px;">
      Se il pulsante non funziona, copia e incolla questo link nel browser:<br>
      <a href="${verifyUrl}" style="color: #4F46E5;">${verifyUrl}</a>
    </p>
  </div>
</body>
</html>`;
  }
}
