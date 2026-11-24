import React, { useState } from 'react';
import service from './service.js';
import { Brand } from './ui.js';

// Login page and Register page (switches between the two)
function Auth({ onLogin }) {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
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
    } finally {
      setBusy(false);
    }
  }

  function switchMode() {
    setIsRegister(!isRegister);
    setError("");
  }

  return (
    <main className="shell auth">
      <Brand />
      <section className="card">
        <h1>{isRegister ? "Create your account" : "Welcome back"}</h1>
        <p className="subtitle">
          {isRegister ? "Start organizing your day in seconds." : "Log in to see your tasks."}
        </p>

        <form onSubmit={handleSubmit}>
          {error && <p className="error" role="alert">{error}</p>}
          <label className="field">
            <span>Username</span>
            <input className="input" placeholder="Your username" value={username} autoComplete="username"
              onChange={(e) => setUsername(e.target.value)} autoFocus />
          </label>
          <label className="field">
            <span>Password</span>
            <input className="input" type="password" placeholder="••••••••" value={password}
              autoComplete={isRegister ? "new-password" : "current-password"}
              onChange={(e) => setPassword(e.target.value)} />
          </label>
          <button className="btn-primary" type="submit" disabled={busy}>
            {busy ? "Please wait…" : isRegister ? "Create account" : "Log in"}
          </button>
        </form>

        <p className="switch">
          {isRegister ? "Already have an account? " : "New here? "}
          <button type="button" className="link" onClick={switchMode}>
            {isRegister ? "Log in" : "Create an account"}
          </button>
        </p>
      </section>
    </main>
  );
}

export default Auth;
