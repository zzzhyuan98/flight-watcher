# Stock Bridge (daily_stock_analysis -> Telegram)

This bridge runs `daily_stock_analysis`, finds the latest generated report, and sends it to Telegram.

## 1) Requirements
- Python 3.10+
- `daily_stock_analysis` repo cloned locally
- Telegram bot token + chat id

## 2) Configure
Copy `.env.example` to `.env` and fill values.

```powershell
cd stock_bridge
copy .env.example .env
```

## 3) Install dependencies
```powershell
pip install requests
```

## 4) Run once
```powershell
powershell -ExecutionPolicy Bypass -File .\run_stock_and_send.ps1
```

## 5) Schedule (Windows Task Scheduler)
Create a daily task that runs:

```powershell
powershell -ExecutionPolicy Bypass -File C:\Users\PC123\.openclaw\workspace\stock_bridge\run_stock_and_send.ps1
```

## Notes
- This sends directly to Telegram Bot API.
- It uses the same bot concept as OpenClaw Telegram channel, but does not require browser relay.
- If report format/location changes, edit `send_report.py` `CANDIDATE_PATTERNS`.
