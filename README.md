# SOAP, MinIO & Socket API Web UI

**Distributed Systems Course Project**

A comprehensive web interface for testing SOAP API, MinIO storage, and Socket communication functionality with full CRUD operations. This project demonstrates distributed system concepts including web services, object storage, and real-time socket communication patterns.

## Features

### SOAP API Testing
- **Create**: Add new todos with title and description
- **Read**: Get all todos or search by specific ID
- **Update**: Modify existing todos (title, description, completion status)
- **Delete**: Remove todos by ID
- Connection status monitoring

### MinIO Storage Testing
- **Bucket Operations**: Create, list, and delete buckets
- **File Upload**: Upload files from your computer
- **Text Upload**: Create text files directly in the interface
- **Download**: Download files from storage
- **View Text**: Display text file contents inline
- **Delete Objects**: Remove files from storage
- Connection status monitoring

### Socket Communication Testing
- **Real-time Messaging**: Send messages to TCP socket server
- **Echo Testing**: Test message echo functionality
- **Command Support**: Special commands (ping, time, status, echo, help)
- **Message History**: View all socket communication history
- **Connection Monitoring**: Real-time socket server status
- **Multi-client Support**: Multiple users can connect simultaneously

### Socket Server Commands
- `ping` → Returns "pong"
- `time` → Returns current server time
- `status` → Returns connection information
- `echo <message>` → Returns the message
- `help` → Shows available commands
- Any other message → Returns "this is reply from server"

## Prerequisites

Before running the web UI, ensure the following services are running:

1. **SOAP API Server** (Port 8000)
   - Navigate to `SOAP API` directory
   - Run: `python main.py`
   - Should be accessible at `http://localhost:8000`

2. **MinIO Server** (Port 9000)
   - Navigate to `MINIO STORAGE` directory
   - Run: `docker-compose up -d`
   - Should be accessible at `http://localhost:9000`
   - Console at `http://localhost:9001`

3. **Socket Server** (Port 8080)
   - Navigate to `SOCKET COMMON` directory
   - Run: `python main.py`
   - Should be accessible at `localhost:8080`

## Installation & Setup

1. **Install Dependencies**
   ```bash
   cd "WEB UI"
   npm install
   ```

2. **Start the Web Server**
   ```bash
   npm start
   ```
   
   Or for development with auto-reload:
   ```bash
   npm run dev
   ```

3. **Access the Web UI**
   - Open your browser and go to: `http://localhost:3000`

## Usage

### Getting Started
1. Open the web interface in your browser
2. The application will automatically test connections to both services
3. Green status = Connected, Red status = Disconnected
4. Use the test buttons to manually check service status

### SOAP API Operations

#### Create Todo
1. Enter a title (required) and description (optional)
2. Click "Create Todo"
3. Check the results section for confirmation

#### Read Operations
- **Get All Todos**: Click "Get All Todos" to retrieve all existing todos
- **Get by ID**: Enter a todo ID and click "Get by ID" to retrieve a specific todo

#### Update Todo
1. Enter the todo ID you want to update
2. Fill in the new title and description
3. Check "Completed" if the todo is done
4. Click "Update Todo"

#### Delete Todo
1. Enter the todo ID you want to delete
2. Click "Delete"

### MinIO Operations

#### Bucket Management
1. **Create Bucket**: Enter a bucket name and click "Create"
2. **List Buckets**: Click "List Buckets" to see all available buckets
3. **Delete Bucket**: Enter bucket name and click "Delete Bucket" (bucket must be empty)

#### Object Operations
1. **Select Bucket**: Choose a bucket from the dropdown
2. **List Objects**: Click "List Objects" to see files in the selected bucket

#### File Upload
1. Select a bucket from the dropdown
2. Choose a file using the file input
3. Click "Upload"

#### Text Upload
1. Select a bucket from the dropdown
2. Enter an object name (filename)
3. Enter your text content
4. Click "Upload Text"

#### Download & View
1. Select a bucket from the dropdown
2. Enter the object name
3. Click "Download" to save the file or "View Text" to display text content

#### Delete Objects
1. Select a bucket from the dropdown
2. Enter the object name to delete
3. Click "Delete Object"
4. Confirm the deletion

## API Endpoints

### SOAP API Routes
- `GET /api/soap/test` - Test SOAP connection
- `GET /api/soap/todos` - Get all todos
- `GET /api/soap/todos/:id` - Get todo by ID
- `POST /api/soap/todos` - Create new todo
- `PUT /api/soap/todos/:id` - Update todo
- `DELETE /api/soap/todos/:id` - Delete todo

### MinIO API Routes
- `GET /api/minio/test` - Test MinIO connection
- `GET /api/minio/buckets` - List buckets
- `POST /api/minio/buckets` - Create bucket
- `DELETE /api/minio/buckets/:name` - Delete bucket
- `GET /api/minio/buckets/:bucket/objects` - List objects in bucket
- `POST /api/minio/buckets/:bucket/objects` - Upload file
- `POST /api/minio/buckets/:bucket/text` - Upload text content
- `GET /api/minio/buckets/:bucket/objects/:object` - Download object
- `GET /api/minio/buckets/:bucket/objects/:object/text` - Get text content
- `DELETE /api/minio/buckets/:bucket/objects/:object` - Delete object

### Socket API Routes
- `POST /api/socket/test` - Test socket connection
- `POST /api/socket/send` - Send message to socket server
- `POST /api/socket/echo` - Echo test functionality
- `GET /api/socket/messages` - Get message history
- `DELETE /api/socket/messages` - Clear message history

## Troubleshooting

### Common Issues

1. **SOAP API Connection Failed**
   - Ensure the SOAP server is running on port 8000
   - Check if `main.py` in SOAP API directory is running
   - Verify no firewall is blocking the connection

2. **MinIO Connection Failed**
   - Ensure Docker is running
   - Check if MinIO container is up: `docker ps`
   - Verify MinIO is accessible at `http://localhost:9000`

3. **Socket Server Connection Failed**
   - Ensure the socket server is running on port 8080
   - Check if `main.py` in SOCKET COMMON directory is running
   - Verify no firewall is blocking the connection

4. **Web UI Not Loading**
   - Check if Node.js dependencies are installed: `npm install`
   - Verify the web server is running on port 3000
   - Check for any console errors in browser developer tools

5. **File Upload Issues**
   - Ensure the bucket exists before uploading
   - Check file size limits
   - Verify MinIO has sufficient storage space

### Service Status Indicators
- 🟢 **Green**: Service is online and responding
- 🔴 **Red**: Service is offline or unreachable  
- 🟡 **Yellow**: Testing connection...

## Technologies Used
- **Frontend**: HTML5, CSS3, JavaScript (ES6+), Bootstrap 5
- **Backend**: Node.js, Express.js
- **SOAP Client**: Axios (for HTTP requests to SOAP service)
- **MinIO Client**: Official MinIO JavaScript SDK
- **Socket Communication**: Native TCP sockets with Python
- **File Upload**: Multer middleware

## Development

To run in development mode with auto-reload:
```bash
npm run dev
```

This uses nodemon to automatically restart the server when files change.

## Security Notes
- This is a development/testing tool
- MinIO credentials are hardcoded (minioadmin/minioadmin123)
- Not suitable for production environments without proper security measures
- No authentication or authorization implemented