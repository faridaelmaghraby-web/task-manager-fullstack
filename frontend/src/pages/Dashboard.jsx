import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import Logo from '../components/Logo.jsx';
import TaskForm from '../components/TaskForm.jsx';
import ConfirmDelete from '../components/ConfirmDelete.jsx';
import { STATUSES } from '../constants.js';

const LIMIT = 6;
const fmt = (d) => new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [stats, setStats] = useState(null);
  const [status, setStatus] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null); // null | 'new' | task
  const [deleting, setDeleting] = useState(null);
  const [toast, setToast] = useState('');
  const reqId = useRef(0);

  // debounce search
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput.trim()); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const showToast = (m) => { setToast(m); setTimeout(() => setToast(''), 2600); };

  const load = useCallback(async () => {
    const id = ++reqId.current;
    setLoading(true);
    setError('');
    try {
      const [list, st] = await Promise.all([
        api.listTasks({ status, search, page, limit: LIMIT }),
        api.stats(),
      ]);
      if (id !== reqId.current) return; // stale response
      setTasks(list.data);
      setPagination(list.pagination);
      setStats(st.data || st);
    } catch (e) {
      if (id === reqId.current) setError(e.message);
    } finally {
      if (id === reqId.current) setLoading(false);
    }
  }, [status, search, page]);

  useEffect(() => { load(); }, [load]);

  const save = async (values) => {
    if (editing === 'new') await api.createTask(values);
    else await api.updateTask(editing._id || editing.id, values);
    const wasNew = editing === 'new';
    setEditing(null);
    showToast(wasNew ? 'Task added' : 'Task updated');
    load();
  };

  const remove = async () => {
    await api.deleteTask(deleting._id || deleting.id);
    setDeleting(null);
    showToast('Task deleted');
    if (tasks.length === 1 && page > 1) setPage(page - 1); else load();
  };

  const quickStatus = async (task, next) => {
    try {
      await api.updateTask(task._id || task.id, { status: next });
      load();
    } catch (e) { showToast(e.message); }
  };

  const filtered = status || search;
  const statCards = [
    { key: '', label: 'All tasks', value: stats?.total },
    { key: 'pending', label: 'Pending', value: stats?.pending },
    { key: 'in-progress', label: 'In progress', value: stats?.['in-progress'] },
    { key: 'completed', label: 'Completed', value: stats?.completed },
  ];

  return (
    <div className="app">
      <header className="topbar">
        <Logo />
        <div className="who">
          <span className="avatar" aria-hidden="true">{user.name?.[0]?.toUpperCase()}</span>
          <span className="who-name">{user.name}</span>
          <button className="btn small" onClick={logout}>Log out</button>
        </div>
      </header>

      <main className="container">
        <div className="page-head">
          <div>
            <h1>Hi {user.name?.split(' ')[0]} 👋</h1>
            <p className="muted">Here is what’s on your plate.</p>
          </div>
          <button className="btn primary" onClick={() => setEditing('new')}>+ New task</button>
        </div>

        <section className="stats" aria-label="Task summary">
          {statCards.map((c) => (
            <button key={c.label} className={`stat ${status === c.key ? 'active' : ''}`} onClick={() => { setStatus(c.key); setPage(1); }}>
              <span className="stat-value">{c.value ?? '–'}</span>
              <span className="stat-label">{c.label}</span>
            </button>
          ))}
        </section>

        <section className="toolbar">
          <div className="search">
            <input type="search" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Search tasks by title or description…" aria-label="Search tasks" />
          </div>
          <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} aria-label="Filter by status">
            <option value="">All statuses</option>
            {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </section>

        {error && (
          <div className="banner error" role="alert">
            <span>{error}</span>
            <button className="btn small" onClick={load}>Retry</button>
          </div>
        )}

        {loading && !tasks.length ? (
          <ul className="tasks" aria-busy="true">
            {[0, 1, 2].map((i) => <li key={i} className="task card skeleton"><div /><div /><div /></li>)}
          </ul>
        ) : !error && tasks.length === 0 ? (
          <div className="empty card">
            <div className="empty-art" aria-hidden="true">✓</div>
            <h3>{filtered ? 'No tasks match your filters' : 'No tasks yet'}</h3>
            <p className="muted">{filtered ? 'Try a different search or status.' : 'Add your first task to get started.'}</p>
            {filtered
              ? <button className="btn" onClick={() => { setSearchInput(''); setStatus(''); }}>Clear filters</button>
              : <button className="btn primary" onClick={() => setEditing('new')}>+ New task</button>}
          </div>
        ) : (
          <ul className={`tasks ${loading ? 'dim' : ''}`}>
            {tasks.map((t) => (
              <li key={t._id || t.id} className="task card">
                <div className="task-main">
                  <h3>{t.title}</h3>
                  {t.description && <p>{t.description}</p>}
                  <small className="muted">Created {fmt(t.createdAt)}</small>
                </div>
                <div className="task-side">
                  <select className={`pill ${t.status}`} value={t.status} onChange={(e) => quickStatus(t, e.target.value)} aria-label={`Status of ${t.title}`}>
                    {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                  <div className="row-actions">
                    <button className="btn small" onClick={() => setEditing(t)}>Edit</button>
                    <button className="btn small danger-ghost" onClick={() => setDeleting(t)}>Delete</button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        {pagination.pages > 1 && (
          <nav className="pager" aria-label="Pagination">
            <button className="btn small" disabled={page <= 1} onClick={() => setPage(page - 1)}>← Prev</button>
            <span>Page {pagination.page} of {pagination.pages}</span>
            <button className="btn small" disabled={page >= pagination.pages} onClick={() => setPage(page + 1)}>Next →</button>
          </nav>
        )}
      </main>

      {editing && <TaskForm task={editing === 'new' ? null : editing} onSave={save} onClose={() => setEditing(null)} />}
      {deleting && <ConfirmDelete task={deleting} onConfirm={remove} onClose={() => setDeleting(null)} />}
      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}
