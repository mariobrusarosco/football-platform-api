import json
from pathlib import Path
from curl_cffi import requests
from playwright.sync_api import sync_playwright

root = Path('/private/tmp/sofascore-probe-20260909')
report = {'http': [], 'browser': []}
url = 'https://www.sofascore.com/api/v1/unique-tournament/17/seasons'
for extra in ({}, {'X-Requested-With': 'XMLHttpRequest'}):
    try:
        r = requests.get(url, impersonate='chrome', headers=extra, timeout=20)
        row = {'headers': extra, 'status': r.status_code, 'sample': r.text[:250]}
    except Exception as e:
        row = {'error': str(e)}
    report['http'].append(row)
    print('HTTP', json.dumps(row), flush=True)

with sync_playwright() as p:
    browser = p.chromium.launch(channel='chrome', headless=False)
    context = browser.new_context()
    page = context.new_page()
    def capture(response):
        if '/api/v1/' not in response.url or 'sofascore.com/' not in response.url:
            return
        row = {'url': response.url, 'status': response.status}
        try:
            body = response.json()
            row['keys'] = list(body) if isinstance(body, dict) else type(body).__name__
            if isinstance(body, dict) and 'events' in body:
                row['events'] = len(body['events'])
                (root / 'captured-events.json').write_text(json.dumps(body, indent=2))
        except Exception:
            pass
        report['browser'].append(row)
        print('BROWSER', json.dumps(row), flush=True)
    page.on('response', capture)
    try:
        response = page.goto('https://www.sofascore.com/', wait_until='domcontentloaded', timeout=30000)
        report['navigation_status'] = response.status if response else None
        page.wait_for_timeout(12000)
        report['title'] = page.title()
        report['visible_text'] = page.locator('body').inner_text()[:1200]
        page.screenshot(path=str(root / 'browser.png'))
    except Exception as e:
        report['browser_error'] = str(e)
    finally:
        browser.close()
(root / 'report.json').write_text(json.dumps(report, indent=2))
print('RESULT', json.dumps(report), flush=True)
