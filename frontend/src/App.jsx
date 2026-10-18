import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import CitizenDashboard from './pages/CitizenDashboard';
import AdminDashboard from './pages/AdminDashboard';
import OfficerDashboard from './pages/OfficerDashboard'; // <--- Make sure this file exists!
import SupportBubble from './components/SupportBubble';
import NotificationBubble from './components/NotificationBubble';

function AppContent() {
  const location = useLocation();
  
  // Check if we are on a page where the floating bubbles should be hidden
  const hideBubbles = location.pathname === '/admin' || location.pathname === '/officer';

  return (
    <>
      <Navbar />
      
      {/* Only show bubbles if NOT on the Admin or Officer page */}
      {!hideBubbles && (
        <>
          <NotificationBubble />
          <SupportBubble />
        </>
      )}

      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Citizen Route */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <CitizenDashboard />
            </ProtectedRoute>
          } 
        />
        
        {/* Admin Route */}
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute adminOnly>
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />

        {/* Department Officer Route */}
        <Route 
          path="/officer" 
          element={
            <ProtectedRoute>
              <OfficerDashboard />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AuthProvider>
  );
}