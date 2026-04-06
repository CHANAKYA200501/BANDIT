import requests

def test_phishstats(url):
    try:
        r = requests.get(f'https://phishstats.info:2053/api/phishing?_where=(url,eq,{url})')
        print(r.json())
    except Exception as e:
        print("Error:", e)

test_phishstats("http://example.com")
test_phishstats("http://paypal-security-update.com")
