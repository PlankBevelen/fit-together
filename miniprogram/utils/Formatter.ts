class Formatter {
  /**
   * 格式化日期
   * @param date 日期对象、字符串或时间戳
   * @returns 格式化的日期字符串，如 "March 22, 2026"
   */
  formatDate(date: Date | string | number): string {
    const d = new Date(date);
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    return d.toLocaleDateString('zh-CN', options);
  }

  /**
   * 格式化时间
   * @param date 日期对象、字符串或时间戳
   * @returns 格式化的时间字符串，如 "14:30:00"
   */
  formatTime(date: Date | string | number): string {
    const d = new Date(date);
    const options: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit', second: '2-digit' };
    return d.toLocaleTimeString('zh-CN', options);
  }

  /**
   * 格式化日期时间
   * @param date 日期对象、字符串或时间戳
   * @returns 格式化的日期时间字符串，如 "March 22, 2026, 14:30:00"
   */
  formatDateTime(date: Date | string | number): string {
    const d = new Date(date);
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    };
    return d.toLocaleDateString('zh-CN', options);
  }

  /**
   * 格式化周几
   * @param date 日期对象、字符串或时间戳
   * @returns 周几的字符串，如 "周一"
   */
  formatDayOfWeek(date: Date | string | number): string {
    const d = new Date(date);
    const daysofweek = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return daysofweek[d.getDay()];
  }

  /**
   * 获取今天的日期
   * @returns 今天的日期字符串，如 "2022年3月22日"
   */
  getTodayDate(): string {
    return this.formatDate(new Date());
  }

  /**
   * 获取今天的时间
   * @returns 今天的时间字符串，如 "14:30:00"
   */
  getTodayTime(): string {
    return this.formatTime(new Date());
  }

  /**
   * 获取今天的周几
   * @returns 今天的周几字符串，如 "周一"
   */
  getTodayDayOfWeek(): string {
    return this.formatDayOfWeek(new Date());
  }
}

export default new Formatter();