import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";

function App() {

  // ======================
  // AUTH STATES
  // ======================

  const [session, setSession] = useState(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // ======================
  // TODO STATES
  // ======================

  const [todos, setTodos] = useState([]);
  const [text, setText] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState("");

  // ======================
  // AUTH LISTENER
  // ======================

  useEffect(() => {

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const { data: listener } =
      supabase.auth.onAuthStateChange(
        (_event, session) => {
          setSession(session);
        }
      );

    return () => {
      listener.subscription.unsubscribe();
    };

  }, []);

  // ======================
  // GET TODOS (USER SPECIFIC)
  // ======================

  async function getTodos() {

    if (!session) return;

    const user = session.user;

    const { data, error } = await supabase
      .from("todos")
      .select("*")
      .eq("user_id", user.id)
      .order("id", { ascending: false });

    if (!error) setTodos(data);
  }

  useEffect(() => {
    getTodos();
  }, [session]);

  // ======================
  // AUTH FUNCTIONS
  // ======================

  async function signUp() {

    const { error } =
      await supabase.auth.signUp({
        email,
        password
      });

    if (error)
      alert(error.message);
    else
      alert("Signup successful! Now login.");
  }

  async function signIn() {

    const { error } =
      await supabase.auth.signInWithPassword({
        email,
        password
      });

    if (error)
      alert(error.message);
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  // ======================
  // ADD TODO
  // ======================

  async function addTodo() {

    if (!text) return;

    const user = session.user;

    await supabase
      .from("todos")
      .insert([
        {
          text,
          user_id: user.id
        }
      ]);

    setText("");
    getTodos();
  }

  // ======================
  // DELETE TODO
  // ======================

  async function deleteTodo(id) {

    await supabase
      .from("todos")
      .delete()
      .eq("id", id);

    getTodos();
  }

  // ======================
  // EDIT TODO
  // ======================

  function startEdit(todo) {
    setEditingId(todo.id);
    setEditingText(todo.text);
  }

  async function updateTodo(id) {

    await supabase
      .from("todos")
      .update({
        text: editingText
      })
      .eq("id", id);

    setEditingId(null);
    setEditingText("");

    getTodos();
  }

  // ======================
  // LOGIN UI
  // ======================

  if (!session) {

    return (
      <div style={{ padding: 20 }}>

        <h1>Supabase Auth</h1>

        <input
          placeholder="Email"
          onChange={(e) =>
            setEmail(e.target.value)
          }
        />

        <br /><br />

        <input
          type="password"
          placeholder="Password"
          onChange={(e) =>
            setPassword(e.target.value)
          }
        />

        <br /><br />

        <button onClick={signUp}>
          Sign Up
        </button>

        <button
          onClick={signIn}
          style={{ marginLeft: 10 }}
        >
          Sign In
        </button>

      </div>
    );
  }

  // ======================
  // TODO UI
  // ======================

  return (

    <div style={{ padding: 20 }}>

      <h1>Supabase Todo App</h1>

      <button onClick={signOut}>
        Logout
      </button>

      <br /><br />

      <input
        value={text}
        onChange={(e) =>
          setText(e.target.value)
        }
        placeholder="Enter todo"
      />

      <button
        onClick={addTodo}
        style={{ marginLeft: 10 }}
      >
        Add
      </button>

      <ul>

        {todos.map(todo => (

          <li key={todo.id}>

            {editingId === todo.id ? (
              <>

                <input
                  value={editingText}
                  onChange={(e) =>
                    setEditingText(
                      e.target.value
                    )
                  }
                />

                <button
                  onClick={() =>
                    updateTodo(todo.id)
                  }
                >
                  Save
                </button>

                <button
                  onClick={() =>
                    setEditingId(null)
                  }
                >
                  Cancel
                </button>

              </>
            ) : (
              <>

                {todo.text}

                <button
                  onClick={() =>
                    startEdit(todo)
                  }
                  style={{ marginLeft: 10 }}
                >
                  Edit
                </button>

                <button
                  onClick={() =>
                    deleteTodo(todo.id)
                  }
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
