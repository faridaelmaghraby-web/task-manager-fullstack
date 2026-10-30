export default function Logo({ light }) {
  return (
    <div className={`logo ${light ? 'light' : ''}`}>
      <svg width="30" height="30" viewBox="0 0 32 32" aria-hidden="true">
        <rect width="32" height="32" rx="9" fill="#0E9F8E" />
        <path d="M9 16.5l4.5 4.5L23 11" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span>Taskly</span>
    </div>
  );
}
