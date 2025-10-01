from zeep import Client
import sys

try:
    print("Connecting to SOAP service...")
    wsdl = 'http://localhost:8000/?wsdl'
    client = Client(wsdl=wsdl)
    print("WSDL loaded successfully!")
    
    print("Testing get_all_todos...")
    result = client.service.get_all_todos()
    print(f"Get all result - Success: {result.success}, Message: {result.message}")
    
    if result.success and result.todos:
        print("Todos retrieved successfully!")
        for i, todo in enumerate(result.todos):
            print(f"Todo {i+1}:")
            print(f"  Type: {type(todo)}")
            print(f"  Value: {todo}")
            try:
                print(f"  ID: {todo.id}")
                print(f"  Title: {todo.title}")
                print(f"  Description: {todo.description}")
                print(f"  Completed: {todo.completed}")
            except Exception as e:
                print(f"  Error accessing attributes: {e}")
            print()
    else:
        print("Failed to get todos or no todos found")
        
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()