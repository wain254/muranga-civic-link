import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-muranga-green text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-2 flex justify-between items-center">
        
        <Link to="/" className="flex items-center gap-3">
          <img src="/logo.png" alt="Logo" className="h-12 w-auto bg-white rounded p-1" />
          <div>
            <h1 className="font-bold text-lg leading-tight uppercase tracking-wide">Murang'a County</h1>
            <p className="text-xs text-muranga-light font-semibold tracking-widest">CIVIC LINK SYSTEM</p>
          </div>
        </Link>

        <div className="flex items-center gap-4 text-sm font-medium">
          {user ? (
            <>
              <span>Hello, {user.full_name}</span>
              
              {/* SPLIT THE DASHBOARDS HERE */}
              {user.role === 'admin' ? (
                <Link to="/admin" className="hover:text-muranga-gold transition">Admin Dashboard</Link>
              ) : user.role === 'officer' ? (
                <Link to="/officer" className="hover:text-muranga-gold transition">Officer Dashboard</Link>
              ) : (
                <Link to="/dashboard" className="hover:text-muranga-gold transition">My Dashboard</Link>
              )}

              <button onClick={handleLogout} className="bg-red-700 px-4 py-1.5 rounded hover:bg-red-800 transition shadow">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="hover:text-muranga-gold transition">Login</Link>
              <Link to="/register" className="bg-white text-muranga-green px-4 py-1.5 rounded font-bold hover:bg-muranga-light transition shadow">
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}