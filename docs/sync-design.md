# kun-notes 笔记同步服务设计文档

## 1. 概述

为 kun-notes 桌面端添加云端同步能力，支持多设备双向同步笔记数据。

### 1.1 核心目标

- 多设备间双向同步笔记（创建、编辑、删除、置顶、文件夹移动）
- 冲突检测与用户选择，不静默丢数据
- 增量同步，只传输变化的记录
- 软删除，数据可恢复

### 1.2 技术选型

| 组件 | 技术 | 说明 |
|------|------|------|
| 服务端框架 | Flask (Python) | 轻量灵活 |
| 数据库 | PostgreSQL（待确认） | 支持 JSONB、并发写入好 |
| ORM | SQLAlchemy + Flask-Migrate | 模型定义 + 迁移管理 |
| 认证 | Bearer Token（对接 user.mtjx.top） | 客户端已有登录流程 |
| 部署域名 | notes.mtjx.top（待确认） | 与用户中心同域体系 |

---

## 2. 整体架构

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   设备 A     │     │   设备 B     │     │   设备 C     │
│  (Electron)  │     │  (Electron)  │     │  (Electron)  │
│  本地 SQLite  │     │  本地 SQLite  │     │  本地 SQLite  │
└──────┬───────┘     └──────┬───────┘     └──────┬───────┘
       │                    │                    │
       │    POST /api/v1/sync                    │
       └────────────┬───────┴────────────────────┘
                    │
            ┌───────▼────────┐
            │  notes.mtjx.top │
            │   Flask 服务     │
            │   PostgreSQL    │
            └───────┬────────┘
                    │ Token 校验
            ┌───────▼────────┐
            │ user.mtjx.top  │
            │   用户中心      │
            └────────────────┘
```

同步模式：**拉-改-推（Pull-Modify-Push）**

客户端每次同步时同时发送本地变更和拉取服务端变更，一次 HTTP 请求完成双向同步。

---

## 3. 目录结构

### 3.1 服务端（新增）

```
kun-note/
├── src/                        # 客户端（不变）
├── server/                     # Flask 同步服务
│   ├── app/
│   │   ├── __init__.py         # Flask app 工厂函数
│   │   ├── config.py           # 配置类（数据库 URI、密钥等）
│   │   ├── extensions.py       # 扩展初始化（db, migrate）
│   │   ├── models.py           # SQLAlchemy 数据模型
│   │   ├── auth.py             # Token 校验装饰器/中间件
│   │   ├── exceptions.py       # 自定义异常
│   │   └── routes/
│   │       ├── __init__.py
│   │       └── sync.py         # 同步 API 蓝图
│   ├── migrations/             # Flask-Migrate 生成的迁移文件
│   ├── requirements.txt
│   ├── wsgi.py                 # 生产环境启动入口（Gunicorn）
│   └── run.py                  # 开发环境启动入口
├── shared/                     # 可选：共享类型定义
│   └── types/
│       └── note.ts             # 与客户端同步的类型（文档参考用）
├── docs/
│   └── sync-design.md          # 本文档
└── package.json
```

### 3.2 客户端（改动）

```
src/
├── main/
│   ├── ipc/
│   │   ├── auth.ts             # 不变
│   │   └── sync.ts             # 新增：同步相关 IPC handlers
│   ├── utils/
│   │   ├── request.ts          # 改动：启用 notesService 实例
│   │   └── sync-manager.ts     # 新增：同步管理器（定时、重试、队列）
│   └── index.ts                # 改动：初始化同步管理器
├── preload/
│   ├── index.ts                # 改动：暴露同步 API
│   └── index.d.ts              # 改动：新增同步相关类型声明
├── renderer/src/
│   ├── components/
│   │   └── SyncStatus.tsx      # 新增：同步状态指示器
│   └── pages/
│       └── Settings.tsx        # 改动：同步设置项
└── types/
    ├── note.ts                 # 改动：新增 version, deleted, syncedAt
    └── sync.ts                 # 新增：同步相关类型定义
```

---

## 4. 数据模型

### 4.1 服务端数据库（PostgreSQL）

#### notes 表

```sql
CREATE TABLE notes (
    id          VARCHAR(36) PRIMARY KEY,     -- UUID，与客户端一致
    user_id     INTEGER NOT NULL,            -- 关联 user.mtjx.top 的用户 ID
    title       TEXT NOT NULL DEFAULT '',
    content     TEXT NOT NULL DEFAULT '',
    type        VARCHAR(10) NOT NULL DEFAULT 'note',  -- 'note' | 'folder'
    parent_id   VARCHAR(36),                 -- 父级文件夹 ID
    is_pinned   BOOLEAN NOT NULL DEFAULT FALSE,
    version     INTEGER NOT NULL DEFAULT 1,  -- 版本号，每次修改 +1
    deleted     BOOLEAN NOT NULL DEFAULT FALSE,  -- 软删除
    created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_notes_user_updated ON notes (user_id, updated_at);
CREATE INDEX idx_notes_user_id ON notes (user_id);
CREATE UNIQUE INDEX idx_notes_user_note ON notes (user_id, id);
```

#### sync_history 表（可选，用于审计与回滚）

```sql
CREATE TABLE sync_history (
    id          SERIAL PRIMARY KEY,
    note_id     VARCHAR(36) NOT NULL,
    user_id     INTEGER NOT NULL,
    version     INTEGER NOT NULL,
    snapshot    JSONB NOT NULL,              -- 该版本完整快照
    synced_at   TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sync_history_note ON sync_history (note_id, version);
```

### 4.2 客户端本地数据库（SQLite）

现有 `notes` 表新增 3 个字段：

```sql
ALTER TABLE notes ADD COLUMN version   INTEGER DEFAULT 1;
ALTER TABLE notes ADD COLUMN deleted   INTEGER DEFAULT 0;
ALTER TABLE notes ADD COLUMN syncedAt  INTEGER DEFAULT 0;
```

对应 TypeScript 类型变更：

```typescript
// src/types/note.ts
export interface Note {
  id: string | null
  title: string
  content: string
  updatedAt: number
  type: NoteType
  parentId: string
  isPinned?: boolean
  version: number      // 新增：版本号
  deleted: boolean     // 新增：软删除标记
  syncedAt: number     // 新增：上次同步成功时间戳（ms）
}
```

---

## 5. 同步协议

### 5.1 核心接口

**`POST /api/v1/sync`**

一次请求完成双向同步：客户端推送变更 + 拉取服务端变更。

#### 请求头

```
Authorization: Bearer <access_token>
Content-Type: application/json
```

#### 请求体

```jsonc
{
  "lastSyncTime": 1715068800000,   // 客户端上次同步时间戳（ms），首次为 0
  "changes": [                      // 客户端本地变更列表（仅 changedAt > lastSyncTime 的记录）
    {
      "id": "uuid-1",
      "title": "笔记标题",
      "content": "笔记内容...",
      "type": "note",
      "parentId": "uuid-folder",
      "isPinned": false,
      "version": 5,
      "deleted": false,
      "updatedAt": 1715068900000
    }
  ]
}
```

#### 响应体（成功）

```jsonc
{
  // 成功同步的笔记 ID 列表
  "synced": ["uuid-1", "uuid-3"],

  // 冲突列表（需要客户端提示用户选择）
  "conflicts": [
    {
      "id": "uuid-2",
      "serverVersion": {
        "id": "uuid-2",
        "title": "服务端标题",
        "content": "服务端内容...",
        "type": "note",
        "parentId": "root",
        "isPinned": false,
        "version": 6,
        "deleted": false,
        "updatedAt": 1715069000000
      },
      "clientVersion": {
        "id": "uuid-2",
        "title": "客户端标题",
        "content": "客户端内容...",
        "type": "note",
        "parentId": "root",
        "isPinned": false,
        "version": 5,
        "deleted": false,
        "updatedAt": 1715068950000
      }
    }
  ],

  // 服务端有变更的笔记（lastSyncTime 之后被其他设备修改的）
  "serverChanges": [
    {
      "id": "uuid-3",
      "title": "其他设备改的标题",
      "content": "新内容...",
      "type": "note",
      "parentId": "uuid-folder",
      "isPinned": true,
      "version": 8,
      "deleted": false,
      "updatedAt": 1715070000000
    }
  ],

  // 本次同步的服务端时间戳，客户端存储后作为下次 lastSyncTime
  "syncTime": 1715070100000
}
```

#### 响应体（未登录）

```json
{
  "code": 401,
  "message": "Token expired or invalid"
}
```

### 5.2 冲突检测算法

```
对客户端提交的每条变更 note X：

1. 查询服务端 note X 当前记录（WHERE id = X AND user_id = current_user）

2. 如果服务端不存在该记录：
   → 无冲突，执行 INSERT

3. 如果服务端存在，比较 version：
   a. server.version == client.version
      → 无冲突，双方基于同一版本，直接 UPDATE

   b. server.version > client.version AND server.updated_at > lastSyncTime
      → 冲突！该笔记在上次同步后被其他设备修改过
      → 不覆盖，将两个版本加入 conflicts 返回

   c. server.version > client.version AND server.updated_at <= lastSyncTime
      → 非本次同步周期的冲突（可能是之前同步遗留）
      → 以客户端版本为准，执行 UPDATE（last-write-wins）
```

### 5.3 软删除处理

- 客户端删除笔记时：设置 `deleted = true`，`updatedAt = Date.now()`，不同步物理删除
- 同步时软删除记录也会被推送，服务端标记 `deleted = true`
- 服务端返回 `serverChanges` 时包含已软删除的记录，客户端也标记为已删除
- 已软删除的记录不再出现在笔记列表中，但数据库保留
- 未来可添加"回收站"功能查看已删除笔记

### 5.4 首次同步（新设备）

新设备 `lastSyncTime = 0`，服务端返回该用户所有笔记作为 `serverChanges`，客户端全量写入本地。

---

## 6. 同步触发策略

| 触发时机 | 说明 | 实现方式 |
|----------|------|----------|
| **笔记保存时** | 用户编辑保存后立即同步该条笔记 | `save-note` IPC 后触发 |
| **应用启动时** | 打开应用做一次全量拉取 | `app.whenReady()` 后触发 |
| **定时轮询** | 后台每 60 秒拉取一次服务端变更 | `setInterval` 定时器 |
| **手动同步** | 用户点击同步按钮 | UI 按钮触发 |
| **网络恢复时** | 断网重连后自动同步 | 监听 `online` 事件 |

### 6.1 离线处理

- 无网络时所有操作正常进行，变更记录在本地
- 记录每次修改的 `updatedAt`，恢复网络后通过 `lastSyncTime` 补同步
- 同步管理器维护一个 dirty 标记队列，网络恢复后批量推送

### 6.2 同步状态机

```
         ┌─────────┐
         │  IDLE    │ ← 空闲状态
         └────┬────┘
              │ 触发同步
         ┌────▼────┐
         │ SYNCING  │ ← 同步中（UI 显示旋转图标）
         └────┬────┘
              │
       ┌──────┴──────┐
       │              │
  ┌────▼────┐   ┌────▼────┐
  │ SUCCESS  │   │  ERROR  │ ← 失败（UI 显示警告，自动重试）
  └────┬────┘   └────┬────┘
       │              │
       └──────┬───────┘
              │
         ┌────▼────┐
         │  IDLE    │
         └─────────┘
```

---

## 7. 客户端改动详情

### 7.1 request.ts

启用已预留的 `notesService` 实例：

```typescript
// 新增笔记同步服务实例
const NOTES_BASE_URL = 'https://notes.mtjx.top'
const NOTES_API_URL = `${NOTES_BASE_URL}/api/v1`

const notesService: AxiosInstance = axios.create({
  baseURL: NOTES_BASE_URL,
  timeout: 15_000
})

// 复用相同的 token 拦截器逻辑
notesService.interceptors.request.use(/* 同 userService */)
notesService.interceptors.response.use(/* 同 userService */)

export async function notesRequest<T>(config: HttpRequestConfig): Promise<ApiResponse<T> | T> {
  const response = await notesService.request<ApiResponse<T>>(config)
  return response.data
}
```

### 7.2 sync-manager.ts

新增同步管理器，封装同步逻辑：

```
职责：
- 维护 lastSyncTime（持久化到本地文件或数据库）
- 触发同步（保存时、定时、启动时）
- 处理冲突（通过 IPC 通知渲染进程弹窗让用户选择）
- 处理离线场景（网络不可用时跳过同步，恢复后自动补同步）
- 防抖/节流（避免频繁保存导致频繁同步）
```

### 7.3 IPC 新增接口

| Channel | 方向 | 说明 |
|---------|------|------|
| `sync-start` | Renderer → Main | 手动触发同步 |
| `sync-status` | Main → Renderer | 同步状态变更通知（IDLE/SYNCING/SUCCESS/ERROR） |
| `sync-conflict` | Main → Renderer | 冲突通知，携带两个版本，等待用户选择 |
| `sync-resolve` | Renderer → Main | 用户选择冲突解决方案（use-mine / use-server） |

### 7.4 数据库迁移

在 `checkDatabaseSchema()` 中添加迁移逻辑：

```typescript
const syncColumns = [
  { name: 'version',  sql: 'version INTEGER DEFAULT 1' },
  { name: 'deleted',   sql: 'deleted INTEGER DEFAULT 0' },
  { name: 'syncedAt',  sql: 'syncedAt INTEGER DEFAULT 0' }
]
// 逐个检查并 ALTER TABLE ADD COLUMN（与现有 isPinned 迁移逻辑一致）
```

---

## 8. 认证设计

### 8.1 Token 校验方式

客户端已有 `user.mtjx.top` 颁发的 Bearer Token。服务端校验有两种方案：

| 方案 | 原理 | 优点 | 缺点 |
|------|------|------|------|
| **JWT 本地校验** | 服务端用同一 secret 解码验证签名 | 快，无网络依赖 | 需要共享 secret |
| **远程校验** | 调用 `user.mtjx.top/api/v1/users/me` 验证 | 无需共享密钥 | 每次请求多一次 HTTP |

**建议**：优先使用 JWT 本地校验。如果用户中心不是 JWT 格式，退化为远程校验 + 服务端缓存（Redis 缓存用户信息 5 分钟）。

### 8.2 用户隔离

所有查询都带 `WHERE user_id = ?` 条件，确保用户只能访问自己的笔记。

---

## 9. API 汇总

| 方法 | 路径 | 说明 |
|------|------|------|
| `POST` | `/api/v1/sync` | 核心同步接口（推送 + 拉取） |
| `GET` | `/api/v1/health` | 健康检查 |

仅一个业务接口，保持极简。

---

## 10. 边界情况与处理

| 场景 | 处理方式 |
|------|----------|
| 首次同步（新设备） | `lastSyncTime = 0`，服务端返回全量数据 |
| 同时删除同一笔记 | 以最后操作的 `updatedAt` 为准，软删除胜出 |
| 一端删、一端改 | 冲突，让用户选择恢复还是确认删除 |
| 文件夹被删除，子笔记未移走 | 子笔记 `parentId` 指向已删除文件夹，客户端显示在根目录 |
| 同步过程中网络断开 | 记录失败，下次同步时重试（基于 lastSyncTime） |
| 客户端时钟不准 | 以服务端 `syncTime` 为准，不依赖客户端本地时钟 |
| 大量笔记首次同步 | 分页拉取，每页 100 条，避免超时 |
| 笔记内容过大 | 服务端设置请求体大小限制（如 1MB），超限返回 413 |

---

## 11. 待确认事项

- [ ] 数据库选型：PostgreSQL 还是 MySQL？
- [ ] 用户中心 Token 格式：是否为 JWT？
- [ ] 部署域名：`notes.mtjx.top`？
- [ ] 是否需要同步历史记录/版本回滚功能？
- [ ] 是否需要回收站（查看已删除笔记）？
