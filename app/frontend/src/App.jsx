import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { OSProvider, useOS } from './context/OSContext';
import Desktop from './pages/Desktop';
import LoginPage from './pages/LoginPage';
import BootScreen from './components/BootScreen';

function AppRoutes() {
  const { state } = useOS();
  if (!state.token && !state.isAuthenticated) return <LoginPage />;
  return <Desktop />;
}

export default function App() {
  return (
    <OSProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/*" element={<AppRoutes />} />
        </Routes>
      </BrowserRouter>
    </OSProvider>
  );
}
