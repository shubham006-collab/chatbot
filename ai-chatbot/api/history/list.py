# Vercel Serverless Function to list all chats for the logged-in user
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
            
            user_id = user.get("user_id")
            
            # 2. Query chats table for basic meta fields, sorted by last updated
            res = supabase.table("chats") \
                .select("id, title, updated_at") \
                .eq("user_id", user_id) \
                .order("updated_at", desc=True) \
                .execute()
                
            chats = res.data or []
            
            # 3. Send successful JSON response
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(chats).encode('utf-8'))
            
        except Exception as e:
            self.send_error_response(500, f"Internal server error: {str(e)}")
            
    def send_error_response(self, status_code: int, message: str):
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps({"error": message}).encode('utf-8'))
