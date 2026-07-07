# Vercel Serverless Function to send user message to LLM and store conversation history
from http.server import BaseHTTPRequestHandler
import json
import sys
import os
from datetime import datetime, timezone

# Adjust import path to find the _lib directory
sys.path.append(os.path.join(os.path.dirname(__file__), '../..'))
from _lib.db import supabase
from _lib.auth_utils import authenticate_request
from _lib.llm import get_ai_response

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
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
            
            message = body.get("message")
            chat_id = body.get("chat_id")
            
            if not message or not isinstance(message, str) or not message.strip():
                self.send_error_response(400, "Message is required and must be a non-empty string")
                return
                
            # 3. Handle Chat lookup or creation
            if chat_id:
                # Verify that this chat belongs to the logged-in user
                chat_res = supabase.table("chats").select("*").eq("id", chat_id).eq("user_id", user_id).execute()
                if not chat_res.data:
                    self.send_error_response(404, "Chat not found or access denied")
                    return
            else:
                # Create a new chat row
                # Title is the first ~40 chars of the message
                title = message.strip()[:40]
                if len(message.strip()) > 40:
                    title += "..."
                    
                insert_res = supabase.table("chats").insert({
                    "user_id": user_id,
                    "title": title
                }).execute()
                
                if not insert_res.data:
                    self.send_error_response(500, "Failed to create chat session")
                    return
                chat_id = insert_res.data[0]["id"]
            
            # 4. Save user message to messages table (uses 'role' to match standard LLM structure)
            supabase.table("messages").insert({
                "chat_id": chat_id,
                "role": "user",
                "content": message.strip()
            }).execute()
            
            # 5. Fetch full message history for this chat ordered by created_at ASC
            msg_res = supabase.table("messages").select("*").eq("chat_id", chat_id).order("created_at", desc=False).execute()
            history = [
                {"role": m["role"], "content": m["content"]}
                for m in msg_res.data
            ]
            
            # 6. Call LLM integration with failover (Gemini -> Groq)
            reply, model_used = get_ai_response(history)
            
            # 7. Save assistant's reply to messages table
            supabase.table("messages").insert({
                "chat_id": chat_id,
                "role": "assistant",
                "content": reply,
                "model_used": model_used
            }).execute()
            
            # 8. Update updated_at on the chats table to bubble it to the top of list
            supabase.table("chats").update({
                "updated_at": datetime.now(timezone.utc).isoformat()
            }).eq("id", chat_id).execute()

            # 9. Return chat_id, reply text, and model used
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({
                "chat_id": chat_id,
                "reply": reply,
                "model_used": model_used
            }).encode('utf-8'))
            
        except Exception as e:
            self.send_error_response(500, f"Internal server error: {str(e)}")
            
    def send_error_response(self, status_code: int, message: str):
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps({"error": message}).encode('utf-8'))
