import requests

def test_urlhaus(url):
    data = {'url': url}
    try:
        r = requests.post('https://urlhaus-api.abuse.ch/v1/url/', data=data)
        print(r.json())
    except Exception as e:
        print("Error:", e)

test_urlhaus("http://example.com")
test_urlhaus("http://pastebin.com/raw/1TfM")
