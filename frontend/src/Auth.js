import React, { useState } from 'react';
import service from './service.js';

// Login page and Register page (switches between the two)
function Auth({ onLogin }) {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      if (isRegister)
        await service.register(username, password);
      else
        await service.login(username, password);
      onLogin();
    } catch (err) {
      const status = err.response?.status;
      if (status === 401) setError("Wrong username or password");
      else if (status === 409) setError("Username already exists");
      else if (status === 400) setError("Please fill in username and password");
      else setError("Something went wrong, please try again");
    }
  }

  function switchMode() {
    setIsRegister(!isRegister);
    setError("");
  }

  // .footer in index.css has an absolute ::before layer that covers its content,
  // so the buttons need position + zIndex to be clickable
  const btn = { position: "relative", zIndex: 1, cursor: "pointer", padding: "4px 10px",
    border: "1px solid #ccc", borderRadius: 3 };

  return (
    <section className="todoapp">
      <header className="header">
        <h1>{isRegister ? "register" : "login"}</h1>
        <form onSubmit={handleSubmit}>
          <input className="new-todo" placeholder="Username" value={username}
            onChange={(e) => setUsername(e.target.value)} autoFocus />
          <input className="new-todo" type="password" placeholder="Password" value={password}
            onChange={(e) => setPassword(e.target.value)} />
          <button type="submit" style={{ display: "none" }} />
        </form>
      </header>
      <footer className="footer" style={{ display: "block", textAlign: "center", height: "auto" }}>
        {error && <div style={{ position: "relative", zIndex: 1, color: "#c0392b", marginBottom: 8 }}>{error}</div>}
        <button type="button" onClick={handleSubmit} style={{ ...btn, marginRight: 16 }}>
          {isRegister ? "Create account" : "Log in"}
        </button>
        <button type="button" onClick={switchMode} style={{ ...btn, border: 0, textDecoration: "underline" }}>
          {isRegister ? "Already have an account? Log in" : "New user? Register"}
        </button>
      </footer>
    </section>
  );
}

export default Auth;
