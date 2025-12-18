
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, isOfflineMode } from './services/firebase';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Accounts from './components/Accounts';
import Transactions from './components/Transactions';
import Analysis from './components/Analysis';
import AuthView from './components/Auth';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOfflineMode) {
      setLoading(false);
      return;
    }

    if (auth) {
      const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        setUser(currentUser);
        setLoading(false);
      });
      return () => unsubscribe();
    }
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent mx-auto"></div>
          <p className="text-slate-600 font-medium">載入中，請稍候...</p>
        </div>
      </div>
    );
  }

  // Demo user if offline
  const currentUser = isOfflineMode ? ({ email: 'demo@example.com', uid: 'demo' } as User) : user;

  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={!currentUser ? <AuthView /> : <Navigate to="/" />} />
        
        <Route path="/" element={currentUser ? <Layout user={currentUser} /> : <Navigate to="/login" />}>
          <Route index element={<Dashboard user={currentUser} />} />
          <Route path="accounts" element={<Accounts user={currentUser} />} />
          <Route path="transactions" element={<Transactions user={currentUser} />} />
          <Route path="analysis" element={<Analysis user={currentUser} />} />
        </Route>

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </HashRouter>
  );
};

export default App;
