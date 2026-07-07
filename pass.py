import sys
import os
import getpass

# Add the ai-chatbot folder to Python module path
sys.path.append(os.path.join(os.path.dirname(__file__), 'ai-chatbot'))

try:
    from api._lib.auth_utils import hash_password
except ImportError as e:
    print(f"Error: Could not import auth_utils. Make sure the 'ai-chatbot' directory exists. Details: {e}")
    sys.exit(1)

def main():
    # Prompt user securely (hiding key strokes)
    password = getpass.getpass("Enter the password to hash (input will be hidden): ")
    if not password:
        print("Password cannot be empty.")
        return
        
    hashed = hash_password(password)
    print("\nGenerated bcrypt hash:")
    print(hashed)

if __name__ == "__main__":
    main()
