import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { SystemConfig } from '@/database/entities/system-config.entity';

export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  fromName: string;
  subject: string;
  expireMinutes: number;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(
    @InjectRepository(SystemConfig)
    private readonly configRepository: Repository<SystemConfig>,
    private readonly configService: ConfigService,
  ) {}

  /**
   * 获取当前生效的 SMTP 邮件配置
   */
  async getSmtpConfig(): Promise<SmtpConfig> {
    const keys = [
      'smtp_host',
      'smtp_port',
      'smtp_secure',
      'smtp_user',
      'smtp_pass',
      'smtp_from_name',
      'smtp_mail_subject',
      'smtp_code_expire',
    ];

    const configs = await this.configRepository.find({
      where: { key: In(keys) },
    });

    const map = new Map(configs.map((c) => [c.key, c.value]));

    const host = map.get('smtp_host') || this.configService.get<string>('SMTP_HOST') || '';
    const port = Number(map.get('smtp_port') || this.configService.get<number>('SMTP_PORT') || 465);
    const secureStr = map.get('smtp_secure');
    const secure = secureStr !== undefined ? secureStr === 'true' || secureStr === '1' : port === 465;
    const user = map.get('smtp_user') || this.configService.get<string>('SMTP_USER') || '';
    const pass = map.get('smtp_pass') || this.configService.get<string>('SMTP_PASS') || '';
    const fromName = map.get('smtp_from_name') || this.configService.get<string>('SMTP_FROM_NAME') || '软考刷题通';
    const subject = map.get('smtp_mail_subject') || '【软考刷题通】注册验证码通知';
    const expireMinutes = Number(map.get('smtp_code_expire') || 5);

    return {
      host,
      port,
      secure,
      user,
      pass,
      fromName,
      subject,
      expireMinutes,
    };
  }

  /**
   * 获取对外展示的配置（密码已脱敏）
   */
  async getPublicSmtpConfig(): Promise<Omit<SmtpConfig, 'pass'> & { isPassSet: boolean }> {
    const config = await this.getSmtpConfig();
    const isPassSet = !!config.pass;
    return {
      host: config.host,
      port: config.port,
      secure: config.secure,
      user: config.user,
      fromName: config.fromName,
      subject: config.subject,
      expireMinutes: config.expireMinutes,
      isPassSet,
    };
  }

  /**
   * 保存 SMTP 邮件配置
   */
  async saveSmtpConfig(dto: {
    host: string;
    port: number;
    secure: boolean;
    user: string;
    pass?: string;
    fromName?: string;
    subject?: string;
    expireMinutes?: number;
  }): Promise<void> {
    const items: Array<{ key: string; value: string; description: string }> = [
      { key: 'smtp_host', value: dto.host?.trim() || '', description: 'SMTP服务器地址' },
      { key: 'smtp_port', value: String(dto.port || 465), description: 'SMTP端口' },
      { key: 'smtp_secure', value: dto.secure ? 'true' : 'false', description: '是否使用SSL/TLS' },
      { key: 'smtp_user', value: dto.user?.trim() || '', description: 'SMTP发信账号' },
      { key: 'smtp_from_name', value: dto.fromName?.trim() || '软考刷题通', description: '发件人昵称' },
      { key: 'smtp_mail_subject', value: dto.subject?.trim() || '【软考刷题通】验证码通知', description: '邮件默认主题' },
      { key: 'smtp_code_expire', value: String(dto.expireMinutes || 5), description: '验证码有效期(分钟)' },
    ];

    // 如果提供了新密码且不是占位符，更新密码
    if (dto.pass && dto.pass !== '******' && dto.pass.trim() !== '') {
      items.push({ key: 'smtp_pass', value: dto.pass.trim(), description: 'SMTP发信密码/授权码' });
    }

    for (const item of items) {
      let cfg = await this.configRepository.findOne({ where: { key: item.key } });
      if (cfg) {
        cfg.value = item.value;
        cfg.description = item.description;
      } else {
        cfg = this.configRepository.create({
          key: item.key,
          value: item.value,
          description: item.description,
          type: 'string',
        });
      }
      await this.configRepository.save(cfg);
    }
  }

  /**
   * 创建邮件传输器
   */
  private createTransporter(cfg: SmtpConfig): nodemailer.Transporter {
    if (!cfg.host || !cfg.user || !cfg.pass) {
      throw new BadRequestException('系统尚未配置发信邮箱，请联系管理员在后台【邮件设置】中配置 SMTP 参数');
    }

    return nodemailer.createTransport({
      host: cfg.host,
      port: cfg.port,
      secure: cfg.secure,
      auth: {
        user: cfg.user,
        pass: cfg.pass,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
  }

  /**
   * 发送注册验证码邮件
   */
  async sendRegisterCode(toEmail: string, code: string): Promise<void> {
    const config = await this.getSmtpConfig();
    const transporter = this.createTransporter(config);

    const subject = `【${config.fromName}】注册验证码：${code}`;
    const html = this.renderCodeEmailTemplate({
      appName: config.fromName,
      title: '欢迎注册软考刷题通',
      actionText: '完成账号注册',
      code,
      expireMinutes: config.expireMinutes || 5,
      recipientEmail: toEmail,
    });

    try {
      await transporter.sendMail({
        from: `"${config.fromName}" <${config.user}>`,
        to: toEmail,
        subject,
        html,
      });
      this.logger.log(`Register verification code email sent to ${toEmail}`);
    } catch (err: any) {
      this.logger.error(`Failed to send email to ${toEmail}: ${err.message}`, err.stack);
      throw new BadRequestException(`邮件发送失败: ${err.message || 'SMTP 连接异常，请检查后台发信配置'}`);
    }
  }

  /**
   * 发送找回密码验证码邮件
   */
  async sendResetCode(toEmail: string, code: string): Promise<void> {
    const config = await this.getSmtpConfig();
    const transporter = this.createTransporter(config);

    const subject = `【${config.fromName}】重置密码验证码：${code}`;
    const html = this.renderCodeEmailTemplate({
      appName: config.fromName,
      title: '重置您的账号密码',
      actionText: '重置登录密码',
      code,
      expireMinutes: config.expireMinutes || 5,
      recipientEmail: toEmail,
    });

    try {
      await transporter.sendMail({
        from: `"${config.fromName}" <${config.user}>`,
        to: toEmail,
        subject,
        html,
      });
      this.logger.log(`Password reset verification code email sent to ${toEmail}`);
    } catch (err: any) {
      this.logger.error(`Failed to send reset email to ${toEmail}: ${err.message}`, err.stack);
      throw new BadRequestException(`邮件发送失败: ${err.message || 'SMTP 连接异常，请检查后台发信配置'}`);
    }
  }

  /**
   * 测试 SMTP 邮件发送
   */
  async testSmtp(toEmail: string, customConfig?: Partial<SmtpConfig>): Promise<{ success: boolean; message: string }> {
    const baseConfig = await this.getSmtpConfig();
    const config: SmtpConfig = {
      host: customConfig?.host || baseConfig.host,
      port: customConfig?.port || baseConfig.port,
      secure: customConfig?.secure !== undefined ? customConfig.secure : baseConfig.secure,
      user: customConfig?.user || baseConfig.user,
      pass: customConfig?.pass && customConfig.pass !== '******' ? customConfig.pass : baseConfig.pass,
      fromName: customConfig?.fromName || baseConfig.fromName,
      subject: customConfig?.subject || baseConfig.subject,
      expireMinutes: customConfig?.expireMinutes || baseConfig.expireMinutes,
    };

    if (!config.host || !config.user || !config.pass) {
      throw new BadRequestException('请填写完整的 SMTP 主机地址、发信账号及发信密码/授权码');
    }

    const transporter = this.createTransporter(config);

    // 1. 测试 SMTP 握手连接
    try {
      await transporter.verify();
    } catch (verifyErr: any) {
      throw new BadRequestException(`SMTP 连接验证失败: ${verifyErr.message || '无法连接到邮件服务器'}`);
    }

    // 2. 发送测试邮件
    const subject = `【${config.fromName}】SMTP 邮件服务连接测试成功`;
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 20px auto; padding: 24px; border-radius: 12px; background: #ffffff; border: 1px solid #e5e7eb; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
        <div style="text-align: center; padding-bottom: 16px; border-bottom: 1px solid #f3f4f6;">
          <h2 style="color: #4f46e5; margin: 0; font-size: 22px;">🎉 ${config.fromName}</h2>
          <p style="color: #6b7280; font-size: 13px; margin: 4px 0 0;">邮件服务测试通知</p>
        </div>
        <div style="padding: 24px 0;">
          <p style="font-size: 15px; color: #374151; line-height: 1.6;">您好！</p>
          <p style="font-size: 14px; color: #4b5563; line-height: 1.6;">
            这是一封来自 <strong>${config.fromName}</strong> 管理后台的测试邮件。收到此邮件说明您的 SMTP 邮件服务器配置正确，系统已具备正常发送注册验证码及找回密码邮件的能力！
          </p>
          <div style="background: #f8fafc; border-left: 4px solid #4f46e5; padding: 12px 16px; margin: 16px 0; font-size: 13px; color: #475569;">
            <strong>SMTP 服务器：</strong> ${config.host}:${config.port}<br/>
            <strong>发信账号：</strong> ${config.user}<br/>
            <strong>发送时间：</strong> ${new Date().toLocaleString('zh-CN')}
          </div>
        </div>
        <div style="text-align: center; border-top: 1px solid #f3f4f6; padding-top: 16px; font-size: 12px; color: #9ca3af;">
          软考刷题通 · 系统自动化测试邮件
        </div>
      </div>
    `;

    try {
      await transporter.sendMail({
        from: `"${config.fromName}" <${config.user}>`,
        to: toEmail,
        subject,
        html,
      });
      return {
        success: true,
        message: `测试邮件已成功发送至 ${toEmail}，请检查收件箱（或垃圾邮件箱）`,
      };
    } catch (sendErr: any) {
      throw new BadRequestException(`测试邮件发送失败: ${sendErr.message}`);
    }
  }

  /**
   * 渲染统一美观的验证码 HTML 邮件模版
   */
  private renderCodeEmailTemplate(params: {
    appName: string;
    title: string;
    actionText: string;
    code: string;
    expireMinutes: number;
    recipientEmail: string;
  }): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${params.appName} 验证码</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;">
        <tr>
          <td align="center" style="padding: 40px 16px;">
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 560px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.06);">
              <!-- 顶部 Banner -->
              <tr>
                <td style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 32px 24px; text-align: center;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700; letter-spacing: 0.5px;">${params.appName}</h1>
                  <p style="margin: 6px 0 0; color: rgba(255,255,255,0.85); font-size: 14px;">高效智能备考 · 助你一战通关</p>
                </td>
              </tr>

              <!-- 内容区域 -->
              <tr>
                <td style="padding: 32px 28px;">
                  <p style="margin: 0 0 12px; font-size: 16px; font-weight: 600; color: #1f2937;">尊敬的用户：</p>
                  <p style="margin: 0 0 20px; font-size: 14px; color: #4b5563; line-height: 1.6;">
                    您正在尝试进行 <strong>${params.actionText}</strong> 操作，本次请求的邮箱验证码如下：
                  </p>

                  <!-- 验证码高亮卡片 -->
                  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; border: 1.5px dashed #6366f1; border-radius: 12px; margin-bottom: 24px;">
                    <tr>
                      <td align="center" style="padding: 24px;">
                        <span style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #4f46e5; font-family: Consolas, Monaco, monospace; display: inline-block;">${params.code}</span>
                        <div style="margin-top: 8px; font-size: 12px; color: #6b7280;">
                          ⏱️ 验证码在 <strong>${params.expireMinutes} 分钟</strong> 内有效
                        </div>
                      </td>
                    </tr>
                  </table>

                  <!-- 安全提示 -->
                  <div style="background-color: #fffbeb; border-radius: 8px; padding: 14px 16px; margin-bottom: 24px;">
                    <p style="margin: 0; font-size: 13px; color: #b45309; line-height: 1.5;">
                      ⚠️ <strong>安全提示：</strong><br/>
                      · 请勿将验证码透露给任何人（包括客服人员）。<br/>
                      · 如非本人操作，请忽略此邮件，您的账号安全不会受到影响。
                    </p>
                  </div>

                  <p style="margin: 0; font-size: 13px; color: #6b7280; line-height: 1.6;">
                    祝您备考顺利，金榜题名！<br/>
                    <strong>${params.appName} 团队</strong>
                  </p>
                </td>
              </tr>

              <!-- 底部版权 -->
              <tr>
                <td style="background-color: #f9fafb; border-top: 1px solid #f3f4f6; padding: 20px 24px; text-align: center;">
                  <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                    此为系统自动发送邮件，请勿直接回复。<br/>
                    收件邮箱：${params.recipientEmail} · 发送时间：${new Date().toLocaleString('zh-CN')}
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
    `;
  }
}
