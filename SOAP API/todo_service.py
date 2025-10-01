from spyne import Application, rpc, ServiceBase, Integer, Unicode, Boolean
from spyne.protocol.soap import Soap11
from spyne.model.complex import ComplexModel, Array

from storage import TodoStorage

#ANCHOR Define Todo complex type
class Todo(ComplexModel):
    id = Integer
    title = Unicode
    description = Unicode
    completed = Boolean

#ANCHOR Define response types
class TodoResponse(ComplexModel):
    success = Boolean
    message = Unicode
    todo = Todo

class TodoListResponse(ComplexModel):
    success = Boolean
    message = Unicode
    todos = Array(Todo)

class SimpleResponse(ComplexModel):
    success = Boolean
    message = Unicode

#ANCHOR SOAP Service
class TodoService(ServiceBase):
    storage = TodoStorage()
    
    @rpc(Unicode, Unicode, _returns=TodoResponse)
    def create_todo(ctx, title, description):
        """Create a new todo item"""
        try:
            todo_dict = TodoService.storage.create(title, description)
            
            todo = Todo()
            todo.id = todo_dict['id']
            todo.title = todo_dict['title']
            todo.description = todo_dict['description']
            todo.completed = todo_dict['completed']
            
            response = TodoResponse()
            response.success = True
            response.message = "Todo created successfully"
            response.todo = todo
            
            return response
        except Exception as e:
            response = TodoResponse()
            response.success = False
            response.message = f"Error creating todo: {str(e)}"
            return response
    
    @rpc(Integer, _returns=TodoResponse)
    def get_todo(ctx, todo_id):
        """Get a specific todo by ID"""
        try:
            todo_dict = TodoService.storage.read(todo_id)
            
            if todo_dict is None:
                response = TodoResponse()
                response.success = False
                response.message = f"Todo with ID {todo_id} not found"
                return response
            
            todo = Todo()
            todo.id = todo_dict['id']
            todo.title = todo_dict['title']
            todo.description = todo_dict['description']
            todo.completed = todo_dict['completed']
            
            response = TodoResponse()
            response.success = True
            response.message = "Todo retrieved successfully"
            response.todo = todo
            
            return response
        except Exception as e:
            response = TodoResponse()
            response.success = False
            response.message = f"Error retrieving todo: {str(e)}"
            return response
    
    @rpc(_returns=Array(TodoResponse))
    def get_all_todos(ctx):
        """Get all todos"""
        try:
            todos_dict = TodoService.storage.read_all()
            
            responses = []
            for todo_dict in todos_dict:
                todo = Todo()
                todo.id = todo_dict['id']
                todo.title = todo_dict['title']
                todo.description = todo_dict['description']
                todo.completed = todo_dict['completed']
                
                response = TodoResponse()
                response.success = True
                response.message = "Todo retrieved successfully"
                response.todo = todo
                responses.append(response)
            
            return responses
        except Exception as e:
            error_response = TodoResponse()
            error_response.success = False
            error_response.message = f"Error retrieving todos: {str(e)}"
            return [error_response]
    
    @rpc(Integer, Unicode, Unicode, Boolean, _returns=TodoResponse)
    def update_todo(ctx, todo_id, title, description, completed):
        """Update a todo item"""
        try:
            todo_dict = TodoService.storage.update(
                todo_id, 
                title if title else None,
                description if description else None,
                completed
            )
            
            if todo_dict is None:
                response = TodoResponse()
                response.success = False
                response.message = f"Todo with ID {todo_id} not found"
                return response
            
            todo = Todo()
            todo.id = todo_dict['id']
            todo.title = todo_dict['title']
            todo.description = todo_dict['description']
            todo.completed = todo_dict['completed']
            
            response = TodoResponse()
            response.success = True
            response.message = "Todo updated successfully"
            response.todo = todo
            
            return response
        except Exception as e:
            response = TodoResponse()
            response.success = False
            response.message = f"Error updating todo: {str(e)}"
            return response
    
    @rpc(Integer, _returns=SimpleResponse)
    def delete_todo(ctx, todo_id):
        """Delete a todo item"""
        try:
            success = TodoService.storage.delete(todo_id)
            
            response = SimpleResponse()
            if success:
                response.success = True
                response.message = f"Todo with ID {todo_id} deleted successfully"
            else:
                response.success = False
                response.message = f"Todo with ID {todo_id} not found"
            
            return response
        except Exception as e:
            response = SimpleResponse()
            response.success = False
            response.message = f"Error deleting todo: {str(e)}"
            return response

#ANCHOR Create SOAP application
application = Application(
    [TodoService],
    tns='todo.soap.service',
    in_protocol=Soap11(validator='lxml'),
    out_protocol=Soap11()
)