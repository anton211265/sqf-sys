import { DependencyInjectionTokenEnum } from '@app/common/constants/dependency-injection-token.enum';
import {
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as glob from 'glob';
import * as nodemailer from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';
import * as path from 'path';
import * as pug from 'pug';
import { SendEmailDto } from './dto/send-email.dto';

@Injectable()
export class EmailService implements OnModuleInit {
  private readonly logger = new Logger(EmailService.name);
  private compiledTemplates: Record<string, pug.compileTemplate> = {};

  constructor(
    private readonly configService: ConfigService,
    @Inject(DependencyInjectionTokenEnum.EMAIL_TRANSPORTER)
    private readonly emailTransporter: nodemailer.Transporter<SMTPTransport.SentMessageInfo>,
  ) {}

  onModuleInit() {
    this.loadTemplates();
  }

  private loadTemplates = () => {
    const templatesDir = path.resolve(
      this.configService.getOrThrow('ROOT_DIR'),
      './templates',
    );
    const templateFilePaths = glob.sync(
      path.resolve(templatesDir, './**/*.pug'),
    );
    for (const templateFilePath of templateFilePaths) {
      const templateContent = fs.readFileSync(templateFilePath, 'utf-8');
      const compiledFunction = pug.compile(templateContent);
      const templateName = templateFilePath.split(templatesDir).at(-1);
      this.compiledTemplates[templateName] = compiledFunction;
    }
  };

  sendEmail = async ({
    emailSender,
    emailReceivers,
    emailCc,
    emailBcc,
    emailReplyTo,
    emailSubject,
    emailTemplate,
    emailBody,
  }: SendEmailDto) => {
    if (emailTemplate && !this.compiledTemplates[emailTemplate.templateName]) {
      throw new NotFoundException('Template not found');
    }

    try {
      const response = await this.emailTransporter.sendMail({
        from: emailSender,
        to: emailReceivers,
        cc: emailCc,
        bcc: emailBcc,
        replyTo: emailReplyTo,
        subject: emailSubject,
        html: emailTemplate
          ? this.compiledTemplates[emailTemplate.templateName](
              emailTemplate.templateVariables,
            )
          : emailBody,
      });

      this.logger.log(`Email sent: ${response.messageId}`);
    } catch (err) {
      this.logger.error(`Error sending email: ${err}`);
    }
  };
}
