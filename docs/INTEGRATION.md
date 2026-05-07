# 其他系统接入用户中心指南

## 一、接入前提

在用户中心管理后台完成以下配置（超级管理员操作）。

### 1. 注册系统

在「系统管理」页面创建业务系统，或通过 API：

```bash
curl -X POST "http://<用户中心地址>/api/v1/systems?name=我的系统&code=my_system&description=业务系统描述" \
  -H "Authorization: Bearer <管理员token>"
```

### 2. 注册客户端

在「客户端管理」页面为系统创建客户端，获取凭证：

```bash
curl -X POST "http://<用户中心地址>/api/v1/clients?client_id=my_app&client_secret=my_secret_key&redirect_uri=http://my-app.com/callback&system_id=1&name=Web端" \
  -H "Authorization: Bearer <管理员token>"
```

返回值中的 `client_id` 和 `client_secret` 就是接入凭证。

### 3. 创建角色和权限

为系统创建专属角色和权限：

```bash
# 创建权限
curl -X POST "http://<用户中心地址>/api/v1/permissions" \
  -H "Authorization: Bearer <管理员token>" \
  -H "Content-Type: application/json" \
  -d '{"name":"文章管理","code":"article:manage","system_id":1,"type":"api"}'

# 创建角色
curl -X POST "http://<用户中心地址>/api/v1/roles" \
  -H "Authorization: Bearer <管理员token>" \
  -H "Content-Type: application/json" \
  -d '{"name":"编辑","system_id":1,"description":"内容编辑人员"}'

# 给角色分配权限
curl -X POST "http://<用户中心地址>/api/v1/roles/1/permissions/1" \
  -H "Authorization: Bearer <管理员token>"

# 给用户分配角色
curl -X POST "http://<用户中心地址>/api/v1/users/2/roles/1" \
  -H "Authorization: Bearer <管理员token>"
```

---

## 二、接入方式

### 方式一：后端直接调用（推荐）

适用于传统的服务端渲染应用（Django、Flask、Spring Boot 等）。

#### 登录获取 Token

```python
import requests

USER_CENTER_URL = "http://<用户中心地址>/api/v1"
CLIENT_ID = "your_client_id"        # 从管理员处获取
CLIENT_SECRET = "your_client_secret"  # 从管理员处获取

def login(username: str, password: str) -> dict:
    """调用用户中心登录接口，需要 client 凭证"""
    resp = requests.post(f"{USER_CENTER_URL}/login", json={
        "username": username,
        "password": password,
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET
    })
    resp.raise_for_status()
    return resp.json()
    # 返回: {"access_token": "xxx", "refresh_token": "xxx", "token_type": "Bearer"}
```

#### 验证 Token 并获取用户信息

```python
def get_current_user(access_token: str) -> dict:
    """用 token 获取当前用户信息"""
    resp = requests.get(f"{USER_CENTER_URL}/users/me", headers={
        "Authorization": f"Bearer {access_token}"
    })
    resp.raise_for_status()
    return resp.json()
    # 返回: {"id": 1, "username": "admin", "email": "admin@example.com", ...}
```

#### 获取用户角色列表

```python
def get_user_roles(access_token: str, user_id: int) -> list:
    """获取用户的角色列表"""
    resp = requests.get(f"{USER_CENTER_URL}/users/{user_id}/roles", headers={
        "Authorization": f"Bearer {access_token}"
    })
    resp.raise_for_status()
    return resp.json()
```

#### 刷新 Token

```python
def refresh_token(refresh_token: str) -> dict:
    """Token 过期时用 refresh_token 换新 token"""
    resp = requests.post(f"{USER_CENTER_URL}/refresh", json={
        "refresh_token": refresh_token
    })
    resp.raise_for_status()
    return resp.json()
```

#### 退出登录

```python
def logout(access_token: str):
    """退出登录，token 会被加入黑名单"""
    requests.post(f"{USER_CENTER_URL}/logout", headers={
        "Authorization": f"Bearer {access_token}"
    })
```

---

### 方式二：前端直接调用

适用于 Vue、React 等 SPA 应用。

#### 登录

```typescript
const USER_CENTER_URL = "/api/v1"  // 通过 nginx 反代到用户中心
const CLIENT_ID = "your_client_id"        // 从管理员处获取
const CLIENT_SECRET = "your_client_secret"  // 从管理员处获取

async function login(username: string, password: string) {
  const res = await fetch(`${USER_CENTER_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username,
      password,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET
    })
  })
  const data = await res.json()
  localStorage.setItem("access_token", data.access_token)
  localStorage.setItem("refresh_token", data.refresh_token)
  return data
}
```

#### 带认证的请求封装

```typescript
async function authFetch(url: string, options: RequestInit = {}) {
  const token = localStorage.getItem("access_token")
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
      ...options.headers
    }
  })

  // 401 时尝试刷新 token
  if (res.status === 401) {
    const refreshed = await refreshToken()
    if (refreshed) {
      return fetch(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${refreshed.access_token}`,
          ...options.headers
        }
      })
    }
  }
  return res
}
```

#### 刷新 Token

```typescript
async function refreshToken() {
  const refresh = localStorage.getItem("refresh_token")
  if (!refresh) return null
  const res = await fetch(`${USER_CENTER_URL}/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refresh })
  })
  if (!res.ok) {
    localStorage.clear()
    window.location.href = "/login"
    return null
  }
  const data = await res.json()
  localStorage.setItem("access_token", data.access_token)
  localStorage.setItem("refresh_token", data.refresh_token)
  return data
}
```

#### Nginx 反向代理配置

```nginx
server {
    listen 80;
    server_name my-app.com;

    # 前端静态资源
    location / {
        root /var/www/my-app/dist;
        try_files $uri $uri/ /index.html;
    }

    # 代理到用户中心
    location /api/v1/ {
        proxy_pass http://user-center-server:8000/api/v1/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # 代理到自己的后端
    location /api/business/ {
        proxy_pass http://my-backend:8080/api/business/;
    }
}
```

---

### 方式三：后端网关验证（微服务架构）

适用于微服务场景，API 网关统一验证 token。

```python
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer
import requests

security = HTTPBearer()
USER_CENTER_URL = "http://user-center:8000/api/v1"

async def verify_token(credentials=Depends(security)):
    """在网关或中间件中验证 token"""
    token = credentials.credentials
    try:
        resp = requests.get(f"{USER_CENTER_URL}/users/me", headers={
            "Authorization": f"Bearer {token}"
        })
        if resp.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid token")
        return resp.json()
    except requests.RequestException:
        raise HTTPException(status_code=503, detail="User center unavailable")
```

---

## 三、API 接口速查表

基础地址：`http://<用户中心地址>/api/v1`

### 认证相关

| 接口 | 方法 | 认证 | 说明 |
|------|------|------|------|
| `/login` | POST | Client 凭证 | 登录，需要 client_id + client_secret，返回 access_token + refresh_token |
| `/token` | POST | Client 凭证 | OAuth2 兼容登录（form 表单），需要 client_id + client_secret |
| `/refresh` | POST | 无 | 用 refresh_token 换新 access_token |
| `/logout` | POST | Bearer | 退出登录，token 加入黑名单 |

### 用户相关

| 接口 | 方法 | 认证 | 说明 |
|------|------|------|------|
| `/users/me` | GET | Bearer | 获取当前用户信息 |
| `/users/me` | PUT | Bearer | 修改个人信息（邮箱等） |
| `/users/me/password` | PUT | Bearer | 修改密码 |
| `/users/{id}/profile` | GET | Bearer | 获取用户资料（昵称、手机等） |
| `/users/{id}/profile` | PUT | Bearer | 更新用户资料（仅限本人） |

### 管理相关（需超级管理员权限）

| 接口 | 方法 | 说明 |
|------|------|------|
| `/stats` | GET | 获取统计数据（用户/角色/权限/系统数量） |
| `/users/` | GET | 用户列表（支持 `?keyword=` 搜索） |
| `/users/` | POST | 创建用户 |
| `/users/{id}` | PUT | 编辑用户 |
| `/users/{id}` | DELETE | 删除用户 |
| `/users/{id}/roles` | GET | 获取用户的角色列表 |
| `/users/{id}/roles/{role_id}` | POST | 给用户分配角色 |
| `/users/{id}/roles/{role_id}` | DELETE | 移除用户角色 |
| `/systems` | GET | 系统列表 |
| `/systems` | POST | 创建系统 |
| `/systems/{id}` | PUT | 编辑系统 |
| `/systems/{id}` | DELETE | 删除系统 |
| `/roles` | GET | 角色列表（支持 `?system_id=` 筛选） |
| `/roles` | POST | 创建角色 |
| `/roles/{id}` | PUT | 编辑角色 |
| `/roles/{id}` | DELETE | 删除角色 |
| `/roles/{id}/permissions/{perm_id}` | POST | 给角色分配权限 |
| `/roles/{id}/permissions/{perm_id}` | DELETE | 移除角色权限 |
| `/permissions` | GET | 权限列表（支持 `?system_id=` 筛选） |
| `/permissions` | POST | 创建权限 |
| `/clients` | GET | 客户端列表 |
| `/clients` | POST | 创建客户端 |
| `/clients/{client_id}` | GET | 客户端详情 |
| `/clients/{client_id}` | DELETE | 删除客户端 |

---

## 四、Token 说明

| 字段 | 值 |
|------|------|
| Access Token 有效期 | 30 分钟 |
| Refresh Token 有效期 | 7 天 |
| Token 类型 | Bearer |
| 签名算法 | HS256 |

请求头格式：

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

---

## 五、接入流程总结

```
1. 联系管理员 → 在用户中心注册你的系统 + 客户端，获取 client_id 和 client_secret
2. 配置角色权限 → 为系统创建角色和权限码
3. 用户登录   → POST /login（携带 client_id + client_secret）获取 token
4. 携带 token → 调用业务接口时 Header 带 Bearer token
5. 后端验证   → 调用 /users/me 验证 token 获取用户身份
6. 权限控制   → 根据用户角色/权限码控制业务功能访问
```
