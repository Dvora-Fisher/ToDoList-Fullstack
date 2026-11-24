import React, { useEffect, useState } from 'react';
import service from './service.js';
import Auth from './Auth.js';
import { Brand, CheckIcon, TrashIcon } from './ui.js';

function App() {
  const [loggedIn, setLoggedIn] = useState(service.isLoggedIn());
  const [newTodo, setNewTodo] = useState("");
  const [todos, setTodos] = useState([]);

  async function getTodos() {
    const todos = await service.getTasks();
    setTodos(todos);
  }

  async function createTodo(e) {
    e.preventDefault();
    if (!newTodo.trim()) return;
    await service.addTask(newTodo.trim());
    setNewTodo("");//clear input
    await getTodos();//refresh tasks list (in order to see the new one)
  }

  async function updateCompleted(todo) {
    await service.setCompleted(todo.id);
    await getTodos();//refresh tasks list (in order to see the updated one)
  }

  async function deleteTodo(id) {
    await service.deleteTask(id);
    await getTodos();//refresh tasks list
  }

  function logout() {
    service.logout();
    setTodos([]);
    setLoggedIn(false);
  }

  useEffect(() => {
    if (loggedIn)
      getTodos();
  }, [loggedIn]);

  if (!loggedIn)
    return <Auth onLogin={() => setLoggedIn(true)} />;

  const doneCount = todos.filter(t => t.isComplete).length;
  const percent = todos.length ? Math.round(doneCount / todos.length * 100) : 0;
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  return (
    <main className="shell">
      <div className="topbar">
        <Brand />
        <button className="btn-ghost" onClick={logout}>Log out</button>
      </div>

      <section className="hero">
        <h1>My tasks</h1>
        <p>{today} · {todos.length ? `${doneCount} of ${todos.length} done` : "Nothing planned yet"}</p>
      </section>

      <div className="progress" aria-hidden="true"><div style={{ width: `${percent}%` }} /></div>

      <section className="card">
        <form className="new-task" onSubmit={createTodo}>
          <input className="input" placeholder="Add a task and press Enter…" value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)} autoFocus />
          <button className="btn-add" type="submit" disabled={!newTodo.trim()}>Add</button>
        </form>

        {todos.length === 0 ? (
          <div className="empty">
            <div className="empty-icon"><CheckIcon size={26} /></div>
            <strong>You're all clear</strong>
            Add your first task above to get started.
          </div>
        ) : (
          <ul className="task-list">
            {todos.map(todo => (
              <li className={`task${todo.isComplete ? " done" : ""}`} key={todo.id}>
                <input className="check" type="checkbox" checked={!!todo.isComplete}
                  onChange={() => updateCompleted(todo)} aria-label={`Mark "${todo.name}" as done`} />
                <span className="task-name">{todo.name}</span>
                <button className="btn-delete" onClick={() => deleteTodo(todo.id)} aria-label={`Delete "${todo.name}"`}>
                  <TrashIcon />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

export default App;
