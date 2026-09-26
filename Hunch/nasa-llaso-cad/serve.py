import os
import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

class ReliableHandler(SimpleHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        self.send_header('Access-Control-Allow-Origin', '*')
        super().end_headers()

    def log_message(self, format, *args):
        sys.stderr.write("%s - - [%s] %s\n" % (self.address_string(), self.log_date_time_string(), format%args))

    def do_POST(self):
        if self.path == '/api/log':
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            msg = post_data.decode('utf-8', errors='ignore')
            with open('rover_actions.log', 'a') as f:
                f.write(msg + '\n')
            resp = b'{"status":"ok"}'
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Content-Length', str(len(resp)))
            self.send_header('Connection', 'close')
            self.end_headers()
            self.wfile.write(resp)
            return
        self.send_error(404, "Endpoint not found")

if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8002
    root = os.path.dirname(os.path.abspath(__file__))
    os.chdir(root)
    server = ThreadingHTTPServer(('127.0.0.1', port), ReliableHandler)
    print(f"NASA CAD Simulation Server online at http://127.0.0.1:{port}/launcher.html")
    print(f"  Autopilot sim: http://127.0.0.1:{port}/viewer.html")
    print(f"Serving files from: {root}")
    server.serve_forever()
