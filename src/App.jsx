
import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient';
import './App.css'

function App() {
  const [todos,setTodos]= useState([]);
  const [text,setText] = useState("");
  async function getTodos() {
    const {data,error} = await supabase
      .from("todos")
      .select("*")
      .order("id",{ascending:false});

    if(!error) setTodos(data);
  }
  useEffect(()=>{
    getTodos();
  },[]);

  async function addTodo() {
    if(!text) return;
    await supabase
      .from("todos")
      .insert([{text}]);
    setText("");
    getTodos();
  }

  async function deletTodo(id) {
    await supabase
      .from("todos")
      .delete()
      .eq("id",id);
    getTodos();
  }

  return (
    <div>
      <h1>Supabase Todo App</h1>
    </div>
  )
}

export default App
