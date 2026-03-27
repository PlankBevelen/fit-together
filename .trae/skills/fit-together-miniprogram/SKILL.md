---
name: "fit-together-miniprogram"
description: "适配本仓库的微信小程序开发规范与改造流程。涉及新增/改页面、组件、底部 Tab、样式与用户状态（未登录/未建档/已建档）时调用。"
---

# FitTogether 小程序工程助手

用于在本仓库内开发/重构微信小程序页面与组件，保证目录结构、路由配置、样式变量、TypeScript 严格模式与现有 UI 组件用法一致。

## 何时调用

- 需要把现有 Web/React 页面迁移成小程序页面时
- 需要新增/调整页面路由、TabBar、自定义底部 Tab 时
- 需要新增/调整组件（navigation-bar、segment-control、ring-progress 等）或其样式时
- 需要引入登录/建档流程，处理未登录/未建档/已建档三态展示与拦截策略时
- 需要排查 TypeScript 编译错误（严格模式）或小程序数据绑定问题时

## 项目结构速览

- 小程序根目录：`miniprogram/`
  - 全局配置：`miniprogram/app.json`、`miniprogram/app.less`、`miniprogram/app.ts`
  - 页面：`miniprogram/pages/<page>/`（每页通常含 `*.ts` / `*.wxml` / `*.less` / `*.json`）
  - 组件：`miniprogram/components/<component>/`
  - 自定义 Tab：`miniprogram/custom-tab-bar/`
  - 静态资源：`miniprogram/static/`（例如 `static/icon/tab/*.svg`）
- TS 类型：`typings/`，并启用严格模式（`tsconfig.json`）

## 现有关键约定

- 页面脚本使用 `Page({ ... })`，事件处理函数直接挂在 Page 对象上（不要使用 `methods: {}` 结构）。
- 组件脚本使用 `Component({ ... })`。
- 样式使用 Less，并复用 `miniprogram/app.less` 的颜色变量（primary、success、warning、divider、text 等）。
- 页面容器普遍使用 `.page`（定义在 `app.less`），底部 Tab 场景通常在页面末尾加入 `<custom-tab-bar />`。
- 导航条使用自定义 `navigation-bar` 组件（`navigationStyle: "custom"`）。

## 常见改造/开发任务的标准流程

### 1) 新增页面（非 Tab）

1. 创建目录：`miniprogram/pages/<name>/`
2. 创建四件套：`<name>.ts / <name>.wxml / <name>.less / <name>.json`
3. 在 `miniprogram/app.json` 的 `pages` 中加入 `pages/<name>/<name>`
4. 若需要顶部导航：在 `<name>.wxml` 顶部加入 `<navigation-bar ... />` 并在 `<name>.json` 声明 `usingComponents`
5. 若需要底部 Tab：在页面末尾加入 `<custom-tab-bar />`

### 2) 新增/调整 Tab（自定义底部 Tab）

Tab 需要同时维护三处一致性：

1. `miniprogram/app.json`
   - `pages` 里必须包含 Tab 的页面路径
   - `tabBar.list` 里包含该 Tab 的 `pagePath`
2. `miniprogram/custom-tab-bar/index.ts`
   - `data.list` 里包含该 Tab 配置（pagePath/text/iconPath/selectedIconPath）
3. 页面模板
   - 每个 Tab 页底部包含 `<custom-tab-bar />`（否则视觉上看不到）

图标约定：

- 默认使用 `miniprogram/static/icon/tab/` 下的 svg
- `iconPath` 与 `selectedIconPath` 建议成对存在，选中态由组件根据 `selected` 自动切换

### 3) 把现有页面迁移成小程序页面

1. 先拆 UI：头部区块 / 数据卡片 / 列表 / 底部按钮，映射到 WXML 的 `view/text/image/button/scroll-view`
2. 再拆数据：把原来内联常量整理到 `data`，把交互变成 Page 事件处理函数
3. 样式落到 `.less`，优先复用 `app.less` 变量，避免在 WXML 里写大段 `style=""`
4. 图标：
   - 优先使用现有 `static` 资源（svg/png）
   - 或用文字占位（后续替换 iconfont/组件）

### 4) 用户状态与引导（未登录 / 未建档 / 已建档）

建议把“登录”和“建档（填写资料）”拆成两步决策：

- 未登录：建议登录（解释同步/备份价值），允许跳过；允许填写资料为本地草稿
- 已登录未建档：引导完善关键字段；允许稍后再说，但关键能力处提示
- 已建档：正常全功能

实现要点：

- 用统一的状态来源驱动 UI，而不是每个页面各自判断
- 在关键动作（保存记录、加入小队、开启同步等）再触发引导，避免频繁弹窗

## 质量门槛（提交前自检）

- `npx tsc -p tsconfig.json --noEmit` 通过（严格模式）
- `app.json` 的 `pages` 与 `tabBar.list` 与 `custom-tab-bar` 三处路由一致
- 页面 `usingComponents` 声明齐全（navigation-bar、segment-control 等）
- 样式优先走 less class，减少 WXML 内联 style
- **通用函数提取**：像 `parseKcal`、日期格式化等跨页面复用的纯函数，必须提取到 `miniprogram/utils/Formatter.ts` 中统一维护，避免在各个 Page 中重复定义。

