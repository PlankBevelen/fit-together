// logs.ts
// const util = require('../../utils/util.js')
import Formatter from '../../utils/Formatter'

Component({
  data: {
    logs: [],
  },
  lifetimes: {
    attached() {
      this.setData({
        logs: (wx.getStorageSync('logs') || []).map((log: string) => {
          return {
            date: Formatter.formatTime(new Date(log)),
            timeStamp: log
          }
        }),
      })
    }
  },
})
