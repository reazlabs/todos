import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";

function App() {

  const [todos, setTodos] = useState([]);
  const [text, setText] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState("");

  // Fetch todos
  async function getTodos() {
    const { data, error } = await supabase
      .from("todos")
      .select("*")
      .order("id", { ascending: false });

    if (!error) setTodos(data);
  }

  useEffect(() => {
    getTodos();
  }, []);

  // Add todo
  async function addTodo() {

    if (!text) return;

    await supabase
      .from("todos")
      .insert([{ text }]);

    setText("");
    getTodos();
  }

  // Delete todo
  async function deleteTodo(id) {
    await supabase
      .from("todos")
      .delete()
      .eq("id", id);

    getTodos();
  }

  // Start editing
  function startEdit(todo) {
    setEditingId(todo.id);
    setEditingText(todo.text);
  }

  // Update todo
  async function updateTodo(id) {

    await supabase
      .from("todos")
      .update({ text: editingText })
      .eq("id", id);

    setEditingId(null);
    setEditingText("");

    getTodos();
  }

  return (
    <div style={{ padding: 20 }}>

      <h1>Supabase Todo App</h1>

      {/* Add */}
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Enter todo"
      />

      <button onClick={addTodo}>
        Add
      </button>

      {/* List */}
      <ul>

        {todos.map(todo => (

          <li key={todo.id}>

            {editingId === todo.id ? (
              <>
                <input
                  value={editingText}
                  onChange={(e) =>
                    setEditingText(e.target.value)
                  }
                />

                <button
                  onClick={() => updateTodo(todo.id)}
                >
                  Save
                </button>

                <button
                  onClick={() => setEditingId(null)}
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                {todo.text}

                <button
                  onClick={() => startEdit(todo)}
                  style={{ marginLeft: 10 }}
                >
                  Edit
                </button>

                <button
                  onClick={() => deleteTodo(todo.id)}
                  style={{ marginLeft: 10 }}
                >
                  Delete
                </button>
              </>
            )}

          </li>

        ))}

      </ul>

    </div>
  );
}

export default App;
