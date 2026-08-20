import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/zh-cn';

dayjs.locale('zh-cn');

/**
 * 日期时间工具类
 */
export class DatetimeUtil {
  /**
   * 获取当前时间
   */
  static now(): Date {
    return new Date();
  }

  /**
   * 格式化日期
   * @param date 日期
   * @param format 格式
   */
  static format(
    date: Date | string | number,
    format: string = 'YYYY-MM-DD HH:mm:ss',
  ): string {
    return dayjs(date).format(format);
  }

  /**
   * 转换为 Date 对象
   */
  static toDate(date: Date | string | number): Date {
    return dayjs(date).toDate();
  }

  /**
   * 增加时间
   * @param date 原日期
   * @param amount 数量
   * @param unit 单位 day/week/month/year/hour/minute/second
   */
  static add(
    date: Date | string | number,
    amount: number,
    unit: dayjs.ManipulateType,
  ): Date {
    return dayjs(date).add(amount, unit).toDate();
  }

  /**
   * 减少时间
   */
  static subtract(
    date: Date | string | number,
    amount: number,
    unit: dayjs.ManipulateType,
  ): Date {
    return dayjs(date).subtract(amount, unit).toDate();
  }

  /**
   * 计算时间差（秒）
   */
  static diffSeconds(
    start: Date | string | number,
    end: Date | string | number = Date.now(),
  ): number {
    return Math.abs(dayjs(end).diff(dayjs(start), 'second'));
  }

  /**
   * 计算时间差（分钟）
   */
  static diffMinutes(
    start: Date | string | number,
    end: Date | string | number = Date.now(),
  ): number {
    return Math.abs(dayjs(end).diff(dayjs(start), 'minute'));
  }

  /**
   * 计算时间差（天）
   */
  static diffDays(
    start: Date | string | number,
    end: Date | string | number = Date.now(),
  ): number {
    return Math.abs(dayjs(end).diff(dayjs(start), 'day'));
  }

  /**
   * 获取 dayjs 对象
   */
  static dayjs(date?: Date | string | number): Dayjs {
    return dayjs(date);
  }
}
