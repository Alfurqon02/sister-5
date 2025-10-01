//ANCHOR Global variables
let currentBuckets = [];
let currentObjects = [];

//ANCHOR Utility functions
function addToResults(message) {
    const results = document.getElementById('results');
    const timestamp = new Date().toLocaleTimeString();
    results.textContent += `[${timestamp}] ${message}\n`;
    results.scrollTop = results.scrollHeight;
}

function clearResults() {
    document.getElementById('results').textContent = '';
}

function setStatus(elementId, status, message) {
    const element = document.getElementById(elementId);
    element.className = status === 'online' ? 'status-online' : 
                      status === 'offline' ? 'status-offline' : 'status-loading';
    element.innerHTML = status === 'loading' ? 
        '<span class="spinner-border spinner-border-sm" role="status"></span> Checking...' : 
        `<i class="fas fa-${status === 'online' ? 'check-circle' : 'times-circle'}"></i> ${message}`;
}

//ANCHOR API call wrapper
async function apiCall(url, options = {}) {
    try {
        const response = await fetch(url, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        throw new Error(`Network error: ${error.message}`);
    }
}

//ANCHOR Service connection tests
async function testSoapConnection() {
    setStatus('soapStatus', 'loading');
    try {
        const result = await apiCall('/api/soap/test');
        if (result.success) {
            setStatus('soapStatus', 'online', 'Connected');
            addToResults('SOAP API is connected and running');
        } else {
            setStatus('soapStatus', 'offline', 'Disconnected');
            addToResults('SOAP API connection failed: ' + result.error);
        }
    } catch (error) {
        setStatus('soapStatus', 'offline', 'Disconnected');
        addToResults('SOAP API connection error: ' + error.message);
    }
}

async function testMinioConnection() {
    setStatus('minioStatus', 'loading');
    try {
        const result = await apiCall('/api/minio/test');
        if (result.success) {
            setStatus('minioStatus', 'online', 'Connected');
            addToResults('MinIO is connected and running');
            addToResults(`  Available buckets: ${result.buckets.length}`);
            await refreshBucketList();
        } else {
            setStatus('minioStatus', 'offline', 'Disconnected');
            addToResults('MinIO connection failed: ' + result.error);
        }
    } catch (error) {
        setStatus('minioStatus', 'offline', 'Disconnected');
        addToResults('MinIO connection error: ' + error.message);
    }
}

//ANCHOR SOAP API Functions
async function createTodo() {
    const title = document.getElementById('todoTitle').value.trim();
    const description = document.getElementById('todoDescription').value.trim();
    
    if (!title) {
        addToResults('Please enter a todo title');
        return;
    }
    
    try {
        addToResults(`Creating todo: "${title}"`);
        const result = await apiCall('/api/soap/todos', {
            method: 'POST',
            body: JSON.stringify({ title, description })
        });
        
        if (result.success) {
            addToResults('Todo created successfully');
            addToResults(`  Response: ${JSON.stringify(result.data, null, 2)}`);
            // Clear form
            document.getElementById('todoTitle').value = '';
            document.getElementById('todoDescription').value = '';
        } else {
            addToResults('Failed to create todo: ' + result.error);
        }
    } catch (error) {
        addToResults('Error creating todo: ' + error.message);
    }
}

async function getAllTodos() {
    try {
        addToResults('Fetching all todos...');
        const result = await apiCall('/api/soap/todos');
        
        if (result.success) {
            addToResults('Retrieved all todos successfully');
            addToResults(`  Response: ${JSON.stringify(result.data, null, 2)}`);
        } else {
            addToResults('Failed to get todos: ' + result.error);
        }
    } catch (error) {
        addToResults('Error getting todos: ' + error.message);
    }
}

async function getTodoById() {
    const todoId = document.getElementById('todoIdSearch').value.trim();
    
    if (!todoId) {
        addToResults('Please enter a todo ID');
        return;
    }
    
    try {
        addToResults(`Fetching todo with ID: ${todoId}`);
        const result = await apiCall(`/api/soap/todos/${todoId}`);
        
        if (result.success) {
            addToResults('Todo retrieved successfully');
            addToResults(`  Response: ${JSON.stringify(result.data, null, 2)}`);
        } else {
            addToResults('Failed to get todo: ' + result.error);
        }
    } catch (error) {
        addToResults('Error getting todo: ' + error.message);
    }
}

async function updateTodo() {
    const todoId = document.getElementById('updateTodoId').value.trim();
    const title = document.getElementById('updateTodoTitle').value.trim();
    const description = document.getElementById('updateTodoDescription').value.trim();
    const completed = document.getElementById('updateTodoCompleted').checked;
    
    if (!todoId) {
        addToResults('Please enter a todo ID');
        return;
    }
    
    if (!title) {
        addToResults('Please enter a title');
        return;
    }
    
    try {
        addToResults(`Updating todo ${todoId}: "${title}"`);
        const result = await apiCall(`/api/soap/todos/${todoId}`, {
            method: 'PUT',
            body: JSON.stringify({ title, description, completed })
        });
        
        if (result.success) {
            addToResults('Todo updated successfully');
            addToResults(`  Response: ${JSON.stringify(result.data, null, 2)}`);
            // Clear form
            document.getElementById('updateTodoId').value = '';
            document.getElementById('updateTodoTitle').value = '';
            document.getElementById('updateTodoDescription').value = '';
            document.getElementById('updateTodoCompleted').checked = false;
        } else {
            addToResults('Failed to update todo: ' + result.error);
        }
    } catch (error) {
        addToResults('Error updating todo: ' + error.message);
    }
}

async function deleteTodo() {
    const todoId = document.getElementById('deleteTodoId').value.trim();
    
    if (!todoId) {
        addToResults('Please enter a todo ID');
        return;
    }
    
    try {
        addToResults(`Deleting todo with ID: ${todoId}`);
        const result = await apiCall(`/api/soap/todos/${todoId}`, {
            method: 'DELETE'
        });
        
        if (result.success) {
            addToResults('Todo deleted successfully');
            addToResults(`  Response: ${JSON.stringify(result.data, null, 2)}`);
            document.getElementById('deleteTodoId').value = '';
        } else {
            addToResults('Failed to delete todo: ' + result.error);
        }
    } catch (error) {
        addToResults('Error deleting todo: ' + error.message);
    }
}

//ANCHOR MinIO Functions
async function refreshBucketList() {
    try {
        const result = await apiCall('/api/minio/buckets');
        if (result.success) {
            currentBuckets = result.buckets;
            const select = document.getElementById('selectedBucket');
            select.innerHTML = '<option value="">Select Bucket</option>';
            
            currentBuckets.forEach(bucket => {
                const option = document.createElement('option');
                option.value = bucket.name;
                option.textContent = bucket.name;
                select.appendChild(option);
            });
        }
    } catch (error) {
        addToResults('Error refreshing bucket list: ' + error.message);
    }
}

async function createBucket() {
    const bucketName = document.getElementById('bucketName').value.trim();
    
    if (!bucketName) {
        addToResults('Please enter a bucket name');
        return;
    }
    
    // Client-side validation and warning
    const normalizedName = bucketName
        .toLowerCase()
        .replace(/[^a-z0-9.-]/g, '-')
        .replace(/^[-.]|[-.]$/g, '')
        .replace(/[-]{2,}/g, '-')
        .replace(/[.]{2,}/g, '.');
    
    if (bucketName !== normalizedName) {
        addToResults(`Bucket name will be normalized from "${bucketName}" to "${normalizedName}"`);
        addToResults('MinIO bucket names must be lowercase, 3-63 chars, letters/numbers/dots/hyphens only');
    }
    
    try {
        addToResults(`Creating bucket: "${bucketName}"`);
        const result = await apiCall('/api/minio/buckets', {
            method: 'POST',
            body: JSON.stringify({ bucketName })
        });
        
        if (result.success) {
            addToResults('Bucket created successfully');
            addToResults(`  Message: ${result.message}`);
            if (result.bucketName) {
                addToResults(`  Final bucket name: ${result.bucketName}`);
            }
            document.getElementById('bucketName').value = '';
            await refreshBucketList();
        } else {
            addToResults('Failed to create bucket: ' + result.error);
        }
    } catch (error) {
        addToResults('Error creating bucket: ' + error.message);
    }
}

async function listBuckets() {
    try {
        addToResults('Listing all buckets...');
        const result = await apiCall('/api/minio/buckets');
        
        if (result.success) {
            addToResults('Buckets retrieved successfully');
            addToResults(`  Found ${result.buckets.length} bucket(s):`);
            result.buckets.forEach((bucket, index) => {
                addToResults(`    ${index + 1}. ${bucket.name} (Created: ${new Date(bucket.creationDate).toLocaleString()})`);
            });
            await refreshBucketList();
        } else {
            addToResults('Failed to list buckets: ' + result.error);
        }
    } catch (error) {
        addToResults('Error listing buckets: ' + error.message);
    }
}

async function deleteBucket() {
    const bucketName = document.getElementById('bucketName').value.trim();
    
    if (!bucketName) {
        addToResults('Please enter a bucket name');
        return;
    }
    
    if (!confirm(`Are you sure you want to delete bucket "${bucketName}"?`)) {
        return;
    }
    
    try {
        addToResults(`Deleting bucket: "${bucketName}"`);
        const result = await apiCall(`/api/minio/buckets/${bucketName}`, {
            method: 'DELETE'
        });
        
        if (result.success) {
            addToResults('Bucket deleted successfully');
            addToResults(`  Message: ${result.message}`);
            document.getElementById('bucketName').value = '';
            await refreshBucketList();
        } else {
            addToResults('Failed to delete bucket: ' + result.error);
            
            // Check if bucket is not empty and offer force delete
            if (result.error.includes('not empty') || result.error.includes('BucketNotEmpty')) {
                const objectCount = result.objectCount || 'some';
                addToResults(`\nBucket contains ${objectCount} object(s).`);
                
                if (confirm(`Bucket "${bucketName}" is not empty. Do you want to delete all objects and the bucket? This action cannot be undone!`)) {
                    await forceDeleteBucket(bucketName);
                }
            }
        }
    } catch (error) {
        addToResults('Error deleting bucket: ' + error.message);
    }
}

async function forceDeleteBucket(bucketName) {
    try {
        addToResults(`Force deleting bucket and all contents: "${bucketName}"`);
        const result = await apiCall(`/api/minio/buckets/${bucketName}/force`, {
            method: 'DELETE'
        });
        
        if (result.success) {
            addToResults('Bucket and all contents deleted successfully');
            addToResults(`  Message: ${result.message}`);
            document.getElementById('bucketName').value = '';
            await refreshBucketList();
        } else {
            addToResults('Failed to force delete bucket: ' + result.error);
        }
    } catch (error) {
        addToResults('Error force deleting bucket: ' + error.message);
    }
}

async function listObjects() {
    const bucketName = document.getElementById('selectedBucket').value;
    
    if (!bucketName) {
        addToResults('Please select a bucket');
        return;
    }
    
    try {
        addToResults(`Listing objects in bucket: "${bucketName}"`);
        const result = await apiCall(`/api/minio/buckets/${bucketName}/objects`);
        
        if (result.success) {
            addToResults('Objects retrieved successfully');
            addToResults(`  Found ${result.objects.length} object(s):`);
            result.objects.forEach((obj, index) => {
                addToResults(`    ${index + 1}. ${obj.name} (Size: ${obj.size} bytes, Modified: ${new Date(obj.lastModified).toLocaleString()})`);
            });
            currentObjects = result.objects;
        } else {
            addToResults('Failed to list objects: ' + result.error);
        }
    } catch (error) {
        addToResults('Error listing objects: ' + error.message);
    }
}

async function uploadFile() {
    const bucketName = document.getElementById('selectedBucket').value;
    const fileInput = document.getElementById('fileUpload');
    const file = fileInput.files[0];
    
    if (!bucketName) {
        addToResults('Please select a bucket');
        return;
    }
    
    if (!file) {
        addToResults('Please select a file');
        return;
    }
    
    try {
        addToResults(`Uploading file: "${file.name}" to bucket: "${bucketName}"`);
        
        const formData = new FormData();
        formData.append('file', file);
        formData.append('objectName', file.name);
        
        const result = await fetch(`/api/minio/buckets/${bucketName}/objects`, {
            method: 'POST',
            body: formData
        }).then(response => response.json());
        
        if (result.success) {
            addToResults('File uploaded successfully');
            addToResults(`  Message: ${result.message}`);
            addToResults(`  Object name: ${result.objectName}`);
            addToResults(`  Size: ${result.size} bytes`);
            fileInput.value = '';
        } else {
            addToResults('Failed to upload file: ' + result.error);
        }
    } catch (error) {
        addToResults('Error uploading file: ' + error.message);
    }
}

async function uploadText() {
    const bucketName = document.getElementById('selectedBucket').value;
    const objectName = document.getElementById('textObjectName').value.trim();
    const content = document.getElementById('textContent').value;
    
    if (!bucketName) {
        addToResults('Please select a bucket');
        return;
    }
    
    if (!objectName) {
        addToResults('Please enter an object name');
        return;
    }
    
    if (!content) {
        addToResults('Please enter text content');
        return;
    }
    
    try {
        addToResults(`Uploading text content as: "${objectName}" to bucket: "${bucketName}"`);
        const result = await apiCall(`/api/minio/buckets/${bucketName}/text`, {
            method: 'POST',
            body: JSON.stringify({ objectName, content })
        });
        
        if (result.success) {
            addToResults('Text content uploaded successfully');
            addToResults(`  Message: ${result.message}`);
            addToResults(`  Object name: ${result.objectName}`);
            addToResults(`  Size: ${result.size} bytes`);
            document.getElementById('textObjectName').value = '';
            document.getElementById('textContent').value = '';
        } else {
            addToResults('Failed to upload text: ' + result.error);
        }
    } catch (error) {
        addToResults('Error uploading text: ' + error.message);
    }
}

async function downloadObject() {
    const bucketName = document.getElementById('selectedBucket').value;
    const objectName = document.getElementById('objectName').value.trim();
    
    if (!bucketName) {
        addToResults('Please select a bucket');
        return;
    }
    
    if (!objectName) {
        addToResults('Please enter an object name');
        return;
    }
    
    try {
        addToResults(`Downloading object: "${objectName}" from bucket: "${bucketName}"`);
        
        const url = `/api/minio/buckets/${bucketName}/objects/${objectName}`;
        const link = document.createElement('a');
        link.href = url;
        link.download = objectName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        addToResults('Download initiated successfully');
    } catch (error) {
        addToResults('Error downloading object: ' + error.message);
    }
}

async function viewTextObject() {
    const bucketName = document.getElementById('selectedBucket').value;
    const objectName = document.getElementById('objectName').value.trim();
    
    if (!bucketName) {
        addToResults('Please select a bucket');
        return;
    }
    
    if (!objectName) {
        addToResults('Please enter an object name');
        return;
    }
    
    try {
        addToResults(`Viewing text content of: "${objectName}" from bucket: "${bucketName}"`);
        const result = await apiCall(`/api/minio/buckets/${bucketName}/objects/${objectName}/text`);
        
        if (result.success) {
            addToResults('Text content retrieved successfully');
            addToResults('  Content:');
            addToResults(`${result.content}`);
        } else {
            addToResults('Failed to view text object: ' + result.error);
        }
    } catch (error) {
        addToResults('Error viewing text object: ' + error.message);
    }
}

async function deleteObject() {
    const bucketName = document.getElementById('selectedBucket').value;
    const objectName = document.getElementById('deleteObjectName').value.trim();
    
    if (!bucketName) {
        addToResults('Please select a bucket');
        return;
    }
    
    if (!objectName) {
        addToResults('Please enter an object name');
        return;
    }
    
    if (!confirm(`Are you sure you want to delete object "${objectName}" from bucket "${bucketName}"?`)) {
        return;
    }
    
    try {
        addToResults(`Deleting object: "${objectName}" from bucket: "${bucketName}"`);
        const result = await apiCall(`/api/minio/buckets/${bucketName}/objects/${objectName}`, {
            method: 'DELETE'
        });
        
        if (result.success) {
            addToResults('Object deleted successfully');
            addToResults(`  Message: ${result.message}`);
            document.getElementById('deleteObjectName').value = '';
        } else {
            addToResults('Failed to delete object: ' + result.error);
        }
    } catch (error) {
        addToResults('Error deleting object: ' + error.message);
    }
}

//ANCHOR Socket Communication Functions
async function testSocketConnection() {
    setStatus('socketStatus', 'loading');
    try {
        addToResults('Testing Socket server connection...');
        const result = await apiCall('/api/socket/test');
        
        if (result.success) {
            setStatus('socketStatus', 'online', 'Connected');
            addToResults('Socket server is online');
            addToResults(`  Server: ${result.server_info}`);
            addToResults(`  Response: ${result.response}`);
        } else {
            setStatus('socketStatus', 'offline', 'Disconnected');
            addToResults('Socket server test failed');
            addToResults(`  Error: ${result.error}`);
        }
    } catch (error) {
        setStatus('socketStatus', 'offline', 'Error');
        addToResults('Socket connection test error: ' + error.message);
    }
}

async function sendSocketMessage() {
    const messageInput = document.getElementById('socketMessage');
    const message = messageInput.value.trim();
    
    if (!message) {
        addToResults('Please enter a message to send');
        return;
    }
    
    try {
        addToResults(`Sending socket message: "${message}"`);
        const result = await apiCall('/api/socket/send', {
            method: 'POST',
            body: JSON.stringify({ message: message })
        });
        
        if (result.success) {
            addToResults('Message sent successfully');
            addToResults(`  Sent: ${result.sent_message}`);
            addToResults(`  Server Response: ${result.server_response}`);
            
            // Update message history
            updateSocketHistory();
            
            // Clear input
            messageInput.value = '';
        } else {
            addToResults('Failed to send message');
            addToResults(`  Error: ${result.error}`);
        }
    } catch (error) {
        addToResults('Error sending socket message: ' + error.message);
    }
}

async function testEcho() {
    const echoInput = document.getElementById('echoText');
    const text = echoInput.value.trim();
    
    if (!text) {
        addToResults('Please enter text to echo');
        return;
    }
    
    try {
        addToResults(`Testing echo with: "${text}"`);
        const result = await apiCall('/api/socket/echo', {
            method: 'POST',
            body: JSON.stringify({ text: text })
        });
        
        if (result.success) {
            addToResults('Echo test successful');
            addToResults(`  Original: ${result.original_text}`);
            addToResults(`  Echo Command: ${result.echo_command}`);
            addToResults(`  Server Response: ${result.server_response}`);
            
            // Clear input
            echoInput.value = '';
        } else {
            addToResults('Echo test failed');
            addToResults(`  Error: ${result.error}`);
        }
    } catch (error) {
        addToResults('Error testing echo: ' + error.message);
    }
}

async function getMessageHistory() {
    try {
        addToResults('Fetching socket message history...');
        const result = await apiCall('/api/socket/messages');
        
        if (result.success) {
            addToResults(`Retrieved ${result.message_count} messages`);
            addToResults(`  Server: ${result.server_info}`);
            
            updateSocketHistory(result.messages);
        } else {
            addToResults('Failed to get message history');
            addToResults(`  Error: ${result.error}`);
        }
    } catch (error) {
        addToResults('Error fetching message history: ' + error.message);
    }
}

async function clearMessageHistory() {
    if (!confirm('Are you sure you want to clear the message history?')) {
        return;
    }
    
    try {
        addToResults('Clearing socket message history...');
        const result = await apiCall('/api/socket/messages', {
            method: 'DELETE'
        });
        
        if (result.success) {
            addToResults('Message history cleared');
            addToResults(`  ${result.message}`);
            
            // Clear the display
            updateSocketHistory([]);
        } else {
            addToResults('Failed to clear message history');
            addToResults(`  Error: ${result.error}`);
        }
    } catch (error) {
        addToResults('Error clearing message history: ' + error.message);
    }
}

function updateSocketHistory(messages) {
    const historyDiv = document.getElementById('socketHistory');
    
    if (!messages || messages.length === 0) {
        historyDiv.innerHTML = '<p class="text-muted mb-0">No messages yet. Send a message to see the history.</p>';
        return;
    }
    
    let historyHTML = '';
    messages.forEach((msg, index) => {
        const timestamp = new Date(msg.timestamp).toLocaleString();
        historyHTML += `
            <div class="message-entry mb-2 p-2 border rounded">
                <div class="d-flex justify-content-between">
                    <strong>Message #${msg.id}</strong>
                    <small class="text-muted">${timestamp}</small>
                </div>
                <div class="mt-1">
                    <strong>Sent:</strong> <code>${msg.message}</code>
                </div>
                <div>
                    <strong>Response:</strong> <code>${msg.response}</code>
                </div>
                <small class="text-muted">From: ${msg.client_info}</small>
            </div>
        `;
    });
    
    historyDiv.innerHTML = historyHTML;
}

//ANCHOR Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    addToResults('SOAP, MinIO & Socket API Tester initialized');
    addToResults('Welcome! Test your services by clicking the connection buttons above.');
    addToResults('Socket communication demo ready for distributed systems testing!');
    addToResults('');
    
    // Test connections on load
    testSoapConnection();
    testMinioConnection();
    testSocketConnection();
});