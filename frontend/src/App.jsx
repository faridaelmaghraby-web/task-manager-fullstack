import { useEffect, useState } from 'react';
import { useAuth } from './auth.jsx';
import AuthPage from './pages/AuthPage.jsx';
import Dashboard from './pages/Dashboard.jsx';

// Tiny path-based router: /login, /register (public) and / (protected dashboard).
const usePath = () => {
  const [path, setPath] = useState(window.location.pathname);
  useEffect(() => {
    const onPop = () => setPath(window.location.pathname);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
  const navigate = (to) => {
    window.history.pushState({}, '', to);
    setPath(to);
  };
  return [path, navigate];
};

export default function App() {
  const { user, booting } = useAuth();
  const [path, navigate] = usePath();

  if (booting) return <div className="boot"><span className="spinner lg" aria-label="Loading" /></div>;

  if (!user) {
    const mode = path === '/register' ? 'register' : 'login';
    return <AuthPage mode={mode} navigate={navigate} />;
  }
  if (path !== '/') navigate('/');
  return <Dashboard />;
}
