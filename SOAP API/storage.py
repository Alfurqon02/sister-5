import json
import os
from typing import List, Dict, Optional

class TodoStorage:
    def __init__(self, filepath: str = 'data/todos.json'):
        self.filepath = filepath
        self._ensure_file_exists()
    
    def _ensure_file_exists(self):
        """Create data directory and file if they don't exist"""
        os.makedirs(os.path.dirname(self.filepath), exist_ok=True)
        if not os.path.exists(self.filepath):
            with open(self.filepath, 'w') as f:
                json.dump([], f)
    
    def read_all(self) -> List[Dict]:
        """Read all todos from file"""
        with open(self.filepath, 'r') as f:
            return json.load(f)
    
    def write_all(self, todos: List[Dict]):
        """Write all todos to file"""
        with open(self.filepath, 'w') as f:
            json.dump(todos, f, indent=2)
    
    def create(self, title: str, description: str) -> Dict:
        """Create a new todo"""
        todos = self.read_all()
        new_id = max([todo['id'] for todo in todos], default=0) + 1
        
        new_todo = {
            'id': new_id,
            'title': title,
            'description': description,
            'completed': False
        }
        
        todos.append(new_todo)
        self.write_all(todos)
        return new_todo
    
    def read(self, todo_id: int) -> Optional[Dict]:
        """Read a specific todo by ID"""
        todos = self.read_all()
        for todo in todos:
            if todo['id'] == todo_id:
                return todo
        return None
    
    def update(self, todo_id: int, title: str = None, description: str = None, completed: bool = None) -> Optional[Dict]:
        """Update a todo"""
        todos = self.read_all()
        
        for i, todo in enumerate(todos):
            if todo['id'] == todo_id:
                if title is not None:
                    todos[i]['title'] = title
                if description is not None:
                    todos[i]['description'] = description
                if completed is not None:
                    todos[i]['completed'] = completed
                
                self.write_all(todos)
                return todos[i]
        
        return None
    
    def delete(self, todo_id: int) -> bool:
        """Delete a todo"""
        todos = self.read_all()
        original_length = len(todos)
        
        todos = [todo for todo in todos if todo['id'] != todo_id]
        
        if len(todos) < original_length:
            self.write_all(todos)
            return True
        
        return False