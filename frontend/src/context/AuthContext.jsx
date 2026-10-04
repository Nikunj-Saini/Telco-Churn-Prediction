import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

const DEMO_ACCOUNTS = [
  { id: 1, username: 'admin', full_name: 'Admin User', role: 'admin', email: 'admin@company.com' },
  { id: 2, username: 'john', full_name: 'John Doe', role: 'user', email: 'john@company.com' },
  { id: 3, username: 'sarah', full_name: 'Sarah Smith', role: 'user', email: 'sarah@company.com' }
];

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('roi_portal_user');
      if (savedUser) {
        return JSON.parse(savedUser);
      }
    } catch (e) {
      console.error('Error parsing stored user:', e);
    }
    // Default initial user: Admin
    return DEMO_ACCOUNTS[0];
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('roi_portal_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('roi_portal_user');
    }
  }, [user]);

  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

  const login = async (username, password) => {
    try {
      const response = await fetch(`${apiBaseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Login failed');
      }
      setUser(data.user);
      return data;
    } catch (err) {
      throw err;
    }
  };

  const register = async (username, email, password, full_name) => {
    try {
      const response = await fetch(`${apiBaseUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password, full_name })
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Registration failed');
      }
      setUser(data.user);
      return data;
    } catch (err) {
      throw err;
    }
  };

  const loginAsDemo = (accountOrId) => {
    let target = null;
    if (typeof accountOrId === 'number' || typeof accountOrId === 'string') {
      target = DEMO_ACCOUNTS.find(a => a.id === Number(accountOrId) || a.username === accountOrId);
    } else {
      target = accountOrId;
    }
    if (target) {
      setUser(target);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('roi_portal_user');
  };

  // Helper method to attach x-user-id header to any fetch options
  const getAuthHeaders = (extraHeaders = {}) => {
    const headers = { ...extraHeaders };
    if (user?.id) {
      headers['x-user-id'] = String(user.id);
    }
    return headers;
  };

  const authFetch = async (url, options = {}) => {
    const headers = getAuthHeaders(options.headers || {});
    return fetch(url, {
      ...options,
      headers
    });
  };

  const isOwnerOrAdmin = (project) => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    if (!project) return true; // new project creation
    return Number(project.created_by_user_id) === Number(user.id);
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      register,
      loginAsDemo,
      logout,
      getAuthHeaders,
      authFetch,
      isOwnerOrAdmin,
      DEMO_ACCOUNTS
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
