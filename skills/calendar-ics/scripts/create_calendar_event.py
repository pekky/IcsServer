#!/usr/bin/env python3
import argparse
import json
import sys
import urllib.error
import urllib.request


DEFAULT_BASE_URL = "https://calendar.imbq.io"


def parse_args():
    parser = argparse.ArgumentParser(
        description="Create a single-event ICS entry through the calendar service."
    )
    parser.add_argument("--base-url", default=DEFAULT_BASE_URL)
    parser.add_argument("--stdin", action="store_true", help="Read JSON payload from stdin")
    parser.add_argument("--title")
    parser.add_argument("--description")
    parser.add_argument("--location")
    parser.add_argument("--start")
    parser.add_argument("--end")
    parser.add_argument("--timezone")
    parser.add_argument(
        "--reminder",
        type=int,
        action="append",
        dest="reminders",
        help="Reminder minutes before the event. May be used at most twice.",
    )
    return parser.parse_args()


def build_payload(args):
    if args.stdin:
        raw = sys.stdin.read()
        if not raw.strip():
            raise ValueError("stdin payload is empty")
        payload = json.loads(raw)
        if not isinstance(payload, dict):
            raise ValueError("stdin payload must be a JSON object")
        return payload

    payload = {
        "title": args.title,
        "description": args.description,
        "location": args.location,
        "start": args.start,
        "end": args.end,
        "timezone": args.timezone,
    }
    if args.reminders:
        payload["reminderMinutes"] = args.reminders

    return {key: value for key, value in payload.items() if value is not None}


def create_event(base_url, payload):
    request = urllib.request.Request(
        f"{base_url.rstrip('/')}/v1/events",
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    try:
        with urllib.request.urlopen(request) as response:
            return response.status, json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")
        try:
            data = json.loads(body)
        except json.JSONDecodeError:
            data = {"error": {"code": "http_error", "message": body}}
        return exc.code, data


def main():
    args = parse_args()

    try:
        payload = build_payload(args)
    except (ValueError, json.JSONDecodeError) as exc:
        print(json.dumps({"error": {"code": "input_error", "message": str(exc)}}))
        return 1

    status, data = create_event(args.base_url, payload)
    print(json.dumps(data, ensure_ascii=True))
    return 0 if 200 <= status < 300 else 1


if __name__ == "__main__":
    raise SystemExit(main())
