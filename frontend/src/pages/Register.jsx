import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';

export default function Register() {
  const [form, setForm] = useState({ full_name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault(); 
    setError(''); 
    setLoading(true);
    try { 
      await api.post('/api/register', form); 
      alert('Registration successful! Please log in.'); 
      navigate('/login'); 
    } 
    catch (err) { 
      setError(err.response?.data?.detail || 'Registration failed'); 
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white p-8 rounded-xl shadow-xl w-full max-w-md border-t-8 border-muranga-green">
        <div className="flex flex-col items-center mb-6">
          {/* FIXED LOGO PATH */}
          <img src={`${import.meta.env.BASE_URL}logo.png`} alt="Muranga Logo" className="h-16 mb-3" />
          <h1 className="text-xl font-bold text-muranga-dark uppercase">Citizen Registration</h1>
        </div>

        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-3 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input
              type="text" required value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-muranga-green focus:border-muranga-green"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email" required value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-muranga-green focus:border-muranga-green"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password" required value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-muranga-green focus:border-muranga-green"
            />
          </div>
          <button
            type="submit" disabled={loading}
            className="w-full bg-muranga-green text-white py-2.5 rounded font-bold hover:bg-muranga-dark disabled:bg-gray-400 transition shadow-md mt-2"
          >
            {loading ? 'Registering...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-4">
          Already have an account? <Link to="/login" className="text-muranga-green font-bold hover:underline">Log in</Link>
        </p>
      </div>
    </div>
  );
}