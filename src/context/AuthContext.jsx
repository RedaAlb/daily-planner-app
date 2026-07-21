import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginWithGoogle, logoutUser, subscribeToAuthChanges } from '../utils/Firebase';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const authorizedEmail = (process.env.REACT_APP_AUTHORIZED_EMAIL || "").trim().toLowerCase();
  
  // Authorized if no specific email constraint is configured OR if user's email matches the configured authorized email
  const isAuthorized = user ? (
    authorizedEmail === "" || user.email?.toLowerCase() === authorizedEmail
  ) : false;

  const login = async () => {
    try {
      const loggedInUser = await loginWithGoogle();
      if (loggedInUser) {
        window.location.reload();
      }
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const logout = async () => {
    try {
      await logoutUser();
      window.location.reload();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthorized, loading, login, logout }}>
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

export default AuthContext;
