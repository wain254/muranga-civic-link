import { useState, useEffect } from 'react';
import api from '../api/axios';

export default function NotificationBubble() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    api.get('/api/notifications').then(res => setNotifications(res.data)).catch(console.error);
  }, []);

  return (
    <div className="fixed bottom-24 right-6 z-50 flex flex-col items-end">
      {isOpen && (
        <div className="bg-white w-80 rounded-lg shadow-2xl border border-gray-200 mb-4 flex flex-col overflow-hidden">
          <div className="bg-muranga-gold text-muranga-dark p-3 flex justify-between items-center font-bold">
            <h3>County Announcements</h3>
            <button onClick={() => setIsOpen(false)} className="hover:text-white font-bold">✕</button>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-500">No new announcements.</div>
            ) : (
              notifications.map((n) => (
                <div key={n.id} className="p-3 border-b hover:bg-gray-50 transition">
                  <h4 className="font-bold text-sm text-muranga-dark mb-1">{n.title}</h4>
                  <p className="text-xs text-gray-600">{n.message}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
      <button onClick={() => setIsOpen(!isOpen)} className="bg-muranga-gold text-muranga-dark w-12 h-12 rounded-full shadow-xl flex items-center justify-center text-xl hover:bg-yellow-400 transition relative">
        🔔
      </button>
    </div>
  );
}