# Vercel Serverless Function to list non-sensitive details of all users in the database
from http.server import BaseHTTPRequestHandler
import json
import sys
import os

# Adjust import path to find the _lib directory
sys.path.append(os.path.join(os.path.dirname(__file__), '../..'))
from _lib.db import supabase
from _lib.auth_utils import authenticate_request

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            # 1. Authenticate user
            user = authenticate_request(self.headers)
            if not user:
                self.send_error_response(401, "Unauthorized")
                return
                
            # 2. Check if user is an admin
            if not user.get("is_admin"):
                self.send_error_response(403, "Forbidden: Admin privileges required")
                return
                
            # 3. Query non-sensitive details of all users
            res = supabase.table("users").select("id, username, is_admin, created_at").execute()
            users = res.data or []
            
            # 4. Send response
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(users).encode('utf-8'))
            
        except Exception as e:
            self.send_error_response(500, f"Internal server error: {str(e)}")
            
    def send_error_response(self, status_code: int, message: str):
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps({"error": message}).encode('utf-8'))
