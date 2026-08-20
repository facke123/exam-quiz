import * as crypto from 'crypto';
import * as bcrypt from 'bcryptjs';

/**
 * 加密工具类
 * 提供密码哈希、校验，以及通用哈希、随机串生成等能力
 */
export class CryptoUtil {
  /** bcrypt 加盐轮数 */
  private static readonly SALT_ROUNDS = 10;

  /**
   * 对明文密码进行 bcrypt 哈希
   */
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }

  /**
   * 校验明文密码与哈希是否匹配
   */
  static async comparePassword(
    password: string,
    hash: string,
  ): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * MD5 哈希
   */
  static md5(text: string): string {
    return crypto.createHash('md5').update(text).digest('hex');
  }

  /**
   * SHA256 哈希
   */
  static sha256(text: string): string {
    return crypto.createHash('sha256').update(text).digest('hex');
  }

  /**
   * 生成随机字符串
   * @param length 长度
   */
  static randomString(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex').slice(0, length);
  }

  /**
   * 生成订单号
   */
  static generateOrderNo(): string {
    const now = Date.now();
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0');
    return `${now}${random}`;
  }

  /**
   * AES-256-CBC 加密
   */
  static aesEncrypt(text: string, key: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(
      'aes-256-cbc',
      Buffer.from(key.padEnd(32, '0').slice(0, 32)),
      iv,
    );
    const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
  }

  /**
   * AES-256-CBC 解密
   */
  static aesDecrypt(encrypted: string, key: string): string {
    const [ivHex, dataHex] = encrypted.split(':');
    const decipher = crypto.createDecipheriv(
      'aes-256-cbc',
      Buffer.from(key.padEnd(32, '0').slice(0, 32)),
      Buffer.from(ivHex, 'hex'),
    );
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(dataHex, 'hex')),
      decipher.final(),
    ]);
    return decrypted.toString();
  }
}
