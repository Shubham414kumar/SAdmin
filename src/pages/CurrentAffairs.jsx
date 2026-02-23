import React, { useState, useEffect } from 'react';
import { Newspaper, Sparkles, AlertCircle, RefreshCw, Calendar } from 'lucide-react';
import { fetchCurrentAffairs, generateCurrentAffairs } from '../api';

export default function CurrentAffairs() {
    const [affairs, setAffairs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        loadAffairs();
    }, []);

    const loadAffairs = async () => {
        try {
            setLoading(true);
            const data = await fetchCurrentAffairs();
            setAffairs(data);
        } catch (error) {
            console.error('Failed to load current affairs:', error);
            setMessage('Error loading current affairs.');
        } finally {
            setLoading(false);
        }
    };

    const handleGenerate = async () => {
        try {
            setGenerating(true);
            setMessage('');
            const res = await generateCurrentAffairs();
            setMessage(res.message);
            loadAffairs(); // Refresh the list after generation
        } catch (error) {
            console.error('Failed to generate current affairs:', error);
            setMessage('Error generating current affairs. Please check if Anthropic API key is valid.');
        } finally {
            setGenerating(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Daily Current Affairs</h1>
                    <p className="text-slate-400">Trigger AI to generate today's top competitive exam news</p>
                </div>

                <button
                    onClick={handleGenerate}
                    disabled={generating}
                    className={`flex items-center px-4 py-3 rounded-xl font-bold shadow-lg transition-all ${generating ? 'bg-slate-700 text-slate-400 cursor-not-allowed' : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-indigo-600/20'
                        }`}
                >
                    {generating ? (
                        <>
                            <RefreshCw size={20} className="mr-2 animate-spin" />
                            Generating with AI...
                        </>
                    ) : (
                        <>
                            <Sparkles size={20} className="mr-2" />
                            Generate Today's News
                        </>
                    )}
                </button>
            </div>

            {message && (
                <div className={`p-4 rounded-xl flex items-center ${message.includes('Error') ? 'bg-red-500/10 border border-red-500/20 text-red-400' : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'}`}>
                    <AlertCircle size={20} className="mr-3 flex-shrink-0" />
                    <p className="font-medium text-sm">{message}</p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <div className="col-span-full py-12 text-center text-slate-500">Loading current affairs...</div>
                ) : affairs.length === 0 ? (
                    <div className="col-span-full py-12 text-center text-slate-500">No current affairs generated yet. Click the button above to start.</div>
                ) : (
                    affairs.map((item) => (
                        <div key={item._id} className="bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-sm relative hover:border-indigo-500/30 transition-colors">
                            {item.important && (
                                <div className="absolute -top-3 -right-3 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg border-2 border-slate-900">
                                    IMPORTANT
                                </div>
                            )}

                            <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-700">
                                <div className="flex items-center gap-2">
                                    <span className="text-2xl">{item.icon}</span>
                                    <span className="px-2 py-1 bg-indigo-500/10 text-indigo-400 text-xs font-bold rounded">
                                        {item.category}
                                    </span>
                                </div>
                                <div className="flex items-center text-slate-400 text-xs font-medium">
                                    <Calendar size={14} className="mr-1" />
                                    {item.date}
                                </div>
                            </div>

                            <h3 className="text-lg font-bold text-white mb-2 leading-tight">{item.title}</h3>
                            <p className="text-sm text-slate-400 leading-relaxed line-clamp-4">{item.description}</p>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
