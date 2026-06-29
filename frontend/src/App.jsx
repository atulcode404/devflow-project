import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { lazy, Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import Navbar from './components/Navbar';

// Lazy load pages for better performance
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Feed = lazy(() => import('./pages/Feed'));
const DeveloperFeed = lazy(() => import('./pages/DeveloperFeed'));
const Profile = lazy(() => import('./pages/Profile'));
const DeveloperProfile = lazy(() => import('./pages/DeveloperProfile'));
const Connections = lazy(() => import('./pages/Connections'));
const Network = lazy(() => import('./pages/Network'));
const Notifications = lazy(() => import('./pages/Notifications'));
const Search = lazy(() => import('./pages/Search'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const CodeRoom = lazy(() => import('./pages/CodeRoom'));
const PortfolioGenerator = lazy(() => import('./pages/PortfolioGenerator'));

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
  if (user.role !== 'admin' && user.role !== 'master_admin') {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)] bg-slate-950 text-slate-400">
        <h2 className="text-xl font-bold">You are not authorized to access this page.</h2>
      </div>
    );
  }
  return children;
};

const PageLoader = () => (
  <div className="flex h-[calc(100vh-4rem)] items-center justify-center bg-slate-950">
    <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
  </div>
);

function App() {
  const { user } = useContext(AuthContext);

  return (
    <Router>
      <SocketProvider>
        <div className="min-h-screen bg-slate-50 flex flex-col">
          {user && <Navbar />}
          <div className="flex-1 overflow-y-auto">
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
                <Route path="/register" element={!user ? <Register /> : <Navigate to="/" />} />
                
                <Route path="/" element={<ProtectedRoute><DeveloperFeed /></ProtectedRoute>} />
                <Route path="/developer/:identifier" element={<ProtectedRoute><DeveloperProfile /></ProtectedRoute>} />
                <Route path="/profile/:identifier" element={<ProtectedRoute><DeveloperProfile /></ProtectedRoute>} />
                <Route path="/network" element={<ProtectedRoute><Network /></ProtectedRoute>} />
                <Route path="/projects" element={<ProtectedRoute><Feed /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                <Route path="/connections" element={<ProtectedRoute><Connections /></ProtectedRoute>} /> 
                <Route path="/messages/:userId" element={<ProtectedRoute><Connections /></ProtectedRoute>} /> 
                <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} /> 
                <Route path="/search" element={<ProtectedRoute><Search /></ProtectedRoute>} /> 
                <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} /> 
                <Route path="/room/:roomId" element={<ProtectedRoute><CodeRoom /></ProtectedRoute>} />
                <Route path="/portfolio" element={<ProtectedRoute><PortfolioGenerator /></ProtectedRoute>} />
                
              </Routes>
            </Suspense>
          </div>
        </div>
      </SocketProvider>
    </Router>
  );
}

export default App;
