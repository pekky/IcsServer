---
name: calendar-ics
description: 创建单事件日历并返回可直接分发的 shareUrl 和 icsUrl。适用于用户要求添加会议、提醒、日程到 Apple Calendar，或希望在 Telegram 中点击链接后导入系统日历的场景。
---

# Calendar ICS

创建单事件 ICS，并返回：
- `shareUrl`：优先分发给用户，适合 Telegram / 聊天窗口点击
- `icsUrl`：原始 ICS 链接，可作为备用

该技能调用的服务地址：
- `https://calendar.imbq.io`

## 何时使用

当用户要求以下事情时触发：
- 帮我创建一个会议日历
- 帮我生成一个可导入 Apple Calendar 的链接
- 给我一个 Telegram 里能点开的日历链接
- 帮我设置提醒并生成日历事件

## 输入要求

在调用脚本前，先整理出结构化字段：
- `title`：必填
- `start`：必填，ISO 8601 时间
- `end`：必填，ISO 8601 时间
- `description`：可选
- `location`：可选
- `timezone`：可选
- `reminderMinutes`：可选，最多 2 个正整数，例如 `10 1440`

规则：
- `start` 必须早于 `end`
- `reminderMinutes` 最多 2 项
- 优先只传确定的字段，不要捏造地点或描述

## 快速使用

```bash
{baseDir}/scripts/create_calendar_event.py \
  --title "和张三开会" \
  --start "2026-05-23T15:00:00+08:00" \
  --end "2026-05-23T16:00:00+08:00" \
  --description "讨论发布计划" \
  --location "Tencent Meeting" \
  --reminder 10 \
  --reminder 1440
```

或者传 JSON：

```bash
cat <<'JSON' | {baseDir}/scripts/create_calendar_event.py --stdin
{
  "title": "和张三开会",
  "start": "2026-05-23T15:00:00+08:00",
  "end": "2026-05-23T16:00:00+08:00",
  "description": "讨论发布计划",
  "location": "Tencent Meeting",
  "reminderMinutes": [10, 1440]
}
JSON
```

## 输出要求

脚本会输出 JSON。优先从结果中提取：
- `shareUrl`
- `icsUrl`

回复用户时优先给：
1. `shareUrl`
2. 如有需要再附带 `icsUrl`

建议回复风格：
- 明确说明“点击即可打开日历导入页”
- 如果用户在 Apple 设备上，优先引导点击 `shareUrl`

## 失败处理

如果服务返回校验错误：
- 不要重试相同请求
- 直接指出缺失或非法字段
- 要求用户补充开始时间、结束时间或标题

如果服务不可用：
- 说明日历服务暂时不可用
- 不要伪造链接

## 参考

- API 说明：`references/api.md`
- 安装脚本：`scripts/install_openclaw_skill.sh`
