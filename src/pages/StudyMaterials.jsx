import React, { useState, useEffect } from 'react';
import { Book, FileText, CheckCircle, UploadCloud, FileType2, Plus, X, Trash2 } from 'lucide-react';
import { fetchBooks, createBook, deleteBook, fetchSyllabus, createSyllabus, deleteSyllabus, fetchPYQs, createPYQ, deletePYQ, uploadFile } from '../api';

const CLASS_OPTIONS = ['9', '10', '11', '12', 'dropper'];
const BOOK_CATEGORIES = ['NCERT', 'Reference', 'Notes'];

export default function StudyMaterials() {
    const [activeTab, setActiveTab] = useState('books'); // 'books', 'syllabus', 'pyqs'
    const [loading, setLoading] = useState(true);

    // Lists
    const [books, setBooks] = useState([]);
    const [syllabus, setSyllabus] = useState([]);
    const [pyqs, setPyqs] = useState([]);

    // Modal
    const [showModal, setShowModal] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');

    // Form states
    const [bookForm, setBookForm] = useState({ title: '', author: '', description: '', class: '10', subject: '', category: 'NCERT' });
    const [bookCoverFile, setBookCoverFile] = useState(null);
    const [bookPdfFile, setBookPdfFile] = useState(null);

    const [syllabusForm, setSyllabusForm] = useState({ examGoal: '', subject: '', topics: '' });
    const [syllabusPdfFile, setSyllabusPdfFile] = useState(null);

    const [pyqForm, setPyqForm] = useState({ exam: '', year: new Date().getFullYear(), subject: '' });
    const [pyqPaperFile, setPyqPaperFile] = useState(null);
    const [pyqSolutionFile, setPyqSolutionFile] = useState(null);

    useEffect(() => {
        loadData();
    }, [activeTab]);

    const loadData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'books') setBooks(await fetchBooks());
            if (activeTab === 'syllabus') setSyllabus(await fetchSyllabus());
            if (activeTab === 'pyqs') setPyqs(await fetchPYQs());
        } catch (error) {
            console.error('Fetching error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateBook = async (e) => {
        e.preventDefault();
        if (!bookCoverFile || !bookPdfFile) return alert('Cover image & PDF required.');
        setUploading(true);
        try {
            const coverRes = await uploadFile(bookCoverFile);
            const pdfRes = await uploadFile(bookPdfFile);
            await createBook({ ...bookForm, coverImage: coverRes.url, pdfUrl: pdfRes.url });

            setSuccessMsg('Book added successfully');
            closeModalAndReload();
        } catch (err) { console.error(err); alert('Error adding book'); }
        finally { setUploading(false); }
    };

    const handleCreateSyllabus = async (e) => {
        e.preventDefault();
        if (!syllabusPdfFile) return alert('PDF required.');
        setUploading(true);
        try {
            const pdfRes = await uploadFile(syllabusPdfFile);
            const topicsArray = syllabusForm.topics.split(',').map(t => t.trim()).filter(Boolean);
            await createSyllabus({ ...syllabusForm, topics: topicsArray, pdfUrl: pdfRes.url });

            setSuccessMsg('Syllabus added successfully');
            closeModalAndReload();
        } catch (err) { console.error(err); alert('Error adding syllabus'); }
        finally { setUploading(false); }
    };

    const handleCreatePYQ = async (e) => {
        e.preventDefault();
        if (!pyqPaperFile) return alert('Question Paper PDF required.');
        setUploading(true);
        try {
            const paperRes = await uploadFile(pyqPaperFile);
            let solUrl = '';
            if (pyqSolutionFile) {
                const solRes = await uploadFile(pyqSolutionFile);
                solUrl = solRes.url;
            }
            await createPYQ({ ...pyqForm, questionPaperUrl: paperRes.url, solutionUrl: solUrl });

            setSuccessMsg('PYQ added successfully');
            closeModalAndReload();
        } catch (err) { console.error(err); alert('Error adding PYQ'); }
        finally { setUploading(false); }
    };

    const closeModalAndReload = () => {
        setTimeout(() => {
            setShowModal(false);
            setSuccessMsg('');
            loadData();
            // Reset forms
            setBookCoverFile(null); setBookPdfFile(null); setSyllabusPdfFile(null); setPyqPaperFile(null); setPyqSolutionFile(null);
            setBookForm({ title: '', author: '', description: '', class: '10', subject: '', category: 'NCERT' });
            setSyllabusForm({ examGoal: '', subject: '', topics: '' });
            setPyqForm({ exam: '', year: new Date().getFullYear(), subject: '' });
        }, 1500);
    };

    const handleDeleteItem = async (id, type) => {
        if (!window.confirm(`Are you sure you want to delete this ${type}?`)) return;
        try {
            if (type === 'book') await deleteBook(id);
            else if (type === 'syllabus') await deleteSyllabus(id);
            else if (type === 'pyq') await deletePYQ(id);

            // Reload silently
            loadData();
        } catch (error) {
            console.error(error);
            alert(`Failed to delete ${type}`);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-2">
                <div>
                    <h1 className="text-2xl font-bold text-white">Study Materials</h1>
                    <p className="text-slate-400">Manage Books, Syllabus, and Previous Year Questions</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg transition-colors"
                >
                    <Plus size={20} className="mr-2" />
                    Add {activeTab === 'books' ? 'Book' : activeTab === 'syllabus' ? 'Syllabus' : 'PYQ'}
                </button>
            </div>

            {/* Tabs */}
            <div className="flex space-x-2 bg-slate-800 p-1 rounded-xl w-fit border border-slate-700">
                {[
                    { id: 'books', name: 'Books & Resources', icon: Book },
                    { id: 'syllabus', name: 'Syllabi', icon: FileType2 },
                    { id: 'pyqs', name: 'PYQs (Old Papers)', icon: FileText }
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center px-4 py-2 rounded-lg font-medium transition-all ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                            }`}
                    >
                        <tab.icon size={16} className="mr-2" /> {tab.name}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden min-h-[400px]">
                {loading ? (
                    <div className="p-12 text-center text-slate-500">Loading {activeTab}...</div>
                ) : (
                    <div className="overflow-x-auto">
                        {activeTab === 'books' && (
                            <table className="w-full text-left">
                                <thead className="bg-slate-900/50 border-b border-slate-700 text-slate-400 uppercase text-xs font-bold">
                                    <tr><th className="p-4">Title</th><th className="p-4">Class & Subject</th><th className="p-4">Category</th><th className="p-4 text-right">Actions</th></tr>
                                </thead>
                                <tbody className="divide-y divide-slate-700">
                                    {books.map(b => (
                                        <tr key={b._id} className="hover:bg-slate-700/30">
                                            <td className="p-4 font-medium text-white flex items-center gap-3">
                                                <img src={b.coverImage} className="w-8 h-10 object-cover rounded" alt="Cover" />
                                                {b.title} <span className="text-xs text-slate-500 font-normal">by {b.author}</span>
                                            </td>
                                            <td className="p-4 text-slate-300">Class {b.class} - {b.subject}</td>
                                            <td className="p-4"><span className="px-2 py-1 bg-indigo-500/10 text-indigo-400 text-xs rounded font-bold">{b.category}</span></td>
                                            <td className="p-4 text-right">
                                                <button onClick={() => handleDeleteItem(b._id, 'book')} className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}

                        {activeTab === 'syllabus' && (
                            <table className="w-full text-left">
                                <thead className="bg-slate-900/50 border-b border-slate-700 text-slate-400 uppercase text-xs font-bold">
                                    <tr><th className="p-4">Exam Goal</th><th className="p-4">Subject</th><th className="p-4">Topics Covered</th><th className="p-4 text-right">Actions</th></tr>
                                </thead>
                                <tbody className="divide-y divide-slate-700">
                                    {syllabus.map(s => (
                                        <tr key={s._id} className="hover:bg-slate-700/30">
                                            <td className="p-4 font-bold text-white">{s.examGoal}</td>
                                            <td className="p-4 text-slate-300">{s.subject}</td>
                                            <td className="p-4 text-slate-400 text-sm truncate max-w-xs">{s.topics.join(', ')}</td>
                                            <td className="p-4 text-right">
                                                <button onClick={() => handleDeleteItem(s._id, 'syllabus')} className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}

                        {activeTab === 'pyqs' && (
                            <table className="w-full text-left">
                                <thead className="bg-slate-900/50 border-b border-slate-700 text-slate-400 uppercase text-xs font-bold">
                                    <tr><th className="p-4">Exam</th><th className="p-4">Year</th><th className="p-4">Subject</th><th className="p-4">Files</th><th className="p-4 text-right">Actions</th></tr>
                                </thead>
                                <tbody className="divide-y divide-slate-700">
                                    {pyqs.map(p => (
                                        <tr key={p._id} className="hover:bg-slate-700/30">
                                            <td className="p-4 font-bold text-white">{p.exam}</td>
                                            <td className="p-4 text-slate-300">{p.year}</td>
                                            <td className="p-4 text-slate-300">{p.subject || 'All Subjects'}</td>
                                            <td className="p-4 flex gap-2">
                                                <a href={p.questionPaperUrl} target="_blank" rel="noreferrer" className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-1 rounded">Q. Paper</a>
                                                {p.solutionUrl && <a href={p.solutionUrl} target="_blank" rel="noreferrer" className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-1 rounded">Solution</a>}
                                            </td>
                                            <td className="p-4 text-right">
                                                <button onClick={() => handleDeleteItem(p._id, 'pyq')} className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}
            </div>


            {/* Unified Uploading Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                    <div className="bg-slate-800 w-full max-w-2xl rounded-2xl border border-slate-700 shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto">
                        <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white"><X size={24} /></button>
                        <h2 className="text-xl font-bold text-white mb-6 uppercase tracking-wider flex items-center">
                            <UploadCloud className="mr-2 text-indigo-400" /> Upload {activeTab}
                        </h2>

                        {successMsg ? (
                            <div className="py-12 flex flex-col items-center">
                                <CheckCircle size={48} className="text-emerald-500 mb-4" />
                                <p className="text-xl text-white font-bold">{successMsg}</p>
                            </div>
                        ) : (
                            // Forms based on activeTab
                            <div className="space-y-4">

                                {activeTab === 'books' && (
                                    <form onSubmit={handleCreateBook} className="grid grid-cols-2 gap-4">
                                        <div className="col-span-2"><label className="block text-xs text-slate-400 mb-1">Book Title *</label><input required className="w-full bg-slate-900 border border-slate-700 text-white p-2 rounded focus:outline-none" value={bookForm.title} onChange={e => setBookForm({ ...bookForm, title: e.target.value })} /></div>
                                        <div><label className="block text-xs text-slate-400 mb-1">Author *</label><input required className="w-full bg-slate-900 border border-slate-700 text-white p-2 rounded focus:outline-none" value={bookForm.author} onChange={e => setBookForm({ ...bookForm, author: e.target.value })} /></div>
                                        <div><label className="block text-xs text-slate-400 mb-1">Subject *</label><input required className="w-full bg-slate-900 border border-slate-700 text-white p-2 rounded focus:outline-none" value={bookForm.subject} onChange={e => setBookForm({ ...bookForm, subject: e.target.value })} /></div>
                                        <div><label className="block text-xs text-slate-400 mb-1">Class *</label>
                                            <select className="w-full bg-slate-900 border border-slate-700 text-white p-2 rounded" value={bookForm.class} onChange={e => setBookForm({ ...bookForm, class: e.target.value })}>
                                                {CLASS_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                        </div>
                                        <div><label className="block text-xs text-slate-400 mb-1">Category *</label>
                                            <select className="w-full bg-slate-900 border border-slate-700 text-white p-2 rounded" value={bookForm.category} onChange={e => setBookForm({ ...bookForm, category: e.target.value })}>
                                                {BOOK_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                        </div>
                                        <div className="col-span-2"><label className="block text-xs text-slate-400 mb-1">Description (Optional)</label><textarea className="w-full bg-slate-900 border border-slate-700 text-white p-2 rounded focus:outline-none" value={bookForm.description} onChange={e => setBookForm({ ...bookForm, description: e.target.value })} /></div>
                                        <div><label className="block text-xs text-slate-400 mb-1">Cover Image (JPG/PNG) *</label><input type="file" required accept="image/*" onChange={e => setBookCoverFile(e.target.files[0])} className="w-full text-slate-400 text-sm" /></div>
                                        <div><label className="block text-xs text-slate-400 mb-1">Book PDF *</label><input type="file" required accept="application/pdf" onChange={e => setBookPdfFile(e.target.files[0])} className="w-full text-slate-400 text-sm" /></div>
                                        <button type="submit" disabled={uploading} className="col-span-2 py-3 bg-indigo-600 text-white font-bold rounded-xl mt-4 disabled:bg-slate-700">{uploading ? 'Processing...' : 'Upload Book'}</button>
                                    </form>
                                )}

                                {activeTab === 'syllabus' && (
                                    <form onSubmit={handleCreateSyllabus} className="grid grid-cols-2 gap-4">
                                        <div><label className="block text-xs text-slate-400 mb-1">Exam Goal *</label><input required placeholder="e.g. CBSE 10th" className="w-full bg-slate-900 border border-slate-700 text-white p-2 rounded focus:outline-none" value={syllabusForm.examGoal} onChange={e => setSyllabusForm({ ...syllabusForm, examGoal: e.target.value })} /></div>
                                        <div><label className="block text-xs text-slate-400 mb-1">Subject *</label><input required placeholder="e.g. Mathematics" className="w-full bg-slate-900 border border-slate-700 text-white p-2 rounded focus:outline-none" value={syllabusForm.subject} onChange={e => setSyllabusForm({ ...syllabusForm, subject: e.target.value })} /></div>
                                        <div className="col-span-2"><label className="block text-xs text-slate-400 mb-1">Topics Covered (Comma separated) *</label><textarea required className="w-full bg-slate-900 border border-slate-700 text-white p-2 rounded focus:outline-none" value={syllabusForm.topics} onChange={e => setSyllabusForm({ ...syllabusForm, topics: e.target.value })} placeholder="Algebra, Geometry, Calculus..." /></div>
                                        <div className="col-span-2"><label className="block text-xs text-slate-400 mb-1">Syllabus PDF *</label><input type="file" required accept="application/pdf" onChange={e => setSyllabusPdfFile(e.target.files[0])} className="w-full text-slate-400" /></div>
                                        <button type="submit" disabled={uploading} className="col-span-2 py-3 bg-indigo-600 text-white font-bold rounded-xl mt-4 disabled:bg-slate-700">{uploading ? 'Processing...' : 'Upload Syllabus'}</button>
                                    </form>
                                )}

                                {activeTab === 'pyqs' && (
                                    <form onSubmit={handleCreatePYQ} className="grid grid-cols-2 gap-4">
                                        <div><label className="block text-xs text-slate-400 mb-1">Exam Name *</label><input required placeholder="e.g. JEE Advanced" className="w-full bg-slate-900 border border-slate-700 text-white p-2 rounded focus:outline-none" value={pyqForm.exam} onChange={e => setPyqForm({ ...pyqForm, exam: e.target.value })} /></div>
                                        <div><label className="block text-xs text-slate-400 mb-1">Year *</label><input type="number" required className="w-full bg-slate-900 border border-slate-700 text-white p-2 rounded focus:outline-none" value={pyqForm.year} onChange={e => setPyqForm({ ...pyqForm, year: Number(e.target.value) })} /></div>
                                        <div className="col-span-2"><label className="block text-xs text-slate-400 mb-1">Subject (Optional)</label><input placeholder="Leave blank if full paper" className="w-full bg-slate-900 border border-slate-700 text-white p-2 rounded focus:outline-none" value={pyqForm.subject} onChange={e => setPyqForm({ ...pyqForm, subject: e.target.value })} /></div>
                                        <div><label className="block text-xs text-slate-400 mb-1">Question Paper PDF *</label><input type="file" required accept="application/pdf" onChange={e => setPyqPaperFile(e.target.files[0])} className="w-full text-slate-400 text-sm" /></div>
                                        <div><label className="block text-xs text-slate-400 mb-1">Solution PDF (Optional)</label><input type="file" accept="application/pdf" onChange={e => setPyqSolutionFile(e.target.files[0])} className="w-full text-slate-400 text-sm" /></div>
                                        <button type="submit" disabled={uploading} className="col-span-2 py-3 bg-indigo-600 text-white font-bold rounded-xl mt-4 disabled:bg-slate-700">{uploading ? 'Processing...' : 'Upload PYQ'}</button>
                                    </form>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
