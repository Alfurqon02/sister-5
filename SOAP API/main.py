import cgi_compat

from wsgiref.simple_server import make_server
from spyne.server.wsgi import WsgiApplication

from todo_service import application

try:
    from config import SOAP_HOST, SOAP_PORT, DEBUG
except ImportError:
    SOAP_HOST = 'localhost'
    SOAP_PORT = 8000
    DEBUG = False

if __name__ == '__main__':
    wsgi_app = WsgiApplication(application)
    
    server = make_server(SOAP_HOST, SOAP_PORT, wsgi_app)

    print(f"WSDL available at: http://{SOAP_HOST}:{SOAP_PORT}/?wsdl")
    print(f"Server running on: http://{SOAP_HOST}:{SOAP_PORT}")
    if DEBUG:
        print("Debug mode enabled")
    
    server.serve_forever()