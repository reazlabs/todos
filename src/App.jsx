import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";

function App() {

  // ======================
  // AUTH STATES
  // ======================

  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

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

    // get existing session
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        setSession(session);
        setLoading(false);
      });

    // listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    return () => subscription.unsubscribe();

  }, []);

  // ======================
  // GET TODOS
  // ======================

  async function getTodos() {

    if (!session?.user) return;

    const { data, error } = await supabase
      .from("todos")
      .select("*")
      .eq("user_id", session.user.id)
      .order("id", { ascending: false });

    if (error) {
      console.log(error.message);
      return;
    }

    setTodos(data);
  }

  useEffect(() => {
    if (session) getTodos();
  }, [session]);

  // ======================
  // SIGN UP
  // ======================

  async function signUp() {

    if (!email || !password) {
      alert("Enter email and password");
      return;
    }

    const { error } = await supabase.auth.signUp({
      email,
      password
    });

    if (error) {
      alert(error.message);
    } else {
      alert("Signup successful! Now login.");
    }
  }

  // ======================
  // SIGN IN
  // ======================

  async function signIn() {

    if (!email || !password) {
      alert("Enter email and password");
      return;
    }

    const { error } =
      await supabase.auth.signInWithPassword({
        email,
        password
      });

    if (error) alert(error.message);
  }

  // ======================
  // SIGN OUT
  // ======================

  async function signOut() {
    await supabase.auth.signOut();
    setTodos([]);
  }

  // ======================
  // ADD TODO
  // ======================

  async function addTodo() {

    if (!text || !session?.user) return;

    const { error } = await supabase
      .from("todos")
      .insert([
        {
          text,
          user_id: session.user.id
        }
      ]);

    if (!error) {
      setText("");
      getTodos();
    }
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
  // LOADING UI
  // ======================

  if (loading) {
    return <h2>Loading...</h2>;
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
          value={email}
          onChange={(e) =>
            setEmail(e.target.value)
          }
        />

        <br /><br />

        <input
          type="password"
          placeholder="Password"
          value={password}
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

      <h1 className="text-3xl">Supabase Todo App</h1>

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
                    setEditingText(e.target.value)
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
