export class DateUtils {
  /**
   * 格式化日期
   * 支持格式：
   * yyyy MM dd HH mm ss SSS
   * 示例：
   * dateFormat(new Date(), 'yyyy-MM-dd HH:mm:ss')
   */
  static dateFormat(date: Date | string | number, format: string = 'yyyy-MM-dd HH:mm:ss'): string {
    const d = this.parseDate(date)

    const year = d.getFullYear()

    const map: Record<string, string> = {
      yyyy: year.toString(),
      yy: year.toString().slice(-2),
      MM: this.pad(d.getMonth() + 1),
      dd: this.pad(d.getDate()),
      HH: this.pad(d.getHours()),
      mm: this.pad(d.getMinutes()),
      ss: this.pad(d.getSeconds()),
      SSS: this.pad(d.getMilliseconds(), 3)
    }

    // 关键：按照长度从大到小排序，避免 yy 把 yyyy 截断
    const tokens = Object.keys(map).sort((a, b) => b.length - a.length)

    let result = format
    tokens.forEach((token) => {
      result = result.replace(new RegExp(token, 'g'), map[token])
    })

    return result
  }

  /**
   * 字符串/时间戳转 Date
   */
  static parseDate(date: Date | string | number): Date {
    if (date instanceof Date) return date
    return new Date(date)
  }

  /**
   * 获取时间戳（毫秒）
   */
  static getTimestamp(date?: Date | string | number): number {
    return this.parseDate(date ?? new Date()).getTime()
  }

  /**
   * 获取当天开始时间 00:00:00
   */
  static startOfDay(date: Date | string | number = new Date()): Date {
    const d = this.parseDate(date)
    return new Date(d.getFullYear(), d.getMonth(), d.getDate())
  }

  /**
   * 获取当天结束时间 23:59:59.999
   */
  static endOfDay(date: Date | string | number = new Date()): Date {
    const d = this.parseDate(date)
    return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999)
  }

  /**
   * 日期加减
   */
  static addDays(date: Date | string | number, days: number): Date {
    const d = this.parseDate(date)
    const result = new Date(d)
    result.setDate(d.getDate() + days)
    return result
  }

  static addMonths(date: Date | string | number, months: number): Date {
    const d = this.parseDate(date)
    const result = new Date(d)
    result.setMonth(d.getMonth() + months)
    return result
  }

  static addYears(date: Date | string | number, years: number): Date {
    const d = this.parseDate(date)
    const result = new Date(d)
    result.setFullYear(d.getFullYear() + years)
    return result
  }

  /**
   * 是否同一天
   */
  static isSameDay(date1: Date | string | number, date2: Date | string | number): boolean {
    const d1 = this.parseDate(date1)
    const d2 = this.parseDate(date2)

    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    )
  }

  /**
   * 日期比较
   * 返回：
   * 1  date1 > date2
   * 0  相等
   * -1 date1 < date2
   */
  static compare(date1: Date | string | number, date2: Date | string | number): number {
    const t1 = this.getTimestamp(date1)
    const t2 = this.getTimestamp(date2)

    if (t1 > t2) return 1
    if (t1 < t2) return -1
    return 0
  }

  /**
   * 计算两个日期差值（单位：天）
   */
  static diffInDays(date1: Date | string | number, date2: Date | string | number): number {
    const t1 = this.startOfDay(date1).getTime()
    const t2 = this.startOfDay(date2).getTime()
    return Math.floor((t1 - t2) / (1000 * 60 * 60 * 24))
  }

  /**
   * 判断是否闰年
   */
  static isLeapYear(year: number): boolean {
    return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
  }

  /**
   * 获取某年某月的天数
   */
  static getDaysInMonth(year: number, month: number): number {
    return new Date(year, month, 0).getDate()
  }

  /**
   * 左侧补零
   */
  private static pad(num: number, length: number = 2): string {
    return num.toString().padStart(length, '0')
  }
}
