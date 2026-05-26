# kun-notes

## 项目概述

kun-notes 是一款基于 Electron 的桌面端笔记应用，支持 Markdown 编辑、文件夹管理、笔记置顶、图片粘贴、自动隐藏窗口等功能。采用本地 SQLite 数据库存储，支持用户登录认证。

## 技术栈

### 桌面框架
- **Electron**: 38.0.0-beta.6
- **构建工具**: electron-vite 4.x + Vite 7.x
- **打包**: electron-builder

### 前端
- **框架**: React 19 + TypeScript 5.9
- **UI 组件**: Ant Design 5.x
- **状态管理**: Redux Toolkit + React-Redux
- **路由**: react-router-dom 6.x (HashRouter)
- **富文本编辑器**: TipTap 3.x（基于 ProseMirror，WYSIWYG，存储格式为 Markdown）
- **HTTP 客户端**: axios

### 数据存储

- **本地数据库**: better-sqlite3 (SQLite)
- **存储位置**: `app.getPath('userData')/notes.db`
- **图片存储**: `app.getPath('userData')/images/`
- **同步服务端**: Flask + SQLAlchemy
- **服务端数据库**: 开发环境 SQLite，生产环境 PostgreSQL
- **服务端图片存储**: `uploads/images/{user_id}/`（按用户隔离）

### 代码规范
- **格式化**: Prettier
- **Lint**: ESLint (TypeScript + React)

---

## 目录结构

```
kun-notes/
├── src/
│   ├── main/                    # Electron 主进程
│   │   ├── index.ts             # 主入口，窗口管理、IPC handlers、数据库初始化
│   │   ├── ipc/
│   │   │   ├── auth.ts          # 认证相关 IPC (login/logout/getUser)
│   │   │   ├── sync.ts          # 同步相关 IPC (sync/trash/history)
│   │   │   └── updater.ts       # 更新相关 IPC (version/check/download/install)
│   │   └── utils/
│   │       ├── animation.ts     # 窗口动画工具
│   │       ├── auth-store.ts    # Token 存储
│   │       ├── common.ts        # 通用工具
│   │       ├── logger.ts        # 日志模块（electron-log 封装）
│   │       ├── request.ts       # HTTP 请求封装（含 notesService、notesUpload、notesDownload）
│   │       └── sync-manager.ts  # 同步管理器（含图片同步）
│   ├── preload/                 # 预加载脚本（桥接主进程与渲染进程）
│   │   ├── index.ts             # API 暴露到 window.api
│   │   └── index.d.ts           # 类型声明
│   ├── renderer/                # 渲染进程（React 前端）
│   │   └── src/
│   │       ├── App.tsx          # 主应用组件
│   │       ├── main.tsx         # React 入口
│   │       ├── router.tsx       # 路由配置
│   │       ├── components/      # 组件
│   │       │   ├── RichTextEditor.tsx  # TipTap 富文本编辑器（WYSIWYG，Markdown 存储）
│   │       │   ├── Slider.tsx          # 侧边栏（简版）
│   │       │   ├── SliderMenu.tsx      # 侧边栏（菜单版，含搜索）
│   │       │   ├── TitleBar.tsx        # 自定义标题栏
│   │       │   ├── GlobalContextMenu.tsx # 全局右键菜单
│   │       │   ├── SyncStatus.tsx      # 同步状态指示器
│   │       │   └── VersionHistory.tsx  # 版本历史弹窗
│   │       ├── pages/
│   │       │   ├── Settings.tsx # 设置页面（含同步设置）
│   │       │   └── Trash.tsx    # 回收站页面
│   │       ├── hooks/
│   │       │   └── useContextMenu.ts # 右键菜单 hook
│   │       ├── state/           # Redux 状态
│   │       │   ├── index.ts
│   │       │   ├── menuSlice.ts
│   │       │   └── menuStore.ts
│   │       └── utils/
│   │           └── DateUtils.ts # 日期工具
│   └── types/                   # 共享类型定义
│       ├── note.ts              # Note 类型
│       ├── auth.ts              # 认证类型
│       └── http.ts              # HTTP 类型
├── server/                      # Flask 同步服务端
│   ├── app/
│   │   ├── __init__.py          # Flask app 工厂函数
│   │   ├── config.py            # 配置类（数据库 URI、密钥等）
│   │   ├── extensions.py        # 扩展初始化（db, migrate）
│   │   ├── models.py            # SQLAlchemy 数据模型
│   │   ├── auth.py              # Token 校验装饰器
│   │   ├── exceptions.py        # 自定义异常
│   │   ├── logger.py            # 日志模块（按天轮转，保留 7 天）
│   │   └── routes/
│   │       ├── __init__.py      # 路由蓝图注册
│   │       ├── sync.py          # 同步 API（POST /api/v1/sync）
│   │       ├── images.py        # 图片 API（上传/下载/列表）
│   │       ├── trash.py         # 回收站 API
│   │       └── history.py       # 版本历史 API
│   ├── requirements.txt         # Python 依赖
│   ├── run.py                   # 开发环境启动入口
│   └── wsgi.py                  # 生产环境启动入口
├── resources/                   # 静态资源（图标等）
├── build/                       # 构建资源
├── electron-builder.yml         # 打包配置
├── electron.vite.config.ts      # Vite 配置
└── package.json
```

---

## 核心功能

### 笔记管理
- 创建/编辑/删除笔记和文件夹
- 笔记支持富文本编辑（WYSIWYG），底层存储为 Markdown 格式，使用 TipTap
- 文件夹层级结构（通过 parentId 实现）
- 笔记置顶功能
- 关键字搜索（标题和内容模糊匹配）

### 图片处理
- 支持剪贴板图片粘贴
- 图片保存到本地 `images/` 目录
- 使用相对路径 `./images/filename` 引用，支持数据迁移
- 图片同步：同步时自动上传本地新图片、下载服务端缺失图片

### 窗口特性
- 无边框透明窗口，自定义标题栏
- 窗口吸附屏幕顶部，自动隐藏/展开
- 鼠标离开延迟隐藏（可配置）
- 系统托盘图标，支持显示/隐藏/退出

### 用户认证

- 登录/登出功能
- Token 存储（access_token + refresh_token）
- 远程 API 认证（`https://user.mtjx.top/api/v1`）
- 设置页面支持关闭按钮

### HTTP 请求架构

- **用户认证服务**: `https://user.mtjx.top`（已实现）
- **笔记同步服务**: Flask 后端（含笔记同步、图片同步、回收站、版本历史）
- 请求封装在 `src/main/utils/request.ts`，使用独立 axios 实例
- `notesRequest`: 通用 JSON 请求
- `notesUpload`: multipart/form-data 文件上传
- `notesDownload`: 二进制文件下载（返回 Buffer）

---

## IPC 通信接口

### 笔记操作
| Channel | 方向 | 说明 |
|---------|------|------|
| `save-note` | Renderer → Main | 创建或更新笔记 |
| `get-note` | Renderer → Main | 获取单个笔记 |
| `list-notes` | Renderer → Main | 获取所有笔记列表 |
| `list-notes-by-parent` | Renderer → Main | 按父级 ID 获取笔记 |
| `search-notes` | Renderer → Main | 搜索笔记 |
| `delete-note` | Renderer → Main | 删除笔记 |
| `toggle-pin` | Renderer → Main | 切换置顶状态 |

### 图片操作
| Channel | 方向 | 说明 |
|---------|------|------|
| `save-image` | Renderer → Main | 保存图片到本地 |
| `get-images-dir` | Renderer → Main | 获取图片目录路径 |
| `get-image-data-url` | Renderer → Main | 图片转 data URL |

### 窗口与设置
| Channel | 方向 | 说明 |
|---------|------|------|
| `handle-transparent` | Renderer → Main | 设置鼠标穿透 |
| `open-or-close-window` | Renderer → Main | 打开/关闭子窗口 |
| `get-settings` | Renderer → Main | 获取应用设置 |
| `save-settings` | Renderer → Main | 保存应用设置 |

### 认证
| Channel | 方向 | 说明 |
|---------|------|------|
| `auth-login` | Renderer → Main | 用户登录 |
| `auth-logout` | Renderer → Main | 用户登出 |
| `auth-get-user` | Renderer → Main | 获取当前用户信息 |

### 同步
| Channel | 方向 | 说明 |
|---------|------|------|
| `sync-start` | Renderer → Main | 手动触发同步 |
| `sync-resolve` | Renderer → Main | 用户选择冲突解决方案 |
| `sync-status` | Main → Renderer | 同步状态变更通知 |
| `sync-conflict` | Main → Renderer | 冲突通知 |
| `get-trash` | Renderer → Main | 获取回收站列表 |
| `restore-note` | Renderer → Main | 恢复已删除笔记 |
| `permanent-delete` | Renderer → Main | 永久删除笔记 |
| `get-note-history` | Renderer → Main | 获取笔记版本历史 |
| `rollback-note` | Renderer → Main | 回滚到指定版本 |

### 应用更新

| Channel | 方向 | 说明 |
| ------- | ---- | ---- |
| `get-app-version` | Renderer → Main | 获取当前应用版本号 |
| `check-for-updates` | Renderer → Main | 检查是否有新版本 |
| `download-update` | Renderer → Main | 下载更新包 |
| `install-update` | Renderer → Main | 安装更新并重启 |
| `update-status` | Main → Renderer | 更新状态变更通知 |
| `update-progress` | Main → Renderer | 下载进度通知 |

---

## 开发注意事项

### 通用规范

1. **自身文档维护**: 如果修改内容涉及新增功能、架构变更、新增文件或目录等，需要同步更新本 `CLAUDE.md` 文档
2. **Git 提交规范**: commit message 使用中文，格式为 `<type>: <描述>`，type 包括 feat（新功能）、fix（修复）、docs（文档）、refactor（重构）、style（格式）、test（测试）、chore（构建/工具）
3. **依赖管理**: 新增依赖前需评估必要性和安全性，避免引入不必要的依赖
4. **日志规范**: 关键操作需记录日志（如登录、权限变更、数据删除等）

### 项目特定规范

**TypeScript 规范**
- 使用 TypeScript 严格模式
- 共享类型定义放在 `src/types/` 目录
- IPC 接口类型需在 `src/preload/index.d.ts` 中声明

**Electron 规范**
- 主进程代码放在 `src/main/`
- 渲染进程通过 `window.api` 调用主进程功能
- 禁止在渲染进程直接访问 Node.js API
- IPC handler 使用 `ipcMain.handle` + `ipcRenderer.invoke` 模式

**数据库规范**
- 数据库路径：`app.getPath('userData')/notes.db`
- 使用 `better-sqlite3` 同步 API
- 修改表结构需在 `checkDatabaseSchema()` 中添加迁移逻辑

**前端规范**
- 组件使用函数式组件 + Hooks
- 路径别名：`@renderer` → `src/renderer/src/`
- 样式使用 CSS 文件（非 CSS-in-JS）

**安全规范**
- 密钥、密码、token 等敏感信息不得硬编码
- 客户端密钥（CLIENT_ID/CLIENT_SECRET）仅用于开发环境
- 图片文件名校验使用正则 `/^[\w.-]+$/`

**构建与发布**
- 开发：`npm run dev`
- 构建：`npm run build:win` / `build:mac` / `build:linux`
- 类型检查：`npm run typecheck`
- 代码格式化：`npm run format`
- Lint 检查：`npm run lint`
