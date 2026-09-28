"""Serve the production preview with the repository's actual common security headers."""
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler
from urllib.request import urlopen
from pathlib import Path
import json

root = Path(__file__).resolve().parents[2]
headers = json.loads((root / 'vercel.json').read_text())['headers'][0]['headers']

class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            with urlopen('http://127.0.0.1:4301' + self.path) as response:
                data = response.read()
                self.send_response(response.status)
                self.send_header('Content-Type', response.headers.get('Content-Type', 'application/octet-stream'))
                for header in headers:
                    self.send_header(header['key'], header['value'])
                self.end_headers()
                self.wfile.write(data)
        except Exception as error:
            self.send_error(502, str(error))

ThreadingHTTPServer(('127.0.0.1', 4305), Handler).serve_forever()
