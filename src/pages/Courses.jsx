import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Video, FileText, X, UploadCloud, CheckCircle, Image as ImageIcon, BookOpen, FolderPlus } from 'lucide-react';
import { fetchCourses, uploadFile, createLesson, createCourse, updateCourse, deleteCourse, deleteLesson, fetchCourseDetails } from '../api';

const MOCK_COURSES = [
    { _id: '60b8d295f1d2a34567890123', title: 'Start typing to see real courses', category: 'General', students: 0, thumbnail: 'https://via.placeholder.com/150' },
];

const CLASS_OPTIONS = ['All', '9', '10', '11', '12', 'dropper', 'SSC', 'Banking'];
const CATEGORY_OPTIONS = ['JEE', 'NEET', 'Board', 'Foundation', 'Teaching', 'UPSC', 'SSC', 'Banking'];

export default function CourseManagement() {
    const [courses, setCourses] = useState([]);
    const [loadingCourses, setLoadingCourses] = useState(true);

    // Upload Video/PDF Modal States
    const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [uploadType, setUploadType] = useState('video'); // 'video' or 'pdf'

    // Add Course Modal States
    const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);

    // Curriculum Modal States
    const [isCurriculumModalOpen, setIsCurriculumModalOpen] = useState(false);
    const [courseLessons, setCourseLessons] = useState([]);
    const [loadingLessons, setLoadingLessons] = useState(false);

    // Video/PDF Form
    const [title, setTitle] = useState('');
    const [order, setOrder] = useState(1);
    const [file, setFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadSuccess, setUploadSuccess] = useState(false);

    // Course Form
    const [courseTitle, setCourseTitle] = useState('');
    const [courseDescription, setCourseDescription] = useState('');
    const [courseCategory, setCourseCategory] = useState(CATEGORY_OPTIONS[0]);
    const [courseClass, setCourseClass] = useState(CLASS_OPTIONS[0]);
    const [coursePrice, setCoursePrice] = useState(0);
    const [courseThumbnail, setCourseThumbnail] = useState(null);
    const [isCreatingCourse, setIsCreatingCourse] = useState(false);
    const [courseSuccess, setCourseSuccess] = useState(false);

    // Edit Course State
    const [editingCourseId, setEditingCourseId] = useState(null);

    useEffect(() => {
        loadCourses();
    }, []);

    const loadCourses = async () => {
        try {
            const data = await fetchCourses();
            setCourses(data.length ? data : MOCK_COURSES);
        } catch (error) {
            console.error('Failed to load courses:', error);
            setCourses(MOCK_COURSES);
        } finally {
            setLoadingCourses(false);
        }
    };

    // ------------- CURRICULUM MANAGEMENT -------------
    const openCurriculumModal = async (course) => {
        setSelectedCourse(course);
        setIsCurriculumModalOpen(true);
        setLoadingLessons(true);
        try {
            const data = await fetchCourseDetails(course._id);
            setCourseLessons(data.lessons || []);
        } catch (error) {
            console.error('Failed to load lessons:', error);
            alert('Failed to load lessons.');
        } finally {
            setLoadingLessons(false);
        }
    };

    const handleDeleteLesson = async (lessonId) => {
        if (!window.confirm('Are you sure you want to delete this lesson?')) return;
        try {
            await deleteLesson(lessonId);
            setCourseLessons(courseLessons.filter(l => l._id !== lessonId));
        } catch (error) {
            console.error('Error deleting lesson:', error);
            alert('Failed to delete lesson');
        }
    };

    // ------------- LESSON UPLOAD -------------
    const openUploadModal = (course, type) => {
        if (course) setSelectedCourse(course);
        setUploadType(type);
        setFile(null);
        setTitle('');
        setOrder(courseLessons.length > 0 ? courseLessons.length + 1 : 1);
        setUploadSuccess(false);
        setIsMenuModalOpen(true);
    };

    const handleLessonUpload = async (e) => {
        e.preventDefault();
        if (!file || !title) return;

        setIsUploading(true);
        setUploadSuccess(false);
        try {
            const uploadRes = await uploadFile(file);
            const secureUrl = uploadRes.url;

            const lessonData = {
                title,
                courseId: selectedCourse._id,
                order: Number(order),
            };

            if (uploadType === 'video') lessonData.videoUrl = secureUrl;
            if (uploadType === 'pdf') {
                lessonData.pdfUrl = secureUrl;
                lessonData.videoUrl = 'none'; // quick schema fix
            }
            if (uploadType === 'assignment') {
                lessonData.assignmentUrl = secureUrl;
                lessonData.videoUrl = 'none';
            }

            const newLesson = await createLesson(lessonData);
            setCourseLessons(prev => [...prev, newLesson]);

            setUploadSuccess(true);
            setTimeout(() => {
                setIsMenuModalOpen(false);
                if (isCurriculumModalOpen) {
                    openCurriculumModal(selectedCourse); // refresh
                }
            }, 2000);

        } catch (error) {
            console.error('Error uploading lesson:', error);
            alert('Failed to upload lesson. Check console log.');
        } finally {
            setIsUploading(false);
        }
    };

    // ------------- COURSE CREATION / EDITING -------------
    const openCourseModal = (course = null) => {
        if (course) {
            setEditingCourseId(course._id);
            setCourseTitle(course.title);
            setCourseDescription(course.description);
            setCourseCategory(course.category || CATEGORY_OPTIONS[0]);
            setCourseClass(course.class || CLASS_OPTIONS[0]);
            setCoursePrice(course.price || 0);
            setCourseThumbnail(null); // Keep null unless uploading a new one
        } else {
            setEditingCourseId(null);
            setCourseTitle('');
            setCourseDescription('');
            setCourseCategory(CATEGORY_OPTIONS[0]);
            setCourseClass(CLASS_OPTIONS[0]);
            setCoursePrice(0);
            setCourseThumbnail(null);
        }
        setCourseSuccess(false);
        setIsCourseModalOpen(true);
    };

    const handleCreateCourse = async (e) => {
        e.preventDefault();
        if (!courseTitle || !courseDescription) return alert('Please fill in the title and description.');
        if (!editingCourseId && !courseThumbnail) return alert('Please provide a thumbnail for the new course.');

        setIsCreatingCourse(true);
        setCourseSuccess(false);

        try {
            let thumbnailUrl = editingCourseId ? courses.find(c => c._id === editingCourseId)?.thumbnail : null;

            if (courseThumbnail) {
                const uploadRes = await uploadFile(courseThumbnail);
                thumbnailUrl = uploadRes.url;
            }

            const courseData = {
                title: courseTitle,
                description: courseDescription,
                category: courseCategory,
                class: courseClass,
                price: Number(coursePrice)
            };

            // Only add thumbnail if it exists
            if (thumbnailUrl) courseData.thumbnail = thumbnailUrl;

            if (editingCourseId) {
                await updateCourse(editingCourseId, courseData);
            } else {
                await createCourse(courseData);
            }

            setCourseSuccess(true);
            setTimeout(() => {
                setIsCourseModalOpen(false);
                loadCourses(); // reload listing
            }, 2000);

        } catch (error) {
            console.error('Error saving course:', error);
            alert('Failed to save course. Check console log.');
        } finally {
            setIsCreatingCourse(false);
        }
    };

    const handleDeleteCourse = async (id) => {
        if (!window.confirm('Are you sure you want to delete this course and all its lessons? This cannot be undone.')) return;
        try {
            await deleteCourse(id);
            setCourses(courses.filter(c => c._id !== id));
        } catch (error) {
            console.error('Error deleting course:', error);
            alert('Failed to delete course');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-white">Course Management</h2>
                    <p className="text-slate-400">Create, edit, and manage your courses and study materials</p>
                </div>
                <button
                    onClick={() => openCourseModal()}
                    className="flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors"
                >
                    <Plus size={20} className="mr-2" />
                    Add New Course
                </button>
            </div>

            {/* Course Grid */}
            {loadingCourses ? (
                <div className="text-white">Loading courses...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {courses.map((course) => (
                        <div key={course._id} className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden hover:border-indigo-500/50 transition-colors group">
                            <div className="h-40 bg-slate-700 relative">
                                <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <div className="p-5 relative group">
                                <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => openCourseModal(course)}
                                        className="p-2 bg-indigo-500/80 hover:bg-indigo-500 text-white rounded-lg backdrop-blur-sm transition-all"
                                        title="Edit Course"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteCourse(course._id)}
                                        className="p-2 bg-pink-500/80 hover:bg-pink-500 text-white rounded-lg backdrop-blur-sm transition-all"
                                        title="Delete Course"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                                <div className="flex justify-between items-start mb-2">
                                    <div className="inline-block px-2 py-1 bg-indigo-500/10 text-indigo-400 text-xs font-bold rounded">
                                        {course.category} (Class {course.class || 'N/A'})
                                    </div>
                                    <div className="text-emerald-400 font-bold text-sm">
                                        {course.price === 0 ? 'FREE' : `₹${course.price}`}
                                    </div>
                                </div>

                                <h3 className="text-lg font-bold text-white mb-1 line-clamp-1">{course.title}</h3>
                                <p className="text-sm text-slate-400 line-clamp-2 mb-4">{course.description || 'No description available.'}</p>

                                <div className="flex items-center justify-between text-slate-300 text-sm pt-4 border-t border-slate-700">
                                    <button
                                        onClick={() => openCurriculumModal(course)}
                                        className="flex items-center justify-center w-full hover:bg-slate-700 transition-colors bg-slate-900 px-3 py-3 rounded-xl font-bold text-indigo-400"
                                    >
                                        <BookOpen size={18} className="mr-2" /> Manage Curriculum
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/*  =================== ADD COURSE MODAL =================== */}
            {isCourseModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                    <div className="bg-slate-800 p-6 rounded-2xl w-full max-w-2xl border border-slate-700 shadow-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-white flex items-center">
                                <Plus className="mr-2 text-indigo-400" />
                                {editingCourseId ? 'Edit Course' : 'Create New Course'}
                            </h3>
                            <button onClick={() => setIsCourseModalOpen(false)} className="text-slate-400 hover:text-white">
                                <X size={24} />
                            </button>
                        </div>

                        {courseSuccess ? (
                            <div className="flex flex-col items-center justify-center py-8">
                                <CheckCircle size={48} className="text-emerald-500 mb-4" />
                                <p className="text-white text-lg font-bold">Course Created Successfully!</p>
                            </div>
                        ) : (
                            <form onSubmit={handleCreateCourse} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-slate-300 mb-1">Course Title</label>
                                        <input
                                            type="text" required value={courseTitle} onChange={(e) => setCourseTitle(e.target.value)}
                                            className="w-full bg-slate-900 border border-slate-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-indigo-500"
                                            placeholder="e.g. Physics Crash Course"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-slate-300 mb-1">Description</label>
                                        <textarea
                                            required rows={3} value={courseDescription} onChange={(e) => setCourseDescription(e.target.value)}
                                            className="w-full bg-slate-900 border border-slate-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-indigo-500 resize-none"
                                            placeholder="Detailed description of the course..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-1">Category</label>
                                        <select
                                            value={courseCategory} onChange={(e) => setCourseCategory(e.target.value)}
                                            className="w-full bg-slate-900 border border-slate-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-indigo-500"
                                        >
                                            {CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-1">Target Class</label>
                                        <select
                                            value={courseClass} onChange={(e) => setCourseClass(e.target.value)}
                                            className="w-full bg-slate-900 border border-slate-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-indigo-500"
                                        >
                                            {CLASS_OPTIONS.map(c => <option key={c} value={c}>{c === 'dropper' ? 'Dropper' : `Class ${c}`}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-1">Price (₹) - Enter 0 for Free</label>
                                        <input
                                            type="number" min="0" required value={coursePrice} onChange={(e) => setCoursePrice(e.target.value)}
                                            className="w-full bg-slate-900 border border-slate-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-indigo-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-1 flex items-center gap-2">
                                            <ImageIcon size={16} className="text-indigo-400" />
                                            Course Thumbnail
                                        </label>
                                        <input
                                            type="file" accept="image/*" required={!editingCourseId} onChange={(e) => setCourseThumbnail(e.target.files[0])}
                                            className="w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-indigo-500/20 file:text-indigo-300 hover:file:bg-indigo-500/30 cursor-pointer"
                                        />
                                        {editingCourseId && !courseThumbnail && (
                                            <p className="text-xs text-slate-500 mt-2">Leave empty to keep your current thumbnail.</p>
                                        )}
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isCreatingCourse || (!editingCourseId && !courseThumbnail)}
                                    className={`w-full py-3 mt-4 rounded-xl flex items-center justify-center text-white font-bold transition-all ${isCreatingCourse || (!editingCourseId && !courseThumbnail) ? 'bg-slate-700 cursor-not-allowed text-slate-400' : 'bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-600/20'
                                        }`}
                                >
                                    {isCreatingCourse ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                            {editingCourseId ? 'Updating...' : 'Publishing...'}
                                        </>
                                    ) : (
                                        editingCourseId ? 'Update Course' : 'Create Course'
                                    )}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            )}

            {/*  =================== ADD LESSON/PDF MODAL =================== */}
            {isMenuModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                    <div className="bg-slate-800 p-6 rounded-2xl w-full max-w-md border border-slate-700 shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-white flex items-center">
                                <UploadCloud className="mr-2 text-indigo-400" />
                                Upload {uploadType === 'video' ? 'Video Lesson' : uploadType === 'pdf' ? 'PDF Notes' : 'Assignment'}
                            </h3>
                            <button onClick={() => setIsMenuModalOpen(false)} className="text-slate-400 hover:text-white">
                                <X size={24} />
                            </button>
                        </div>

                        {uploadSuccess ? (
                            <div className="flex flex-col items-center justify-center py-8">
                                <CheckCircle size={48} className="text-emerald-500 mb-4" />
                                <p className="text-white text-lg font-bold">Upload Successful!</p>
                            </div>
                        ) : (
                            <form onSubmit={handleLessonUpload} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">Lesson Title</label>
                                    <input
                                        type="text" required value={title} onChange={(e) => setTitle(e.target.value)}
                                        className="w-full bg-slate-900 border border-slate-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-indigo-500"
                                        placeholder={`E.g., ${uploadType === 'pdf' ? 'Chapter 1 Notes' : uploadType === 'assignment' ? 'Weekly Assignment' : 'Intro to Physics'}`}
                                    />
                                </div>
                                <div className="flex gap-4">
                                    <div className="flex-1">
                                        <label className="block text-sm font-medium text-slate-300 mb-1">Order / Chapter No.</label>
                                        <input
                                            type="number" required min="1" value={order} onChange={(e) => setOrder(e.target.value)}
                                            className="w-full bg-slate-900 border border-slate-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-indigo-500"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <label className="block text-sm font-medium text-slate-300 mb-1">Course</label>
                                        <input
                                            type="text" disabled value={selectedCourse?.title || ''}
                                            className="w-full bg-slate-800 border border-slate-700 text-slate-400 px-4 py-2 rounded-lg opacity-50 cursor-not-allowed"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-1">Select File</label>
                                    <input
                                        type="file" required accept={uploadType === 'video' ? "video/*" : "application/pdf"} onChange={(e) => setFile(e.target.files[0])}
                                        className="w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-indigo-500/20 file:text-indigo-300 hover:file:bg-indigo-500/30 cursor-pointer"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={isUploading || !file}
                                    className={`w-full py-3 mt-4 rounded-xl flex items-center justify-center text-white font-bold transition-all ${isUploading || !file ? 'bg-slate-700 cursor-not-allowed text-slate-400' : 'bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-600/20'
                                        }`}
                                >
                                    {isUploading ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                            Uploading to Cloudinary...
                                        </>
                                    ) : (
                                        'Upload & Save'
                                    )}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            )}
            {/*  =================== CURRICULUM MODAL =================== */}
            {isCurriculumModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                    <div className="bg-slate-800 p-6 rounded-2xl w-full max-w-4xl border border-slate-700 shadow-2xl max-h-[90vh] flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-white flex items-center">
                                <BookOpen className="mr-2 text-indigo-400" />
                                Manage Curriculum: {selectedCourse?.title}
                            </h3>
                            <button onClick={() => setIsCurriculumModalOpen(false)} className="text-slate-400 hover:text-white">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="flex gap-4 mb-6">
                            <button
                                onClick={() => openUploadModal(selectedCourse, 'video')}
                                className="flex-1 py-3 bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600 hover:text-white rounded-xl transition-all flex items-center justify-center font-semibold border border-indigo-500/30"
                            >
                                <Video size={18} className="mr-2" /> Add Video
                            </button>
                            <button
                                onClick={() => openUploadModal(selectedCourse, 'pdf')}
                                className="flex-1 py-3 bg-pink-600/20 text-pink-400 hover:bg-pink-600 hover:text-white rounded-xl transition-all flex items-center justify-center font-semibold border border-pink-500/30"
                            >
                                <FileText size={18} className="mr-2" /> Add PDF Notes
                            </button>
                            <button
                                onClick={() => openUploadModal(selectedCourse, 'assignment')}
                                className="flex-1 py-3 bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600 hover:text-white rounded-xl transition-all flex items-center justify-center font-semibold border border-emerald-500/30"
                            >
                                <FolderPlus size={18} className="mr-2" /> Add Assignment
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto pr-2 space-y-3">
                            {loadingLessons ? (
                                <div className="text-center text-slate-400 py-10">Loading lessons...</div>
                            ) : courseLessons.length === 0 ? (
                                <div className="text-center text-slate-500 py-10 border-2 border-dashed border-slate-700 rounded-xl">
                                    No content added yet. Click above to add some.
                                </div>
                            ) : (
                                courseLessons.map((lesson) => (
                                    <div key={lesson._id} className="bg-slate-900 border border-slate-700 p-4 rounded-xl flex items-center justify-between group hover:border-indigo-500/50 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400">
                                                {lesson.videoUrl && lesson.videoUrl !== 'none' ? <Video size={20} className="text-indigo-400" /> :
                                                 lesson.pdfUrl ? <FileText size={20} className="text-pink-400" /> :
                                                 <FolderPlus size={20} className="text-emerald-400" />}
                                            </div>
                                            <div>
                                                <h4 className="text-white font-semibold">{lesson.title}</h4>
                                                <div className="text-xs text-slate-500 flex gap-3 mt-1">
                                                    <span>Order: {lesson.order}</span>
                                                    <span className="capitalize text-indigo-300">
                                                        {lesson.videoUrl && lesson.videoUrl !== 'none' ? 'Video' : lesson.pdfUrl ? 'PDF Note' : 'Assignment'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => handleDeleteLesson(lesson._id)}
                                            className="p-2 text-slate-500 hover:text-pink-500 hover:bg-pink-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
