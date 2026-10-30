export const STATUSES = [
  { value: 'pending', label: 'Pending' },
  { value: 'in-progress', label: 'In progress' },
  { value: 'completed', label: 'Completed' },
];
export const statusLabel = (v) => STATUSES.find((s) => s.value === v)?.label || v;
