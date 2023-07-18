import requests
url = 'https://codeforces.com/problemset/submission/1843/210587897'
content=requests.get(url).content.decode('utf-8')
print(content)