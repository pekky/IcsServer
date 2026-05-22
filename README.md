# ICS Server

一个面向 agent 集成的单事件 ICS 服务。

它解决的是这条链路：
- agent 调用 HTTP 接口创建一个日历事件
- 服务返回 `shareUrl` 和 `icsUrl`
- 你在 OpenClaw / Hermes / Telegram 里点击链接
- macOS / iPhone 侧进入系统日历导入流程

第一版特性：
- 只支持单事件
- 最多 2 个提醒
- 提醒类型固定为 `DISPLAY`
- 使用 SQLite 持久化事件元数据
- `.ics` 内容按请求动态生成
- 提供 Apple 优先的分享页
- 可用 Docker 部署到 VPS
- 已部署到 `https://calendar.imbq.io`

## Current Deployment

当前已验证通过的正式地址：

- 服务根域名：`https://calendar.imbq.io`
- 健康检查：`https://calendar.imbq.io/healthz`

当前部署形态：
- Docker 容器运行在 `clawsig`
- Nginx 反代到容器的 `3000` 端口
- SQLite 通过宿主机目录挂载持久化
- Hermes skill 已安装到 `~/.hermes/skills/calendar-ics`

注意：
- 当前服务支持 `GET` 和 `POST`
- 当前没有实现 `HEAD`，所以 `curl -I` 会返回 `404`
- 当前没有实现全天事件；如果只有日期没有时间，需要调用方先提供占位时间或补充准确时间

## API

### `POST /v1/events`

创建单事件并返回分发链接。

请求体：

```json
{
  "title": "Planning Session",
  "description": "Discuss launch plan",
  "location": "Tencent Meeting",
  "start": "2026-05-23T15:00:00+08:00",
  "end": "2026-05-23T16:00:00+08:00",
  "timezone": "Asia/Shanghai",
  "reminderMinutes": [10, 1440]
}
```

约束：
- `title`、`start`、`end` 必填
- `start` 和 `end` 必须是 ISO 8601 时间
- `start` 必须早于 `end`
- `reminderMinutes` 最多 2 项
- `reminderMinutes` 中每项必须是正整数分钟数
- `reminderMinutes` 不允许重复

响应：

```json
{
  "id": "7cf8c44f-5df9-4875-a8a2-5c2c810633e1",
  "uid": "7cf8c44f-5df9-4875-a8a2-5c2c810633e1@calendar.imbq.io",
  "title": "Planning Session",
  "reminderMinutes": [10, 1440],
  "icsUrl": "https://calendar.imbq.io/v1/events/7cf8c44f-5df9-4875-a8a2-5c2c810633e1.ics",
  "shareUrl": "https://calendar.imbq.io/share/7cf8c44f-5df9-4875-a8a2-5c2c810633e1"
}
```

### `GET /v1/events/:id.ics`

返回标准 ICS 内容。

响应头：
- `Content-Type: text/calendar; charset=utf-8`
- `Content-Disposition: inline; filename="<event-id>.ics"`
- `Cache-Control: public, max-age=300`

### `GET /share/:id`

返回一个分享页。

分享页包含：
- `Add To Apple Calendar`
- `Download Or Open ICS`

在 Telegram 里，建议优先分发 `shareUrl`，不要直接只发 `webcal://`。

### `GET /healthz`

健康检查接口。

响应：

```json
{
  "ok": true
}
```

## Reminder Mapping

提醒通过 ICS `VALARM` 生成。

示例：
- `10` -> `TRIGGER:-PT10M`
- `120` -> `TRIGGER:-PT2H`
- `1440` -> `TRIGGER:-P1D`

每个事件最多写入 2 个 `VALARM`：

```ics
BEGIN:VALARM
ACTION:DISPLAY
TRIGGER:-PT10M
DESCRIPTION:Reminder
END:VALARM
```

## Local Run

要求：
- Node.js 22 或更高版本

启动：

```bash
PORT=3000 BASE_URL=http://localhost:3000 node src/index.js
```

也可以通过 `npm`：

```bash
npm start
```

默认配置：
- `PORT=3000`
- `BASE_URL=http://localhost:3000`
- `DATABASE_PATH=<project>/data/events.db`

## Docker

构建镜像：

```bash
docker build -t ics-server .
```

运行容器：

```bash
docker run \
  --name ics-server \
  -p 3000:3000 \
  -e PORT=3000 \
  -e BASE_URL=https://calendar.imbq.io \
  -e DATABASE_PATH=/app/data/events.db \
  -v /path/on/host/ics-data:/app/data \
  ics-server
```

部署要求：
- `BASE_URL` 必须配置成最终公网地址
- SQLite 文件必须放到挂载卷里
- Nginx 或现有入口层将公网请求反代到容器端口

如果容器重建后仍挂载同一个数据卷，历史事件链接仍然有效。

## OpenClaw / Hermes Integration

这个仓库包含一个 OpenAPI 描述文件：
- [openapi.json](/Users/binqianglai/Documents/projects/IcsServer/openapi.json)

如果你的 OpenClaw HTTP skill 支持导入 OpenAPI，可以直接使用它暴露这些操作：
- `healthCheck`
- `createEvent`
- `getEventIcs`
- `getSharePage`

推荐的 agent 调用方式：
1. agent 整理出结构化事件参数
2. 调 `POST /v1/events`
3. 把响应里的 `shareUrl` 发回 Telegram
4. 可选附带 `icsUrl` 作为备用链接

Hermes 目录式 skill 已实现，源码位于：
- [skills/calendar-ics/SKILL.md](/Users/binqianglai/Documents/projects/IcsServer/skills/calendar-ics/SKILL.md)
- [skills/calendar-ics/scripts/create_calendar_event.py](/Users/binqianglai/Documents/projects/IcsServer/skills/calendar-ics/scripts/create_calendar_event.py)

Hermes 部署位置：
- `~/.hermes/skills/calendar-ics`

Hermes skill 当前行为：
- 直接调用 `https://calendar.imbq.io/v1/events`
- 输出 `shareUrl` 和 `icsUrl`
- 适合在 Telegram 聊天窗口直接回链接
- 当前不支持“只有日期没有时间”的全天事件输入

推荐 skill 输入：

```json
{
  "title": "Planning Session",
  "start": "2026-05-23T15:00:00+08:00",
  "end": "2026-05-23T16:00:00+08:00",
  "description": "Discuss launch plan",
  "location": "Tencent Meeting",
  "reminderMinutes": [10, 1440]
}
```

## Testing

运行测试：

```bash
npm test
```

当前测试覆盖：
- 参数校验
- 提醒触发器格式转换
- ICS 文本输出
- `POST /v1/events`
- `GET /v1/events/:id.ics`
- `GET /share/:id`

## Notes

- 这版没有实现订阅型 calendar feed。
- 这版没有实现 Android 专用深链。
- 这版没有实现事件更新、取消和鉴权。
- 这版没有实现全天事件；只有日期没有时间时，需要调用方先补时间或使用占位时间。
- 这版主路径是 `shareUrl -> icsUrl`，而不是依赖 `webcal://`。
