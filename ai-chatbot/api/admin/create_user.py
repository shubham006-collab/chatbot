# Vercel Serverless Function for admins to create new users in the database
from http.server import BaseHTTPRequestHandler
import json
import sys
import os

# Adjust import path to find the _lib directory
sys.path.append(os.path.join(os.path.dirname(__file__), '../..'))
from _lib.db import supabase
from _lib.auth_utils import authenticate_request, hash_password

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            # 1. Authenticate user
            user = authenticate_request(self.headers)
            if not user:
                self.send_error_response(401, "Unauthorized")
                return
                
            # 2. Check if the user is an admin
            if not user.get("is_admin"):
                self.send_error_response(403, "Forbidden: Admin privileges required")
                return
                
            # 3. Parse content length and request body
            content_length = int(self.headers.get('Content-Length', 0))
            if content_length == 0:
                self.send_error_response(400, "Missing request body")
                return
                
            post_data = self.rfile.read(content_length)
            body = json.loads(post_data.decode('utf-8'))
            
            username = body.get("username")
            password = body.get("password")
            is_admin = bool(body.get("is_admin", False))
            
            if not username or not password:
                self.send_error_response(400, "Username and password are required")
                return
                
            # 4. Check if username already exists in database
            existing_user_res = supabase.table("users").select("id").eq("username", username).execute()
            if existing_user_res.data:
                self.send_error_response(400, "Username already exists")
                return
                
            # 5. Hash password and insert the new user record
            hashed_password = hash_password(password)
            insert_res = supabase.table("users").insert({
                "username": username,
                "password_hash": hashed_password,
                "is_admin": is_admin
            }).execute()
            
            if not insert_res.data:
                self.send_error_response(500, "Failed to insert user record")
                return
                
            created_user = insert_res.data[0]
            
            # 6. Return created user id and username (excluding password hash)
            self.send_response(201)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({
                "id": str(created_user.get("id")),
                "username": created_user.get("username")
            }).encode('utf-8'))
            
        except Exception as e:
            self.send_error_response(500, f"Internal server error: {str(e)}")
            
    def send_error_response(self, status_code: int, message: str):
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps({"error": message}).encode('utf-8'))
