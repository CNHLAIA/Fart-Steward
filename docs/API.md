# Fart Tracker API 文档

API 基础地址: `http://localhost:5000/api`

所有 API 响应格式为 JSON。时间戳使用 ISO 8601 格式（UTC）。

---

## 目录

1. [认证模块](#认证模块-apiauth)
2. [记录模块](#记录模块-apirecords)
3. [类型模块](#类型模块-apifart-types)
4. [导出模块](#导出模块-apiexport)
5. [分析模块](#分析模块-apianalytics)
6. [健康检查](#健康检查-apihealth)
7. [枚举值说明](#枚举值说明)
8. [错误码说明](#错误码说明)

---

## 枚举值说明

### duration (时长)
| 值 | 中文说明 |
|------|----------|
| `very_short` | 极短 |
| `short` | 短 |
| `medium` | 中 |
| `long` | 长 |

### smell_level (臭味程度)
| 值 | 中文说明 |
|------|----------|
| `mild` | 轻微 |
| `tolerable` | 可忍受 |
| `stinky` | 臭 |
| `extremely_stinky` | 极臭 |

### temperature (温感)
| 值 | 中文说明 |
|------|----------|
| `hot` | 热 |
| `cold` | 冷 |

### moisture (湿感)
| 值 | 中文说明 |
|------|----------|
| `moist` | 湿 |
| `dry` | 干 |

---

## 认证模块 (/api/auth)

### POST /api/auth/register

用户注册

**认证**: 无

**请求体**:
```json
{
  "username": "string, 必填, 用户名",
  "password": "string, 必填, 密码"
}
```

**响应示例 (201 Created)**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "username": "zhangsan"
  }
}
```

**错误码**:
| 状态码 | 错误码 | 说明 |
|--------|--------|------|
| 400 | INVALID_REQUEST | 缺少用户名或密码 |
| 409 | USERNAME_TAKEN | 用户名已被占用 |

---

### POST /api/auth/login

用户登录

**认证**: 无

**请求体**:
```json
{
  "username": "string, 必填, 用户名",
  "password": "string, 必填, 密码"
}
```

**响应示例 (200 OK)**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "username": "zhangsan"
  }
}
```

**错误码**:
| 状态码 | 错误码 | 说明 |
|--------|--------|------|
| 400 | INVALID_REQUEST | 缺少用户名或密码 |
| 401 | INVALID_CREDENTIALS | 用户名或密码错误 |

---

### POST /api/auth/logout

用户登出（前端清除 token 即可）

**认证**: JWT

**请求头**:
```
Authorization: Bearer <token>
```

**响应示例 (200 OK)**:
```json
{
  "status": "ok"
}
```

---

### GET /api/auth/me

获取当前用户信息

**认证**: JWT

**请求头**:
```
Authorization: Bearer <token>
```

**响应示例 (200 OK)**:
```json
{
  "user": {
    "username": "zhangsan"
  }
}
```

**错误码**:
| 状态码 | 错误码 | 说明 |
|--------|--------|------|
| 401 | UNAUTHORIZED | 未授权 |

---

## 记录模块 (/api/records)

### POST /api/records

创建一条放屁记录

**认证**: JWT

**请求头**:
```
Authorization: Bearer <token>
Content-Type: application/json
```

**请求体**:
```json
{
  "timestamp": "string, 可选, ISO 8601 格式, 默认为当前时间",
  "duration": "string, 必填, 枚举值: very_short/short/medium/long",
  "type_id": "integer, 必填, 放屁类型 ID",
  "smell_level": "string, 必填, 枚举值: mild/tolerable/stinky/extremely_stinky",
  "temperature": "string, 必填, 枚举值: hot/cold",
  "moisture": "string, 必填, 枚举值: moist/dry",
  "notes": "string, 可选, 备注"
}
```

**响应示例 (201 Created)**:
```json
{
  "id": 123,
  "timestamp": "2024-01-15T08:30:00Z",
  "duration": "medium",
  "type_id": 3,
  "smell_level": "stinky",
  "temperature": "hot",
  "moisture": "moist",
  "notes": "早餐后"
}
```

**错误码**:
| 状态码 | 错误码 | 说明 |
|--------|--------|------|
| 400 | INVALID_REQUEST | 缺少必填字段或时间戳格式错误 |
| 400 | INVALID_ENUM | 枚举值无效 |
| 400 | INVALID_TYPE | type_id 无效或类型不存在 |
| 401 | UNAUTHORIZED | 未授权 |

---

### GET /api/records

获取记录列表（支持分页和日期过滤）

**认证**: JWT

**请求头**:
```
Authorization: Bearer <token>
```

**查询参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | integer | 可选 | 页码，默认 1 |
| per_page | integer | 可选 | 每页条数，默认 20，最大 100 |
| date_from | string | 可选 | 开始日期 (YYYY-MM-DD) |
| date_to | string | 可选 | 结束日期 (YYYY-MM-DD) |

**响应示例 (200 OK)**:
```json
{
  "items": [
    {
      "id": 123,
      "timestamp": "2024-01-15T08:30:00Z",
      "duration": "medium",
      "type_id": 3,
      "smell_level": "stinky",
      "temperature": "hot",
      "moisture": "moist",
      "notes": "早餐后"
    }
  ],
  "total": 150,
  "page": 1,
  "per_page": 20
}
```

**错误码**:
| 状态码 | 错误码 | 说明 |
|--------|--------|------|
| 400 | INVALID_REQUEST | 分页参数无效或日期格式错误 |
| 401 | UNAUTHORIZED | 未授权 |

---

### GET /api/records/{id}

获取单条记录详情

**认证**: JWT

**请求头**:
```
Authorization: Bearer <token>
```

**路径参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | integer | 必填 | 记录 ID |

**响应示例 (200 OK)**:
```json
{
  "id": 123,
  "timestamp": "2024-01-15T08:30:00Z",
  "duration": "medium",
  "type_id": 3,
  "smell_level": "stinky",
  "temperature": "hot",
  "moisture": "moist",
  "notes": "早餐后"
}
```

**错误码**:
| 状态码 | 错误码 | 说明 |
|--------|--------|------|
| 401 | UNAUTHORIZED | 未授权 |
| 404 | NOT_FOUND | 记录不存在或无权限 |

---

### PUT /api/records/{id}

更新记录

**认证**: JWT

**请求头**:
```
Authorization: Bearer <token>
Content-Type: application/json
```

**路径参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | integer | 必填 | 记录 ID |

**请求体** (所有字段可选):
```json
{
  "timestamp": "string, ISO 8601 格式",
  "duration": "string, 枚举值: very_short/short/medium/long",
  "type_id": "integer, 放屁类型 ID",
  "smell_level": "string, 枚举值: mild/tolerable/stinky/extremely_stinky",
  "temperature": "string, 枚举值: hot/cold",
  "moisture": "string, 枚举值: moist/dry",
  "notes": "string, 备注"
}
```

**响应示例 (200 OK)**:
```json
{
  "id": 123,
  "timestamp": "2024-01-15T09:00:00Z",
  "duration": "long",
  "type_id": 3,
  "smell_level": "extremely_stinky",
  "temperature": "hot",
  "moisture": "moist",
  "notes": "更新后的备注"
}
```

**错误码**:
| 状态码 | 错误码 | 说明 |
|--------|--------|------|
| 400 | INVALID_REQUEST | 时间戳格式错误 |
| 400 | INVALID_ENUM | 枚举值无效 |
| 400 | INVALID_TYPE | type_id 无效 |
| 401 | UNAUTHORIZED | 未授权 |
| 404 | NOT_FOUND | 记录不存在或无权限 |

---

### DELETE /api/records/{id}

删除记录

**认证**: JWT

**请求头**:
```
Authorization: Bearer <token>
```

**路径参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | integer | 必填 | 记录 ID |

**响应示例 (200 OK)**:
```json
{
  "status": "ok"
}
```

**错误码**:
| 状态码 | 错误码 | 说明 |
|--------|--------|------|
| 401 | UNAUTHORIZED | 未授权 |
| 404 | NOT_FOUND | 记录不存在或无权限 |

---

## 类型模块 (/api/fart-types)

### GET /api/fart-types

获取所有放屁类型（包括预设和自定义）

**认证**: JWT

**请求头**:
```
Authorization: Bearer <token>
```

**响应示例 (200 OK)**:
```json
[
  {
    "id": 1,
    "name": "正常",
    "is_preset": true
  },
  {
    "id": 2,
    "name": "响屁",
    "is_preset": true
  },
  {
    "id": 5,
    "name": "自定义类型",
    "is_preset": false
  }
]
```

**错误码**:
| 状态码 | 错误码 | 说明 |
|--------|--------|------|
| 401 | UNAUTHORIZED | 未授权 |

---

### POST /api/fart-types

创建自定义放屁类型

**认证**: JWT

**请求头**:
```
Authorization: Bearer <token>
Content-Type: application/json
```

**请求体**:
```json
{
  "name": "string, 必填, 类型名称"
}
```

**响应示例 (201 Created)**:
```json
{
  "id": 5,
  "name": "自定义类型",
  "is_preset": false
}
```

**错误码**:
| 状态码 | 错误码 | 说明 |
|--------|--------|------|
| 400 | INVALID_REQUEST | 缺少名称 |
| 401 | UNAUTHORIZED | 未授权 |
| 409 | TYPE_EXISTS | 类型名称已存在 |

---

## 导出模块 (/api/export)

### GET /api/export/csv

导出记录为 CSV 格式

**认证**: JWT

**请求头**:
```
Authorization: Bearer <token>
```

**查询参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| date_from | string | 可选 | 开始日期 (YYYY-MM-DD) |
| date_to | string | 可选 | 结束日期 (YYYY-MM-DD) |

**响应**: CSV 文件下载

**Content-Type**: `text/csv; charset=utf-8`

**文件名**: `fart_records.csv`

**CSV 列**: 时间, 时长, 类型, 臭味程度, 温感, 湿感, 备注

**错误码**:
| 状态码 | 说明 |
|--------|------|
| 401 | 未授权 |

---

### GET /api/export/excel

导出记录为 Excel 格式

**认证**: JWT

**请求头**:
```
Authorization: Bearer <token>
```

**查询参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| date_from | string | 可选 | 开始日期 (YYYY-MM-DD) |
| date_to | string | 可选 | 结束日期 (YYYY-MM-DD) |

**响应**: Excel 文件下载

**Content-Type**: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`

**文件名**: `fart_records.xlsx`

**工作表名称**: 屁屁记录

**列**: 时间, 时长, 类型, 臭味程度, 温感, 湿感, 备注

**错误码**:
| 状态码 | 说明 |
|--------|------|
| 401 | 未授权 |

---

## 分析模块 (/api/analytics)

所有分析端点支持以下过滤参数：

| 参数 | 类型 | 说明 |
|------|------|------|
| date_from | string | 开始日期 (YYYY-MM-DD) |
| date_to | string | 结束日期 (YYYY-MM-DD) |
| days | integer | 最近 N 天的数据 |
| weeks | integer | 最近 N 周的数据 |

### GET /api/analytics/daily-count

每日放屁数量统计

**认证**: JWT

**响应示例 (200 OK)**:
```json
{
  "dates": ["2024-01-10", "2024-01-11", "2024-01-12"],
  "counts": [3, 5, 2]
}
```

---

### GET /api/analytics/weekly-count

每周放屁数量统计

**认证**: JWT

**响应示例 (200 OK)**:
```json
{
  "weeks": ["2024-01", "2024-02", "2024-03"],
  "counts": [15, 22, 18]
}
```

---

### GET /api/analytics/type-distribution

放屁类型分布统计

**认证**: JWT

**响应示例 (200 OK)**:
```json
[
  {
    "name": "正常",
    "value": 45
  },
  {
    "name": "响屁",
    "value": 23
  },
  {
    "name": "闷屁",
    "value": 12
  }
]
```

---

### GET /api/analytics/smell-distribution

臭味程度分布统计

**认证**: JWT

**响应示例 (200 OK)**:
```json
{
  "categories": ["mild", "tolerable", "stinky", "extremely_stinky"],
  "values": [10, 25, 35, 8]
}
```

---

### GET /api/analytics/hourly-heatmap

时段分布热力图数据

返回格式: `[小时(0-23), 星期(0-6, 0=周日), 数量]`

**认证**: JWT

**响应示例 (200 OK)**:
```json
[
  [8, 1, 3],
  [12, 1, 5],
  [18, 1, 2],
  [9, 2, 4]
]
```

---

### GET /api/analytics/duration-distribution

时长分布统计

**认证**: JWT

**响应示例 (200 OK)**:
```json
[
  {
    "name": "very_short",
    "value": 15
  },
  {
    "name": "short",
    "value": 30
  },
  {
    "name": "medium",
    "value": 20
  },
  {
    "name": "long",
    "value": 5
  }
]
```

---

### GET /api/analytics/cross-analysis

臭味与时长交叉分析

**认证**: JWT

**响应示例 (200 OK)**:
```json
[
  {
    "value": [3, 4],
    "meta": {
      "smell": "extremely_stinky",
      "duration": "long",
      "temperature": "hot",
      "moisture": "moist"
    }
  }
]
```

**说明**: `value[0]` 为时长评分 (1-4)，`value[1]` 为臭味评分 (1-4)

---

## 健康检查 (/api/health)

### GET /api/health

检查服务健康状态

**认证**: 无

**响应示例 (200 OK)**:
```json
{
  "status": "ok"
}
```

---

## 错误码说明

### HTTP 状态码

| 状态码 | 含义 | 说明 |
|--------|------|------|
| 200 | OK | 请求成功 |
| 201 | Created | 资源创建成功 |
| 400 | Bad Request | 请求参数错误 |
| 401 | Unauthorized | 未授权，缺少或无效的 JWT Token |
| 404 | Not Found | 资源不存在 |
| 409 | Conflict | 资源冲突（如用户名已存在） |
| 500 | Internal Server Error | 服务器内部错误 |

### 业务错误码

| 错误码 | 说明 |
|--------|------|
| INVALID_REQUEST | 请求参数无效或缺失 |
| INVALID_CREDENTIALS | 用户名或密码错误 |
| INVALID_ENUM | 枚举值无效 |
| INVALID_TYPE | 类型 ID 无效 |
| UNAUTHORIZED | 未授权 |
| NOT_FOUND | 资源不存在 |
| USERNAME_TAKEN | 用户名已被占用 |
| TYPE_EXISTS | 类型名称已存在 |

---

## 认证说明

API 使用 JWT (JSON Web Token) 进行身份认证。

### 获取 Token

通过 `POST /api/auth/register` 或 `POST /api/auth/login` 获取 token。

### 使用 Token

在请求头中添加：

```
Authorization: Bearer <your-jwt-token>
```

### curl 示例

```bash
# 注册
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser", "password": "testpass"}'

# 登录
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser", "password": "testpass"}'

# 创建记录
curl -X POST http://localhost:5000/api/records \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "duration": "medium",
    "type_id": 1,
    "smell_level": "stinky",
    "temperature": "hot",
    "moisture": "moist",
    "notes": "测试记录"
  }'

# 获取记录列表
curl -X GET "http://localhost:5000/api/records?page=1&per_page=10" \
  -H "Authorization: Bearer <token>"

# 导出 CSV
curl -X GET "http://localhost:5000/api/export/csv" \
  -H "Authorization: Bearer <token>" \
  -o fart_records.csv

# 获取每日统计
curl -X GET "http://localhost:5000/api/analytics/daily-count?days=7" \
  -H "Authorization: Bearer <token>"

# 健康检查
curl -X GET http://localhost:5000/api/health
```

---

## 时间戳格式

所有时间戳使用 ISO 8601 格式，UTC 时区：

- 完整格式: `2024-01-15T08:30:00+00:00` 或 `2024-01-15T08:30:00Z`
- 日期格式: `2024-01-15`

服务器会将所有时间戳标准化为 UTC 格式存储和返回。

---

*文档版本: 1.0.0*
*最后更新: 2024-01-15*
