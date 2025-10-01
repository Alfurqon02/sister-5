const express = require('express');
const axios = require('axios');
const xml2js = require('xml2js');
const router = express.Router();

//ANCHOR SOAP endpoint using environment variables
const SOAP_URL = process.env.SOAP_URL || `http://${process.env.SOAP_HOST || 'localhost'}:${process.env.SOAP_PORT || 8000}`;

//ANCHOR XML parser
const parser = new xml2js.Parser({
    explicitArray: false,
    ignoreAttrs: true,
    tagNameProcessors: [xml2js.processors.stripPrefix]
});

//ANCHOR Helper functions to extract data from parsed SOAP responses
function extractTodosFromResponse(parsedXml) {
    try {
        const result = parsedXml.Envelope.Body.get_all_todosResponse.get_all_todosResult;
        
        if (!result.TodoResponse) {
            return [];
        }
        
        // Handle single response vs array of responses
        const todoResponses = Array.isArray(result.TodoResponse) ? result.TodoResponse : [result.TodoResponse];
        
        return todoResponses.map(todoResponse => ({
            success: todoResponse.success === 'true',
            message: todoResponse.message,
            todo: todoResponse.todo ? {
                id: parseInt(todoResponse.todo.id),
                title: todoResponse.todo.title,
                description: todoResponse.todo.description,
                completed: todoResponse.todo.completed === 'true'
            } : null
        }));
    } catch (error) {
        console.error('Error extracting todos:', error);
        return [];
    }
}

function extractSingleTodoFromResponse(parsedXml, methodName) {
    try {
        const responseKey = `${methodName}Response`;
        const resultKey = `${methodName}Result`;
        
        const result = parsedXml.Envelope.Body[responseKey][resultKey];
        
        return {
            success: result.success === 'true',
            message: result.message,
            todo: result.todo ? {
                id: parseInt(result.todo.id),
                title: result.todo.title,
                description: result.todo.description,
                completed: result.todo.completed === 'true'
            } : null
        };
    } catch (error) {
        console.error(`Error extracting single todo from ${methodName}:`, error);
        return {
            success: false,
            message: 'Error parsing response',
            todo: null
        };
    }
}

function extractSimpleResponse(parsedXml, methodName) {
    try {
        const responseKey = `${methodName}Response`;
        const resultKey = `${methodName}Result`;
        
        const result = parsedXml.Envelope.Body[responseKey][resultKey];
        
        return {
            success: result.success === 'true',
            message: result.message
        };
    } catch (error) {
        console.error(`Error extracting simple response from ${methodName}:`, error);
        return {
            success: false,
            message: 'Error parsing response'
        };
    }
}

//ANCHOR Helper function to make SOAP requests
async function makeSoapRequest(soapBody, soapAction) {
    const soapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" 
               xmlns:tns="todo.soap.service">
    <soap:Body>
        ${soapBody}
    </soap:Body>
</soap:Envelope>`;

    try {
        const response = await axios.post(SOAP_URL, soapEnvelope, {
            headers: {
                'Content-Type': 'text/xml; charset=utf-8',
                'SOAPAction': `"${soapAction}"`
            }
        });
        
        // Parse XML response to JSON
        const parsedXml = await parser.parseStringPromise(response.data);
        console.log('Parsed SOAP Response:', JSON.stringify(parsedXml, null, 2));
        
        return parsedXml;
    } catch (error) {
        console.error('SOAP Request Error:', error.response?.data || error.message);
        throw new Error(`SOAP request failed: ${error.response?.data || error.message}`);
    }
}

//ANCHOR Get all todos
router.get('/todos', async (req, res) => {
    try {
        const soapBody = '<tns:get_all_todos></tns:get_all_todos>';
        const parsedResult = await makeSoapRequest(soapBody, 'get_all_todos');
        const todos = extractTodosFromResponse(parsedResult);
        res.json({ success: true, data: todos });
    } catch (error) {
        console.error('SOAP get_all_todos error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

//ANCHOR Get todo by ID
router.get('/todos/:id', async (req, res) => {
    try {
        const todoId = parseInt(req.params.id);
        const soapBody = `<tns:get_todo>
            <tns:todo_id>${todoId}</tns:todo_id>
        </tns:get_todo>`;
        const parsedResult = await makeSoapRequest(soapBody, 'get_todo');
        const todoResponse = extractSingleTodoFromResponse(parsedResult, 'get_todo');
        res.json({ success: true, data: todoResponse });
    } catch (error) {
        console.error('SOAP get_todo error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

//ANCHOR Create todo
router.post('/todos', async (req, res) => {
    try {
        const { title, description } = req.body;
        const soapBody = `<tns:create_todo>
            <tns:title>${title}</tns:title>
            <tns:description>${description || ''}</tns:description>
        </tns:create_todo>`;
        const parsedResult = await makeSoapRequest(soapBody, 'create_todo');
        const todoResponse = extractSingleTodoFromResponse(parsedResult, 'create_todo');
        res.json({ success: true, data: todoResponse });
    } catch (error) {
        console.error('SOAP create_todo error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

//ANCHOR Update todo
router.put('/todos/:id', async (req, res) => {
    try {
        const todoId = parseInt(req.params.id);
        const { title, description, completed } = req.body;
        const soapBody = `<tns:update_todo>
            <tns:todo_id>${todoId}</tns:todo_id>
            <tns:title>${title}</tns:title>
            <tns:description>${description || ''}</tns:description>
            <tns:completed>${completed || false}</tns:completed>
        </tns:update_todo>`;
        const parsedResult = await makeSoapRequest(soapBody, 'update_todo');
        const todoResponse = extractSingleTodoFromResponse(parsedResult, 'update_todo');
        res.json({ success: true, data: todoResponse });
    } catch (error) {
        console.error('SOAP update_todo error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

//ANCHOR Delete todo
router.delete('/todos/:id', async (req, res) => {
    try {
        const todoId = parseInt(req.params.id);
        const soapBody = `<tns:delete_todo>
            <tns:todo_id>${todoId}</tns:todo_id>
        </tns:delete_todo>`;
        const parsedResult = await makeSoapRequest(soapBody, 'delete_todo');
        const response = extractSimpleResponse(parsedResult, 'delete_todo');
        res.json({ success: true, data: response });
    } catch (error) {
        console.error('SOAP delete_todo error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

//ANCHOR Test SOAP connection
router.get('/test', async (req, res) => {
    try {
        const response = await axios.get(`${SOAP_URL}/?wsdl`);
        res.json({ 
            success: true, 
            message: 'SOAP server is running',
            wsdl: response.data.substring(0, 200) + '...'
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'SOAP server is not reachable: ' + error.message });
    }
});

module.exports = router;