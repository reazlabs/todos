import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import { Search } from "lucide-react";

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

  // ======================
  // SEARCH + FILTER STATES
  // ======================

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [filter, setFilter] = useState("all"); 
  // all | completed | pending

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
      (_event, session) => setSession(session)
    );

    return () => subscription.unsubscribe();

  }, []);

  // ======================
  // SEARCH DEBOUNCE
  // ======================

  useEffect(() => {

    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 400);

    return () => clearTimeout(timer);

  }, [search]);

  // ======================
  // GET TODOS FROM SUPABASE
  // ======================

  async function getTodos() {

    if (!session?.user) return;

    let query = supabase
      .from("todos")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false });

    // search filter
    if (debouncedSearch) {
      query = query.ilike("text", `%${debouncedSearch}%`);
    }

    // completed filter
    if (filter === "completed") {
      query = query.eq("completed", true);
    }

    if (filter === "pending") {
      query = query.eq("completed", false);
    }

    const { data, error } = await query;

    if (error) {
      alert(error.message);
      return;
    }

    setTodos(data);
  }

  useEffect(() => {
    getTodos();
  }, [session, debouncedSearch, filter]);

  // ======================
  // AUTH FUNCTIONS
  // ======================

  async function signUp() {
    setSaving(true);
    const { error } = await supabase.auth.signUp({
      email,
      password
    });
    setSaving(false);

    if (error) alert(error.message);
    else alert("Signup successful");
  }

  async function signIn() {
    setSaving(true);
    const { error } =
      await supabase.auth.signInWithPassword({
        email,
        password
      });
    setSaving(false);

    if (error) alert(error.message);
  }

  async function signOut() {
    await supabase.auth.signOut();
    setSession(null);
  }

  // ======================
  // TODO FUNCTIONS
  // ======================

  async function addTodo() {

    if (!text.trim()) return;

    const { error } = await supabase
      .from("todos")
      .insert({
        text,
        user_id: session.user.id
      });

    if (error) {
      alert(error.message);
      return;
    }

    setText("");
    getTodos();
  }

  async function deleteTodo(id) {

    await supabase
      .from("todos")
      .delete()
      .eq("id", id);

    getTodos();
  }

  async function toggleComplete(todo) {

    await supabase
      .from("todos")
      .update({
        completed: !todo.completed
      })
      .eq("id", todo.id);

    getTodos();
  }

  // ======================
  // LOADING
  // ======================

  if (loading)
    return <div className="p-10">Loading...</div>;

  // ======================
  // LOGIN UI
  // ======================

  if (!session)
    return (

      <div className="flex min-h-screen items-center justify-center bg-gray-100">

        <div className="w-80 bg-white p-6 rounded-xl shadow">

          <h1 className="mb-4 text-xl font-bold">
            Login
          </h1>

          <input
            placeholder="Email"
            className="mb-3 w-full border p-2 rounded"
            onChange={(e) =>
              setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            className="mb-3 w-full border p-2 rounded"
            onChange={(e) =>
              setPassword(e.target.value)}
          />

          <button
            onClick={signIn}
            className="w-full bg-indigo-600 text-white p-2 rounded mb-2">
            Sign In
          </button>

          <button
            onClick={signUp}
            className="w-full bg-gray-600 text-white p-2 rounded">
            Sign Up
          </button>

        </div>

      </div>
    );

  // ======================
  // MAIN UI
  // ======================

  return (

    <div className="max-w-md mx-auto p-4">

      {/* Header */}
      <div className="flex justify-between mb-4">

        <h1 className="text-xl font-bold">
          My Todos
        </h1>

        <button
          onClick={signOut}
          className="bg-red-500 text-white px-3 py-1 rounded">
          Logout
        </button>

      </div>

      {/* Add */}
      <div className="flex gap-2 mb-4">

        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="flex-1 border p-2 rounded"
          placeholder="Add todo"
        />

        <button
          onClick={addTodo}
          className="bg-green-600 text-white px-4 rounded">
          Add
        </button>

      </div>

      {/* Search with icon */}
      <div className="relative mb-4">

        <Search
          size={18}
          className="absolute left-3 top-3 text-gray-400"
        />

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search todos..."
          className="w-full border pl-10 p-2 rounded"
        />

      </div>

      {/* Filter buttons */}
      <div className="flex gap-2 mb-4">

        <button
          onClick={() => setFilter("all")}
          className={`px-3 py-1 rounded ${
            filter === "all"
              ? "bg-indigo-600 text-white"
              : "bg-gray-200"
          }`}>
          All
        </button>

        <button
          onClick={() => setFilter("completed")}
          className={`px-3 py-1 rounded ${
            filter === "completed"
              ? "bg-indigo-600 text-white"
              : "bg-gray-200"
          }`}>
          Completed
        </button>

        <button
          onClick={() => setFilter("pending")}
          className={`px-3 py-1 rounded ${
            filter === "pending"
              ? "bg-indigo-600 text-white"
              : "bg-gray-200"
          }`}>
          Pending
        </button>

      </div>

      {/* Todo List */}
      <div className="space-y-2">

        {todos.map(todo => (

          <div
            key={todo.id}
            className="flex justify-between bg-white p-3 rounded shadow">

            <div className="flex gap-2">

              <input
                type="checkbox"
                checked={todo.completed}
                onChange={() =>
                  toggleComplete(todo)}
              />

              <span className={
                todo.completed
                  ? "line-through text-gray-400"
                  : ""
              }>
                {todo.text}
              </span>

            </div>

            <button
              onClick={() =>
                deleteTodo(todo.id)}
              className="text-red-500">
              Delete
            </button>

          </div>

        ))}

      </div>

    </div>
  );
}

export default App;
