import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import DonorDashboard from './pages/DonorDashboard';
import NewDonation from './pages/NewDonation';
import VolunteerDashboard from './pages/VolunteerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import DonationDetail from './pages/DonationDetail';
import Profile from './pages/Profile';

import './App.css';

// Redirect logged-in users away from auth pages
const PublicOnly = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) {
    if (user.role === 'donor') return <Navigate to="/donor" replace />;
    if (user.role === 'volunteer') return <Navigate to="/volunteer" replace />;
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
  }
  return children;
};

function AppRoutes() {
  return (
    <div className="app">
      <Navbar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />

          <Route
            path="/login"
            element={
              <PublicOnly>
                <Login />
              </PublicOnly>
            }
          />
          <Route
            path="/register"
            element={
              <PublicOnly>
                <Register />
              </PublicOnly>
            }
          />

          {/* Donor routes */}
          <Route
            path="/donor"
            element={
              <ProtectedRoute allowedRoles={['donor', 'admin']}>
                <DonorDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/donor/new"
            element={
              <ProtectedRoute allowedRoles={['donor', 'admin']}>
                <NewDonation />
              </ProtectedRoute>
            }
          />

          {/* Volunteer routes */}
          <Route
            path="/volunteer"
            element={
              <ProtectedRoute allowedRoles={['volunteer', 'admin']}>
                <VolunteerDashboard />
              </ProtectedRoute>
            }
          />

          {/* Admin routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Shared */}
          <Route
            path="/donations/:id"
            element={
              <ProtectedRoute>
                <DonationDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;
