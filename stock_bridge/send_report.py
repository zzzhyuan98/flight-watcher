import os
import re
import sys
import glob
import requests
from pathlib import Path
from datetime import datetime


def load_env(env_path: Path):
    if not env_path.exists():
        return
    for line in env_path.read_text(encoding='utf-8').splitlines():
        line = line.strip()
        if not line or line.startswith('#') or '=' not in line:
            continue
        k, v = line.split('=', 1)
        os.environ.setdefault(k.strip(), v.strip())


def find_latest_report(repo: Path) -> Path | None:
    candidate_patterns = [
        '**/*report*.md',
        '**/*分析*.md',
        '**/*summary*.md',
        '**/*.md',
        '**/*.txt',
    ]

    skip_dirs = {'venv', '.venv', '.git', 'node_modules', '__pycache__'}
    files = []
    for pattern in candidate_patterns:
        for p in repo.glob(pattern):
            if not p.is_file():
                continue
            if any(part in skip_dirs for part in p.parts):
                continue
            if p.stat().st_size > 1024 * 1024:
                continue
            # prioritize recent files only
            if datetime.now().timestamp() - p.stat().st_mtime > 3 * 24 * 3600:
                continue
            files.append(p)

    if not files:
        return None

    # Prefer files that look like output/result
    def score(path: Path):
        name = path.name.lower()
        bonus = 0
        if 'report' in name or 'summary' in name or 'result' in name:
            bonus += 100
        if 'analysis' in name or '分析' in name:
            bonus += 80
        if 'readme' in name:
            bonus -= 200
        return (bonus, path.stat().st_mtime)

    files.sort(key=score, reverse=True)
    return files[0]


def chunk_text(text: str, limit: int = 3800):
    # Telegram hard limit is 4096; keep margin.
    text = text.strip()
    while text:
        yield text[:limit]
        text = text[limit:]


def send_telegram(bot_token: str, chat_id: str, text: str, thread_id: str | None = None):
    url = f'https://api.telegram.org/bot{bot_token}/sendMessage'
    payload = {
        'chat_id': chat_id,
        'text': text,
        'disable_web_page_preview': True,
    }
    if thread_id:
        payload['message_thread_id'] = thread_id

    r = requests.post(url, json=payload, timeout=30)
    if r.status_code != 200:
        raise RuntimeError(f'Telegram API error {r.status_code}: {r.text}')


def main():
    script_dir = Path(__file__).resolve().parent
    load_env(script_dir / '.env')

    repo_path = os.getenv('DSA_REPO_PATH')
    bot_token = os.getenv('TELEGRAM_BOT_TOKEN')
    chat_id = os.getenv('TELEGRAM_CHAT_ID')
    thread_id = os.getenv('TELEGRAM_MESSAGE_THREAD_ID')
    prefix = os.getenv('MESSAGE_PREFIX', '📈 Daily Stock Analysis')

    if not repo_path:
        print('Missing DSA_REPO_PATH', file=sys.stderr)
        sys.exit(1)
    if not bot_token or not chat_id:
        print('Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID', file=sys.stderr)
        sys.exit(1)

    repo = Path(repo_path)
    if not repo.exists():
        print(f'Repo not found: {repo}', file=sys.stderr)
        sys.exit(1)

    latest = find_latest_report(repo)
    if not latest:
        print('No recent report file found.', file=sys.stderr)
        sys.exit(1)

    content = latest.read_text(encoding='utf-8', errors='ignore').strip()
    if not content:
        print(f'Report empty: {latest}', file=sys.stderr)
        sys.exit(1)

    header = f"{prefix}\nSource: {latest}\n"
    chunks = list(chunk_text(content, 3600))

    for i, c in enumerate(chunks, 1):
        if i == 1:
            msg = f"{header}\n{c}"
        else:
            msg = f"(cont. {i}/{len(chunks)})\n{c}"
        send_telegram(bot_token, chat_id, msg, thread_id=thread_id)

    print(f'Sent {len(chunks)} message(s) from: {latest}')


if __name__ == '__main__':
    main()
