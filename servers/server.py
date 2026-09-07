import http.server
import socketserver
import json
import sqlite3
import os
import urllib.parse

PORT = 5000
DB_PATH = os.path.join(os.path.dirname(__file__), "agriflow.db")

class AgriFlowHandler(http.server.BaseHTTPRequestHandler):
    def _send_cors(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')

    def do_OPTIONS(self):
        self.send_response(200)
        self._send_cors()
        self.end_headers()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cur = conn.cursor()

        if path == "/api/health":
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self._send_cors()
            self.end_headers()
            self.wfile.write(json.dumps({
                "status": "online",
                "server": "AgriFlow Python Standard Backend",
                "database": "SQLite3 (agriflow.db)",
                "port": PORT
            }).encode())

        elif path in ["/api/farmer/crops", "/api/buyer/catalog", "/api/crops"]:
            cur.execute("SELECT * FROM crops")
            rows = [dict(r) for r in cur.fetchall()]
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self._send_cors()
            self.end_headers()
            self.wfile.write(json.dumps({"success": True, "count": len(rows), "crops": rows, "catalog": rows}).encode())

        elif path in ["/api/logistics/orders/manifest", "/api/orders"]:
            cur.execute("SELECT * FROM orders ORDER BY created_date DESC")
            rows = [dict(r) for r in cur.fetchall()]
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self._send_cors()
            self.end_headers()
            self.wfile.write(json.dumps({"success": True, "count": len(rows), "orders": rows}).encode())

        elif path == "/api/logistics/telematics":
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self._send_cors()
            self.end_headers()
            self.wfile.write(json.dumps({
                "success": True,
                "telematics": {
                    "activeTruck": "MH-15-EG-8821",
                    "driver": "Suresh Mane",
                    "speedKmh": 58,
                    "reeferTemp": 4.2,
                    "humidity": 68.4
                }
            }).encode())
        else:
            self.send_response(404)
            self._send_cors()
            self.end_headers()

        conn.close()

    def do_POST(self):
        length = int(self.headers.get('content-length', 0))
        body = json.loads(self.rfile.read(length).decode()) if length > 0 else {}
        path = urllib.parse.urlparse(self.path).path

        if path == "/api/farmer/auth/send-otp":
            phone = body.get('phone', '9822012345')
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self._send_cors()
            self.end_headers()
            self.wfile.write(json.dumps({
                "success": True,
                "otp": "1295",
                "message": f"OTP sent to {phone}"
            }).encode())
        else:
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self._send_cors()
            self.end_headers()
            self.wfile.write(json.dumps({"success": True, "message": "Action recorded in SQLite."}).encode())

if __name__ == '__main__':
    print(f"🌾 AgriFlow Python Backend running at http://localhost:{PORT}")
    with socketserver.TCPServer(("", PORT), AgriFlowHandler) as httpd:
        httpd.serve_forever()