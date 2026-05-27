import os
from dotenv import load_dotenv

load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL")
MONGODB_DB_NAME = os.getenv("MONGODB_DB_NAME", "voiceAssistance")
MONGODB_SSL_ALLOW_INVALID_CERTIFICATES = os.getenv("MONGODB_SSL_ALLOW_INVALID_CERTIFICATES", "false").lower() == "true"
