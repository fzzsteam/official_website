# 响应式布局 & Tailwind CSS 迁移设计

**日期**: 2026-05-30  
**状态**: 待审阅  
**范围**: 全站所有前端页面，含竖屏视频播放器适配

---

## 1. 背景与目标

现有代码全部使用 React 内联样式，无任何响应式断点。所有布局均针对桌面端硬编码（固定 px 值、绝对定位偏移量）。目标：

- 引入 Tailwind CSS，建立统一的响应式系统
- 所有现有页面适配手机端（≤ 768px）
- 竖屏视频（9:16）在桌面端和手机端均有合理展示
- 迁移后写新页面效率大幅提升

---

## 2. 技术方案：Tailwind CSS v3

### 为什么用 Tailwind

- Next.js 官方一等支持，`@next/font` 变量可直接映射进 Tailwind config
- 响应式前缀（`sm:` `md:` `lg:`）语义清晰，新页面开发极快
- 现有 inline styles 与 Tailwind class 可在同一元素共存，支持逐组件迁移

### 安装

```bash
npm install -D tailwindcss@3 postcss autoprefixer
npx tailwindcss init -p
```

> 使用 v3（不用 v4）：v3 的 `tailwind.config.ts` 配置方式与 Next.js App Router 配合最稳定，社区文档最丰富。

### tailwind.config.ts

```ts
import type { Config } from 'tailwindcss'

export default {
  content: [
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          bg:    '#1C1917',
          card:  '#272320',
          gold:  '#C9912A',
          amber: '#d8a24d',
        },
        text: {
          primary: '#F0EDE8',
          muted:   'rgba(240,237,232,0.58)',
        },
      },
      fontFamily: {
        display:   ['var(--font-display)',   'serif'],
        body:      ['var(--font-body)',      'sans-serif'],
        cormorant: ['var(--font-cormorant)', 'serif'],
      },
    },
  },
} satisfies Config
```

### globals.css 新增 3 行（追加到文件头部）

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

保留现有 `*`, `html`, `body`, `button`, `input` 规则，不冲突。

---

## 3. 断点策略

使用 Tailwind 默认断点，移动优先（base = 手机）：

| 前缀 | 宽度 | 含义 |
|------|------|------|
| (base) | 0–767px | 手机端 |
| `md:` | ≥ 768px | 平板及以上 |
| `lg:` | ≥ 1024px | 桌面端 |
| `xl:` | ≥ 1280px | 大屏桌面 |

---

## 4. 组件响应式设计规范

### 4.1 Navbar

**手机端**（base）：
- 隐藏所有导航链接（`hidden md:flex`）
- 只显示：品牌名 + 右侧「登录/用户头像」+ 汉堡按钮（三条横线图标）
- 汉堡点击后弹出全屏竖向抽屉，列出所有导航链接
- 抽屉从右侧 slide-in，背景 `bg-brand-bg/95 backdrop-blur-md`

**桌面端**（`md:`）：
- 保持现有横向布局，隐藏汉堡按钮（`md:hidden`）
- padding: `px-11 py-[18px]`（保持视觉等同现有 44px/18px）

### 4.2 HomePage

**Hero Section**

保留全屏覆盖式设计，内容改为流式布局适配手机。

| 属性 | 手机端 | 桌面端（`lg:`） |
|------|--------|----------------|
| 内容定位 | `absolute left-4 right-4 bottom-14`（流式宽度）| `lg:left-[72px] lg:right-auto lg:bottom-[120px]` |
| 最大宽度 | 自然撑满（left-4 right-4）| `lg:max-w-[560px]` |
| tagline | `hidden` | `lg:block` |
| 英文副标题 | `hidden` | `lg:block` |
| 标题字号 | `text-[clamp(36px,9vw,60px)]` | `lg:text-[clamp(60px,7vw,96px)]` |
| 剧情描述 | `line-clamp-2`（只显示两行）| `lg:line-clamp-none`（完整显示）|
| 操作按钮排列 | `flex-col w-full gap-3`，「立即观看」按钮 `w-full` | `lg:flex-row lg:w-auto` |
| 左右箭头 | `hidden`（改用 touch 滑动切换）| `lg:flex` |
| 圆点分页 | 保留，居中显示 | 保留 |
| Hero 区触摸滑动 | 添加 `onTouchStart` / `onTouchEnd` 手势识别切换 | 不需要 |

**热门推荐区**

| 属性 | 手机端 | 桌面端（`lg:`） |
|------|--------|----------------|
| Section padding | `px-4 pt-8 pb-12` | `lg:px-[60px] lg:py-12` |
| 卡片宽度 | `w-[148px]`（横向滚动，不变）| `lg:w-48` |
| 「查看全部」按钮 | 保留 | 保留 |

### 4.3 EpisodeDetailPage（剧集详情页）

**整体布局**

```
手机端（flex-col）:
┌─────────────────────┐
│   VideoPlayer 9:16  │  ← 全宽
├─────────────────────┤
│   EpisodeInfo       │
├─────────────────────┤
│   EpisodeSelector   │  ← 水平滚动条（非侧边栏）
├─────────────────────┤
│   CastSection       │
├─────────────────────┤
│   Recommendations   │
└─────────────────────┘

桌面端（lg: flex-row）:
┌────────────────────────────┬───────────┐
│  左列（flex-1）             │ 右侧边栏  │
│  ┌──────────────────────┐  │ Episode-  │
│  │ VideoPlayer 9:16     │  │ Selector  │
│  │ max-w-[400px] mx-auto│  │ w-[336px] │
│  └──────────────────────┘  │           │
│  EpisodeInfo               │           │
│  CastSection               │           │
│  Recommendations           │           │
└────────────────────────────┴───────────┘
```

**paddingTop**：Navbar 高度 62px → `pt-[62px]`

### 4.4 VideoPlayer

**核心变化**：`aspectRatio: '16/9'` → `aspect-[9/16]`

| 属性 | 手机端 | 桌面端（`lg:`） |
|------|--------|----------------|
| 容器宽度 | `w-full` | `lg:max-w-[400px] lg:mx-auto` |
| 宽高比 | `aspect-[9/16]`（任意值语法，无需 config）| 同左 |
| 控制栏按钮间距 | gap-2，触摸区域 `p-3` | gap-[14px]，`p-1` |
| 「倍速」「高清」文字按钮 | `hidden` | `block` |
| Back 按钮文字 | `hidden`（只显示箭头图标）| `block` |
| 进度条高度 | `h-1`（4px，更易触摸）| `h-[3px]` |
| 进度条 scrubber 尺寸 | `w-4 h-4` | `w-3 h-3` |

### 4.5 EpisodeSelector

**手机端**：不作为右侧边栏，改为内嵌全宽组件，竖向展示剧集网格（`grid-cols-8`，可滚动），`EpisodeSelector` 组件接收 `variant?: 'sidebar' | 'inline'` prop：
- `sidebar`（默认）：现有侧边栏样式，`w-[336px]`
- `inline`：全宽，网格列数 `grid-cols-8 md:grid-cols-10`，无固定高度限制

**显示逻辑**：
- `lg:` 显示 sidebar 变体，手机端显示 inline 变体
- EpisodeDetailPage 通过 Tailwind 的 `hidden lg:block` / `lg:hidden` 控制哪个版本显示
- 避免 JS 判断屏幕宽度，纯 CSS 控制

### 4.6 EpisodeInfo

手机端：`padding: '0 0 20px'`，操作按钮（收藏/点赞/分享）改为横向排列放在标题下方（`flex-row`），而非竖向浮在右侧。

### 4.7 CastSection

手机端：padding 调整为 `px-4`，宽度限制去掉（`w-full`），横向滚动保留。

### 4.8 Recommendations

手机端：`padding: '24px 16px 32px'`，左右箭头按钮隐藏（手机用手指横滑）。

### 4.9 其他页面（About / Business / Contact / Inner）

结构简单，按以下通用原则处理：
- 所有 `padding: 'Xpx Ypx'` → `px-4 py-8 md:px-12 lg:px-[72px]`
- 所有固定宽度容器 → `max-w-4xl mx-auto px-4`
- 字号使用 `clamp()` 或 Tailwind 响应式字号

### 4.10 Modal（Login / Payment / Vip）

手机端：
- 宽度：`w-full mx-4`（留边距），`max-w-[420px]`
- 从底部弹出（`translate-y` 动画），而非居中显示（更符合手机交互习惯）

桌面端：保持现有居中弹窗。

---

## 5. 迁移策略

### 原则

- **逐组件迁移**：每个组件完成后独立可用，不等全部改完才测试
- **Inline styles 与 Tailwind class 共存**：只对布局相关属性（flex、grid、padding、width、display）换 class，装饰性样式（颜色、字号、特定设计 token）视情况保留 inline 或换 Tailwind color class
- **不引入额外 CSS 文件**：不创建 `.module.css`，用 Tailwind utilities 解决一切

### 迁移顺序

| 优先级 | 组件 | 原因 |
|--------|------|------|
| 1 | **Tailwind 安装 & 配置** | 所有后续工作的前提 |
| 2 | **Navbar** | 影响所有页面，手机汉堡菜单是核心功能 |
| 3 | **VideoPlayer** | 竖屏比例修正，独立组件，改动集中 |
| 4 | **EpisodeDetailPage** | 整体布局切换（侧边栏 ↔ 堆叠列） |
| 5 | **EpisodeSelector**（加 variant prop） | 依赖 EpisodeDetailPage 布局 |
| 6 | **EpisodeInfo / CastSection / Recommendations** | 内部细节调整 |
| 7 | **HomePage** | Hero + 推荐区 |
| 8 | **About / Business / Contact / Inner** | 简单页面批量处理 |
| 9 | **Modals（Login/Payment/Vip）** | 弹窗底部弹出适配 |

---

## 6. 约束与边界

- 不改动任何业务逻辑、API 接口、状态管理
- 不引入 shadcn/ui 或其他组件库（保持现有自研组件）
- 不改动 `tokens.ts`，Tailwind config 中的自定义 color 与 tokens 保持一一对应
- VideoPlayer 不修改播放逻辑，只修改容器布局和控件尺寸
- 迁移过程中保持页面功能可用，每一步可独立验证
