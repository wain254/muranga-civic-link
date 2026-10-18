import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const params = new URLSearchParams();
      params.append('username', email); 
      params.append('password', password);

      const response = await api.post('/api/login', params);
      const { access_token, user } = response.data;

      login(user, access_token);

      // REDIRECT BASED ON ROLE
      if (user.role === 'admin') {
        navigate('/admin');
      } else if (user.role === 'officer') {
        navigate('/officer'); // <--- Officer goes to /officer
      } else {
        navigate('/dashboard'); // <--- Citizen goes to /dashboard
      }
      
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white p-8 rounded-xl shadow-xl w-full max-w-md border-t-8 border-muranga-green">
        
        <div className="flex flex-col items-center mb-8">
          <img src="/logo.png" alt="Muranga Logo" className="h-20 mb-4" />
          <h1 className="text-2xl font-bold text-muranga-dark uppercase tracking-wide text-center">
            Murang'a County
          </h1>
          <p className="text-muranga-green font-semibold text-sm">Civic Link Portal</p>
        </div>

        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-3 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-muranga-green focus:border-muranga-green transition"
              placeholder="e.g. Amari@gmail.com"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-muranga-green focus:border-muranga-green transition"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-muranga-green text-white py-2.5 rounded font-bold hover:bg-muranga-dark disabled:bg-gray-400 transition shadow-md"
          >
            {loading ? 'Authenticating...' : 'Log In'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-muranga-green font-bold hover:underline">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}