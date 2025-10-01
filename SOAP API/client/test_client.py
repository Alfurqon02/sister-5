import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import cgi_compat
from zeep import Client

wsdl = 'http://localhost:8000/?wsdl'
client = Client(wsdl=wsdl)

def test_crud_operations():
    print("=" * 50)
    print("Testing SOAP Todo API")
    print("=" * 50)
    
    #ANCHOR CREATE - Create a new todo
    print("\n1. CREATE - Creating a new todo...")
    result = client.service.create_todo(
        title="Learn SOAP",
        description="Understand SOAP API development"
    )
    print(f"Success: {result.success}")
    print(f"Message: {result.message}")
    if result.todo:
        print(f"Created Todo ID: {result.todo.id}")
        todo_id = result.todo.id
    
    #ANCHOR CREATE - Create another todo
    print("\n2. CREATE - Creating another todo...")
    result = client.service.create_todo(
        title="Build SOAP API",
        description="Create a Python SOAP service"
    )
    print(f"Success: {result.success}")
    print(f"Message: {result.message}")
    
    #ANCHOR READ - Get all todos
    print("\n3. READ - Getting all todos...")
    result = client.service.get_all_todos()
    
    if result:
        print(f"Retrieved {len(result)} todo responses")
        for i, todo_response in enumerate(result):
            if todo_response.success and todo_response.todo:
                todo = todo_response.todo
                print(f"  - [{todo.id}] {todo.title}: {todo.description} (Completed: {todo.completed})")
            else:
                print(f"  Error in response {i}: {todo_response.message}")
    else:
        print("No todos found")
    
    #ANCHOR READ - Get specific todo
    print(f"\n4. READ - Getting todo with ID {todo_id}...")
    result = client.service.get_todo(todo_id=todo_id)
    print(f"Success: {result.success}")
    print(f"Message: {result.message}")
    if result.todo:
        print(f"  Title: {result.todo.title}")
        print(f"  Description: {result.todo.description}")
        print(f"  Completed: {result.todo.completed}")
    
    #ANCHOR UPDATE - Update the todo
    print(f"\n5. UPDATE - Updating todo {todo_id}...")
    result = client.service.update_todo(
        todo_id=todo_id,
        title="Learn SOAP (Updated)",
        description="Master SOAP API development with Python",
        completed=True
    )
    print(f"Success: {result.success}")
    print(f"Message: {result.message}")
    if result.todo:
        print(f"  Updated Title: {result.todo.title}")
        print(f"  Updated Completed: {result.todo.completed}")
    
    #ANCHOR DELETE - Delete the todo
    print(f"\n6. DELETE - Deleting todo {todo_id}...")
    result = client.service.delete_todo(todo_id=todo_id)
    print(f"Success: {result.success}")
    print(f"Message: {result.message}")
    
    #ANCHOR READ - Verify deletion
    print("\n7. READ - Getting all todos after deletion...")
    result = client.service.get_all_todos()
    
    if result:
        print(f"Retrieved {len(result)} todo responses after deletion")
        for i, todo_response in enumerate(result):
            if todo_response.success and todo_response.todo:
                todo = todo_response.todo
                print(f"  - [{todo.id}] {todo.title}")
            else:
                print(f"  Error in response {i}: {todo_response.message}")
    else:
        print("No todos found after deletion")
    
    print("\n" + "=" * 50)
    print("Testing completed!")
    print("=" * 50)

if __name__ == '__main__':
    try:
        test_crud_operations()
    except Exception as e:
        print(f"Error: {str(e)}")
        print("\nMake sure the SOAP server is running (python app.py)")