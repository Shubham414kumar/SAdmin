import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'https://saarthiprep-kfkl.onrender.com/api';

const api = axios.create({
    baseURL: API_BASE,
});

// Add a request interceptor to inject the token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('adminToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Add a response interceptor to handle expired/invalid tokens
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // Token expired or invalid — force logout
            localStorage.removeItem('adminToken');
            localStorage.removeItem('adminUser');
            // Redirect to login
            window.location.hash = '#/login';
            window.location.reload();
        }
        return Promise.reject(error);
    }
);

export const uploadFile = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/upload', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};

export const createCourse = async (courseData) => {
    const response = await api.post('/courses', courseData);
    return response.data;
};

export const updateCourse = async (id, courseData) => {
    const response = await api.put(`/courses/${id}`, courseData);
    return response.data;
};

export const deleteCourse = async (id) => {
    const response = await api.delete(`/courses/${id}`);
    return response.data;
};

export const createLesson = async (lessonData) => {
    const response = await api.post('/courses/lesson', lessonData);
    return response.data;
};

export const deleteLesson = async (id) => {
    const response = await api.delete(`/courses/lesson/${id}`);
    return response.data;
};

export const fetchCourses = async () => {
    const response = await api.get('/courses');
    return response.data;
};

// --- Analytics API ---
export const fetchDashboardStats = async () => {
    const response = await api.get('/analytics/dashboard');
    return response.data;
};

// --- Admit Card API ---
export const fetchAdmitCards = async () => {
    const response = await api.get('/admit-cards');
    return response.data;
};
export const createAdmitCard = async (data) => {
    const response = await api.post('/admit-cards', data);
    return response.data;
};
export const deleteAdmitCard = async (id) => {
    const response = await api.delete(`/admit-cards/${id}`);
    return response.data;
};

// --- Results API ---
export const fetchResults = async () => {
    const response = await api.get('/results');
    return response.data;
};
export const createResult = async (data) => {
    const response = await api.post('/results', data);
    return response.data;
};
export const uploadBulkResults = async (dataArray) => {
    const response = await api.post('/results/upload', dataArray);
    return response.data;
};
export const deleteResult = async (id) => {
    const response = await api.delete(`/results/${id}`);
    return response.data;
};

// --- Vacancies API ---
export const fetchVacancies = async () => {
    const response = await api.get('/vacancies');
    return response.data;
};
export const createVacancy = async (data) => {
    const response = await api.post('/vacancies', data);
    return response.data;
};
export const updateVacancy = async (id, data) => {
    const response = await api.put(`/vacancies/${id}`, data);
    return response.data;
};
export const deleteVacancy = async (id) => {
    const response = await api.delete(`/vacancies/${id}`);
    return response.data;
};

// --- Current Affairs API ---
export const fetchCurrentAffairs = async (date) => {
    const url = date ? `/current-affairs?date=${date}` : '/current-affairs';
    const response = await api.get(url);
    return response.data;
};
export const generateCurrentAffairs = async () => {
    const response = await api.post('/current-affairs/generate');
    return response.data;
};

// --- Study Materials API ---
export const fetchBooks = async () => {
    const response = await api.get('/study-materials/books');
    return response.data;
};
export const createBook = async (data) => {
    const response = await api.post('/study-materials/books', data);
    return response.data;
};
export const deleteBook = async (id) => {
    const response = await api.delete(`/study-materials/books/${id}`);
    return response.data;
};

export const fetchSyllabus = async () => {
    const response = await api.get('/study-materials/syllabus');
    return response.data;
};
export const createSyllabus = async (data) => {
    const response = await api.post('/study-materials/syllabus', data);
    return response.data;
};
export const deleteSyllabus = async (id) => {
    const response = await api.delete(`/study-materials/syllabus/${id}`);
    return response.data;
};

export const fetchPYQs = async () => {
    const response = await api.get('/study-materials/pyqs');
    return response.data;
};
export const createPYQ = async (data) => {
    const response = await api.post('/study-materials/pyqs', data);
    return response.data;
};
export const deletePYQ = async (id) => {
    const response = await api.delete(`/study-materials/pyqs/${id}`);
    return response.data;
};

// --- Quiz API ---
export const fetchQuizzes = async (studentClass = '') => {
    const url = studentClass ? `/quizzes?class=${studentClass}` : '/quizzes';
    const response = await api.get(url);
    return response.data;
};
export const createQuiz = async (data) => {
    const response = await api.post('/quizzes', data);
    return response.data;
};
export const deleteQuiz = async (id) => {
    const response = await api.delete(`/quizzes/${id}`);
    return response.data;
};

export default api;
