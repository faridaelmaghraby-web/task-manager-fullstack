import { useState } from 'react';
import { useAuth } from '../auth.jsx';
import Logo from '../components/Logo.jsx';

export default function AuthPage({ mode, navigate }) {
  const { authenticate } = useAuth();
  const isRegister = mode === 'register';
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    const fe = {};
    if (isRegister && form.name.trim().length < 2) fe.name = 'Enter your name (min 2 characters).';
    if (!/^\S+@\S+\.\S+$/.test(form.email)) fe.email = 'Enter a valid email address.';
    if (form.password.length < 6) fe.password = 'Password must be at least 6 characters.';
    setFieldErrors(fe);
    if (Object.keys(fe).length) return;

    setLoading(true);
    try {
      const payload = isRegister ? form : { email: form.email, password: form.password };
      await authenticate(isRegister ? 'register' : 'login', payload);
      navigate('/');
    } catch (err) {
      const server = {};
      (err.errors || []).forEach((x) => { if (x.field) server[x.field] = x.message; });
      setFieldErrors(server);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth">
      <aside className="auth-hero">
        <Logo light />
        <h1>Get your work out of your head.</h1>
        <p>Capture tasks, track progress and finish what matters. Simple, fast and private to you.</p>
        <ul>
          <li>Filter by status, search in a click</li>
          <li>Edit or remove tasks any time</li>
          <li>Works on phone, tablet and desktop</li>
        </ul>
      </aside>

      <section className="auth-panel">
        <form className="card auth-card" onSubmit={submit} noValidate>
          <h2>{isRegister ? 'Create your account' : 'Welcome back'}</h2>
          <p className="muted">{isRegister ? 'It takes less than a minute.' : 'Log in to see your tasks.'}</p>

          {error && <div className="banner error" role="alert">{error}</div>}

          {isRegister && (
            <label className="field">
              <span>Name</span>
              <input value={form.name} onChange={set('name')} autoComplete="name" placeholder="Farida" />
              {fieldErrors.name && <em>{fieldErrors.name}</em>}
            </label>
          )}
          <label className="field">
            <span>Email</span>
            <input type="email" value={form.email} onChange={set('email')} autoComplete="email" placeholder="you@example.com" />
            {fieldErrors.email && <em>{fieldErrors.email}</em>}
          </label>
          <label className="field">
            <span>Password</span>
            <input type="password" value={form.password} onChange={set('password')} autoComplete={isRegister ? 'new-password' : 'current-password'} placeholder="At least 6 characters" />
            {fieldErrors.password && <em>{fieldErrors.password}</em>}
          </label>

          <button className="btn primary block" disabled={loading}>
            {loading && <span className="spinner" />}
            {loading ? 'Please wait…' : isRegister ? 'Create account' : 'Log in'}
          </button>

          <p className="switch">
            {isRegister ? 'Already have an account?' : 'New here?'}{' '}
            <a href={isRegister ? '/login' : '/register'} onClick={(e) => { e.preventDefault(); navigate(isRegister ? '/login' : '/register'); }}>
              {isRegister ? 'Log in' : 'Create an account'}
            </a>
          </p>
        </form>
      </section>
    </main>
  );
}
