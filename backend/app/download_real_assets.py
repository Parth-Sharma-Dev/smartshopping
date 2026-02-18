import asyncio
import os
import requests
import re
from duckduckgo_search import DDGS
from sqlalchemy import select
from app.database import engine, async_session
from app.models import Item
from app.seed import SEED_ITEMS
import time

# Directory to save images
IMAGE_DIR = r"c:\Dev\Personal\SmartShoppingWEB\frontend\public\items"

def slugify(text):
    text = text.lower()
    return re.sub(r'[\W_]+', '-', text).strip('-')

def download_image(query, save_path):
    print(f"🔍 Searching for: {query}")
    try:
        with DDGS() as ddgs:
            results = list(ddgs.images(
                keywords=f"{query} product high quality white background",
                region="in-en",
                safesearch="off",
                max_results=3
            ))
            
            if not results:
                print(f"❌ No results found for {query}")
                return False

            for res in results:
                image_url = res['image']
                try:
                    print(f"⬇️ Downloading: {image_url}")
                    response = requests.get(image_url, timeout=10)
                    if response.status_code == 200:
                        with open(save_path, 'wb') as f:
                            f.write(response.content)
                        print(f"✅ Saved to {save_path}")
                        return True
                except Exception as e:
                    print(f"⚠️ Failed to download {image_url}: {e}")
                    continue
            
            print(f"❌ All download attempts failed for {query}")
            return False

    except Exception as e:
        print(f"❌ Search failed for {query}: {e}")
        return False

async def update_items_with_real_images():
    if not os.path.exists(IMAGE_DIR):
        os.makedirs(IMAGE_DIR)

    async with async_session() as session:
        print("🔄 Starting image update process...")
        
        for seed_item in SEED_ITEMS:
            item_name = seed_item["name"]
            slug = slugify(item_name)
            filename = f"{slug}.jpg"
            file_path = os.path.join(IMAGE_DIR, filename)
            relative_path = f"/items/{filename}"

            # Check if image already exists locally
            if not os.path.exists(file_path):
                success = download_image(item_name, file_path)
                if success:
                    # polite delay
                    time.sleep(1)
                else:
                    print(f"⚠️ Skipping DB update for {item_name} (download failed)")
                    continue
            else:
                print(f"⚡ Image already exists for {item_name}")

            # Update DB
            stmt = select(Item).where(Item.name == item_name)
            result = await session.execute(stmt)
            db_item = result.scalar_one_or_none()
            
            if db_item:
                if db_item.image != relative_path:
                    db_item.image = relative_path
                    session.add(db_item)
                    print(f"🔄 Updated DB for {item_name} -> {relative_path}")
                else:
                    print(f"✓ DB already up to date for {item_name}")
        
        await session.commit()
        print("🎉 All done!")

if __name__ == "__main__":
    asyncio.run(update_items_with_real_images())
