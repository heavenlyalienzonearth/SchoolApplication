import requests
from bs4 import BeautifulSoup

url = "https://www.kangarookids.in/preschool-enrollment-admissions-form"
headers = {"User-Agent": "Mozilla/5.0"}
r = requests.get(url, headers=headers)
soup = BeautifulSoup(r.text, 'html.parser')

print("=== SEARCHING FOR IMAGES ===")
for img in soup.find_all('img'):
    src = img.get('src')
    alt = img.get('alt', '')
    print(f"Alt: {alt} | Src: {src}")
