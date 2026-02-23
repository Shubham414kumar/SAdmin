import { useState, useEffect } from 'react';
import { Briefcase, Plus, Search, Edit2, Trash2, Bell, X, Save, Filter } from 'lucide-react';
import { fetchVacancies as apiFetchVacancies, createVacancy, updateVacancy, deleteVacancy } from '../api';
import axios from 'axios';

const EXAM_CATEGORIES = ['SSC', 'Railway', 'Banking', 'Defence', 'Teaching', 'UPSC', 'State', 'JEE', 'NEET', 'CUET'];
const STATUS_OPTIONS = ['Active', 'Upcoming', 'Closed'];

const emptyForm = {
    title: '', organization: '', examCategory: 'SSC',
    lastDate: '', admitCardDate: '', examDate: '', resultDate: '',
    vacancies: 0, status: 'Active', eligibility: '', salary: '', applyUrl: ''
};

export default function VacancyManagement() {
    const [vacancies, setVacancies] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editId, setEditId] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [search, setSearch] = useState('');
    const [filterCat, setFilterCat] = useState('All');
    const [notifyId, setNotifyId] = useState(null);
    const [notifyMsg, setNotifyMsg] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchVacancies();
    }, []);

    const fetchVacancies = async () => {
        try {
            setLoading(true);
            const data = await apiFetchVacancies();
            setVacancies(data);
        } catch (error) {
            console.error("Failed to fetch vacancies:", error);
            alert("Failed to load vacancies from server.");
        } finally {
            setLoading(false);
        }
    };

    const filtered = vacancies.filter(v => {
        const matchSearch = v.title?.toLowerCase().includes(search.toLowerCase()) || v.organization?.toLowerCase().includes(search.toLowerCase());
        const matchCat = filterCat === 'All' || v.examCategory === filterCat;
        return matchSearch && matchCat;
    });

    const openAdd = () => { setForm(emptyForm); setEditId(null); setShowModal(true); };

    // Format dates for input fields (YYYY-MM-DD)
    const openEdit = (v) => {
        const formattedForm = { ...v };
        ['lastDate', 'admitCardDate', 'examDate', 'resultDate'].forEach(field => {
            if (formattedForm[field]) {
                formattedForm[field] = new Date(formattedForm[field]).toISOString().split('T')[0];
            } else {
                formattedForm[field] = '';
            }
        });
        setForm(formattedForm);
        setEditId(v._id);
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (confirm('Delete this vacancy?')) {
            try {
                await deleteVacancy(id);
                setVacancies(vacancies.filter(v => v._id !== id));
            } catch (error) {
                console.error("Delete error:", error);
                alert("Failed to delete vacancy.");
            }
        }
    };

    const handleSave = async () => {
        if (!form.title || !form.organization) return alert('Title and Organization are required');

        try {
            // Clean empty dates before sending
            const submitData = { ...form };
            ['lastDate', 'admitCardDate', 'examDate', 'resultDate'].forEach(field => {
                if (!submitData[field]) delete submitData[field];
            });

            if (editId) {
                await updateVacancy(editId, submitData);
            } else {
                await createVacancy(submitData);
            }

            fetchVacancies(); // Refresh list
            setShowModal(false);
        } catch (error) {
            console.error("Save error:", error);
            alert("Failed to save vacancy.");
        }
    };

    const handleNotify = (v) => {
        setNotifyId(v._id);
        setForm({ ...form, title: v.title, examCategory: v.examCategory });
        setNotifyMsg(`🆕 New Vacancy: ${v.title}\n${v.organization} | ${v.vacancies > 0 ? v.vacancies + ' Posts' : v.salary}\nLast Date: ${v.lastDate ? new Date(v.lastDate).toLocaleDateString() : 'N/A'}`);
    };

    const sendNotification = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('adminToken');
            const response = await axios.post('http://localhost:5000/api/notifications/send', {
                title: form.title || 'New Vacancy Alert',
                body: notifyMsg,
                examCategory: form.examCategory,
                alertType: 'newVacancies'
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            alert(`Success! Notification sent to ${response.data.sent} devices.`);
            setNotifyId(null);
            setNotifyMsg('');
        } catch (e) {
            console.error(e);
            alert('Failed to send notification. Please check server connection.');
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        if (status === 'Active') return 'bg-emerald-500/20 text-emerald-400';
        if (status === 'Upcoming') return 'bg-amber-500/20 text-amber-400';
        return 'bg-red-500/20 text-red-400';
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Briefcase size={24} className="text-indigo-400" /> Vacancy Management
                    </h2>
                    <p className="text-slate-400">Create, edit, and manage government vacancies</p>
                </div>
                <button onClick={openAdd} className="flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors">
                    <Plus size={20} className="mr-2" /> Add Vacancy
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 bg-slate-800 p-4 rounded-xl border border-slate-700">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text" value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="Search vacancies..."
                        className="w-full bg-slate-900 border border-slate-700 text-white pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:border-indigo-500"
                    />
                </div>
                <select value={filterCat} onChange={e => setFilterCat(e.target.value)} className="bg-slate-900 border border-slate-700 text-slate-300 px-4 py-2 rounded-lg focus:outline-none focus:border-indigo-500">
                    <option value="All">All Categories</option>
                    {EXAM_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Total', value: vacancies.length, color: 'indigo' },
                    { label: 'Active', value: vacancies.filter(v => v.status === 'Active').length, color: 'emerald' },
                    { label: 'Upcoming', value: vacancies.filter(v => v.status === 'Upcoming').length, color: 'amber' },
                    { label: 'Closed', value: vacancies.filter(v => v.status === 'Closed').length, color: 'red' },
                ].map(s => (
                    <div key={s.label} className={`bg-slate-800 border border-slate-700 rounded-xl p-4`}>
                        <p className="text-slate-400 text-sm">{s.label}</p>
                        <p className={`text-2xl font-bold text-${s.color}-400`}>{s.value}</p>
                    </div>
                ))}
            </div>

            {/* Table */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-700">
                                {['Title', 'Category', 'Posts', 'Last Date', 'Status', 'Actions'].map(h => (
                                    <th key={h} className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700">
                            {loading ? (
                                <tr><td colSpan="6" className="p-8 text-center text-slate-500">Loading vacancies...</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan="6" className="p-8 text-center text-slate-500">No vacancies found</td></tr>
                            ) : filtered.map(v => (
                                <tr key={v._id} className="hover:bg-slate-700/50 transition-colors">
                                    <td className="px-4 py-3">
                                        <p className="text-white font-semibold text-sm">{v.title}</p>
                                        <p className="text-slate-500 text-xs">{v.organization}</p>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="px-2 py-1 bg-indigo-500/10 text-indigo-400 text-xs font-bold rounded">{v.examCategory}</span>
                                    </td>
                                    <td className="px-4 py-3 text-slate-300 text-sm">{v.vacancies > 0 ? v.vacancies.toLocaleString() : '—'}</td>
                                    <td className="px-4 py-3 text-slate-300 text-sm">{v.lastDate ? new Date(v.lastDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}</td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-1 text-xs font-bold rounded ${getStatusBadge(v.status)}`}>{v.status}</span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => openEdit(v)} className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors" title="Edit">
                                                <Edit2 size={15} />
                                            </button>
                                            <button onClick={() => handleNotify(v)} className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors" title="Send Notification">
                                                <Bell size={15} />
                                            </button>
                                            <button onClick={() => handleDelete(v._id)} className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors" title="Delete">
                                                <Trash2 size={15} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-4 border-b border-slate-700">
                            <h3 className="text-lg font-bold text-white">{editId ? 'Edit Vacancy' : 'Add New Vacancy'}</h3>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white"><X size={20} /></button>
                        </div>
                        <div className="p-6 space-y-6">
                            {/* Basic Details */}
                            <div className="space-y-4">
                                <h4 className="text-sm font-bold text-indigo-400 uppercase tracking-wider">Basic Details</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-400 mb-1">Title *</label>
                                        <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. SSC CGL 2026"
                                            className="w-full bg-slate-900 border border-slate-700 text-white px-3 py-2 rounded-lg focus:border-indigo-500 focus:outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-400 mb-1">Organization *</label>
                                        <input type="text" value={form.organization} onChange={e => setForm({ ...form, organization: e.target.value })} placeholder="e.g. Staff Selection Commission"
                                            className="w-full bg-slate-900 border border-slate-700 text-white px-3 py-2 rounded-lg focus:border-indigo-500 focus:outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-400 mb-1">Exam Category *</label>
                                        <select value={form.examCategory} onChange={e => setForm({ ...form, examCategory: e.target.value })}
                                            className="w-full bg-slate-900 border border-slate-700 text-white px-3 py-2 rounded-lg focus:border-indigo-500 focus:outline-none">
                                            {EXAM_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-400 mb-1">Status</label>
                                        <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                                            className="w-full bg-slate-900 border border-slate-700 text-white px-3 py-2 rounded-lg focus:border-indigo-500 focus:outline-none">
                                            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-400 mb-1">Eligibility</label>
                                        <input type="text" value={form.eligibility} onChange={e => setForm({ ...form, eligibility: e.target.value })} placeholder="e.g. Graduate"
                                            className="w-full bg-slate-900 border border-slate-700 text-white px-3 py-2 rounded-lg focus:border-indigo-500 focus:outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-400 mb-1">No. of Vacancies</label>
                                        <input type="number" value={form.vacancies} onChange={e => setForm({ ...form, vacancies: parseInt(e.target.value) || 0 })}
                                            className="w-full bg-slate-900 border border-slate-700 text-white px-3 py-2 rounded-lg focus:border-indigo-500 focus:outline-none" />
                                    </div>
                                </div>
                            </div>

                            {/* Important Dates */}
                            <div className="space-y-4">
                                <h4 className="text-sm font-bold text-amber-400 uppercase tracking-wider">Important Dates</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-400 mb-1">Application Last Date *</label>
                                        <input type="date" value={form.lastDate} onChange={e => setForm({ ...form, lastDate: e.target.value })}
                                            className="w-full bg-slate-900 border border-slate-700 text-white px-3 py-2 rounded-lg focus:border-indigo-500 focus:outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-400 mb-1">Admit Card Date (Optional)</label>
                                        <input type="date" value={form.admitCardDate} onChange={e => setForm({ ...form, admitCardDate: e.target.value })}
                                            className="w-full bg-slate-900 border border-slate-700 text-white px-3 py-2 rounded-lg focus:border-indigo-500 focus:outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-400 mb-1">Exam Date (Optional)</label>
                                        <input type="date" value={form.examDate} onChange={e => setForm({ ...form, examDate: e.target.value })}
                                            className="w-full bg-slate-900 border border-slate-700 text-white px-3 py-2 rounded-lg focus:border-indigo-500 focus:outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-400 mb-1">Result Date (Optional)</label>
                                        <input type="date" value={form.resultDate} onChange={e => setForm({ ...form, resultDate: e.target.value })}
                                            className="w-full bg-slate-900 border border-slate-700 text-white px-3 py-2 rounded-lg focus:border-indigo-500 focus:outline-none" />
                                    </div>
                                </div>
                            </div>

                            {/* Additional Info */}
                            <div className="space-y-4">
                                <h4 className="text-sm font-bold text-emerald-400 uppercase tracking-wider">Additional Info</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-400 mb-1">Salary / Pay Scale</label>
                                        <input type="text" value={form.salary} onChange={e => setForm({ ...form, salary: e.target.value })} placeholder="e.g. ₹25,500 - ₹81,100"
                                            className="w-full bg-slate-900 border border-slate-700 text-white px-3 py-2 rounded-lg focus:border-indigo-500 focus:outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-400 mb-1">Apply URL</label>
                                        <input type="text" value={form.applyUrl} onChange={e => setForm({ ...form, applyUrl: e.target.value })} placeholder="https://..."
                                            className="w-full bg-slate-900 border border-slate-700 text-white px-3 py-2 rounded-lg focus:border-indigo-500 focus:outline-none" />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 p-4 border-t border-slate-700">
                            <button onClick={() => setShowModal(false)} className="px-4 py-2 text-slate-400 hover:text-white transition-colors">Cancel</button>
                            <button onClick={handleSave} disabled={loading} className="flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-700 text-white rounded-xl transition-colors">
                                <Save size={16} className="mr-2" /> {editId ? 'Update' : 'Create'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Notify Modal */}
            {notifyId && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-md">
                        <div className="flex items-center justify-between p-4 border-b border-slate-700">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2"><Bell size={18} className="text-amber-400" /> Send Notification</h3>
                            <button onClick={() => setNotifyId(null)} className="text-slate-400 hover:text-white"><X size={20} /></button>
                        </div>
                        <div className="p-4">
                            <label className="block text-sm font-medium text-slate-400 mb-2">Notification Message</label>
                            <textarea value={notifyMsg} onChange={e => setNotifyMsg(e.target.value)} rows={4}
                                className="w-full bg-slate-900 border border-slate-700 text-white px-3 py-2 rounded-lg focus:border-indigo-500 focus:outline-none resize-none" />
                            <p className="text-slate-500 text-xs mt-2">This will be sent to all users subscribed to the matching exam category.</p>
                        </div>
                        <div className="flex justify-end gap-3 p-4 border-t border-slate-700">
                            <button onClick={() => setNotifyId(null)} className="px-4 py-2 text-slate-400 hover:text-white">Cancel</button>
                            <button onClick={sendNotification} className="flex items-center px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl transition-colors">
                                <Bell size={16} className="mr-2" /> Send to Users
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
