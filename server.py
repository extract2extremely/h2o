#!/usr/bin/env python3
"""
FinCollect Local Web Server
Runs a simple HTTP server for local development
This bypasses CORS and file:// protocol restrictions
"""

import http.server
import socketserver
import os
import webbrowser
import time
from pathlib import Path

PORT = 8000
DIRECTORY = Path(__file__).parent

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(DIRECTORY), **kwargs)
    
    def end_headers(self):
        # Add headers to allow resource loading
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        super().end_headers()
    
    def log_message(self, format, *args):
        # Customize log messages
        print(f"[{self.log_date_time_string()}] {format % args}")

def start_server():
    """Start the local development server"""
    os.chdir(DIRECTORY)
    
    handler = MyHTTPRequestHandler
    
    try:
        with socketserver.TCPServer(("", PORT), handler) as httpd:
            print("\n" + "="*60)
            print("  FinCollect Local Development Server Started")
            print("="*60)
            print(f"\n✓ Server running at: http://localhost:{PORT}")
            print(f"✓ Open in browser: http://localhost:{PORT}/index.html")
            print(f"\n✓ App Directory: {DIRECTORY}")
            print("\nFeatures Enabled:")
            print("  • CORS bypassed for local development")
            print("  • All library loading enabled")
            print("  • Font files accessible")
            print("  • Service Worker compatible")
            print("\nPress Ctrl+C to stop the server\n")
            
            # Auto-open browser
            time.sleep(0.5)
            try:
                webbrowser.open(f'http://localhost:{PORT}/index.html')
            except:
                pass
            
            httpd.serve_forever()
    
    except OSError as e:
        if e.errno == 48 or e.errno == 98:  # Port already in use
            print(f"\n✗ Error: Port {PORT} is already in use")
            print("Try:")
            print(f"  • Kill the process using port {PORT}")
            print(f"  • Change PORT variable to another number (e.g., 8001, 8080)")
        else:
            print(f"\n✗ Server error: {e}")
    except KeyboardInterrupt:
        print("\n\n✓ Server stopped")

if __name__ == '__main__':
    start_server()
