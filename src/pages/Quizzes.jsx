import React, { useState, useEffect } from 'react';
import { Upload, FileText, CheckCircle, BrainCircuit, Trash2, Plus, GripVertical, ChevronDown, ChevronUp, Copy, X, Save, ListChecks, PenLine, Hash, AlertCircle } from 'lucide-react';
import { fetchQuizzes, createQuiz, deleteQuiz } from '../api';

const EMPTY_OBJECTIVE = {
    questionText: '',
    questionType: 'objective',
    options: ['', '', '', ''],
    correctOption: null,
    marks: 4,
    explanation: '',
};

const EMPTY_SUBJECTIVE = {
    questionText: '',
    questionType: 'subjective',
    options: [],
    correctOption: null,
    marks: 4,
    explanation: '',
    expectedAnswer: '',
};

const CATEGORIES = ['Physics', 'Chemistry', 'Mathematics', 'Biology', 'English', 'Hindi', 'GK', 'Reasoning', 'SSC', 'Railway', 'Full Test', 'Other'];
const CLASSES = ['6', '7', '8', '9', '10', '11', '12', 'dropper'];
const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];

export default function Quizzes() {
    // Tab: 'builder' or 'json'
    const [activeTab, setActiveTab] = useState('builder');

    // JSON mode
    const [jsonInput, setJsonInput] = useState('');

    // Builder mode  
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');
    const [selectedClasses, setSelectedClasses] = useState([]);
    const [difficulty, setDifficulty] = useState('Medium');
    const [duration, setDuration] = useState(60);
    const [questions, setQuestions] = useState([{ ...EMPTY_OBJECTIVE }]);
    const [expandedQ, setExpandedQ] = useState(0);

    // Common
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });
    const [quizzes, setQuizzes] = useState([]);
    const [loadingQuizzes, setLoadingQuizzes] = useState(true);

    useEffect(() => { loadQuizzes(); }, []);

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

    // ── BUILDER HELPERS ──

    const updateQuestion = (index, field, value) => {
        const updated = [...questions];
        updated[index] = { ...updated[index], [field]: value };
        setQuestions(updated);
    };

    const updateOption = (qIndex, optIndex, value) => {
        const updated = [...questions];
        const opts = [...updated[qIndex].options];
        opts[optIndex] = value;
        updated[qIndex] = { ...updated[qIndex], options: opts };
        setQuestions(updated);
    };

    const addQuestion = (type = 'objective') => {
        const newQ = type === 'subjective' ? { ...EMPTY_SUBJECTIVE } : { ...EMPTY_OBJECTIVE, options: ['', '', '', ''] };
        setQuestions([...questions, newQ]);
        setExpandedQ(questions.length);
    };

    const removeQuestion = (index) => {
        if (questions.length <= 1) return;
        const updated = questions.filter((_, i) => i !== index);
        setQuestions(updated);
        if (expandedQ >= updated.length) setExpandedQ(updated.length - 1);
        else if (expandedQ === index) setExpandedQ(Math.max(0, index - 1));
    };

    const duplicateQuestion = (index) => {
        const copy = JSON.parse(JSON.stringify(questions[index]));
        const updated = [...questions];
        updated.splice(index + 1, 0, copy);
        setQuestions(updated);
        setExpandedQ(index + 1);
    };

    const moveQuestion = (index, direction) => {
        const newIndex = index + direction;
        if (newIndex < 0 || newIndex >= questions.length) return;
        const updated = [...questions];
        [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
        setQuestions(updated);
        setExpandedQ(newIndex);
    };

    const toggleClass = (cls) => {
        setSelectedClasses(prev =>
            prev.includes(cls) ? prev.filter(c => c !== cls) : [...prev, cls]
        );
    };

    const calcTotalMarks = () => questions.reduce((sum, q) => sum + (Number(q.marks) || 0), 0);

    const validateBuilder = () => {
        if (!title.trim()) return 'Quiz title is required';
        if (!category) return 'Category is required';
        if (!duration || duration <= 0) return 'Duration must be > 0';
        for (let i = 0; i < questions.length; i++) {
            const q = questions[i];
            if (!q.questionText.trim()) return `Question ${i + 1}: Question text is empty`;
            if (q.questionType === 'objective') {
                const filledOpts = q.options.filter(o => o.trim());
                if (filledOpts.length < 2) return `Question ${i + 1}: At least 2 options required`;
                if (q.correctOption === null || q.correctOption === undefined) return `Question ${i + 1}: Select the correct answer`;
                if (q.correctOption >= filledOpts.length) return `Question ${i + 1}: Correct answer index invalid`;
            }
            if (!q.marks || q.marks <= 0) return `Question ${i + 1}: Marks must be > 0`;
        }
        return null;
    };

    // ── SUBMIT ──

    const handleBuilderSubmit = async () => {
        const error = validateBuilder();
        if (error) {
            setMessage({ text: error, type: 'error' });
            return;
        }

        const quizData = {
            title: title.trim(),
            description: description.trim(),
            category,
            class: selectedClasses,
            difficulty,
            duration: Number(duration),
            totalMarks: calcTotalMarks(),
            questions: questions.map(q => {
                const base = {
                    questionText: q.questionText.trim(),
                    questionType: q.questionType,
                    marks: Number(q.marks),
                    explanation: q.explanation?.trim() || '',
                };
                if (q.questionType === 'objective') {
                    base.options = q.options.filter(o => o.trim());
                    base.correctOption = Number(q.correctOption);
                } else {
                    base.expectedAnswer = q.expectedAnswer?.trim() || '';
                }
                return base;
            }),
        };

        try {
            setLoading(true);
            setMessage({ text: '', type: '' });
            await createQuiz(quizData);
            setMessage({ text: `Quiz "${title}" created with ${questions.length} questions (${calcTotalMarks()} marks)!`, type: 'success' });
            // Reset form
            setTitle(''); setDescription(''); setCategory(''); setSelectedClasses([]);
            setDifficulty('Medium'); setDuration(60);
            setQuestions([{ ...EMPTY_OBJECTIVE, options: ['', '', '', ''] }]);
            setExpandedQ(0);
            loadQuizzes();
        } catch (err) {
            setMessage({ text: 'Error: ' + (err.response?.data?.message || err.message), type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleJsonUpload = async () => {
        try {
            setLoading(true);
            setMessage({ text: '', type: '' });
            const data = JSON.parse(jsonInput);
            if (Array.isArray(data)) throw new Error('Upload a single Quiz object, not an array.');
            if (!data.questions || !Array.isArray(data.questions)) throw new Error('Quiz must contain a "questions" array.');
            await createQuiz(data);
            setMessage({ text: `Success! Created quiz "${data.title}" with ${data.questions.length} questions.`, type: 'success' });
            setJsonInput('');
            loadQuizzes();
        } catch (err) {
            setMessage({ text: 'Error: ' + err.message, type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteQuiz = async (id, title) => {
        if (!window.confirm(`Delete quiz "${title}"?`)) return;
        try {
            await deleteQuiz(id);
            loadQuizzes();
        } catch (error) {
            alert('Failed to delete quiz.');
        }
    };

    // ── RENDER ──

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-white">Manage Quizzes & Mock Tests</h1>
                    <p className="text-slate-400">Create objective (MCQ) & subjective questions easily</p>
                </div>
                <div className="flex items-center gap-2 bg-slate-800 rounded-xl p-1 border border-slate-700">
                    <button
                        onClick={() => setActiveTab('builder')}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'builder' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                    >
                        <ListChecks size={16} className="inline mr-1.5 -mt-0.5" /> Visual Builder
                    </button>
                    <button
                        onClick={() => setActiveTab('json')}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'json' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                    >
                        <FileText size={16} className="inline mr-1.5 -mt-0.5" /> JSON Upload
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

                {/* ═══════ LEFT: FORM AREA ═══════ */}
                <div className="lg:col-span-3 space-y-6">

                    {activeTab === 'builder' ? (
                        <>
                            {/* ── QUIZ META ── */}
                            <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
                                <h2 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
                                    <div className="bg-indigo-500/20 p-2 rounded-xl"><BrainCircuit className="text-indigo-400" size={20} /></div>
                                    Quiz Details
                                </h2>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Title */}
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-semibold text-slate-300 mb-1.5">Quiz Title *</label>
                                        <input
                                            type="text"
                                            placeholder="e.g., Weekly Physics Mock Test"
                                            className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                                            value={title}
                                            onChange={e => setTitle(e.target.value)}
                                        />
                                    </div>

                                    {/* Description */}
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-semibold text-slate-300 mb-1.5">Description</label>
                                        <input
                                            type="text"
                                            placeholder="e.g., Chapter 1-3 Revision"
                                            className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                                            value={description}
                                            onChange={e => setDescription(e.target.value)}
                                        />
                                    </div>

                                    {/* Category */}
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-300 mb-1.5">Category *</label>
                                        <select
                                            className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                                            value={category}
                                            onChange={e => setCategory(e.target.value)}
                                        >
                                            <option value="">Select Category</option>
                                            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>

                                    {/* Difficulty */}
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-300 mb-1.5">Difficulty</label>
                                        <div className="flex gap-2">
                                            {DIFFICULTIES.map(d => (
                                                <button
                                                    key={d}
                                                    onClick={() => setDifficulty(d)}
                                                    className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all border ${difficulty === d
                                                            ? d === 'Easy' ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400'
                                                                : d === 'Medium' ? 'bg-amber-600/20 border-amber-500 text-amber-400'
                                                                    : 'bg-red-600/20 border-red-500 text-red-400'
                                                            : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'
                                                        }`}
                                                >
                                                    {d}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Duration */}
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-300 mb-1.5">Duration (minutes) *</label>
                                        <input
                                            type="number"
                                            min="1"
                                            placeholder="60"
                                            className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                                            value={duration}
                                            onChange={e => setDuration(e.target.value)}
                                        />
                                    </div>

                                    {/* Classes */}
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-300 mb-1.5">Classes</label>
                                        <div className="flex flex-wrap gap-2">
                                            {CLASSES.map(cls => (
                                                <button
                                                    key={cls}
                                                    onClick={() => toggleClass(cls)}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${selectedClasses.includes(cls)
                                                            ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                                                            : 'bg-slate-900 border-slate-700 text-slate-500 hover:border-slate-600'
                                                        }`}
                                                >
                                                    {cls === 'dropper' ? 'Dropper' : cls}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* ── QUESTIONS BUILDER ── */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                        Questions
                                        <span className="text-xs font-semibold bg-indigo-500/20 text-indigo-300 px-2.5 py-1 rounded-full">
                                            {questions.length} Q · {calcTotalMarks()} Marks
                                        </span>
                                    </h2>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => addQuestion('objective')}
                                            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-indigo-600/20"
                                        >
                                            <Plus size={16} /> MCQ
                                        </button>
                                        <button
                                            onClick={() => addQuestion('subjective')}
                                            className="flex items-center gap-1.5 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-violet-600/20"
                                        >
                                            <PenLine size={16} /> Subjective
                                        </button>
                                    </div>
                                </div>

                                {questions.map((q, qIdx) => (
                                    <div key={qIdx} className={`bg-slate-800 rounded-2xl border transition-all ${expandedQ === qIdx ? 'border-indigo-500/50 shadow-lg shadow-indigo-500/5' : 'border-slate-700'}`}>

                                        {/* Question Header (always visible) */}
                                        <div
                                            className="flex items-center gap-3 p-4 cursor-pointer select-none"
                                            onClick={() => setExpandedQ(expandedQ === qIdx ? -1 : qIdx)}
                                        >
                                            <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${q.questionType === 'subjective' ? 'bg-violet-500/20 text-violet-300' : 'bg-indigo-500/20 text-indigo-300'}`}>
                                                {qIdx + 1}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm text-white font-medium truncate">
                                                    {q.questionText || <span className="text-slate-500 italic">Question {qIdx + 1} — click to expand</span>}
                                                </p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase ${q.questionType === 'subjective' ? 'bg-violet-500/15 text-violet-400' : 'bg-blue-500/15 text-blue-400'}`}>
                                                        {q.questionType === 'subjective' ? 'Subjective' : 'MCQ'}
                                                    </span>
                                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-400">
                                                        {q.marks} marks
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <button onClick={e => { e.stopPropagation(); moveQuestion(qIdx, -1); }} className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-700 rounded-lg transition-all" title="Move up"><ChevronUp size={14} /></button>
                                                <button onClick={e => { e.stopPropagation(); moveQuestion(qIdx, 1); }} className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-700 rounded-lg transition-all" title="Move down"><ChevronDown size={14} /></button>
                                                <button onClick={e => { e.stopPropagation(); duplicateQuestion(qIdx); }} className="p-1.5 text-slate-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all" title="Duplicate"><Copy size={14} /></button>
                                                <button onClick={e => { e.stopPropagation(); removeQuestion(qIdx); }} className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all" title="Delete" disabled={questions.length <= 1}><Trash2 size={14} /></button>
                                                {expandedQ === qIdx ? <ChevronUp size={16} className="text-slate-400 ml-1" /> : <ChevronDown size={16} className="text-slate-400 ml-1" />}
                                            </div>
                                        </div>

                                        {/* Expanded Question Editor */}
                                        {expandedQ === qIdx && (
                                            <div className="px-4 pb-5 pt-1 border-t border-slate-700/50 space-y-4">

                                                {/* Question Type Toggle */}
                                                <div className="flex items-center gap-3">
                                                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Type:</label>
                                                    <div className="flex gap-1.5 bg-slate-900 rounded-lg p-1">
                                                        <button
                                                            onClick={() => {
                                                                updateQuestion(qIdx, 'questionType', 'objective');
                                                                if (!q.options || q.options.length === 0) updateQuestion(qIdx, 'options', ['', '', '', '']);
                                                            }}
                                                            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${q.questionType === 'objective' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                                                        >
                                                            <ListChecks size={12} className="inline mr-1 -mt-0.5" /> Objective (MCQ)
                                                        </button>
                                                        <button
                                                            onClick={() => updateQuestion(qIdx, 'questionType', 'subjective')}
                                                            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${q.questionType === 'subjective' ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white'}`}
                                                        >
                                                            <PenLine size={12} className="inline mr-1 -mt-0.5" /> Subjective
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Question Text */}
                                                <div>
                                                    <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Question Text *</label>
                                                    <textarea
                                                        rows={2}
                                                        placeholder="Enter your question here..."
                                                        className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors resize-none text-sm"
                                                        value={q.questionText}
                                                        onChange={e => updateQuestion(qIdx, 'questionText', e.target.value)}
                                                    />
                                                </div>

                                                {/* Objective: Options */}
                                                {q.questionType === 'objective' && (
                                                    <div>
                                                        <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Options (click radio to mark correct)</label>
                                                        <div className="space-y-2.5">
                                                            {(q.options || ['', '', '', '']).map((opt, oIdx) => (
                                                                <div key={oIdx} className="flex items-center gap-2.5">
                                                                    {/* Correct answer radio */}
                                                                    <button
                                                                        onClick={() => updateQuestion(qIdx, 'correctOption', oIdx)}
                                                                        className={`flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${q.correctOption === oIdx
                                                                                ? 'bg-emerald-500 border-emerald-400 shadow-lg shadow-emerald-500/30'
                                                                                : 'border-slate-600 hover:border-slate-400'
                                                                            }`}
                                                                        title={`Mark option ${String.fromCharCode(65 + oIdx)} as correct`}
                                                                    >
                                                                        {q.correctOption === oIdx ? (
                                                                            <CheckCircle size={16} className="text-white" />
                                                                        ) : (
                                                                            <span className="text-xs font-bold text-slate-500">{String.fromCharCode(65 + oIdx)}</span>
                                                                        )}
                                                                    </button>

                                                                    {/* Option input */}
                                                                    <input
                                                                        type="text"
                                                                        placeholder={`Option ${String.fromCharCode(65 + oIdx)}`}
                                                                        className={`flex-1 p-2.5 rounded-xl text-sm border transition-all focus:outline-none ${q.correctOption === oIdx
                                                                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-100 placeholder-emerald-300/40 focus:border-emerald-400'
                                                                                : 'bg-slate-900 border-slate-700 text-white placeholder-slate-500 focus:border-indigo-500'
                                                                            }`}
                                                                        value={opt}
                                                                        onChange={e => updateOption(qIdx, oIdx, e.target.value)}
                                                                    />
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Subjective: Expected Answer */}
                                                {q.questionType === 'subjective' && (
                                                    <div>
                                                        <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Model Answer (optional)</label>
                                                        <textarea
                                                            rows={3}
                                                            placeholder="Write the expected/model answer here..."
                                                            className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors resize-none text-sm"
                                                            value={q.expectedAnswer || ''}
                                                            onChange={e => updateQuestion(qIdx, 'expectedAnswer', e.target.value)}
                                                        />
                                                    </div>
                                                )}

                                                {/* Bottom Row: Marks + Explanation */}
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                    {/* Marks */}
                                                    <div>
                                                        <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                                                            <Hash size={10} className="inline mr-0.5 -mt-0.5" /> Marks *
                                                        </label>
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            placeholder="4"
                                                            className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors text-sm"
                                                            value={q.marks}
                                                            onChange={e => updateQuestion(qIdx, 'marks', Number(e.target.value))}
                                                        />
                                                    </div>

                                                    {/* Explanation */}
                                                    <div className="md:col-span-2">
                                                        <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">Explanation (optional)</label>
                                                        <input
                                                            type="text"
                                                            placeholder="Why is this the correct answer?"
                                                            className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors text-sm"
                                                            value={q.explanation}
                                                            onChange={e => updateQuestion(qIdx, 'explanation', e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}

                                {/* Add Question Buttons */}
                                <div className="flex gap-3 justify-center py-2">
                                    <button
                                        onClick={() => addQuestion('objective')}
                                        className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 border border-dashed border-slate-600 hover:border-indigo-500 text-slate-400 hover:text-indigo-300 rounded-xl text-sm font-semibold transition-all"
                                    >
                                        <Plus size={16} /> Add MCQ Question
                                    </button>
                                    <button
                                        onClick={() => addQuestion('subjective')}
                                        className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 border border-dashed border-slate-600 hover:border-violet-500 text-slate-400 hover:text-violet-300 rounded-xl text-sm font-semibold transition-all"
                                    >
                                        <Plus size={16} /> Add Subjective Question
                                    </button>
                                </div>
                            </div>

                            {/* ── PUBLISH BUTTON ── */}
                            <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4">
                                <div className="flex-1">
                                    {message.text && (
                                        <p className={`text-sm flex items-center gap-2 ${message.type === 'error' ? 'text-red-400' : 'text-emerald-400'}`}>
                                            {message.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle size={16} />}
                                            {message.text}
                                        </p>
                                    )}
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        <p className="text-xs text-slate-500">Total</p>
                                        <p className="text-lg font-black text-white">{questions.length} Qs · {calcTotalMarks()} M</p>
                                    </div>
                                    <button
                                        onClick={handleBuilderSubmit}
                                        disabled={loading}
                                        className={`px-8 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${loading ? 'bg-slate-700 text-slate-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20'}`}
                                    >
                                        <Save size={16} />
                                        {loading ? 'Publishing...' : 'Publish Quiz'}
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : (
                        /* ═══════ JSON TAB ═══════ */
                        <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="bg-indigo-500/20 p-2 rounded-xl"><FileText className="text-indigo-400" size={20} /></div>
                                <div>
                                    <h2 className="text-lg font-bold text-white">JSON Upload</h2>
                                    <p className="text-sm text-slate-400">Paste a complete JSON Quiz object</p>
                                </div>
                            </div>
                            <textarea
                                className="w-full h-96 p-4 rounded-xl font-mono text-sm bg-slate-900 border border-slate-700 text-slate-300 focus:outline-none focus:border-indigo-500 resize-none"
                                placeholder={`{
  "title": "Weekly Physics Mock Test",
  "description": "Chapter 1-3 Revision",
  "category": "Physics",
  "class": ["12"],
  "duration": 60,
  "totalMarks": 12,
  "questions": [
    {
      "questionText": "What is the unit of force?",
      "questionType": "objective",
      "options": ["Joule", "Newton", "Watt", "Pascal"],
      "correctOption": 1,
      "marks": 4
    },
    {
      "questionText": "Define Newton's second law of motion.",
      "questionType": "subjective",
      "marks": 5,
      "expectedAnswer": "F = ma"
    }
  ]
}`}
                                value={jsonInput}
                                onChange={e => setJsonInput(e.target.value)}
                            />
                            <div className="flex justify-between items-center mt-4">
                                <div className="flex-1">
                                    {message.text && (
                                        <p className={`text-sm flex items-center gap-2 ${message.type === 'error' ? 'text-red-400' : 'text-emerald-400'}`}>
                                            {message.type !== 'error' && <CheckCircle size={16} />}
                                            {message.text}
                                        </p>
                                    )}
                                </div>
                                <button
                                    onClick={handleJsonUpload}
                                    disabled={loading || !jsonInput}
                                    className={`px-8 py-3 rounded-xl font-bold transition-all ${loading || !jsonInput ? 'bg-slate-700 text-slate-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20'}`}
                                >
                                    {loading ? 'Publishing...' : 'Publish Test'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* ═══════ RIGHT: SIDEBAR ═══════ */}
                <div className="space-y-6">
                    {/* Stats */}
                    <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 flex flex-col items-center justify-center text-center">
                        <div className="bg-indigo-500/20 p-4 rounded-full mb-4">
                            <BrainCircuit size={32} className="text-indigo-400" />
                        </div>
                        <h3 className="text-3xl font-black text-white mb-1">
                            {loadingQuizzes ? '...' : quizzes.length.toLocaleString()}
                        </h3>
                        <p className="text-slate-400 font-medium">Live Tests Available</p>
                    </div>

                    {/* Quiz Schema Info */}
                    <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5">
                        <h3 className="font-bold text-white flex items-center gap-2 mb-3 text-sm">
                            <FileText size={16} className="text-blue-400" /> Question Types
                        </h3>
                        <div className="space-y-3 text-xs">
                            <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-3">
                                <p className="font-bold text-indigo-300 flex items-center gap-1.5 mb-1">
                                    <ListChecks size={12} /> Objective (MCQ)
                                </p>
                                <p className="text-slate-400 leading-relaxed">
                                    Question + 4 options + correct answer + marks. Perfect for competitive exam prep.
                                </p>
                            </div>
                            <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-3">
                                <p className="font-bold text-violet-300 flex items-center gap-1.5 mb-1">
                                    <PenLine size={12} /> Subjective
                                </p>
                                <p className="text-slate-400 leading-relaxed">
                                    Question + marks + model answer. For descriptive or essay-type questions.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Available Quizzes */}
                    <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 overflow-hidden flex-1 max-h-[420px] flex flex-col">
                        <h3 className="font-bold text-white mb-3 text-sm sticky top-0 bg-slate-800">Available Quizzes</h3>
                        <div className="overflow-y-auto pr-1 space-y-2 flex-1 custom-scrollbar">
                            {loadingQuizzes ? (
                                <p className="text-slate-500 text-sm text-center py-4">Loading...</p>
                            ) : quizzes.length === 0 ? (
                                <p className="text-slate-500 text-sm text-center py-4">No quizzes yet</p>
                            ) : quizzes.map(q => (
                                <div key={q._id} className="bg-slate-900 border border-slate-700 p-3 rounded-xl flex justify-between items-start group hover:border-slate-600 transition-all">
                                    <div className="min-w-0 flex-1">
                                        <p className="text-white text-sm font-semibold truncate">{q.title}</p>
                                        <p className="text-slate-500 text-xs mt-0.5">{q.category} · {q.questions?.length || 0} Qs · {q.totalMarks}M</p>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteQuiz(q._id, q.title)}
                                        className="text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all p-1.5 hover:bg-red-500/10 rounded-lg ml-2"
                                        title="Delete Quiz"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
