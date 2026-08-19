#!/usr/bin/env python3
"""Local preview server for OnlyTires.

Opening index.html straight from disk works, but the browser blocks reading
the .glb as a local file, so the site falls back to a 5 MB base64 copy.
Serving over HTTP is closer to production and noticeably faster.

    python3 preview.py      then open http://localhost:8000
"""
import http.server, socketserver, webbrowser, threading

PORT = 8000

class Handler(http.server.SimpleHTTPRequestHandler):
    extensions_map = {**http.server.SimpleHTTPRequestHandler.extensions_map,
                      '.glb': 'model/gltf-binary', '.webp': 'image/webp'}
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()
    def log_message(self, *a): pass

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    url = f"http://localhost:{PORT}"
    print(f"OnlyTires running at {url}  (Ctrl+C to stop)")
    threading.Timer(0.6, lambda: webbrowser.open(url)).start()
    try: httpd.serve_forever()
    except KeyboardInterrupt: print("\nstopped")
