import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Feed from './pages/Feed';
import Profile from './pages/Profile';
import Connections from './pages/Connections';
import Notifications from './pages/Notifications';
import Search from './pages/Search';
import AdminDashboard from './pages/AdminDashboard';
import CodeRoom from './pages/CodeRoom';
import PortfolioGenerator from './pages/PortfolioGenerator';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  return children;
};

const AdminRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (user.role !== 'admin') return <Navigate to="/" />;
  return children;
};

function App() {
  const { user } = useContext(AuthContext);

  return (
    <Router>
      <div className="min-h-screen bg-slate-50 flex flex-col">
        {user && <Navbar />}
        <div className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
            <Route path="/register" element={!user ? <Register /> : <Navigate to="/" />} />
            
            <Route path="/" element={<ProtectedRoute><Feed /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/connections" element={<ProtectedRoute><Connections /></ProtectedRoute>} /> 
            <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} /> 
            <Route path="/search" element={<ProtectedRoute><Search /></ProtectedRoute>} /> 
            <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} /> 
            <Route path="/room/:roomId" element={<ProtectedRoute><CodeRoom /></ProtectedRoute>} />
            <Route path="/portfolio" element={<ProtectedRoute><PortfolioGenerator /></ProtectedRoute>} />
            
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
