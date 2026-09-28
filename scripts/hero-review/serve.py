from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from urllib.request import urlopen
from pathlib import Path
import os
import argparse
parser = argparse.ArgumentParser()
parser.add_argument("--port", type=int, default=4302)
parser.add_argument("--upstream", type=int, default=4301)
args = parser.parse_args()
os.chdir(Path(__file__).resolve().parent)
class Handler(SimpleHTTPRequestHandler):
 def do_GET(self):
  if self.path.startswith(('/review','/artboards/')):
   return super().do_GET()
  try:
   with urlopen(f'http://127.0.0.1:{args.upstream}'+self.path) as r:
    data=r.read();self.send_response(r.status)
    for k in ('Content-Type','Cache-Control'):
     if r.headers.get(k):self.send_header(k,r.headers[k])
    self.end_headers();self.wfile.write(data)
  except Exception as e:self.send_error(502,str(e))
ThreadingHTTPServer(('127.0.0.1',args.port),Handler).serve_forever()
