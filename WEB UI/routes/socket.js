const express = require('express');
const net = require('net');
const router = express.Router();

//ANCHOR Socket server configuration
const SOCKET_HOST = process.env.SOCKET_HOST || 'localhost';
const SOCKET_PORT = parseInt(process.env.SOCKET_PORT) || 8080;

//ANCHOR Store active socket connections for demo
let socketConnections = new Map();
let messageHistory = [];

//ANCHOR Test socket server connection
router.get('/test', async (req, res) => {
    try {
        const client = new net.Socket();
        
        const testPromise = new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                client.destroy();
                reject(new Error('Connection timeout'));
            }, 5000);
            
            client.connect(SOCKET_PORT, SOCKET_HOST, () => {
                clearTimeout(timeout);
                client.write('ping');
            });
            
            client.on('data', (data) => {
                clearTimeout(timeout);
                client.destroy();
                resolve(data.toString());
            });
            
            client.on('error', (err) => {
                clearTimeout(timeout);
                reject(err);
            });
        });
        
        const response = await testPromise;
        res.json({ 
            success: true, 
            message: 'Socket server is running', 
            response: response,
            server_info: `${SOCKET_HOST}:${SOCKET_PORT}`
        });
    } catch (error) {
        console.error('Socket test error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Socket server is not reachable: ' + error.message 
        });
    }
});

//ANCHOR Send message to socket server
router.post('/send', async (req, res) => {
    try {
        const { message } = req.body;
        
        if (!message) {
            return res.status(400).json({ success: false, error: 'Message is required' });
        }
        
        const client = new net.Socket();
        
        const sendPromise = new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                client.destroy();
                reject(new Error('Connection timeout'));
            }, 10000);
            
            client.connect(SOCKET_PORT, SOCKET_HOST, () => {
                console.log('Connected to socket server, sending message:', message);
                client.write(message);
            });
            
            client.on('data', (data) => {
                clearTimeout(timeout);
                const response = data.toString();
                console.log('Received response from socket server:', response);
                
                // Store in message history
                const messageEntry = {
                    id: Date.now(),
                    message: message,
                    response: response,
                    timestamp: new Date().toISOString(),
                    client_info: req.ip || 'unknown'
                };
                
                messageHistory.unshift(messageEntry);
                
                // Keep only last 50 messages
                if (messageHistory.length > 50) {
                    messageHistory = messageHistory.slice(0, 50);
                }
                
                client.destroy();
                resolve(response);
            });
            
            client.on('error', (err) => {
                clearTimeout(timeout);
                reject(err);
            });
            
            client.on('close', () => {
                clearTimeout(timeout);
            });
        });
        
        const response = await sendPromise;
        res.json({ 
            success: true, 
            message: 'Message sent successfully',
            sent_message: message,
            server_response: response,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Socket send error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to send message: ' + error.message 
        });
    }
});

//ANCHOR Get message history
router.get('/messages', (req, res) => {
    try {
        res.json({
            success: true,
            message_count: messageHistory.length,
            messages: messageHistory,
            server_info: `${SOCKET_HOST}:${SOCKET_PORT}`
        });
    } catch (error) {
        console.error('Get messages error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

//ANCHOR Clear message history
router.delete('/messages', (req, res) => {
    try {
        const clearedCount = messageHistory.length;
        messageHistory = [];
        res.json({
            success: true,
            message: `Cleared ${clearedCount} messages`,
            remaining_messages: 0
        });
    } catch (error) {
        console.error('Clear messages error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

//ANCHOR Echo test - simple message echo
router.post('/echo', async (req, res) => {
    try {
        const { text } = req.body;
        
        if (!text) {
            return res.status(400).json({ success: false, error: 'Text is required' });
        }
        
        const echoMessage = `echo ${text}`;
        
        // Use the send functionality
        req.body.message = echoMessage;
        
        // Forward to send route
        const client = new net.Socket();
        
        const echoPromise = new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                client.destroy();
                reject(new Error('Echo timeout'));
            }, 5000);
            
            client.connect(SOCKET_PORT, SOCKET_HOST, () => {
                client.write(echoMessage);
            });
            
            client.on('data', (data) => {
                clearTimeout(timeout);
                client.destroy();
                resolve(data.toString());
            });
            
            client.on('error', (err) => {
                clearTimeout(timeout);
                reject(err);
            });
        });
        
        const response = await echoPromise;
        res.json({ 
            success: true, 
            original_text: text,
            echo_command: echoMessage,
            server_response: response
        });
        
    } catch (error) {
        console.error('Socket echo error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Echo failed: ' + error.message 
        });
    }
});

module.exports = router;