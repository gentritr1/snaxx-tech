from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from urllib.request import urlopen
from pathlib import Path
import os
os.chdir(Path(__file__).resolve().parent)
class Handler(SimpleHTTPRequestHandler):
 def do_GET(self):
  if self.path.startswith(('/review','/artboards/')):
   return super().do_GET()
  try:
   with urlopen('http://127.0.0.1:4301'+self.path) as r:
    data=r.read();self.send_response(r.status)
    for k in ('Content-Type','Cache-Control'):
     if r.headers.get(k):self.send_header(k,r.headers[k])
    self.end_headers();self.wfile.write(data)
  except Exception as e:self.send_error(502,str(e))
ThreadingHTTPServer(('127.0.0.1',4302),Handler).serve_forever()
