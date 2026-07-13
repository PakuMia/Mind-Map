import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { supabase } from './lib/supabaseClient.js';

export default function Auth() {
  const [mode, setMode] = useState('sign-in'); // 'sign-in' | 'sign-up'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState(null); // { kind: 'error'|'info', text }
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setStatus(null);
    const action = mode === 'sign-in' ? supabase.auth.signInWithPassword({ email, password }) : supabase.auth.signUp({ email, password });
    const { error } = await action;
    setBusy(false);
    if (error) {
      setStatus({ kind: 'error', text: error.message });
      return;
    }
    if (mode === 'sign-up') {
      setStatus({ kind: 'info', text: 'Account created — you can sign in now.' });
      setMode('sign-in');
    }
  }

  return (
    <div className="auth-screen">
      <form className="auth-card" onSubmit={handleSubmit}>
        <div className="brand">
          <div className="logo">
            <Sparkles size={18} />
          </div>
          <div>
            <strong>Kaj Kam</strong>
            <span>Mind Map</span>
          </div>
        </div>
        <h2>{mode === 'sign-in' ? 'Sign in' : 'Create an account'}</h2>
        <p className="sub">Your boards sync to your account and follow you to any device.</p>

        <label>
          <span>Email</span>
          <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label>
          <span>Password</span>
          <input
            type="password"
            required
            minLength={6}
            autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>

        {status && <p className={`auth-status ${status.kind}`}>{status.text}</p>}

        <button className="primary" type="submit" disabled={busy}>
          {busy ? 'Please wait…' : mode === 'sign-in' ? 'Sign in' : 'Sign up'}
        </button>

        <button
          type="button"
          className="auth-switch"
          onClick={() => {
            setMode((m) => (m === 'sign-in' ? 'sign-up' : 'sign-in'));
            setStatus(null);
          }}
        >
          {mode === 'sign-in' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
        </button>
      </form>
    </div>
  );
}
