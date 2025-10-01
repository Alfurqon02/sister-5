import socket
import threading
import json
from datetime import datetime

class SimpleSocketServer:
    def __init__(self, host='0.0.0.0', port=8080):
        self.host = host
        self.port = port
        self.server_socket = None
        self.clients = {}
        self.running = False
        
    def start_server(self):
        try:
            self.server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            self.server_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            self.server_socket.bind((self.host, self.port))
            self.server_socket.listen(5)
            self.running = True
            
            print(f"Socket Server started on {self.host}:{self.port}")
            
            while self.running:
                try:
                    client_socket, client_address = self.server_socket.accept()
                    print(f"Client connected: {client_address}")
                    
                    self.clients[client_socket] = {
                        'address': client_address,
                        'connected_at': datetime.now()
                    }
                    
                    thread = threading.Thread(target=self.handle_client, args=(client_socket, client_address))
                    thread.daemon = True
                    thread.start()
                    
                except socket.error as e:
                    if self.running:
                        print(f"Server error: {e}")
                        
        except Exception as e:
            print(f"Failed to start server: {e}")
            
    def handle_client(self, client_socket, client_address):
        try:
            while self.running:
                data = client_socket.recv(1024)
                if not data:
                    break
                    
                message = data.decode('utf-8').strip()
                print(f"From {client_address}: {message}")
                
                response = self.process_message(message, client_address)
                client_socket.send(response.encode('utf-8'))
                
        except Exception as e:
            print(f"Error with client {client_address}: {e}")
        finally:
            if client_socket in self.clients:
                del self.clients[client_socket]
            client_socket.close()
            print(f"Client {client_address} disconnected")
    
    def process_message(self, message, client_address):
        message_lower = message.lower().strip()
        
        if message_lower == 'ping':
            return 'pong'
        elif message_lower == 'time':
            return datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        elif message_lower == 'status':
            return f'Connected from {client_address[0]}:{client_address[1]}'
        elif message_lower.startswith('echo '):
            return message[5:]
        elif message_lower == 'help':
            return 'Commands: ping, time, status, echo <text>, help'
        else:
            return 'this is reply from server'
            
    def stop_server(self):
        """Stop the server"""
        self.running = False
        if self.server_socket:
            self.server_socket.close()
        print("Socket server stopped")

if __name__ == "__main__":
    server = SimpleSocketServer()
    try:
        server.start_server()
    except KeyboardInterrupt:
        server.stop_server()