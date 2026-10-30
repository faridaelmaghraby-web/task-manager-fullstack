import { useState } from 'react';
import Modal from './Modal.jsx';
import { STATUSES } from '../constants.js';

export default function TaskForm({ task, onSave, onClose }) {
  const [form, setForm] = useState({
    title: task?.title || '',
    description: task?.description || '',
    status: task?.status || 'pending',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    const fe = {};
    const t = form.title.trim();
    if (t.length < 3 || t.length > 100) fe.title = 'Title must be 3–100 characters.';
    if (form.description.length > 1000) fe.description = 'Description is limited to 1000 characters.';
    setFieldErrors(fe);
    if (Object.keys(fe).length) return;

    setSaving(true);
    setError('');
    try {
      await onSave({ ...form, title: t });
    } catch (err) {
      const server = {};
      (err.errors || []).forEach((x) => { if (x.field) server[x.field] = x.message; });
      setFieldErrors(server);
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <Modal title={task ? 'Edit task' : 'New task'} onClose={onClose}>
      <form onSubmit={submit} noValidate>
        {error && <div className="banner error" role="alert">{error}</div>}
        <label className="field">
          <span>Title</span>
          <input autoFocus value={form.title} onChange={set('title')} placeholder="e.g. Finish the project report" />
          {fieldErrors.title && <em>{fieldErrors.title}</em>}
        </label>
        <label className="field">
          <span>Description <small>(optional)</small></span>
          <textarea rows="4" value={form.description} onChange={set('description')} placeholder="Add a few details…" />
          {fieldErrors.description && <em>{fieldErrors.description}</em>}
        </label>
        <label className="field">
          <span>Status</span>
          <select value={form.status} onChange={set('status')}>
            {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </label>
        <div className="modal-actions">
          <button type="button" className="btn" onClick={onClose}>Cancel</button>
          <button className="btn primary" disabled={saving}>
            {saving && <span className="spinner" />}
            {task ? 'Save changes' : 'Add task'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
