import { useState, useEffect } from 'react';
import api from '../api/axios';

export default function SupportBubble() {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState('chat'); // 'chat', 'contact', 'history'
  const [messages, setMessages] = useState([{ sender: 'ai', text: 'Hello! I am the Civic Link AI. How can I help you today?' }]);
  const [input, setInput] = useState('');
  const [departments, setDepartments] = useState([]);
  const [form, setForm] = useState({ name: '', email: '', phone: '', department: '', question: '' });
  
  // History states
  const [searchEmail, setSearchEmail] = useState('');
  const [myTickets, setMyTickets] = useState([]);

  useEffect(() => {
    if (view === 'contact') api.get('/api/departments').then(res => setDepartments(res.data)).catch(console.error);
  }, [view]);

  const handleSend = (e) => {
    e.preventDefault(); if (!input.trim()) return;
    const userMsg = input.toLowerCase();
    setMessages([...messages, { sender: 'user', text: input }]);
    setInput('');
    setTimeout(() => {
      let aiResponse = "I'm not sure about that. Click the headset icon 🎧 to leave a message for our agents, or click the search icon 🔍 to check replies.";
      if (userMsg.includes('how to report')) aiResponse = 'Go to your Dashboard, fill out the form, attach a photo, and click Submit.';
      setMessages((prev) => [...prev, { sender: 'ai', text: aiResponse }]);
    }, 800);
  };

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/support', form);
      alert('Message sent to agent! You will get a reply soon.');
      setForm({ name: '', email: '', phone: '', department: '', question: '' }); // Clear form
      setView('chat'); 
    } catch (err) { alert('Failed to send message.'); }
  };

  const fetchMyTickets = async (e) => {
    e.preventDefault();
    try {
      const res = await api.get(`/api/support/my-messages?email=${searchEmail}`);
      setMyTickets(res.data);
    } catch (err) { alert('Error fetching messages'); }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {isOpen && (
        // Changed h-[450px] to h-112.5
        <div className="bg-white w-80 rounded-lg shadow-2xl border border-gray-200 mb-4 flex flex-col h-112.5">
          <div className="bg-muranga-green text-white p-3 rounded-t-lg flex justify-between items-center">
            <h3 className="font-bold">Civic Link Support</h3>
            <button onClick={() => setIsOpen(false)} className="text-white font-bold">✕</button>
          </div>
          
          <div className="flex-1 p-3 overflow-y-auto bg-gray-50 flex flex-col gap-2">
            {view === 'chat' && messages.map((msg, i) => (
              <div key={i} className={`p-2 rounded-lg max-w-[80%] text-sm ${msg.sender === 'ai' ? 'bg-muranga-light text-muranga-dark self-start' : 'bg-blue-600 text-white self-end'}`}>{msg.text}</div>
            ))}

            {view === 'contact' && (
              <form onSubmit={handleContactSubmit} className="text-sm space-y-2 p-1">
                <p className="font-bold text-muranga-dark">Leave your details for an Agent:</p>
                <input type="text" required placeholder="Full Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full border p-1 rounded" />
                <input type="email" required placeholder="Email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full border p-1 rounded" />
                <input type="tel" required placeholder="Phone (WhatsApp)" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full border p-1 rounded" />
                <select value={form.department} onChange={e => setForm({...form, department: e.target.value})} className="w-full border p-1 rounded text-gray-600">
                  <option value="">Select Department (Optional)</option>
                  {departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                </select>
                <textarea required placeholder="Your Question..." value={form.question} onChange={e => setForm({...form, question: e.target.value})} className="w-full border p-1 rounded" rows="2"></textarea>
                <button type="submit" className="w-full bg-muranga-green text-white py-1 rounded font-bold">Send to Agent</button>
                <button type="button" onClick={() => setView('chat')} className="text-xs text-gray-500 underline w-full text-center">Cancel</button>
              </form>
            )}

            {view === 'history' && (
              <div className="text-sm space-y-3 p-1">
                <p className="font-bold text-muranga-dark">Check Your Replies:</p>
                <form onSubmit={fetchMyTickets} className="flex gap-1">
                  <input type="email" required placeholder="Enter your email" value={searchEmail} onChange={e => setSearchEmail(e.target.value)} className="flex-1 border p-1 rounded" />
                  <button type="submit" className="bg-muranga-green text-white px-2 rounded text-xs font-bold">Search</button>
                </form>
                <div className="max-h-40 overflow-y-auto space-y-2 mt-2">
                  {myTickets.length === 0 ? <p className="text-xs text-gray-500 text-center">No messages found.</p> : myTickets.map(t => (
                    <div key={t.id} className="border p-2 rounded bg-white shadow-sm">
                      <p className="text-xs text-gray-500 mb-1">Q: {t.question}</p>
                      {t.reply_text ? (
                        <div className="bg-green-50 p-2 rounded border border-green-200 mt-1">
                          <p className="text-xs font-bold text-green-800">Reply from {t.replied_by || 'Admin'}:</p>
                          <p className="text-xs text-green-700">{t.reply_text}</p>
                        </div>
                      ) : <p className="text-xs text-yellow-600 italic">Pending reply...</p>}
                    </div>
                  ))}
                </div>
                <button onClick={() => setView('chat')} className="text-xs text-gray-500 underline w-full text-center mt-2">Back to Chat</button>
              </div>
            )}
          </div>

          {view === 'chat' && (
            <form onSubmit={handleSend} className="p-2 border-t flex gap-2 bg-white">
              <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask..." className="flex-1 border rounded px-2 py-1 text-sm focus:outline-none" />
              <button type="submit" className="bg-muranga-green text-white px-3 py-1 rounded text-sm font-bold">Send</button>
            </form>
          )}

          <div className="bg-gray-100 p-2 flex justify-center gap-4 text-lg border-t rounded-b-lg">
            <a href="https://wa.me/254700000000" target="_blank" rel="noreferrer" className="hover:scale-110 transition">🟢</a>
            <button onClick={() => setView('history')} title="Check Replies" className="hover:scale-110 transition">🔍</button>
            <button onClick={() => setView('contact')} title="Talk to Agent" className="hover:scale-110 transition">🎧</button>
          </div>
        </div>
      )}
      <button onClick={() => setIsOpen(!isOpen)} className="bg-muranga-green text-white w-14 h-14 rounded-full shadow-xl flex items-center justify-center text-2xl hover:bg-muranga-dark transition">{isOpen ? '✕' : '💬'}</button>
    </div>
  );
}