# Move anything from utils.constants if needed, or keep utils/constants.py
import os

# Example of configuration constants
OAUTH_REDIRECT_URI = os.getenv('OAUTH_REDIRECT_URI', 'http://127.0.0.1:8000/auth/callback/google')
