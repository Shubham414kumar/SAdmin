import React, { useState, useEffect } from 'react';
import { Plus, Trash2, ExternalLink, FileText, CheckCircle, UploadCloud, X } from 'lucide-react';
import { fetchAdmitCards, createAdmitCard, deleteAdmitCard, uploadFile } from '../api';

const CATEGORY_OPTIONS = ['SSC', 'Railway', 'Banking', 'Defence', 'Teaching', 'UPSC', 'State', 'JEE', 'NEET'];

export default function AdmitCards() {
    const [cards, setCards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    const [formData, setFormData] = useState({
        examName: '', examDate: '', releaseDate: '', status: 'Upcoming',
        examCategory: CATEGORY_OPTIONS[0]
    });

    const [file, setFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadSuccess, setUploadSuccess] = useState(false);

    useEffect(() => {
        loadCards();
    }, []);

    const loadCards = async () => {
        try {
            setLoading(true);
            const data = await fetchAdmitCards();
            setCards(data);
        } catch (err) {
            console.error('Failed to load cards:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setIsUploading(true);
        setUploadSuccess(false);

        try {
            let externalUrl = '';

            // If an Admin uploaded a PDF, stream it to Cloudinary first
            if (file) {
                const uploadRes = await uploadFile(file);
                externalUrl = uploadRes.url;
            }

            // Create Admit Card document in Mongoose
            await createAdmitCard({
                ...formData,
                downloadUrl: externalUrl
            });

            setUploadSuccess(true);

            setTimeout(() => {
                setShowModal(false);
                loadCards();
                setFormData({ examName: '', examDate: '', releaseDate: '', status: 'Upcoming', examCategory: CATEGORY_OPTIONS[0] });
                setFile(null);
            }, 2000);

        } catch (err) {
            console.error(err);
            alert('Error creating admit card. Check console.');
        } finally {
            setIsUploading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you certain you want to delete this Admit Card?')) return;
        try {
            await deleteAdmitCard(id);
            loadCards();
        } catch (err) {
            console.error(err);
            alert('Error deleting admit card.');
        }
    }

    const openAddModal = () => {
        setUploadSuccess(false);
        setFile(null);
        setFormData({ examName: '', examDate: '', releaseDate: '', status: 'Upcoming', examCategory: CATEGORY_OPTIONS[0] });
        setShowModal(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-white">Admit Cards</h1>
                    <p className="text-slate-400">Manage and upload admit card PDFs securely</p>
                </div>
                <button onClick={openAddModal} className="bg-indigo-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-indigo-700 transition-colors">
                    <Plus size={20} /> Add New
                </button>
            </div>

            <div className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700 shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-900/50 border-b border-slate-700">
                            <tr>
                                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Exam Details</th>
                                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Category</th>
                                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Release Date</th>
                                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700">
                            {loading ? (
                                <tr><td colSpan="5" className="p-8 text-center text-slate-500">Loading records...</td></tr>
                            ) : cards.length === 0 ? (
                                <tr><td colSpan="5" className="p-8 text-center text-slate-500">No admit cards found</td></tr>
                            ) : cards.map(card => (
                                <tr key={card._id} className="hover:bg-slate-700/50 transition-colors">
                                    <td className="p-4">
                                        <p className="text-white font-semibold">{card.examName}</p>
                                        <p className="text-slate-500 text-xs">Exams: {card.examDate}</p>
                                    </td>
                                    <td className="p-4">
                                        <span className="px-2 py-1 bg-indigo-500/10 text-indigo-400 text-xs font-bold rounded">
                                            {card.examCategory || 'General'}
                                        </span>
                                    </td>
                                    <td className="p-4 text-slate-300 text-sm">{card.releaseDate}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded-md text-xs font-bold ${card.status === 'Released' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                                            {card.status}
                                        </span>
                                    </td>
                                    <td className="p-4 flex gap-3 justify-end items-center">
                                        {card.downloadUrl && (
                                            <a href={card.downloadUrl} target="_blank" rel="noreferrer" className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors" title="Download PDF">
                                                <ExternalLink size={18} />
                                            </a>
                                        )}
                                        <button onClick={() => handleDelete(card._id)} className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors" title="Delete Entry">
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-lg border border-slate-700 shadow-2xl">

                        <div className="flex justify-between items-center mb-6 border-b border-slate-700 pb-4">
                            <h2 className="text-xl font-bold flex items-center text-white">
                                <FileText className="mr-2 text-indigo-400" />
                                Publish Admit Card
                            </h2>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        {uploadSuccess ? (
                            <div className="flex flex-col items-center justify-center py-8">
                                <CheckCircle size={48} className="text-emerald-500 mb-4" />
                                <p className="text-white text-lg font-bold">Publish Successful!</p>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-slate-300 mb-1">Exam Name</label>
                                        <input
                                            placeholder="e.g. SSC CGL 2026 Tier-1" required
                                            className="w-full bg-slate-900 border border-slate-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-indigo-500"
                                            value={formData.examName} onChange={e => setFormData({ ...formData, examName: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-1">Testing Dates</label>
                                        <input
                                            placeholder="e.g. 24-30 Jan" required
                                            className="w-full bg-slate-900 border border-slate-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-indigo-500"
                                            value={formData.examDate} onChange={e => setFormData({ ...formData, examDate: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-1">Category</label>
                                        <select
                                            className="w-full bg-slate-900 border border-slate-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-indigo-500"
                                            value={formData.examCategory} onChange={e => setFormData({ ...formData, examCategory: e.target.value })}
                                        >
                                            {CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-1">Release Date</label>
                                        <input
                                            placeholder="e.g. Today" required
                                            type="date"
                                            className="w-full bg-slate-900 border border-slate-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-indigo-500"
                                            value={formData.releaseDate} onChange={e => setFormData({ ...formData, releaseDate: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-1">Status</label>
                                        <select
                                            className="w-full bg-slate-900 border border-slate-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-indigo-500"
                                            value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}
                                        >
                                            <option value="Upcoming">Upcoming</option>
                                            <option value="Released">Released</option>
                                        </select>
                                    </div>

                                    <div className="md:col-span-2 mt-2">
                                        <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center">
                                            <UploadCloud size={16} className="text-indigo-400 mr-2" />
                                            Upload Admit Card PDF (Optional)
                                        </label>
                                        <input
                                            type="file" accept="application/pdf"
                                            onChange={e => setFile(e.target.files[0])}
                                            className="w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-indigo-500/20 file:text-indigo-300 hover:file:bg-indigo-500/30 cursor-pointer"
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-3 pt-4 border-t border-slate-700">
                                    <button
                                        type="submit"
                                        disabled={isUploading}
                                        className={`w-full py-3 rounded-xl flex items-center justify-center text-white font-bold transition-all ${isUploading ? 'bg-slate-700 cursor-not-allowed text-slate-400' : 'bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-600/20'
                                            }`}
                                    >
                                        {isUploading ? (
                                            <>
                                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                                Publishing...
                                            </>
                                        ) : (
                                            'Save Admit Card'
                                        )}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
