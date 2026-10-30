import { useState } from 'react';
import Modal from './Modal.jsx';

export default function ConfirmDelete({ task, onConfirm, onClose }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const go = async () => {
    setBusy(true);
    try { await onConfirm(); } catch (e) { setError(e.message); setBusy(false); }
  };
  return (
    <Modal title="Delete task?" onClose={onClose}>
      {error && <div className="banner error" role="alert">{error}</div>}
      <p>“{task.title}” will be permanently removed. This cannot be undone.</p>
      <div className="modal-actions">
        <button className="btn" onClick={onClose}>Cancel</button>
        <button className="btn danger" onClick={go} disabled={busy}>
          {busy && <span className="spinner" />}Delete
        </button>
      </div>
    </Modal>
  );
}
