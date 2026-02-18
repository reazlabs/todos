import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import "./App.css";

function App() {

  // ======================
  // AUTH STATES
  // ======================

  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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

    const getSession = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      setLoading(false);
    };

    getSession();

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
      .order("created_at", { ascending: false });

    if (error) {
      alert(error.message);
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

    if (!email.trim() || !password.trim()) {
      alert("Enter email and password");
      return;
    }

    setSaving(true);

    const { error } = await supabase.auth.signUp({
      email,
      password
    });

    setSaving(false);

    if (error) {
      alert(error.message);
    } else {
      alert("Signup successful! Now sign in.");
    }
  }

  // ======================
  // SIGN IN
  // ======================

  async function signIn() {

    if (!email.trim() || !password.trim()) {
      alert("Enter email and password");
      return;
    }

    setSaving(true);

    const { error } =
      await supabase.auth.signInWithPassword({
        email,
        password
      });

    setSaving(false);

    if (error) alert(error.message);
  }

  // ======================
  // SIGN OUT
  // ======================

  async function signOut() {

    await supabase.auth.signOut();

    setSession(null);
    setTodos([]);
  }

  // ======================
  // ADD TODO
  // ======================

  async function addTodo() {

    if (!text.trim()) {
      alert("Enter todo text");
      return;
    }

    setSaving(true);

    const { data, error } = await supabase
      .from("todos")
      .insert([
        {
          text: text.trim(),
          user_id: session.user.id
        }
      ])
      .select()
      .single();

    setSaving(false);

    if (error) {
      alert(error.message);
      return;
    }

    setTodos(prev => [data, ...prev]);
    setText("");
  }

  // ======================
  // DELETE TODO
  // ======================

  async function deleteTodo(id) {

    const { error } = await supabase
      .from("todos")
      .delete()
      .eq("id", id)
      .eq("user_id", session.user.id);

    if (error) {
      alert(error.message);
      return;
    }

    setTodos(prev => prev.filter(todo => todo.id !== id));
  }

  // ======================
  // EDIT TODO
  // ======================

  function startEdit(todo) {

    setEditingId(todo.id);
    setEditingText(todo.text);
  }

  async function updateTodo(id) {

    if (!editingText.trim()) {
      alert("Todo cannot be empty");
      return;
    }

    setSaving(true);

    const { error } = await supabase
      .from("todos")
      .update({
        text: editingText.trim()
      })
      .eq("id", id)
      .eq("user_id", session.user.id);

    setSaving(false);

    if (error) {
      alert(error.message);
      return;
    }

    setTodos(prev =>
      prev.map(todo =>
        todo.id === id
          ? { ...todo, text: editingText.trim() }
          : todo
      )
    );

    setEditingId(null);
    setEditingText("");
  }

  // ======================
  // LOADING UI
  // ======================

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <h2 className="text-xl font-semibold">Loading...</h2>
      </div>
    );
  }

  // ======================
  // LOGIN UI
  // ======================

  if (!session) {

    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 px-4">

        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">

          <h1 className="mb-2 text-center text-3xl font-bold text-gray-900">
            Todo App
          </h1>

          <p className="mb-8 text-center text-gray-500">
            Sign in to manage your tasks
          </p>

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
            className="mb-4 w-full rounded-xl border px-5 py-4"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
            className="mb-6 w-full rounded-xl border px-5 py-4"
          />

          <div className="flex flex-col gap-4 sm:flex-row">

            <button
              onClick={signUp}
              disabled={saving}
              className="flex-1 rounded-xl bg-indigo-600 px-6 py-4 font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {saving ? "Please wait..." : "Sign Up"}
            </button>

            <button
              onClick={signIn}
              disabled={saving}
              className="flex-1 rounded-xl bg-indigo-600 px-6 py-4 font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {saving ? "Please wait..." : "Sign In"}
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

    <div className="mx-auto min-h-screen max-w-md bg-gray-50 px-4 pb-12 pt-6">

      <header className="mb-8 flex items-center justify-between border-b pb-4">

        <h1 className="text-2xl font-semibold">
          My Todo
        </h1>

        <button
          onClick={signOut}
          className="rounded-lg bg-red-500 px-5 py-2 text-white hover:bg-red-600"
        >
          Logout
        </button>

      </header>

      <div className="mb-6 flex flex-col sm:flex-row gap-3">

  <input
    type="text"
    value={text}
    onChange={(e) => setText(e.target.value)}
    placeholder="What needs to be done?"
    className="w-full sm:flex-1 rounded-xl border border-gray-300 px-5 py-4 outline-none focus:ring-2 focus:ring-emerald-400"
  />

  <button
    onClick={addTodo}
    disabled={saving}
    className="w-full sm:w-auto rounded-xl bg-emerald-600 px-6 py-4 text-white hover:bg-emerald-700 disabled:opacity-50"
  >
    Add
  </button>

</div>

      <ul className="space-y-4">

        {todos.map(todo => (

          <li
            key={todo.id}
            className="rounded-xl bg-white p-4 shadow"
          >

            {editingId === todo.id ? (

              <div className="flex flex-col gap-2">

                <input
                  value={editingText}
                  onChange={(e) =>
                    setEditingText(e.target.value)
                  }
                  className="rounded-xl border px-4 py-3"
                />

                <div className="flex gap-2">

                  <button
                    onClick={() =>
                      updateTodo(todo.id)
                    }
                    className="flex-1 rounded-xl bg-green-600 py-2 text-white"
                  >
                    Save
                  </button>

                  <button
                    onClick={() =>
                      setEditingId(null)
                    }
                    className="flex-1 rounded-xl bg-gray-400 py-2 text-white"
                  >
                    Cancel
                  </button>

                </div>

              </div>

            ) : (

              <div className="flex items-center justify-between">

                <span>
                  {todo.text}
                </span>

                <div className="flex gap-2">

                  <button
                    onClick={() =>
                      startEdit(todo)
                    }
                    className="rounded bg-yellow-500 px-3 py-1 text-white"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() =>
                      deleteTodo(todo.id)
                    }
                    className="rounded bg-red-500 px-3 py-1 text-white"
                  >
                    Delete
                  </button>

                </div>

              </div>

            )}

          </li>

        ))}

      </ul>

      <div className="mt-6 text-center text-sm text-gray-400">
        v@1.2.0
      </div>

    </div>

  );

}

export default App;
