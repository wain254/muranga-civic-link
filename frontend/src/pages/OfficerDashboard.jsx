import { useState, useEffect } from 'react';
import api from '../api/axios';

export default function OfficerDashboard() {
  const [activeTab, setActiveTab] = useState('work');
  const [requests, setRequests] = useState([]);
  const [messages, setMessages] = useState([]);
  const [msgFilter, setMsgFilter] = useState('New'); // 'All', 'New', 'Answered'
  
  // Work Submission States
  const [selectedTask, setSelectedTask] = useState(null);
  const [workNotes, setWorkNotes] = useState('');
  const [evidenceFile, setEvidenceFile] = useState(null);

  // Reply State
  const [replyMsg, setReplyMsg] = useState({ id: null, text: '' });

  // Profile State
  const [profile, setProfile] = useState(null);
  const [profilePic, setProfilePic] = useState(null);

  const fetchData = async () => {
    try {
      const [reqRes, msgRes, profRes] = await Promise.all([
        api.get('/api/officer/requests'), 
        api.get('/api/officer/support'),
        api.get('/api/officer/profile')
      ]);
      setRequests(reqRes.data);
      setMessages(msgRes.data);
      setProfile(profRes.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchData(); }, []);

  const submitWork = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('notes', workNotes);
    if (evidenceFile) formData.append('evidence', evidenceFile);
    try {
      await api.put(`/api/officer/requests/${selectedTask.id}/complete`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      alert('Work marked as done! Waiting for Admin approval.');
      setSelectedTask(null); setWorkNotes(''); setEvidenceFile(null);
      fetchData();
    } catch (err) { alert('Error completing work'); }
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
    } catch (err) { alert('Error'); }
  };

  const uploadPic = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('file', profilePic);
    try {
      await api.post('/api/officer/profile-pic', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      alert('Profile Pic Updated!');
      fetchData();
    } catch (err) { alert('Error uploading'); }
  };

  const filteredMessages = messages.filter(m => {
    if (msgFilter === 'New') return m.status === 'Pending';
    if (msgFilter === 'Answered') return m.status === 'Resolved';
    return true;
  });

  return (
    <div className="max-w-380 mx-auto p-6">
      <h1 className="text-2xl font-bold text-muranga-dark mb-6 uppercase tracking-wide">Department Officer Dashboard</h1>
      
      <div className="flex gap-4 mb-6 border-b pb-2">
        <button onClick={() => setActiveTab('work')} className={`font-bold uppercase px-4 py-2 rounded-t-lg ${activeTab === 'work' ? 'bg-muranga-green text-white' : 'text-gray-500 hover:bg-gray-100'}`}>Assigned Work</button>
        <button onClick={() => setActiveTab('messages')} className={`font-bold uppercase px-4 py-2 rounded-t-lg ${activeTab === 'messages' ? 'bg-muranga-green text-white' : 'text-gray-500 hover:bg-gray-100'}`}>Messages</button>
        <button onClick={() => setActiveTab('profile')} className={`font-bold uppercase px-4 py-2 rounded-t-lg ${activeTab === 'profile' ? 'bg-muranga-green text-white' : 'text-gray-500 hover:bg-gray-100'}`}>My Profile</button>
      </div>

      {/* TAB 1: WORK */}
      {activeTab === 'work' && (
        <div className="bg-white rounded-lg shadow overflow-x-auto border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-muranga-light">
              <tr><th className="px-4 py-3 text-left text-xs font-bold uppercase">Issue Details</th><th className="px-4 py-3 text-left text-xs font-bold uppercase">Status</th><th className="px-4 py-3 text-left text-xs font-bold uppercase">Action</th></tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {requests.length === 0 ? <tr><td colSpan="3" className="p-4 text-center">No tasks assigned.</td></tr> : requests.map(req => (
                <tr key={req.id}>
                  <td className="px-4 py-4 text-sm">
                    <span className="font-bold">{req.category}</span><br/>
                    <span className="text-xs text-gray-500">{req.location}</span>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`px-2 py-1 text-xs font-bold rounded-full ${req.status === 'Resolved' ? 'bg-green-100 text-green-800' : req.status === 'Work Done' ? 'bg-purple-100 text-purple-800' : 'bg-yellow-100 text-yellow-800'}`}>{req.status}</span>
                  </td>
                  <td className="px-4 py-4 text-sm">
                    {req.status !== 'Resolved' && req.status !== 'Work Done' && (
                      <button onClick={() => setSelectedTask(req)} className="bg-muranga-green text-white px-3 py-1 rounded text-xs font-bold">Mark Finished</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 2: MESSAGES */}
      {activeTab === 'messages' && (
        <div>
          <div className="flex gap-2 mb-4">
            {['New', 'Answered', 'All'].map(f => (
              <button key={f} onClick={() => setMsgFilter(f)} className={`px-3 py-1 text-sm rounded ${msgFilter === f ? 'bg-muranga-dark text-white' : 'bg-gray-200'}`}>{f}</button>
            ))}
          </div>
          <div className="space-y-4">
            {filteredMessages.length === 0 ? <p>No messages found.</p> : filteredMessages.map(msg => (
              <div key={msg.id} className="bg-white p-4 rounded shadow border-l-4 border-muranga-green">
                <h3 className="font-bold">{msg.name} <span className="text-sm text-gray-500">({msg.email})</span></h3>
                <p className="mt-2 text-sm">Q: {msg.question}</p>
                {msg.reply_text ? (
                  <div className="mt-3 bg-green-50 p-2 rounded text-sm"><strong>Replied by {msg.replied_by}:</strong> {msg.reply_text}</div>
                ) : (
                  <form onSubmit={(e) => sendReply(e, msg.id)} className="mt-3 flex gap-2">
                    <input type="text" required placeholder="Reply to email..." value={replyMsg.id === msg.id ? replyMsg.text : ''} onChange={e => setReplyMsg({ id: msg.id, text: e.target.value })} className="flex-1 border p-2 rounded text-sm" />
                    <button type="submit" className="bg-muranga-green text-white px-4 py-2 rounded text-sm font-bold">Send</button>
                  </form>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: PROFILE */}
      {activeTab === 'profile' && profile && (
        <div className="bg-white p-6 rounded shadow max-w-md flex flex-col items-center">
          <img src={profile.profile_pic || 'https://via.placeholder.com/150'} alt="Profile" className="w-32 h-32 rounded-full object-cover border-4 border-muranga-green mb-4" />
          <h2 className="text-xl font-bold">{profile.full_name}</h2>
          <p className="text-sm text-gray-500 mb-4">{profile.email}</p>
          
          <div className="w-full text-sm space-y-2 mb-6 text-left border-t pt-4">
            <p><strong>Role:</strong> {profile.role.toUpperCase()}</p>
            <p><strong>ID Number:</strong> {profile.id_number || 'Not provided'}</p>
            <p><strong>Phone:</strong> {profile.phone_number || 'Not provided'}</p>
          </div>

          <form onSubmit={uploadPic} className="w-full border-t pt-4">
            <label className="block text-sm font-bold mb-2">Update Profile Picture</label>
            <input type="file" onChange={e => setProfilePic(e.target.files[0])} className="mb-2 text-sm w-full" required />
            <button type="submit" className="bg-muranga-green text-white w-full py-2 rounded font-bold">Upload New Picture</button>
          </form>
        </div>
      )}

      {/* WORK COMPLETION MODAL */}
      {selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-96">
            <h2 className="text-lg font-bold mb-4">Complete Task: {selectedTask.category}</h2>
            <form onSubmit={submitWork} className="space-y-3">
              <textarea required value={workNotes} onChange={e => setWorkNotes(e.target.value)} placeholder="Enter resolution notes (what was done?)..." className="w-full border p-2 rounded" rows="3" />
              <div>
                <label className="block text-sm mb-1">Upload Evidence Photo</label>
                <input type="file" onChange={e => setEvidenceFile(e.target.files[0])} className="w-full text-sm" />
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button type="button" onClick={() => setSelectedTask(null)} className="px-4 py-2 border rounded">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-muranga-green text-white rounded font-bold">Submit to Admin</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}