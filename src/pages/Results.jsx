import React, { useState, useEffect } from 'react';
import { Upload, FileText, CheckCircle, Database } from 'lucide-react';
import { fetchResults, uploadBulkResults } from '../api';

export default function Results() {
    const [jsonInput, setJsonInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [results, setResults] = useState([]);
    const [loadingResults, setLoadingResults] = useState(true);

    useEffect(() => {
        loadResults();
    }, []);

    const loadResults = async () => {
        try {
            setLoadingResults(true);
            const data = await fetchResults();
            setResults(data);
        } catch (err) {
            console.error('Error fetching results:', err);
        } finally {
            setLoadingResults(false);
        }
    };

    const handleUpload = async () => {
        try {
            setLoading(true);
            setMessage('');
            const data = JSON.parse(jsonInput);
            if (!Array.isArray(data)) throw new Error('Input must be an array of objects');

            await uploadBulkResults(data);
            setMessage(`Success! Uploaded ${data.length} records to the database.`);
            setJsonInput('');
            loadResults();
        } catch (err) {
            setMessage('Error: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-white">Manage Details & Results</h1>
                    <p className="text-slate-400">Bulk upload student exam results securely</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* JSON Upload Box */}
                <div className="lg:col-span-2 bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="bg-indigo-500/20 p-2 rounded-xl">
                            <Upload className="text-indigo-400" size={24} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white">Bulk Upload Results</h2>
                            <p className="text-sm text-slate-400">Paste a JSON array of student result objects</p>
                        </div>
                    </div>

                    <div className="mb-4">
                        <textarea
                            className="w-full h-80 p-4 rounded-xl font-mono text-sm bg-slate-900 border border-slate-700 text-slate-300 focus:outline-none focus:border-indigo-500 resize-none shadow-inner"
                            placeholder={`[
  {
    "examName": "JEE Main 2026",
    "rollNumber": "2601001",
    "candidateName": "Rahul Sharma",
    "score": "240/300",
    "rank": "AIR 1500",
    "status": "Qualified"
  }
]`}
                            value={jsonInput}
                            onChange={e => setJsonInput(e.target.value)}
                        />
                    </div>

                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                        <div className="flex-1">
                            {message && (
                                <p className={`text-sm flex items-center ${message.includes('Error') ? 'text-red-400' : 'text-emerald-400'}`}>
                                    {!message.includes('Error') && <CheckCircle size={16} className="mr-2" />}
                                    {message}
                                </p>
                            )}
                        </div>
                        <button
                            onClick={handleUpload}
                            disabled={loading || !jsonInput}
                            className={`px-8 py-3 rounded-xl font-bold transition-all ${loading || !jsonInput ? 'bg-slate-700 text-slate-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20'
                                }`}
                        >
                            {loading ? 'Uploading safely...' : 'Publish to App'}
                        </button>
                    </div>
                </div>

                {/* Info Panel */}
                <div className="space-y-6">
                    <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 shadow-sm">
                        <h3 className="font-bold text-white flex items-center gap-2 mb-4">
                            <FileText size={18} className="text-blue-400" /> JSON Schema Guide
                        </h3>
                        <div className="space-y-3 text-sm text-slate-300">
                            <p><strong>Required Fields:</strong></p>
                            <ul className="list-disc pl-5 space-y-1 text-slate-400">
                                <li><code>examName</code> (e.g. "SSC CGL Tier 1")</li>
                                <li><code>rollNumber</code> (Must be unique)</li>
                                <li><code>candidateName</code></li>
                                <li><code>score</code> (e.g. "120/150")</li>
                            </ul>
                            <p className="pt-2"><strong>Optional Fields:</strong></p>
                            <ul className="list-disc pl-5 space-y-1 text-slate-400">
                                <li><code>rank</code> (e.g. "AIR 45")</li>
                                <li><code>status</code> ("Qualified" or "Not Qualified" or "Pending")</li>
                            </ul>
                        </div>
                    </div>

                    {/* Quick Stats Panel */}
                    <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-sm flex flex-col items-center justify-center text-center">
                        <div className="bg-emerald-500/20 p-4 rounded-full mb-4">
                            <Database size={32} className="text-emerald-400" />
                        </div>
                        <h3 className="text-3xl font-black text-white mb-1">
                            {loadingResults ? '...' : results.length.toLocaleString()}
                        </h3>
                        <p className="text-slate-400 font-medium">Total Result Records Available in App</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
