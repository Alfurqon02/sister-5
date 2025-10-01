import os
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

SOAP_HOST = os.getenv('SOAP_HOST', 'localhost')
SOAP_PORT = int(os.getenv('SOAP_PORT', 8000))

DATA_FILE = os.path.join(os.path.dirname(__file__), 'data', 'todos.json')

LOG_LEVEL = os.getenv('LOG_LEVEL', 'info').upper()
DEBUG = os.getenv('DEBUG', 'false').lower() == 'true'