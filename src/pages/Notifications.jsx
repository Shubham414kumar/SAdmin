import { useState, useEffect } from 'react';
import { Bell, Send, Filter, Clock, Users, CheckCircle, X } from 'lucide-react';
import axios from 'axios';

const EXAM_CATEGORIES = ['SSC', 'Railway', 'Banking', 'Defence', 'Teaching', 'UPSC', 'State', 'JEE', 'NEET', 'CUET'];
const ALERT_TYPES = ['newVacancies', 'results', 'admitCards', 'deadlines'];

export default function NotificationManagement() {
    const [form, setForm] = useState({ title: '', body: '', examCategory: 'All', alertType: 'newVacancies' });
    const [history, setHistory] = useState([]);
    const [sending, setSending] = useState(false);
    const [loading, setLoading] = useState(true);
    const [success, setSuccess] = useState('');

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('adminToken');
            const res = await axios.get('http://localhost:5000/api/notifications/history', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setHistory(res.data);
        } catch (error) {
            console.error('Failed to fetch history:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSend = async () => {
        if (!form.title || !form.body) return alert('Title and Body are required');
        setSending(true);
        try {
            const token = localStorage.getItem('adminToken');
            const response = await axios.post('http://localhost:5000/api/notifications/send',
                {
                    title: form.title,
                    body: form.body,
                    examCategory: form.examCategory === 'All' ? undefined : form.examCategory,
                    alertType: form.alertType
                }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const sentCount = response.data.sent;

            const newEntry = {
                _id: Date.now(),
                title: form.title,
                body: form.body,
                examCategory: form.examCategory,
                alertType: form.alertType,
                sentAt: new Date().toISOString(),
                devices: sentCount,
            };
            setHistory([newEntry, ...history]);
            setForm({ ...form, title: '', body: '' }); // keep target filters
            setSuccess(`Notification sent to ${sentCount} devices!`);
            setTimeout(() => setSuccess(''), 3000);
        } catch (error) {
            console.error(error);
            alert('Failed to send push notifications. Check server connection.');
        } finally {
            setSending(false);
        }
    };

    const getTypeLabel = (type) => {
        const map = { newVacancies: '🆕 New Vacancy', results: '📊 Result', admitCards: '🎫 Admit Card', deadlines: '⏰ Deadline' };
        return map[type] || type;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Bell size={24} className="text-amber-400" /> Notification Center
                </h2>
                <p className="text-slate-400">Broadcast notifications to users by exam category</p>
            </div>

            {success && (
                <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-4 py-3 rounded-xl">
                    <CheckCircle size={18} /> {success}
                </div>
            )}

            {/* Compose Form */}
            <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 space-y-4">
                <h3 className="text-lg font-bold text-white">📤 Compose Notification</h3>

                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Title</label>
                    <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. 🆕 SSC CGL 2026 Applications Open"
                        className="w-full bg-slate-900 border border-slate-700 text-white px-4 py-2.5 rounded-lg focus:border-indigo-500 focus:outline-none" />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Body</label>
                    <textarea value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} rows={3} placeholder="Notification message body..."
                        className="w-full bg-slate-900 border border-slate-700 text-white px-4 py-2.5 rounded-lg focus:border-indigo-500 focus:outline-none resize-none" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Target Exam Category</label>
                        <select value={form.examCategory} onChange={e => setForm({ ...form, examCategory: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-700 text-white px-4 py-2.5 rounded-lg focus:border-indigo-500 focus:outline-none">
                            <option value="All">All Categories</option>
                            {EXAM_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Alert Type</label>
                        <select value={form.alertType} onChange={e => setForm({ ...form, alertType: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-700 text-white px-4 py-2.5 rounded-lg focus:border-indigo-500 focus:outline-none">
                            {ALERT_TYPES.map(t => <option key={t} value={t}>{getTypeLabel(t)}</option>)}
                        </select>
                    </div>
                </div>

                <button onClick={handleSend} disabled={sending}
                    className={`flex items-center px-6 py-2.5 rounded-xl font-semibold transition-colors ${sending ? 'bg-slate-600 text-slate-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}>
                    <Send size={16} className="mr-2" />
                    {sending ? 'Sending...' : 'Send Notification'}
                </button>
            </div>

            {/* History */}
            <div className="bg-slate-800 rounded-2xl border border-slate-700">
                <div className="px-6 py-4 border-b border-slate-700">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Clock size={18} className="text-slate-400" /> Sent History
                    </h3>
                </div>
                <div className="divide-y divide-slate-700">
                    {loading ? (
                        <div className="p-8 text-center text-slate-500">Loading history...</div>
                    ) : history.length === 0 ? (
                        <div className="p-8 text-center text-slate-500">No push notifications sent yet.</div>
                    ) : history.map(item => (
                        <div key={item._id} className="px-6 py-4 hover:bg-slate-700/30 transition-colors">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <p className="text-white font-semibold text-sm">{item.title}</p>
                                    <p className="text-slate-400 text-xs mt-1">{item.body}</p>
                                    <div className="flex items-center gap-3 mt-2">
                                        <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 text-xs font-bold rounded">{item.examCategory || 'All'}</span>
                                        <span className="text-slate-500 text-xs">{getTypeLabel(item.alertType)}</span>
                                        <span className="flex items-center text-slate-500 text-xs">
                                            <Users size={12} className="mr-1" /> {item.devices} devices
                                        </span>
                                    </div>
                                </div>
                                <span className="text-slate-500 text-xs whitespace-nowrap ml-4">
                                    {new Date(item.sentAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
