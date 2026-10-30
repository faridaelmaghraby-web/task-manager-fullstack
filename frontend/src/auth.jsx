import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, getToken, setToken, setUnauthorizedHandler } from './api.js';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(Boolean(getToken()));

  const logout = useCallback(() => { setToken(null); setUser(null); }, []);

  useEffect(() => {
    setUnauthorizedHandler(logout);
    if (!getToken()) return;
    api.me()
      .then((r) => setUser(r.user || r.data))
      .catch(() => setToken(null))
      .finally(() => setBooting(false));
  }, [logout]);

  const authenticate = useCallback(async (mode, payload) => {
    const r = await api[mode](payload);
    setToken(r.token);
    setUser(r.user);
  }, []);

  const value = useMemo(() => ({ user, booting, authenticate, logout }), [user, booting, authenticate, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
