"""Final attempt - last 4 missing images."""
import os, time, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
import requests
from duckduckgo_search import DDGS

IMAGE_DIR = r"c:\Dev\Personal\SmartShoppingWEB\frontend\public\items"

MISSING = [
    ("samsung-galaxy-buds",     "samsung buds wireless earbuds"),
    ("cotton-kurta-daily",      "indian kurta men white cotton"),
    ("winter-beanie",           "beanie cap woolen"),
    ("yoga-mat-premium",        "yoga exercise mat thick"),
]

for fn, q in MISSING:
    path = os.path.join(IMAGE_DIR, f"{fn}.jpg")
    if os.path.exists(path):
        print(f"SKIP: {fn}")
        continue
    print(f"SEARCH: {q}")
    try:
        with DDGS() as ddgs:
            results = list(ddgs.images(keywords=q, region="wt-wt", safesearch="off", max_results=10))
        for r in results:
            try:
                resp = requests.get(r["image"], timeout=10, headers={"User-Agent": "Mozilla/5.0"})
                if resp.status_code == 200 and len(resp.content) > 2000:
                    with open(path, "wb") as f:
                        f.write(resp.content)
                    print(f"  OK: {fn}.jpg")
                    break
            except:
                continue
        else:
            print(f"  FAIL: {fn}")
        time.sleep(4)
    except Exception as e:
        print(f"  ERROR: {e}")
        time.sleep(5)

print("DONE")
