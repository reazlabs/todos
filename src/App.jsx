import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Trash2, Edit, Plus, LogOut } from "lucide-react";

const PAGE_SIZE = 5;

export default function App() {

  // ================= AUTH =================

  const [session, setSession] = useState(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(true);

  // ================= TODOS =================

  const [todos, setTodos] = useState([]);

  const [newTodo, setNewTodo] = useState("");

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [filter, setFilter] = useState("all");

  const [page, setPage] = useState(1);
  const [count, setCount] = useState(0);

  const [editTodo, setEditTodo] = useState(null);
  const [editText, setEditText] = useState("");

  const totalPages = Math.ceil(count / PAGE_SIZE);

  // ================= AUTH LOAD =================

  useEffect(() => {

    supabase.auth.getSession().then(({ data }) => {

      setSession(data.session);
      setLoading(false);

    });

    const { data: listener } =
      supabase.auth.onAuthStateChange((_event, session) => {

        setSession(session);

      });

    return () => listener.subscription.unsubscribe();

  }, []);

  // ================= SEARCH DEBOUNCE =================

  useEffect(() => {

    const timer = setTimeout(() => {

      setDebouncedSearch(search);
      setPage(1);

    }, 400);

    return () => clearTimeout(timer);

  }, [search]);

  // ================= FETCH TODOS =================

  async function fetchTodos() {

    if (!session?.user) return;

    let query = supabase
      .from("todos")
      .select("*", { count: "exact" })
      .eq("user_id", session.user.id);

    if (debouncedSearch)
      query = query.ilike("text", `%${debouncedSearch}%`);

    if (filter === "completed")
      query = query.eq("completed", true);

    if (filter === "pending")
      query = query.eq("completed", false);

    query = query
      .order("id", { ascending: false })
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

    const { data, count } = await query;

    setTodos(data || []);
    setCount(count || 0);

  }

  useEffect(() => {

    fetchTodos();

  }, [session, debouncedSearch, filter, page]);

  // ================= AUTH =================

  async function signUp() {

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) alert(error.message);
    else alert("Signup successful");

  }

  async function signIn() {

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) alert(error.message);

  }

  async function signOut() {

    await supabase.auth.signOut();

  }

  // ================= ADD =================

  async function addTodo() {

    if (!newTodo.trim()) return;

    const { error } = await supabase
      .from("todos")
      .insert({

        text: newTodo,
        completed: false,
        user_id: session.user.id,

      });

    if (error) alert(error.message);

    setNewTodo("");

    fetchTodos();

  }

  // ================= DELETE =================

  async function deleteTodo(id) {

    await supabase
      .from("todos")
      .delete()
      .eq("id", id)
      .eq("user_id", session.user.id);

    fetchTodos();

  }

  // ================= TOGGLE =================

  async function toggleTodo(todo) {

    await supabase
      .from("todos")
      .update({
        completed: !todo.completed,
      })
      .eq("id", todo.id);

    fetchTodos();

  }

  // ================= EDIT =================

  function openEdit(todo) {

    setEditTodo(todo);
    setEditText(todo.text);

  }

  async function updateTodo() {

    await supabase
      .from("todos")
      .update({
        text: editText,
      })
      .eq("id", editTodo.id);

    setEditTodo(null);

    fetchTodos();

  }

  // ================= LOADING =================

  if (loading)
    return (
      <div className="flex h-screen justify-center items-center">
        Loading...
      </div>
    );

  // ================= LOGIN UI =================

  if (!session)
    return (

      <div className="h-screen flex justify-center items-center bg-gray-100">

        <div className="bg-white p-6 rounded-xl w-80 shadow">

          <h1 className="text-xl font-bold mb-4 text-center">

            Login

          </h1>

          <input
            placeholder="Email"
            className="border p-2 w-full mb-2 rounded"
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            placeholder="Password"
            type="password"
            className="border p-2 w-full mb-3 rounded"
            onChange={(e) => setPassword(e.target.value)}
          />

          <div className="flex gap-2">

            <button
              onClick={signIn}
              className="bg-blue-500 text-white flex-1 p-2 rounded"
            >
              Login
            </button>

            <button
              onClick={signUp}
              className="bg-green-500 text-white flex-1 p-2 rounded"
            >
              Signup
            </button>

          </div>

        </div>

      </div>

    );

  // ================= MAIN UI =================

  return (

    <div className="min-h-screen bg-gray-100 flex justify-center p-4">

      <div className="w-full max-w-md">

        {/* Header */}

        <div className="flex justify-between items-center mb-3">

          <h1 className="text-xl font-bold">

            My Todo

          </h1>

          <LogOut
            onClick={signOut}
            className="cursor-pointer"
          />

        </div>

        {/* Add */}

        <div className="flex gap-2 mb-3">

          <input
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            placeholder="New todo"
            className="flex-1 border p-2 rounded"
          />

          <button
            onClick={addTodo}
            className="bg-blue-500 text-white px-3 rounded"
          >

            <Plus size={18}/>

          </button>

        </div>

        {/* Search */}

        <div className="relative mb-3">

          <Search
            size={18}
            className="absolute top-3 left-3 text-gray-400"
          />

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search"
            className="w-full pl-10 p-2 border rounded"
          />

        </div>

        {/* Filter */}

        <div className="flex gap-2 mb-3">

          {["all","completed","pending"].map(f => (

            <button
              key={f}
              onClick={() => {
                setFilter(f);
                setPage(1);
              }}
              className={`flex-1 p-2 rounded ${
                filter === f
                  ? "bg-blue-500 text-white"
                  : "bg-white border"
              }`}
            >

              {f}

            </button>

          ))}

        </div>

        {/* List */}

        <AnimatePresence>

          {todos.map(todo => (

            <motion.div
              key={todo.id}
              initial={{ opacity:0, y:10 }}
              animate={{ opacity:1, y:0 }}
              exit={{ opacity:0 }}
              className="bg-white p-3 mb-2 rounded flex justify-between"
            >

              <div
                onClick={() => toggleTodo(todo)}
                className="cursor-pointer flex-1"
              >

                <span
                  className={
                    todo.completed
                      ? "line-through text-gray-400"
                      : ""
                  }
                >

                  {todo.text}

                </span>

              </div>

              <div className="flex gap-2">

                <Edit
                  size={18}
                  onClick={() => openEdit(todo)}
                  className="cursor-pointer"
                />

                <Trash2
                  size={18}
                  onClick={() => deleteTodo(todo.id)}
                  className="cursor-pointer text-red-500"
                />

              </div>

            </motion.div>

          ))}

        </AnimatePresence>

        {/* Pagination */}

        <div className="flex justify-center gap-3 mt-3">

          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >

            Prev

          </button>

          <span>

            {page} / {totalPages || 1}

          </span>

          <button
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
          >

            Next

          </button>

        </div>

      </div>

      {/* Edit Modal */}

      {editTodo && (

        <div className="fixed inset-0 bg-black/30 flex justify-center items-center">

          <div className="bg-white p-4 rounded w-80">

            <input
              value={editText}
              onChange={(e) =>
                setEditText(e.target.value)
              }
              className="border p-2 w-full mb-2"
            />

            <div className="flex justify-end gap-2">

              <button onClick={() =>
                setEditTodo(null)
              }>
                Cancel
              </button>

              <button
                onClick={updateTodo}
                className="bg-blue-500 text-white px-3 py-1 rounded"
              >
                Save
              </button>

            </div>

          </div>

        </div>

      )}

    </div>

  );

}
