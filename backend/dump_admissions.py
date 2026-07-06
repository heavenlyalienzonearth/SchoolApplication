import requests
from bs4 import BeautifulSoup

url = "https://www.kangarookids.in/preschool-enrollment-admissions-form"
headers = {"User-Agent": "Mozilla/5.0"}
r = requests.get(url, headers=headers)
soup = BeautifulSoup(r.text, 'html.parser')

print("=== ALL TEXT HEADINGS AND PARAGRAPHS ===")
for tag in soup.find_all(['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'span']):
    text_val = tag.get_text().strip()
    if len(text_val) > 20:
        print(f"<{tag.name}>: {text_val[:120]}")
