Component({
  data: {
    selected: 0,
    color: "#6B7280",
    selectedColor: "#3730A3",
    list: [
      { pagePath: '/pages/index/index', text: '首页' },
      { pagePath: '/pages/plan/plan', text: '计划' },
      { pagePath: '/pages/record/record', text: '记录' },
    ],    
  },

  lifetimes: {
    attached() {
      this.queueSyncSelected();
      this.bindRouteChange();
    },
    detached() {
      this.unbindRouteChange();
    }
  },

  pageLifetimes: {
    show() {
      this.queueSyncSelected();
    }
  },

  methods: {
    normalizeRoute(routeOrPath: string) {
      return routeOrPath.startsWith('/') ? routeOrPath.slice(1) : routeOrPath;
    },

    getCurrentRoute() {
      const pages = getCurrentPages();
      if (!pages || pages.length === 0) return undefined;
      return this.normalizeRoute(pages[pages.length - 1].route);
    },

    queueSyncSelected() {
      const wxAny = wx as any;
      const nextTick = wxAny.nextTick;
      if (typeof nextTick === 'function') {
        nextTick(() => this.syncSelectedFromRoute());
        return;
      }
      setTimeout(() => this.syncSelectedFromRoute(), 0);
    },

    syncSelectedFromRoute() {
      const currentRoute = this.getCurrentRoute();
      if (!currentRoute) return;

      const pendingRoute = (this as any).__pendingRoute as string | undefined;
      if (pendingRoute && pendingRoute !== currentRoute) return;
      if (pendingRoute && pendingRoute === currentRoute) {
        (this as any).__pendingRoute = undefined;
      }

      const nextSelected = this.data.list.findIndex(item => this.normalizeRoute(item.pagePath) === currentRoute);
      if (nextSelected < 0) return;
      if (this.data.selected === nextSelected) return;

      this.setData({ selected: nextSelected });
    },

    bindRouteChange() {
      const wxAny = wx as any;
      if (typeof wxAny.onAppRoute !== 'function') return;

      const handler = () => this.queueSyncSelected();
      (this as any).__onAppRouteHandler = handler;
      wxAny.onAppRoute(handler);
    },

    unbindRouteChange() {
      const wxAny = wx as any;
      const handler = (this as any).__onAppRouteHandler as (() => void) | undefined;
      if (!handler) return;
      if (typeof wxAny.offAppRoute === 'function') {
        wxAny.offAppRoute(handler);
      }
      (this as any).__onAppRouteHandler = undefined;
    },

    onTabItemTap(event: any) {
      const index = Number(event.currentTarget.dataset.index);
      const path = String(event.currentTarget.dataset.path || '');
      if (!path) return;

      const currentRoute = this.getCurrentRoute();
      if (!currentRoute) return;

      const nextRoute = this.normalizeRoute(path);
      if (currentRoute === nextRoute) return;

      (this as any).__pendingRoute = nextRoute;
      this.setData({ selected: index });

      wx.switchTab({
        url: path.startsWith('/') ? path : `/${path}`,
        complete: () => this.queueSyncSelected()
      });
    },
  }
});
