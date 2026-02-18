import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import './App.css';

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
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">

          <h1 className="mb-2 text-center text-3xl font-bold text-gray-900">Todo App</h1>
          <p className="mb-8 text-center text-gray-500">Sing in to manage your Task</p>

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
            className="mb-4 w-full rounded-xl border border-gray-300 px-5 py-4 text-base focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          />


          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
            className="mb-6 w-full rounded-xl border border-gray-300 px-5 py-4 text-base focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          />
          <div className="flex flex-col gap-4 sm:flex-row">
            <button onClick={signUp}
              className="flex-1 rounded-b-xl bg-indigo-600 px-6 py-4 font-semibold text-white shadow-md transition hover:bg-indigo-700 active:scale-[0.98]"
            >
              Sign Up
            </button>

            <button
              onClick={signIn}
              className="flex-1 rounded-b-xl bg-indigo-600 px-6 py-4 font-semibold text-white shadow-md transition hover:bg-indigo-700 active:scale-[0.98]"
            >
              Sign In
            </button>
          </div>
        </div>
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
