import { useState, useEffect } from 'react';
import api from '../api/axios';

export default function OfficerDashboard() {
  const [requests, setRequests] = useState([]);
  const [messages, setMessages] = useState([]);
  const [activeTab, setActiveTab] = useState('issues');
  const [replyMsg, setReplyMsg] = useState({ id: null, text: '' });

  const fetchData = async () => {
    try {
      const [reqRes, msgRes] = await Promise.all([
        api.get('/api/officer/requests'),
        api.get('/api/officer/support')
      ]);
      setRequests(reqRes.data);
      setMessages(msgRes.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchData(); }, []);

  const updateStatus = async (id, status, file) => {
    const formData = new FormData();
    formData.append('status', status);
    formData.append('department', requests.find(r => r.id === id)?.department || 'Unassigned');
    if (file) formData.append('evidence', file);
    try { await api.put(`/api/admin/requests/${id}`, formData); fetchData(); } catch (err) { alert("Failed to update"); }
  };

  const sendReply = async (e, id) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('reply_text', replyMsg.text);
    try { await api.put(`/api/admin/support/${id}`, formData); setReplyMsg({ id: null, text: '' }); fetchData(); } catch (err) { alert('Error'); }
  };

  return (
    <div className="max-w-380 mx-auto p-6">
      <h1 className="text-2xl font-bold text-muranga-dark mb-6 uppercase tracking-wide">Department Officer Dashboard</h1>

      <div className="flex gap-4 mb-6 border-b pb-2">
        <button onClick={() => setActiveTab('issues')} className={`font-bold uppercase px-4 py-2 rounded-t-lg ${activeTab === 'issues' ? 'bg-muranga-green text-white' : 'text-gray-500 hover:bg-gray-100'}`}>Assigned Issues</button>
        <button onClick={() => setActiveTab('messages')} className={`font-bold uppercase px-4 py-2 rounded-t-lg ${activeTab === 'messages' ? 'bg-muranga-green text-white' : 'text-gray-500 hover:bg-gray-100'}`}>Department Messages</button>
      </div>

      {activeTab === 'issues' && (
        <div className="bg-white rounded-lg shadow overflow-x-auto border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-muranga-light">
              <tr><th className="px-4 py-3 text-left text-xs font-bold uppercase">Issue</th><th className="px-4 py-3 text-left text-xs font-bold uppercase">Location</th><th className="px-4 py-3 text-left text-xs font-bold uppercase">Action</th></tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {requests.length === 0 ? <tr><td colSpan="3" className="p-4 text-center">No issues assigned to your department yet.</td></tr> : requests.map(req => (
                <tr key={req.id}>
                  <td className="px-4 py-4 text-sm font-bold">{req.category} <br/><span className="text-xs font-normal text-gray-500">{req.tracking_number}</span></td>
                  <td className="px-4 py-4 text-sm">{req.location}</td>
                  <td className="px-4 py-4 text-sm bg-gray-50">
                    <select value={req.status} onChange={(e) => updateStatus(req.id, e.target.value, null)} className="border p-1 rounded text-sm mb-2 block">
                      <option value="Pending">Pending</option><option value="In Progress">In Progress</option><option value="Resolved">Resolved</option>
                    </select>
                    <input type="file" onChange={(e) => updateStatus(req.id, 'Resolved', e.target.files[0])} className="text-xs" title="Upload Evidence" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'messages' && (
        <div className="space-y-4">
          {messages.length === 0 ? <p>No messages for your department.</p> : messages.map(msg => (
            <div key={msg.id} className="bg-white p-4 rounded shadow border-l-4 border-muranga-green">
              <div className="flex justify-between">
                <h3 className="font-bold">{msg.name} <span className="text-sm font-normal text-gray-500">({msg.email})</span></h3>
                <span className={`px-2 py-1 rounded text-xs font-bold ${msg.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>{msg.status}</span>
              </div>
              <p className="mt-2 text-gray-800 font-medium">Q: {msg.question}</p>
              {msg.reply_text ? (
                <div className="mt-3 bg-green-50 p-2 rounded text-sm text-green-800"><strong>Replied by {msg.replied_by}:</strong> {msg.reply_text}</div>
              ) : (
                <form onSubmit={(e) => sendReply(e, msg.id)} className="mt-3 flex gap-2">
                  <input type="text" required placeholder="Type reply..." value={replyMsg.id === msg.id ? replyMsg.text : ''} onChange={e => setReplyMsg({ id: msg.id, text: e.target.value })} className="flex-1 border p-2 rounded text-sm" />
                  <button type="submit" className="bg-muranga-green text-white px-4 py-2 rounded text-sm font-bold">Reply</button>
                </form>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}