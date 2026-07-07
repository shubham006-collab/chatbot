# Vercel Serverless Function to delete a user record, preventing self-deletion
from http.server import BaseHTTPRequestHandler
import json
import sys
import os

# Adjust import path to find the _lib directory
sys.path.append(os.path.join(os.path.dirname(__file__), '../..'))
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
                
            # 2. Check if the authenticated user is an admin
            if not user.get("is_admin"):
                self.send_error_response(403, "Forbidden: Admin privileges required")
                return
                
            current_user_id = str(user.get("user_id"))
            
            # 3. Parse content length and request body
            content_length = int(self.headers.get('Content-Length', 0))
            if content_length == 0:
                self.send_error_response(400, "Missing request body")
                return
                
            post_data = self.rfile.read(content_length)
            body = json.loads(post_data.decode('utf-8'))
            target_user_id = body.get("user_id")
            
            if not target_user_id:
                self.send_error_response(400, "Missing user_id parameter")
                return
                
            target_user_id = str(target_user_id)
            
            # 4. Prevent self-deletion guard rail
            if target_user_id == current_user_id:
                self.send_error_response(400, "Admins cannot delete their own account")
                return
                
            # 5. Check if the target user exists
            target_user_res = supabase.table("users").select("id").eq("id", target_user_id).execute()
            if not target_user_res.data:
                self.send_error_response(404, "User not found")
                return
                
            # 6. Delete target user (Supabase cascade deletes associated chats and messages)
            delete_res = supabase.table("users").delete().eq("id", target_user_id).execute()
            if not delete_res.data:
                self.send_error_response(500, "Failed to delete user record")
                return
                
            # 7. Return successful JSON response
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
