# Vercel Serverless Function handling user authentication and login
from http.server import BaseHTTPRequestHandler
import json
import time
import sys
import os

# Adjust import path to find the _lib directory
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
from _lib.db import supabase
from _lib.auth_utils import verify_password, create_jwt

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            # 1. Parse content length and request body
            content_length = int(self.headers.get('Content-Length', 0))
            if content_length == 0:
                self.send_error_response(400, "Missing request body")
                return

            post_data = self.rfile.read(content_length)
            body = json.loads(post_data.decode('utf-8'))
            
            username = body.get("username")
            password = body.get("password")
            
            if not username or not password:
                self.send_error_response(400, "Username and password are required")
                return
            
            # 2. Look up the user in Supabase by username
            res = supabase.table("users").select("*").eq("username", username).execute()
            users = res.data
            
            # Local failure handler with delay to prevent brute-forcing
            def handle_auth_failure():
                time.sleep(1.5)  # 1.5-second delay to slow down brute force attacks
                self.send_error_response(401, "Invalid credentials")

            if not users:
                handle_auth_failure()
                return
            
            user = users[0]
            # Support both 'password_hash' and 'password' columns
            password_hash = user.get("password_hash") or user.get("password")
            
            if not password_hash:
                handle_auth_failure()
                return

            # 3. Verify the password
            if not verify_password(password, password_hash):
                handle_auth_failure()
                return
            
            # 4. On success: generate JWT token (valid for 7 days)
            user_id = str(user.get("id"))
            is_admin = bool(user.get("is_admin", False))
            token = create_jwt(user_id, is_admin)
            
            # 5. Build response body containing token and basic user info
            response_data = {
                "user": {
                    "id": user_id,
                    "username": user.get("username"),
                    "is_admin": is_admin
                },
                "token": token
            }
            
            # 6. Send response and set httpOnly, secure cookie
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            
            # Set cookie with Secure, HttpOnly, SameSite=Lax, and Max-Age (7 days)
            cookie_value = f"token={token}; HttpOnly; Secure; Path=/; SameSite=Lax; Max-Age=604800"
            self.send_header('Set-Cookie', cookie_value)
            self.end_headers()
            
            self.wfile.write(json.dumps(response_data).encode('utf-8'))
            
        except Exception as e:
            self.send_error_response(500, f"Internal server error: {str(e)}")

    def send_error_response(self, status_code: int, message: str):
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        error_payload = {
            "error": message
        }
        self.wfile.write(json.dumps(error_payload).encode('utf-8'))
