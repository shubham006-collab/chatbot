# Functions for calling LLM providers (Gemini and Groq) with failover capability
import os
import logging
import google.generativeai as genai
from groq import Groq

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("api._lib.llm")

def get_ai_response(messages: list) -> tuple[str, str]:
    """
    Get AI response from LLM provider.
    Tries Gemini (gemini-3.1-flash-lite) first, falling back to Groq (llama-3.3-70b-versatile) on any exception.
    
    Returns:
        tuple[str, str]: (response_text, model_used)
    """
    gemini_key = os.environ.get("GEMINI_API_KEY")
    groq_key = os.environ.get("GROQ_API_KEY")

    # 1. Try Gemini
    try:
        if not gemini_key:
            raise ValueError("GEMINI_API_KEY is not set")
            
        genai.configure(api_key=gemini_key)
        
        # Convert OpenAI-style messages to Gemini history structure
        contents = []
        base_system_instruction = (
            "You are a helpful assistant.\n"
            "Rules:\n"
            "1. When the user asks for a table, you MUST give the answer in table format ONLY (using standard markdown tables, e.g., | Column 1 | Column 2 |) and some explanation.\n"
            "2. When the user asks for a diagram, you MUST provide it in diagram format (using ASCII art inside a code block with language 'ascii' or 'diagram').\n"
            "3. Ensure table rows are correctly formatted with newlines separating each row."
        )
        system_instruction = base_system_instruction
        
        for msg in messages:
            role = msg.get("role")
            content = msg.get("content", "")
            
            if role == "system":
                system_instruction = f"{base_system_instruction}\n\nAdditional instructions:\n{content}"
            elif role in ("assistant", "model"):
                contents.append({
                    "role": "model",
                    "parts": [content]
                })
            else:
                contents.append({
                    "role": "user",
                    "parts": [content]
                })
        
        # Initialize the model with optional system instruction
        model = genai.GenerativeModel(
            model_name="gemini-3.1-flash-lite",
            system_instruction=system_instruction
        )
        
        # Generate content
        response = model.generate_content(contents)
        
        logger.info("Successfully generated response using Gemini (gemini-3.1-flash-lite)")
        return response.text, "gemini-3.1-flash-lite"
        
    except Exception as e:
        logger.warning(
            f"Gemini call failed with error: {e}. Attempting fallback to Groq (llama-3.3-70b-versatile)..."
        )
        
        # 2. Try Groq as fallback
        try:
            if not groq_key:
                raise ValueError("GROQ_API_KEY is not set and Gemini failed")
                
            client = Groq(api_key=groq_key)
            
            # Map roles to standard Groq-compatible roles
            groq_messages = []
            if system_instruction:
                groq_messages.append({
                    "role": "system",
                    "content": system_instruction
                })
            for msg in messages:
                role = msg.get("role")
                content = msg.get("content", "")
                if role == "system":
                    continue
                if role == "model":
                    role = "assistant"
                groq_messages.append({
                    "role": role,
                    "content": content
                })
                
            completion = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=groq_messages
            )
            
            logger.info("Successfully generated response using Groq fallback (llama-3.3-70b-versatile)")
            return completion.choices[0].message.content, "llama-3.3-70b-versatile"
            
        except Exception as groq_err:
            logger.error(f"Both Gemini and Groq fallback failed. Groq error: {groq_err}")
            raise groq_err
