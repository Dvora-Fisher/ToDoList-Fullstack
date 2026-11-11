import React, { useEffect, useState } from 'react';
import service from './service.js';
import Auth from './Auth.js';

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
    await service.addTask(newTodo);
    setNewTodo("");//clear input
    await getTodos();//refresh tasks list (in order to see the new one)
  }

  async function updateCompleted(todo, isComplete) {
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

  return (
    <section className="todoapp">
      <header className="header">
        <h1>todos</h1>
        <form onSubmit={createTodo}>
          <input className="new-todo" placeholder="Well, let's take on the day" value={newTodo} onChange={(e) => setNewTodo(e.target.value)} />
        </form>
      </header>
      <section className="main" style={{ display: "block" }}>
        <ul className="todo-list">
          {todos.map(todo => {
            return (
              <li className={todo.isComplete ? "completed" : ""} key={todo.id}>
                <div className="view">
                  <input className="toggle" type="checkbox" defaultChecked={todo.isComplete} onChange={(e) => updateCompleted(todo, e.target.checked)} />
                  <label>{todo.name}</label>
                  <button className="destroy" onClick={() => deleteTodo(todo.id)}></button>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
      <footer className="footer" style={{ display: "block", textAlign: "center" }}>
        <button onClick={logout} style={{ position: "relative", zIndex: 1, cursor: "pointer" }}>Log out</button>
      </footer>
    </section >
  );
}

export default App;