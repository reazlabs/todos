import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";

function App() {

  const [todos, setTodos] = useState([]);
  const [text, setText] = useState("");

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

  return (
    <div style={{ padding: 20 }}>

      <h1>Supabase Todo App</h1>

      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Enter todo"
      />

      <button onClick={addTodo}>
        Add
      </button>

      <ul>
        {todos.map(todo => (
          <li key={todo.id}>
            {todo.text}

            <button
              onClick={() => deleteTodo(todo.id)}
              style={{ marginLeft: 10 }}
            >
              Delete
            </button>

          </li>
        ))}
      </ul>

    </div>
  );
}

export default App;
