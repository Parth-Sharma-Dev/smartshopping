"""
Download product images from Amazon.in product pages.
Extracts the main product image URL from the page HTML and downloads it.
"""
import re
import os
import time
import urllib.request
import urllib.parse
import ssl

# Disable SSL verification for simplicity
ssl._create_default_https_context = ssl._create_unverified_context

SAVE_DIR = os.path.join("frontend", "public", "items")
os.makedirs(SAVE_DIR, exist_ok=True)

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
    "Accept-Encoding": "identity",
    "Connection": "keep-alive",
}

# Map: (filename_without_ext, amazon_product_page_url)
# For sspa/click URLs, we extract the actual product path
ITEMS = [
    ("jbl-go-3-speaker",         "https://www.amazon.in/JBL-Wireless-Portable-Bluetooth-Waterproof/dp/B08FB396L1"),
    ("noise-smartwatch",         "https://www.amazon.in/Noise-Launched-Bluetooth-Detection-Smartwatch/dp/B0CQRQK8L8"),
    ("sony-wired-headphones",    "https://www.amazon.in/Sony-MDR-ZX310AP-Headband-Stereo-Headset/dp/B0784BMDRW"),
    ("tp-link-wifi-router",      "https://www.amazon.in/TP-Link-Archer-C6-Wireless-MU-MIMO/dp/B07GVR9TG7"),
    ("laptop-cooling-pad",       "https://www.amazon.in/Ant-Esports-Gaming-Notebook-Cooler/dp/B0D9W55VLG"),
    ("gaming-keyboard-membrane", "https://www.amazon.in/Ant-Esports-MK801-V2-Mechanical/dp/B0DX1MF624"),
    ("extension-board-4-socket", "https://www.amazon.in/GM-Modular-3060-Book-Multicolour/dp/B008XT42JU"),
    ("echo-dot-alexa",           "https://www.amazon.in/Echo-Dot-5th-Gen-Alexa-smart-speaker/dp/B09B8XJDW5"),
    ("samsung-galaxy-buds",      "https://www.amazon.in/Samsung-Enabled-Enriched-Battery-Controls/dp/B0FDGVNSLH"),
    ("cotton-handkerchiefs-3pc", "https://www.amazon.in/Kuber-Industries-Premium-Collection-Handkerchiefs/dp/B092DP7TJC"),
    ("sports-socks-pack-of-3",   "https://www.amazon.in/BADOWL-POWERSTEP-Cushioned-Athletic-Breathable/dp/B0GG48P82L"),
    ("printed-t-shirt",          "https://www.amazon.in/boffi-Oversized-T-Shirt-Shoulder-Regular/dp/B0DVKTGDXJ"),
    ("polo-t-shirt",             "https://www.amazon.in/KAJARU-Waffle-T-Shirt-Sleeve-Collar/dp/B0FFMVD46C"),
    ("cotton-kurta-daily",       "https://www.amazon.in/Amazon-Brand-Symbol-Regular-SYMETHLKUR-1_White_L/dp/B0F7XP4BQJ"),
    ("denim-jeans-regular",      "https://www.amazon.in/CHEMISTREE-Bootcut-Bell-Bottom-Durable-Stretch/dp/B0G2C8PX4X"),
    ("joggers-trackpants",       "https://www.amazon.in/Dollar-Cotton-Trackpant-Charcoal-Melange/dp/B0D1YQ4BXT"),
    ("formal-shirt",             "https://www.amazon.in/Pinkmint-Sleeve-Button-Collared-Casual/dp/B0CW1YFRPY"),
    ("ethnic-dupatta",           "https://www.amazon.in/AKSHADEEP-Bandhani-Patola-Print-Dupattas/dp/B0CQLKG6Y7"),
    ("winter-beanie",            "https://www.amazon.in/NORTHWIND-Winter-winter-beanie-woolen/dp/B0CL9J3FFL"),
    ("ray-ban-aviators",         "https://www.amazon.in/Ray-Ban-protected-Sunglasses-0RB3129IW022658-millimeters/dp/B00JZ48QT4"),
    ("titan-watch-classic",      "https://www.amazon.in/Titan-Analog-Gray-Dial-Watch-18062617NM01/dp/B09P1NS52N"),
    ("silk-saree-mysore",        "https://www.amazon.in/Shree-Silk-Mills-Lightweight-Designer/dp/B0GDM4BDYS"),
    ("leather-jacket-faux",      "https://www.amazon.in/STYLING-Leather-Jackets-Motorcycle-Asymmetric/dp/B0FNNBD9FX"),
    ("scented-candle-glass",     "https://www.amazon.in/SEVA-HOME-Heirloom-Scented-Candle/dp/B0CTH955XH"),
    ("bamboo-plant-lucky",       "https://www.amazon.in/Nurturing-Birthday-Gifting-Housewarming-Friendly/dp/B0CJG1851P"),
    ("swiss-knife-victorinox",   "https://www.amazon.in/Victorinox-Huntsman-Swiss-Knife-1-3713/dp/B0001P151W"),
    ("yoga-mat-premium",         "https://www.amazon.in/Overcmr-Premium-Non-Slip-Textured-Exercise/dp/B0GBNSMYBF"),
    ("silver-coin-10g",          "https://www.amazon.in/ijuels-Hallmarked-Certified-Swastik-Embossed/dp/B07FZ2SQFQ"),
    ("crystal-vase-small",       "https://www.amazon.in/Interior-Handicraft-Hammered-Vintage-Antique/dp/B0B77Y1N8M"),
    ("swarovski-pendant",        "https://www.amazon.in/Swarovski-Constella-pendant-Gold-tone-plated/dp/B0B1JPSJLH"),
]


def extract_image_url(html: str) -> str | None:
    """Extract the main product image URL from Amazon page HTML."""
    # Method 1: Look for hiRes image in the image data JSON
    match = re.search(r'"hiRes"\s*:\s*"(https://m\.media-amazon\.com/images/I/[^"]+)"', html)
    if match:
        return match.group(1)
    
    # Method 2: Look for large image in data
    match = re.search(r'"large"\s*:\s*"(https://m\.media-amazon\.com/images/I/[^"]+)"', html)
    if match:
        return match.group(1)
    
    # Method 3: Look for mainUrl
    match = re.search(r'"mainUrl"\s*:\s*"(https://m\.media-amazon\.com/images/I/[^"]+)"', html)
    if match:
        return match.group(1)
    
    # Method 4: Look for landingImageUrl
    match = re.search(r'"landingImageUrl"\s*:\s*"(https://m\.media-amazon\.com/images/I/[^"]+)"', html)
    if match:
        return match.group(1)
    
    # Method 5: Look for any m.media-amazon.com image
    match = re.search(r'(https://m\.media-amazon\.com/images/I/[A-Za-z0-9+_.-]+\.(?:jpg|png|webp))', html)
    if match:
        return match.group(1)
    
    return None


def download_image(url: str, filepath: str) -> bool:
    """Download an image from URL to filepath."""
    try:
        req = urllib.request.Request(url, headers=HEADERS)
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = resp.read()
            with open(filepath, "wb") as f:
                f.write(data)
        return True
    except Exception as e:
        print(f"  ❌ Download failed: {e}")
        return False


def fetch_page(url: str) -> str | None:
    """Fetch HTML content of a page."""
    try:
        req = urllib.request.Request(url, headers=HEADERS)
        with urllib.request.urlopen(req, timeout=15) as resp:
            return resp.read().decode("utf-8", errors="replace")
    except Exception as e:
        print(f"  ❌ Fetch failed: {e}")
        return None


def main():
    success_count = 0
    fail_count = 0
    
    for filename, url in ITEMS:
        print(f"\n📦 {filename}")
        print(f"   URL: {url}")
        
        html = fetch_page(url)
        if not html:
            fail_count += 1
            continue
        
        img_url = extract_image_url(html)
        if not img_url:
            print(f"  ❌ Could not find image URL in page HTML")
            fail_count += 1
            continue
        
        print(f"  🖼️  Found: {img_url[:80]}...")
        
        # Determine file extension from URL
        ext = ".jpg"
        if ".png" in img_url:
            ext = ".png"
        elif ".webp" in img_url:
            ext = ".webp"
        
        filepath = os.path.join(SAVE_DIR, f"{filename}{ext}")
        
        if download_image(img_url, filepath):
            print(f"  ✅ Saved: {filepath}")
            success_count += 1
        else:
            fail_count += 1
        
        # Be polite - don't hammer Amazon
        time.sleep(1.5)
    
    print(f"\n{'='*50}")
    print(f"✅ Success: {success_count}")
    print(f"❌ Failed:  {fail_count}")
    print(f"Total:     {len(ITEMS)}")


if __name__ == "__main__":
    main()
