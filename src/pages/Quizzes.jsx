import React, { useState, useEffect } from 'react';
import { Upload, FileText, CheckCircle, BrainCircuit, Trash2 } from 'lucide-react';
import { fetchQuizzes, createQuiz, deleteQuiz } from '../api';

export default function Quizzes() {
    const [jsonInput, setJsonInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [quizzes, setQuizzes] = useState([]);
    const [loadingQuizzes, setLoadingQuizzes] = useState(true);

    useEffect(() => {
        loadQuizzes();
    }, []);

    const loadQuizzes = async () => {
        try {
            setLoadingQuizzes(true);
            const data = await fetchQuizzes();
            setQuizzes(data);
        } catch (err) {
            console.error('Error fetching quizzes:', err);
        } finally {
            setLoadingQuizzes(false);
        }
    };

    const handleUpload = async () => {
        try {
            setLoading(true);
            setMessage('');
            const data = JSON.parse(jsonInput);

            if (Array.isArray(data)) {
                throw new Error('Please upload a single Quiz object, not an array. (See Schema Guide)');
            }
            if (!data.questions || !Array.isArray(data.questions)) {
                throw new Error('Quiz must contain a "questions" array.');
            }

            await createQuiz(data);
            setMessage(`Success! Created quiz "${data.title}" with ${data.questions.length} questions.`);
            setJsonInput('');
            loadQuizzes();
        } catch (err) {
            setMessage('Error: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteQuiz = async (id, title) => {
        if (!window.confirm(`Are you sure you want to delete the quiz "${title}"?`)) return;
        try {
            await deleteQuiz(id);
            loadQuizzes();
        } catch (error) {
            console.error(error);
            alert("Failed to delete quiz.");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-white">Manage Quizzes & Mock Tests</h1>
                    <p className="text-slate-400">Author complex tests via JSON schema uploads</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* JSON Upload Box */}
                <div className="lg:col-span-2 bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="bg-indigo-500/20 p-2 rounded-xl">
                            <BrainCircuit className="text-indigo-400" size={24} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white">Create New Test</h2>
                            <p className="text-sm text-slate-400">Paste a complete JSON Quiz object</p>
                        </div>
                    </div>

                    <div className="mb-4">
                        <textarea
                            className="w-full h-96 p-4 rounded-xl font-mono text-sm bg-slate-900 border border-slate-700 text-slate-300 focus:outline-none focus:border-indigo-500 resize-none shadow-inner"
                            placeholder={`{
  "title": "Weekly Physics Mock Test",
  "description": "Chapter 1-3 Revision",
  "category": "Physics",
  "class": "12",
  "duration": 60,
  "totalMarks": 12,
  "questions": [
    {
      "questionText": "What is the unit of force?",
      "options": ["Joule", "Newton", "Watt", "Pascal"],
      "correctOption": 1,
      "marks": 4,
      "explanation": "Newton is the SI unit of force."
    }
  ]
}`}
                            value={jsonInput}
                            onChange={e => setJsonInput(e.target.value)}
                        />
                    </div>

                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                        <div className="flex-1">
                            {message && (
                                <p className={`text-sm flex items-center ${message.includes('Error') ? 'text-red-400' : 'text-emerald-400'}`}>
                                    {!message.includes('Error') && <CheckCircle size={16} className="mr-2 flex-shrink-0" />}
                                    <span style={{ whiteSpace: "pre-wrap" }}>{message}</span>
                                </p>
                            )}
                        </div>
                        <button
                            onClick={handleUpload}
                            disabled={loading || !jsonInput}
                            className={`px-8 py-3 rounded-xl font-bold transition-all ${loading || !jsonInput ? 'bg-slate-700 text-slate-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20'
                                }`}
                        >
                            {loading ? 'Publishing...' : 'Publish Test to App'}
                        </button>
                    </div>
                </div>

                {/* Info & Stats Panel */}
                <div className="space-y-6">
                    <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 shadow-sm">
                        <h3 className="font-bold text-white flex items-center gap-2 mb-4">
                            <FileText size={18} className="text-blue-400" /> Quiz Schema Info
                        </h3>
                        <div className="space-y-3 text-sm text-slate-300">
                            <p><strong>Top-Level Fields:</strong></p>
                            <ul className="list-disc pl-5 space-y-1 text-slate-400">
                                <li><code>title</code>, <code>category</code>, <code>duration</code> (minutes)</li>
                                <li><code>totalMarks</code></li>
                            </ul>
                            <p className="pt-2"><strong>Questions Array:</strong></p>
                            <ul className="list-disc pl-5 space-y-1 text-slate-400">
                                <li><code>questionText</code></li>
                                <li><code>options</code> (Array of strings)</li>
                                <li><code>correctOption</code> (Integer index, 0-based)</li>
                                <li><code>marks</code> (points for the question)</li>
                            </ul>
                        </div>
                    </div>

                    <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-sm flex flex-col items-center justify-center text-center">
                        <div className="bg-indigo-500/20 p-4 rounded-full mb-4">
                            <BrainCircuit size={32} className="text-indigo-400" />
                        </div>
                        <h3 className="text-3xl font-black text-white mb-1">
                            {loadingQuizzes ? '...' : quizzes.length.toLocaleString()}
                        </h3>
                        <p className="text-slate-400 font-medium">Live Tests Currently Available</p>
                    </div>

                    <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-sm overflow-hidden flex-1 max-h-96 flex flex-col">
                        <h3 className="font-bold text-white mb-4 sticky top-0 bg-slate-800">Available Quizzes</h3>
                        <div className="overflow-y-auto pr-2 space-y-3 flex-1 custom-scrollbar">
                            {loadingQuizzes ? (
                                <p className="text-slate-500 text-sm text-center">Loading...</p>
                            ) : quizzes.map(q => (
                                <div key={q._id} className="bg-slate-900 border border-slate-700 p-3 rounded-xl flex justify-between items-start group">
                                    <div>
                                        <p className="text-white text-sm font-semibold truncate max-w-[200px]">{q.title}</p>
                                        <p className="text-slate-500 text-xs mt-1">{q.category} · {q.questions?.length || 0} Qs</p>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteQuiz(q._id, q.title)}
                                        className="text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all p-1.5 hover:bg-red-500/10 rounded-lg"
                                        title="Delete Quiz"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
