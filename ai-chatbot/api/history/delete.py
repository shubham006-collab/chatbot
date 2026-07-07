# Vercel Serverless Function to delete a specific chat session after verifying ownership
from http.server import BaseHTTPRequestHandler
import json
import sys
import os

# Adjust import path to find the _lib directory
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
from _lib.db import supabase
from _lib.auth_utils import authenticate_request

class handler(BaseHTTPRequestHandler):
    def handle_delete(self):
        try:
            # 1. Authenticate user
            user = authenticate_request(self.headers)
            if not user:
                self.send_error_response(401, "Unauthorized")
                return
            
            user_id = user.get("user_id")
            
            # 2. Parse request body
            content_length = int(self.headers.get('Content-Length', 0))
            if content_length == 0:
                self.send_error_response(400, "Missing request body")
                return
                
            post_data = self.rfile.read(content_length)
            body = json.loads(post_data.decode('utf-8'))
            chat_id = body.get("chat_id")
            
            if not chat_id:
                self.send_error_response(400, "Missing chat_id parameter")
                return
                
            # 3. Verify ownership
            chat_res = supabase.table("chats").select("user_id").eq("id", chat_id).execute()
            if not chat_res.data:
                self.send_error_response(404, "Chat not found")
                return
                
            chat_owner = chat_res.data[0].get("user_id")
            if chat_owner != user_id:
                self.send_error_response(403, "Access denied")
                return
                
            # 4. Delete the chat (Supabase database cascade handles removing messages)
            delete_res = supabase.table("chats").delete().eq("id", chat_id).execute()
            
            if not delete_res.data:
                self.send_error_response(500, "Failed to delete chat session")
                return
                
            # 5. Send successful JSON response
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"success": True}).encode('utf-8'))
            
        except Exception as e:
            self.send_error_response(500, f"Internal server error: {str(e)}")

    def do_POST(self):
        self.handle_delete()

    def do_DELETE(self):
        self.handle_delete()
            
    def send_error_response(self, status_code: int, message: str):
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps({"error": message}).encode('utf-8'))
