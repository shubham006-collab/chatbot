# Vercel Serverless Function to retrieve all messages of a specific chat session
from http.server import BaseHTTPRequestHandler
import json
import sys
import os
from urllib.parse import urlparse, parse_qs

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
            
            # 2. Extract chat_id from query parameters
            parsed_url = urlparse(self.path)
            query_params = parse_qs(parsed_url.query)
            chat_ids = query_params.get("chat_id")
            chat_id = chat_ids[0] if chat_ids else None
            
            if not chat_id:
                self.send_error_response(400, "Missing chat_id parameter")
                return
                
            # 3. Verify chat ownership
            chat_res = supabase.table("chats").select("user_id").eq("id", chat_id).execute()
            if not chat_res.data:
                self.send_error_response(404, "Chat not found")
                return
                
            chat_owner = chat_res.data[0].get("user_id")
            if chat_owner != user_id:
                self.send_error_response(403, "Access denied")
                return
                
            # 4. Fetch all messages in chronological order
            msg_res = supabase.table("messages") \
                .select("id, role, content, model_used, created_at") \
                .eq("chat_id", chat_id) \
                .order("created_at", desc=False) \
                .execute()
                
            messages = msg_res.data or []
            
            # 5. Send successful JSON response
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(messages).encode('utf-8'))
            
        except Exception as e:
            self.send_error_response(500, f"Internal server error: {str(e)}")
            
    def send_error_response(self, status_code: int, message: str):
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps({"error": message}).encode('utf-8'))
