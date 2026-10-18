import { useState, useEffect } from 'react';
import { getMyRequests, submitRequest } from '../api/requests';
import api from '../api/axios'; // Import api to fetch departments

export default function CitizenDashboard() {
  const [requests, setRequests] = useState([]);
  const [departments, setDepartments] = useState([]); // State to hold Admin-created departments
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ category: '', location: '', description: '', priority: 'Normal', image: null });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const fetchRequests = async () => {
    try { 
      setRequests(await getMyRequests()); 
    } catch (err) { 
      console.error(err); 
    } finally { 
      setLoading(false); 
    }
  };

  // Fetch both the citizen's requests AND the active departments
  useEffect(() => { 
    fetchRequests(); 
    
    api.get('/api/departments')
      .then(res => setDepartments(res.data))
      .catch(err => console.error("Error fetching departments:", err));
  }, []);

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setForm((prev) => ({ ...prev, location: `Lat: ${pos.coords.latitude.toFixed(4)}, Lng: ${pos.coords.longitude.toFixed(4)}` })),
        () => alert("Could not get location.")
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); 
    setSubmitting(true); 
    setMessage('');
    
    const formData = new FormData();
    formData.append('category', form.category); 
    formData.append('location', form.location);
    formData.append('description', form.description); 
    formData.append('priority', form.priority);
    if (form.image) formData.append('image', form.image);
    
    try {
      await submitRequest(formData);
      setMessage('Request submitted successfully!');
      setForm({ category: '', location: '', description: '', priority: 'Normal', image: null });
      fetchRequests();
    } catch (err) { 
      setMessage('Failed to submit request.'); 
    } finally { 
      setSubmitting(false); 
    }
  };

  const getStatusColor = (status) => {
    if (status === 'Pending') return 'bg-yellow-100 text-yellow-800';
    if (status === 'In Progress') return 'bg-blue-100 text-blue-800';
    if (status === 'Resolved') return 'bg-green-100 text-green-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* LEFT COLUMN: Submit Form */}
      <div className="lg:col-span-1">
        <div className="bg-white p-6 rounded-lg shadow-md border-t-4 border-muranga-green">
          <h2 className="text-xl font-bold text-muranga-dark mb-4">Submit a New Request</h2>
          
          {message && (
            <div className={`p-3 rounded mb-4 text-sm ${message.includes('success') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* DYNAMIC CATEGORY DROPDOWN */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category / Department</label>
              <select 
                required 
                value={form.category} 
                onChange={(e) => setForm({ ...form, category: e.target.value })} 
                className="w-full px-3 py-2 border rounded focus:ring-muranga-green"
              >
                <option value="">Select the issue type...</option>
                
                {/* Map through the departments created by the Admin */}
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.name}>{dept.name}</option>
                ))}
                
                {/* Fallback option */}
                <option value="Other">Other (Not Listed)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select 
                value={form.priority} 
                onChange={(e) => setForm({ ...form, priority: e.target.value })} 
                className="w-full px-3 py-2 border rounded focus:ring-muranga-green"
              >
                <option value="Normal">Normal (Moderate)</option>
                <option value="Urgent">🚨 Urgent (Critical)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  required 
                  placeholder="e.g., Kenol Town" 
                  value={form.location} 
                  onChange={(e) => setForm({ ...form, location: e.target.value })} 
                  className="w-full px-3 py-2 border rounded focus:ring-muranga-green" 
                />
                <button 
                  type="button" 
                  onClick={handleGetLocation} 
                  className="bg-gray-200 px-3 rounded hover:bg-gray-300 font-bold" 
                  title="Use GPS Location"
                >
                  📍
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea 
                required 
                rows="3" 
                value={form.description} 
                onChange={(e) => setForm({ ...form, description: e.target.value })} 
                className="w-full px-3 py-2 border rounded focus:ring-muranga-green"
                placeholder="Describe the issue in detail..."
              ></textarea>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Attach Image (Optional)</label>
              <input 
                type="file" 
                accept="image/*" 
                onChange={(e) => setForm({ ...form, image: e.target.files[0] })} 
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-muranga-light file:text-muranga-dark hover:file:bg-muranga-green hover:file:text-white" 
              />
            </div>

            <button 
              type="submit" 
              disabled={submitting} 
              className="w-full bg-muranga-green text-white py-2 rounded hover:bg-muranga-dark disabled:bg-gray-400 transition font-bold shadow"
            >
              {submitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </form>
        </div>
      </div>

      {/* RIGHT COLUMN: My Requests List */}
      <div className="lg:col-span-2">
        <h2 className="text-xl font-bold text-muranga-dark mb-4">My Requests</h2>
        
        {loading ? (
          <p>Loading...</p>
        ) : requests.length === 0 ? (
          <div className="bg-white p-6 rounded-lg shadow text-center text-gray-500">No requests yet.</div>
        ) : (
          <div className="space-y-4">
            {requests.map((req) => (
              <div key={req.id} className="bg-white p-4 rounded-lg shadow-md border-l-4 border-muranga-green">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-lg text-gray-800">
                      {req.priority === 'Urgent' && '🚨 '}{req.category}
                    </h3>
                    <p className="text-sm text-gray-500">📍 {req.location}</p>
                    <p className="text-xs font-mono bg-gray-100 px-2 py-1 rounded inline-block mt-1">
                      Tracking: {req.tracking_number}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(req.status)}`}>
                    {req.status}
                  </span>
                </div>
                <p className="text-gray-700 mt-2">{req.description}</p>
                
                <div className="grid grid-cols-2 gap-4 mt-3">
                    {req.image_url && (
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Reported Issue:</p>
                        <img src={req.image_url} alt="Before" className="h-24 w-full object-cover rounded border" />
                      </div>
                    )}
                    {req.evidence_url && (
                      <div>
                        <p className="text-xs text-green-600 font-bold mb-1">Resolved (Evidence):</p>
                        <img src={req.evidence_url} alt="After" className="h-24 w-full object-cover rounded border border-green-400" />
                      </div>
                    )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}