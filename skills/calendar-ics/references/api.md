# Calendar ICS API

Base URL:

```text
https://calendar.imbq.io
```

## Create Event

`POST /v1/events`

请求体示例：

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

响应示例：

```json
{
  "id": "e0d9c798-5894-4866-b701-8e97778b4076",
  "uid": "e0d9c798-5894-4866-b701-8e97778b4076@calendar.imbq.io",
  "title": "Planning Session",
  "reminderMinutes": [10, 1440],
  "icsUrl": "https://calendar.imbq.io/v1/events/e0d9c798-5894-4866-b701-8e97778b4076.ics",
  "shareUrl": "https://calendar.imbq.io/share/e0d9c798-5894-4866-b701-8e97778b4076"
}
```

## Health Check

`GET /healthz`

响应：

```json
{
  "ok": true
}
```

## Notes

- 这是单事件服务，不是订阅型 calendar feed
- `shareUrl` 是首选分发链接
- `reminderMinutes` 最多 2 项
- 目前不需要鉴权
