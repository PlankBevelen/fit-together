Component({
  properties: {
    size: { type: Number, value: 160 },
    strokeWidth: { type: Number, value: 12 },
    percent: { type: Number, value: 0 },
    color: { type: String, value: '#4F46E5' },
    bgColor: { type: String, value: '#E5E7EB' },
    value: { type: Number, value: 0 },
    total: { type: Number, value: 0 },
    label: { type: String, value: '已摄入' }
  },

  data: {},

  observers: {
    'size,strokeWidth,percent,color,bgColor': function () {
      this.queueDraw();
    }
  },

  lifetimes: {
    ready() {
      (this as any)._ringReady = true;
      this.queueDraw();
    }
  },

  methods: {
    clampPercent(value: number) {
      if (Number.isNaN(value)) return 0;
      if (value < 0) return 0;
      if (value > 100) return 100;
      return value;
    },

    queueDraw() {
      if (!(this as any)._ringReady) {
        (this as any)._ringPendingDraw = true;
        return;
      }

      (this as any)._ringPendingDraw = false;
      const wxAny = wx as any;
      if (typeof wxAny.nextTick === 'function') {
        wxAny.nextTick(() => this.draw());
        return;
      }
      setTimeout(() => this.draw(), 0);
    },

    draw() {
      const size = Number(this.data.size) || 0;
      const strokeWidth = Number(this.data.strokeWidth) || 0;
      if (size <= 0 || strokeWidth <= 0) return;

      const percent = this.clampPercent(Number(this.data.percent) || 0) / 100;
      const center = size / 2 ;
      const padding = 2;
      const radius = center - strokeWidth / 2 - padding;
      if (radius <= 0) return;

      const canvasId = 'ringProgress';
      const ctx = wx.createCanvasContext(canvasId, this as any);
      ctx.clearRect(0, 0, size, size);
      ctx.setLineWidth(strokeWidth);
      const startAngle = -Math.PI / 2;
      const fullCircle = Math.PI * 2;
      const epsilon = 0.0001;

      ctx.setStrokeStyle(this.data.bgColor);
      ctx.setLineCap('butt');
      ctx.beginPath();
      ctx.arc(center, center, radius, startAngle + epsilon, startAngle + fullCircle - epsilon);
      ctx.stroke();

      if (percent > 0) {
        const progressAngle = Math.min(fullCircle - epsilon, fullCircle * percent);
        ctx.setStrokeStyle(this.data.color);
        ctx.setLineCap('round');
        ctx.beginPath();
        ctx.arc(center, center, radius, startAngle, startAngle + progressAngle);
        ctx.stroke();
      }

      ctx.draw();
    }
  }
});
