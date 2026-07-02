import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import MainLayout from './layouts/MainLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import Queues from './pages/Queues';
import Jobs from './pages/Jobs';
import Workers from './pages/Workers';
import Analytics from './pages/Analytics';
import Logs from './pages/Logs';
import DeadLetterQueue from './pages/DeadLetterQueue';
import Settings from './pages/Settings';
import CreateJob from './pages/CreateJob';
import CreateQueue from './pages/CreateQueue';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Auth pages — standalone, no sidebar */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* All dashboard pages */}
          <Route element={<MainLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/queues" element={<Queues />} />
            <Route path="/queues/new" element={<CreateQueue />} />
            <Route path="/jobs" element={<Jobs />} />
            <Route path="/jobs/new" element={<CreateJob />} />
            <Route path="/workers" element={<Workers />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/logs" element={<Logs />} />
            <Route path="/dlq" element={<DeadLetterQueue />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
