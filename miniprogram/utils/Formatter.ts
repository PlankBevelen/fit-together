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

  /**
   * 返回 YYYY-MM-DD 格式
   */
  formatYYYYMMDD(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  /**
   * 获取偏移几周的日期数组
   * weekOffset = 0 为本周, -1 上周, 1 下周
   */
  getWeekDates(weekOffset: number): { date: string, displayDate: string, day: string, isToday: boolean }[] {
    const now = new Date();
    // 把周一作为一周的第一天
    const dayOfWeek = now.getDay() === 0 ? 7 : now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - dayOfWeek + 1 + weekOffset * 7);

    const week = [];
    const todayYYYYMMDD = this.formatYYYYMMDD(now);

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const yyyymmdd = this.formatYYYYMMDD(d);
      week.push({
        date: yyyymmdd,
        displayDate: `${d.getMonth() + 1}/${d.getDate()}`,
        day: this.formatDayOfWeek(d),
        isToday: yyyymmdd === todayYYYYMMDD
      });
    }
    return week;
  }

  /**
   * 获取当月日历数组 (包含前后补齐)
   */
  getMonthDates(): { date: string, day: number, isToday: boolean }[] {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const todayYYYYMMDD = this.formatYYYYMMDD(now);

    // 把周一作为一周的第一天
    let startOffset = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
    const days = [];

    // 填充上月天数
    for (let i = startOffset; i > 0; i--) {
      const d = new Date(year, month, 1 - i);
      days.push({
        date: this.formatYYYYMMDD(d),
        day: d.getDate(),
        isToday: this.formatYYYYMMDD(d) === todayYYYYMMDD
      });
    }

    // 填充本月天数
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const d = new Date(year, month, i);
      const yyyymmdd = this.formatYYYYMMDD(d);
      days.push({
        date: yyyymmdd,
        day: i,
        isToday: yyyymmdd === todayYYYYMMDD
      });
    }

    // 填充下月天数以满足 42 格（6行）
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      days.push({
        date: this.formatYYYYMMDD(d),
        day: d.getDate(),
        isToday: this.formatYYYYMMDD(d) === todayYYYYMMDD
      });
    }

    return days;
  }
  /**
   * 解析带单位的卡路里字符串为数字
   * @param value 如 "150kcal" 或 "150"
   */
  parseKcal(value: string | number | undefined): number {
    if (value === undefined || value === null) return 0;
    if (typeof value === 'number') return value;
    const n = parseInt(value, 10);
    return Number.isNaN(n) ? 0 : n;
  }
}

export default new Formatter();