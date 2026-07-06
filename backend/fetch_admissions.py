import requests
from bs4 import BeautifulSoup

url = "https://www.kangarookids.in/preschool-enrollment-admissions-form"
try:
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
    r = requests.get(url, headers=headers, timeout=10)
    print(f"Status Code: {r.status_code}")
    print(f"Length of HTML: {len(r.text)}")
    
    soup = BeautifulSoup(r.text, 'html.parser')
    
    # Let's search for text containing "Our Programmes" or "Why Kangaroo"
    print("\n--- Searching for 'Our Programmes' ---")
    for tag in soup.find_all(text=True):
        if "program" in tag.lower() or "programme" in tag.lower():
            parent = tag.parent
            if parent.name in ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'li', 'span']:
                print(f"[{parent.name}]: {tag.strip()}")
                
    print("\n--- Searching for 'Why Kangaroo' ---")
    for tag in soup.find_all(text=True):
        if "why kangaroo" in tag.lower() or "why choose" in tag.lower() or "why us" in tag.lower():
            parent = tag.parent
            if parent.name in ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'li', 'span']:
                print(f"[{parent.name}]: {tag.strip()}")
                
except Exception as e:
    print(f"Error: {e}")
