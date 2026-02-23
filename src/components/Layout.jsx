import { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, BookOpen, Users, LogOut, Menu, X, Briefcase, Bell, IndianRupee, Newspaper, BrainCircuit } from 'lucide-react';

export default function Layout({ onLogout }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const location = useLocation();

    const menuItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
        { icon: BookOpen, label: 'Courses', path: '/courses' },
        { icon: Users, label: 'Users', path: '/users' },
        { icon: Briefcase, label: 'Vacancies', path: '/vacancies' },
        { icon: BookOpen, label: 'Admit Cards', path: '/admit-cards' },
        { icon: Users, label: 'Results', path: '/results' },
        { icon: Newspaper, label: 'Current Affairs', path: '/current-affairs' },
        { icon: BookOpen, label: 'Study Materials', path: '/study-materials' },
        { icon: BrainCircuit, label: 'Quizzes', path: '/quizzes' },
        { icon: Bell, label: 'Notifications', path: '/notifications' },
        { icon: IndianRupee, label: 'Payments', path: '/payments' },
    ];

    return (
        <div className="flex h-screen bg-slate-900 text-white overflow-hidden">

            {/* Sidebar */}
            <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-800 border-r border-slate-700 transformation transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0`}>
                <div className="flex items-center justify-between p-4 border-b border-slate-700">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">SaarthiPrep Admin</h1>
                    <button onClick={() => setSidebarOpen(false)} className="md:hidden text-slate-400 hover:text-white">
                        <X size={24} />
                    </button>
                </div>

                <nav className="p-4 space-y-2">
                    {menuItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center px-4 py-3 rounded-xl transition-colors ${location.pathname === item.path ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-700 hover:text-white'}`}
                        >
                            <item.icon size={20} className="mr-3" />
                            <span className="font-medium">{item.label}</span>
                        </Link>
                    ))}
                </nav>

                <div className="absolute bottom-0 w-full p-4 border-t border-slate-700">
                    <button onClick={onLogout} className="flex items-center w-full px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors">
                        <LogOut size={20} className="mr-3" />
                        <span className="font-medium">Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header (Mobile) */}
                <header className="md:hidden flex items-center justify-between p-4 bg-slate-800 border-b border-slate-700">
                    <h1 className="font-bold text-lg">Admin Panel</h1>
                    <button onClick={() => setSidebarOpen(true)} className="text-white">
                        <Menu size={24} />
                    </button>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-auto p-6">
                    <Outlet />
                </main>
            </div>

        </div>
    );
}
