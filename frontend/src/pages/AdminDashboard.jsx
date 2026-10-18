import { useState, useEffect } from 'react';
import { getAllRequests, getAnalytics } from '../api/admin';
import api from '../api/axios';
import MurangaMap from '../components/MurangaMap';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#f1c40f', '#3498db', '#008f39', '#e74c3c'];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('requests');
  const [requests, setRequests] = useState([]);
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [messages, setMessages] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [analytics, setAnalytics] = useState({ total: 0, pending: 0, in_progress: 0, resolved: 0 });
  
  // Form states for creating
  const [newDept, setNewDept] = useState({ name: '', description: '' });
  const [newOfficer, setNewOfficer] = useState({ full_name: '', email: '', password: '', department_id: '', id_number: '', phone_number: '' });
  const [newNotif, setNewNotif] = useState({ title: '', message: '', expiry_days: 7 });
  const [replyMsg, setReplyMsg] = useState({ id: null, text: '' });

  // States for Editing
  const [editingUser, setEditingUser] = useState(null);
  const [editUserForm, setEditUserForm] = useState({ full_name: '', email: '', password: '', department_id: '' });
  const [editingDept, setEditingDept] = useState(null);
  const [editDeptForm, setEditDeptForm] = useState({ name: '', description: '' });

  const fetchData = async () => {
    try {
      if (activeTab === 'requests') {
        const [reqData, analyticsData, deptData] = await Promise.all([getAllRequests(), getAnalytics(), api.get('/api/departments')]);
        setRequests(reqData); setAnalytics(analyticsData); setDepartments(deptData.data);
      } else if (activeTab === 'users') {
        const [userData, deptData] = await Promise.all([api.get('/api/admin/users'), api.get('/api/departments')]);
        setUsers(userData.data); setDepartments(deptData.data);
      } else if (activeTab === 'support') {
        const msgData = await api.get('/api/admin/support');
        setMessages(msgData.data);
      } else if (activeTab === 'notifications') {
        const notifData = await api.get('/api/admin/notifications');
        setNotifications(notifData.data);
      }
    } catch (err) { console.error("Error fetching admin data:", err); }
  };

  useEffect(() => { fetchData(); }, [activeTab]);

  // --- HANDLERS ---
  const handleUpdateRequest = async (id, status, department) => {
    const formData = new FormData();
    formData.append('status', status); 
    formData.append('department', department);
    try { 
      await api.put(`/api/admin/requests/${id}`, formData); 
      fetchData(); 
    } catch (err) { alert("Failed to update request."); }
  };

  const approveWork = async (id) => {
    try { 
      await api.put(`/api/admin/requests/${id}/approve`); 
      fetchData(); 
      alert('Work Approved & Citizen Notified via Mock Email!'); 
    } catch (err) { alert("Failed to approve"); }
  };

  const createDepartment = async (e) => {
    e.preventDefault();
    try { await api.post('/api/admin/departments', newDept); setNewDept({ name: '', description: '' }); fetchData(); } catch (err) { alert('Error creating dept'); }
  };

  const deleteDept = async (id) => {
    if(window.confirm("Delete this department? Users assigned to it will be unassigned.")) { 
      try { await api.delete(`/api/admin/departments/${id}`); fetchData(); } catch (err) { alert('Error deleting'); }
    }
  };

  const createOfficer = async (e) => {
    e.preventDefault();
    try { 
      await api.post('/api/admin/users/officer', newOfficer); 
      setNewOfficer({ full_name: '', email: '', password: '', department_id: '', id_number: '', phone_number: '' }); 
      fetchData(); 
      alert("Officer created successfully!"); 
    } catch (err) { 
      const errorMsg = err.response?.data?.detail?.[0]?.msg || err.response?.data?.detail || 'Failed to create officer';
      alert(`Error: ${errorMsg}`); 
    }
  };

  const deleteUser = async (id) => {
    if(window.confirm("Delete this user? All their requests will also be deleted.")) { 
      try { await api.delete(`/api/admin/users/${id}`); fetchData(); } catch (err) { alert('Error deleting'); }
    }
  };

  const createNotification = async (e) => {
    e.preventDefault();
    try { 
      await api.post('/api/admin/notifications', newNotif); 
      alert('Broadcast Sent!'); 
      setNewNotif({ title: '', message: '', expiry_days: 7 }); 
      fetchData();
    } catch (err) { alert('Error'); }
  };

  const deleteNotification = async (id) => {
    if(window.confirm("Delete this announcement?")) { try { await api.delete(`/api/admin/notifications/${id}`); fetchData(); } catch (err) {} }
  };

  const sendReply = async (e, id) => {
    e.preventDefault();
    const formData = new FormData(); 
    formData.append('reply_text', replyMsg.text);
    try { 
      await api.put(`/api/admin/support/${id}`, formData); 
      setReplyMsg({ id: null, text: '' }); 
      fetchData(); 
      alert("Reply sent to citizen email!"); 
    } catch (err) { alert('Error sending reply'); }
  };

  const downloadCSV = () => {
    window.open('http://localhost:8000/api/admin/support/export', '_blank');
  };

  // --- EDIT HANDLERS ---
  const openEditUser = (user) => {
    setEditingUser(user);
    setEditUserForm({ full_name: user.full_name, email: user.email, password: '', department_id: user.department_id || '' });
  };

  const saveEditedUser = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...editUserForm };
      if (!payload.password) delete payload.password;
      if (!payload.department_id) payload.department_id = null;
      
      await api.put(`/api/admin/users/${editingUser.id}`, payload);
      setEditingUser(null);
      fetchData();
      alert("User updated successfully!");
    } catch (err) { alert("Error updating user: " + (err.response?.data?.detail || err.message)); }
  };

  const openEditDept = (dept) => {
    setEditingDept(dept);
    setEditDeptForm({ name: dept.name, description: dept.description || '' });
  };

  const saveEditedDept = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/api/admin/departments/${editingDept.id}`, editDeptForm);
      setEditingDept(null);
      fetchData();
      alert("Department updated!");
    } catch (err) { alert("Error updating department"); }
  };

  const pieData = [
    { name: 'Pending', value: analytics.pending },
    { name: 'In Progress', value: analytics.in_progress },
    { name: 'Resolved', value: analytics.resolved },
  ];

  return (
    <div className="max-w-380 mx-auto p-6">
      <h1 className="text-2xl font-bold text-muranga-dark mb-6 uppercase tracking-wide">Admin Dashboard</h1>

      {/* TABS */}
      <div className="flex gap-4 mb-6 border-b pb-2 overflow-x-auto">
        {['requests', 'users', 'support', 'notifications'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`font-bold uppercase px-4 py-2 rounded-t-lg whitespace-nowrap transition ${activeTab === tab ? 'bg-muranga-green text-white' : 'text-gray-500 hover:bg-gray-100'}`}>
            {tab === 'users' ? 'Manage Users & Depts' : tab === 'support' ? 'Support Inbox' : tab === 'notifications' ? 'Announcements' : 'Requests'}
          </button>
        ))}
      </div>

      {/* ================= TAB 1: REQUESTS ================= */}
      {activeTab === 'requests' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-lg shadow border-t-4 border-gray-500"><p className="text-sm text-gray-500 font-semibold">Total</p><p className="text-3xl font-bold">{analytics.total}</p></div>
              <div className="bg-white p-4 rounded-lg shadow border-t-4 border-yellow-500"><p className="text-sm text-gray-500 font-semibold">Pending</p><p className="text-3xl font-bold text-yellow-600">{analytics.pending}</p></div>
              <div className="bg-white p-4 rounded-lg shadow border-t-4 border-blue-500"><p className="text-sm text-gray-500 font-semibold">In Progress</p><p className="text-3xl font-bold text-blue-600">{analytics.in_progress}</p></div>
              <div className="bg-white p-4 rounded-lg shadow border-t-4 border-green-500"><p className="text-sm text-gray-500 font-semibold">Resolved</p><p className="text-3xl font-bold text-green-600">{analytics.resolved}</p></div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow flex flex-col items-center justify-center">
              <h3 className="font-bold text-gray-600 mb-2">Issue Analysis</h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Tooltip /><Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <MurangaMap requests={requests} />

          <div className="bg-white rounded-lg shadow overflow-x-auto border border-gray-200 mt-8">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-muranga-light">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-muranga-dark uppercase">Citizen</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-muranga-dark uppercase">Issue</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-muranga-dark uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {requests.map((req) => (
                  <tr key={req.id}>
                    <td className="px-4 py-4 text-sm font-medium">{req.citizen_name}</td>
                    <td className="px-4 py-4 text-sm">
                      <div className="font-mono text-xs text-gray-500">{req.tracking_number}</div>
                      <div className="font-bold text-muranga-dark">{req.category}</div>
                      <div className="text-xs text-gray-600">📍 {req.location}</div>
                    </td>
                    <td className="px-4 py-4 text-sm bg-gray-50">
                      {req.status === 'Work Done' ? (
                        <div className="border p-2 bg-purple-50 rounded shadow-sm">
                          <p className="text-xs font-bold text-purple-800 mb-1">Awaiting Approval</p>
                          <p className="text-xs mb-2 text-gray-700">{req.officer_notes}</p>
                          <button onClick={() => approveWork(req.id)} className="bg-green-600 text-white px-3 py-1.5 rounded text-xs font-bold w-full hover:bg-green-700 transition">Approve & Close</button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {/* Status Dropdown */}
                          <select value={req.status} onChange={(e) => handleUpdateRequest(req.id, e.target.value, req.department)} className="border p-1 rounded text-sm w-full">
                            <option value="Pending">Pending</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Resolved">Resolved</option>
                          </select>

                          {/* Department Dropdown with Warning */}
                          {req.department === 'Unassigned' && (
                            <p className="text-xs font-bold text-red-600 mb-1 animate-pulse">⚠️ Action Required: Assign Dept</p>
                          )}
                          <select 
                            value={req.department} 
                            onChange={(e) => handleUpdateRequest(req.id, req.status, e.target.value)} 
                            className={`border p-1 rounded text-sm w-full ${req.department === 'Unassigned' ? 'bg-yellow-50 border-yellow-400 font-bold' : ''}`}
                          >
                            <option value="Unassigned">Unassigned</option>
                            {departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                          </select>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ================= TAB 2: USERS & DEPTS ================= */}
      {activeTab === 'users' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow border-t-4 border-muranga-gold">
            <h2 className="text-lg font-bold mb-4">Create Department</h2>
            <form onSubmit={createDepartment} className="space-y-3">
              <input type="text" required placeholder="Dept Name (e.g. Fire Department)" value={newDept.name} onChange={e => setNewDept({...newDept, name: e.target.value})} className="w-full border p-2 rounded" />
              <textarea placeholder="Description" value={newDept.description} onChange={e => setNewDept({...newDept, description: e.target.value})} className="w-full border p-2 rounded" />
              <button type="submit" className="bg-muranga-gold text-muranga-dark px-4 py-2 rounded font-bold w-full hover:bg-yellow-400 transition">Add Department</button>
            </form>

            <h3 className="font-bold mt-6 mb-2 border-b pb-1">Existing Departments</h3>
            <ul className="space-y-2 max-h-48 overflow-y-auto">
              {departments.map(d => (
                <li key={d.id} className="flex justify-between items-center bg-gray-50 p-2 rounded text-sm border">
                  {d.name} 
                  <div className="flex gap-2">
                    <button onClick={() => openEditDept(d)} className="text-blue-600 hover:underline">Edit</button>
                    <button onClick={() => deleteDept(d.id)} className="text-red-600 hover:underline">Delete</button>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border-t-4 border-blue-500">
            <h2 className="text-lg font-bold mb-4">Create Dept Officer Account</h2>
            <form onSubmit={createOfficer} className="space-y-2">
              <input type="text" required placeholder="Full Name" value={newOfficer.full_name} onChange={e => setNewOfficer({...newOfficer, full_name: e.target.value})} className="w-full border p-2 rounded" />
              <input type="email" required placeholder="Email (e.g. name@domain.com)" value={newOfficer.email} onChange={e => setNewOfficer({...newOfficer, email: e.target.value})} className="w-full border p-2 rounded" />
              <input type="password" required placeholder="Password" value={newOfficer.password} onChange={e => setNewOfficer({...newOfficer, password: e.target.value})} className="w-full border p-2 rounded" />
              <input type="text" placeholder="ID Number (Optional)" value={newOfficer.id_number} onChange={e => setNewOfficer({...newOfficer, id_number: e.target.value})} className="w-full border p-2 rounded" />
              <input type="text" placeholder="Phone Number (Optional)" value={newOfficer.phone_number} onChange={e => setNewOfficer({...newOfficer, phone_number: e.target.value})} className="w-full border p-2 rounded" />
              <select required value={newOfficer.department_id} onChange={e => setNewOfficer({...newOfficer, department_id: e.target.value})} className="w-full border p-2 rounded">
                <option value="">Select Department...</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
              <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded font-bold w-full hover:bg-blue-700 transition">Create Officer</button>
            </form>
          </div>

          <div className="md:col-span-2 bg-white p-6 rounded-lg shadow mt-4">
            <h2 className="text-lg font-bold mb-4">All System Users</h2>
            <div className="max-h-96 overflow-y-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-2 px-2 text-sm">Name</th>
                    <th className="text-left py-2 px-2 text-sm">Email</th>
                    <th className="text-left py-2 px-2 text-sm">Role</th>
                    <th className="text-left py-2 px-2 text-sm">Profile</th>
                    <th className="text-left py-2 px-2 text-sm">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} className="border-b">
                      <td className="py-2 px-2 text-sm">{u.full_name}</td>
                      <td className="py-2 px-2 text-sm">{u.email}</td>
                      <td className="py-2 px-2 text-xs font-bold uppercase">{u.role}</td>
                      <td className="py-2 px-2">
                        {u.profile_pic ? <img src={u.profile_pic} className="w-8 h-8 rounded-full object-cover border" /> : <span className="text-xs text-gray-400">None</span>}
                      </td>
                      <td className="py-2 px-2 text-sm flex gap-2">
                        <button onClick={() => openEditUser(u)} className="text-blue-600 hover:underline">Edit</button>
                        {u.role !== 'admin' && <button onClick={() => deleteUser(u.id)} className="text-red-600 hover:underline">Delete</button>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 3: SUPPORT INBOX ================= */}
      {activeTab === 'support' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold">Support Inbox (Historical Record)</h2>
            <button onClick={downloadCSV} className="bg-blue-600 text-white px-4 py-2 rounded font-bold text-sm shadow hover:bg-blue-700 transition">⬇ Download Chats (CSV)</button>
          </div>
          <div className="space-y-4">
            {messages.length === 0 ? <p>No support messages yet.</p> : messages.map(msg => (
              <div key={msg.id} className="bg-white p-4 rounded shadow border-l-4 border-muranga-green">
                <div className="flex justify-between">
                  <h3 className="font-bold">{msg.name} <span className="text-sm font-normal text-gray-500">({msg.email} | {msg.phone})</span></h3>
                  <span className={`px-2 py-1 rounded text-xs font-bold ${msg.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>{msg.status}</span>
                </div>
                <p className="text-sm text-gray-600 mt-1 mb-2">Dept: {msg.department || 'Not specified'}</p>
                <p className="mt-2 text-gray-800 font-medium">Q: {msg.question}</p>
                
                {msg.reply_text ? (
                  <div className="mt-3 bg-green-50 p-2 rounded text-sm text-green-800"><strong>Replied by {msg.replied_by}:</strong> {msg.reply_text}</div>
                ) : (
                  <form onSubmit={(e) => sendReply(e, msg.id)} className="mt-3 flex gap-2">
                    <input type="text" required placeholder="Type reply..." value={replyMsg.id === msg.id ? replyMsg.text : ''} onChange={e => setReplyMsg({ id: msg.id, text: e.target.value })} className="flex-1 border p-2 rounded text-sm" />
                    <button type="submit" className="bg-muranga-green text-white px-4 py-2 rounded text-sm font-bold hover:bg-muranga-dark transition">Reply</button>
                  </form>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= TAB 4: NOTIFICATIONS ================= */}
      {activeTab === 'notifications' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 bg-white p-6 rounded-lg shadow border-t-4 border-muranga-green">
            <h2 className="text-lg font-bold mb-4">New Announcement</h2>
            <form onSubmit={createNotification} className="space-y-4">
              <input type="text" required placeholder="Title (e.g. Free Medical Camp)" value={newNotif.title} onChange={e => setNewNotif({...newNotif, title: e.target.value})} className="w-full border p-2 rounded" />
              <textarea required placeholder="Message details..." value={newNotif.message} onChange={e => setNewNotif({...newNotif, message: e.target.value})} className="w-full border p-2 rounded" rows="3"></textarea>
              <div>
                <label className="block text-sm mb-1 font-bold">Expiry (Days)</label>
                <input type="number" required min="1" value={newNotif.expiry_days} onChange={e => setNewNotif({...newNotif, expiry_days: parseInt(e.target.value)})} className="w-full border p-2 rounded" />
                <p className="text-xs text-gray-500 mt-1">After this many days, citizens will no longer see it.</p>
              </div>
              <button type="submit" className="bg-muranga-green text-white px-4 py-2 rounded font-bold w-full hover:bg-muranga-dark transition">Broadcast Notification</button>
            </form>
          </div>

          <div className="md:col-span-2 bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-bold mb-4">Announcement History</h2>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {notifications.map(n => {
                const isExpired = n.expires_at && new Date(n.expires_at) < new Date();
                return (
                  <div key={n.id} className={`p-3 border rounded flex justify-between items-center ${isExpired ? 'bg-gray-100 opacity-60' : 'bg-white'}`}>
                    <div>
                      <h4 className="font-bold text-sm">{n.title} {isExpired && <span className="text-red-500 text-xs ml-2">(EXPIRED)</span>}</h4>
                      <p className="text-xs text-gray-500">{n.message}</p>
                      <p className="text-xs text-gray-400 mt-1">Expires: {n.expires_at ? new Date(n.expires_at).toLocaleDateString() : 'Never'}</p>
                    </div>
                    <button onClick={() => deleteNotification(n.id)} className="text-red-600 text-sm font-bold hover:underline">Delete</button>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ================= MODALS ================= */}
      
      {/* EDIT USER MODAL */}
      {editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-96">
            <h2 className="text-lg font-bold mb-4">Edit User: {editingUser.full_name}</h2>
            <form onSubmit={saveEditedUser} className="space-y-3">
              <input type="text" required value={editUserForm.full_name} onChange={e => setEditUserForm({...editUserForm, full_name: e.target.value})} className="w-full border p-2 rounded" placeholder="Full Name" />
              <input type="email" required value={editUserForm.email} onChange={e => setEditUserForm({...editUserForm, email: e.target.value})} className="w-full border p-2 rounded" placeholder="Email" />
              <input type="password" value={editUserForm.password} onChange={e => setEditUserForm({...editUserForm, password: e.target.value})} className="w-full border p-2 rounded" placeholder="New Password (leave blank to keep current)" />
              
              {editingUser.role === 'officer' && (
                <select value={editUserForm.department_id || ''} onChange={e => setEditUserForm({...editUserForm, department_id: e.target.value})} className="w-full border p-2 rounded">
                  <option value="">Unassigned Department</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              )}

              <div className="flex justify-end gap-2 mt-4">
                <button type="button" onClick={() => setEditingUser(null)} className="px-4 py-2 text-gray-600 border rounded hover:bg-gray-100">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-muranga-green text-white rounded font-bold hover:bg-muranga-dark">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT DEPARTMENT MODAL */}
      {editingDept && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-96">
            <h2 className="text-lg font-bold mb-4">Edit Department</h2>
            <form onSubmit={saveEditedDept} className="space-y-3">
              <input type="text" required value={editDeptForm.name} onChange={e => setEditDeptForm({...editDeptForm, name: e.target.value})} className="w-full border p-2 rounded" placeholder="Department Name" />
              <textarea value={editDeptForm.description} onChange={e => setEditDeptForm({...editDeptForm, description: e.target.value})} className="w-full border p-2 rounded" placeholder="Description" rows="3"></textarea>
              
              <div className="flex justify-end gap-2 mt-4">
                <button type="button" onClick={() => setEditingDept(null)} className="px-4 py-2 text-gray-600 border rounded hover:bg-gray-100">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-muranga-green text-white rounded font-bold hover:bg-muranga-dark">Update</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}