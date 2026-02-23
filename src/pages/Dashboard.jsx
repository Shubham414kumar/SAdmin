import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Users, BookOpen, IndianRupee, TrendingUp, Briefcase, Bell, FileText, MapPin } from 'lucide-react';
import { fetchDashboardStats } from '../api';

const StatCard = ({ title, value, icon: Icon, color, trend }) => (
    <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 hover:border-indigo-500/30 transition-all duration-300">
        <div className="flex items-start justify-between">
            <div>
                <p className="text-slate-400 text-sm font-medium mb-1">{title}</p>
                <h3 className="text-3xl font-bold text-white mb-2">{value}</h3>
                {(trend !== undefined && trend !== null) && (
                    <p className={`text-xs font-medium flex items-center ${trend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        <TrendingUp size={12} className="mr-1" />
                        {trend}% from last month
                    </p>
                )}
            </div>
            <div className={`p-3 rounded-xl bg-opacity-20 ${color}`}>
                <Icon size={24} className={color.replace('bg-', 'text-')} />
            </div>
        </div>
    </div>
);

const COLORS = ['#6366F1', '#EC4899', '#F59E0B', '#10B981', '#EF4444', '#8B5CF6'];

export default function Dashboard() {
    const [statsData, setStatsData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadDashboard = async () => {
            try {
                const data = await fetchDashboardStats();
                setStatsData(data);
            } catch (error) {
                console.error("Failed to load dashboard stats:", error);
            } finally {
                setLoading(false);
            }
        };
        loadDashboard();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[70vh]">
                <div className="text-white text-lg flex items-center">
                    <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent flex items-center justify-center rounded-full animate-spin mr-3"></div>
                    Loading Dashboard...
                </div>
            </div>
        );
    }

    if (!statsData) {
        return <div className="text-white">Failed to load data.</div>;
    }

    const { stats, monthlyData, examDistribution, recentActivity } = statsData;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-white">Dashboard Overview</h2>
                    <p className="text-slate-400">Welcome back, Admin • {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>
            </div>

            {/* Stats Grid — 6 cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <StatCard title="Total Students" value={stats.totalStudents} icon={Users} color="bg-blue-500 text-blue-400" trend={12} />
                <StatCard title="Active Courses" value={stats.activeCourses} icon={BookOpen} color="bg-purple-500 text-purple-400" trend={5} />
                <StatCard title="Revenue (₹)" value={`₹${stats.revenue}`} icon={IndianRupee} color="bg-green-500 text-green-400" trend={18} />
                <StatCard title="Active Vacancies" value={stats.activeVacancies} icon={Briefcase} color="bg-pink-500 text-pink-400" trend={14} />
                <StatCard title="Notifications Sent" value={stats.notificationsSent} icon={Bell} color="bg-yellow-500 text-yellow-400" trend={22} />
                <StatCard title="PYQ Downloads" value={stats.pyqDownloads} icon={FileText} color="bg-cyan-500 text-cyan-400" trend={8} />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
                    <h3 className="text-lg font-bold text-white mb-6">User Growth & Revenue</h3>
                    <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={monthlyData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                <XAxis dataKey="name" stroke="#94A3B8" />
                                <YAxis stroke="#94A3B8" />
                                <Tooltip contentStyle={{ backgroundColor: '#1E293B', borderColor: '#334155', color: '#fff' }} itemStyle={{ color: '#fff' }} />
                                <Line type="monotone" dataKey="users" stroke="#3B82F6" strokeWidth={2} name="Users" />
                                <Line type="monotone" dataKey="revenue" stroke="#8B5CF6" strokeWidth={2} name="Revenue (₹)" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
                    <h3 className="text-lg font-bold text-white mb-6">Students by Exam Category</h3>
                    <div className="h-72 w-full flex items-center">
                        <ResponsiveContainer width="55%" height="100%">
                            <PieChart>
                                <Pie data={examDistribution} cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={4} dataKey="value">
                                    {examDistribution.map((entry, i) => (
                                        <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: '#1E293B', borderColor: '#334155', color: '#fff' }} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="flex-1 space-y-2 pl-2">
                            {examDistribution.map((item, i) => (
                                <div key={item.name} className="flex items-center text-sm">
                                    <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                    <span className="text-slate-400 flex-1">{item.name}</span>
                                    <span className="text-white font-semibold">{item.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Vacancies Bar + Activity Feed */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
                    <h3 className="text-lg font-bold text-white mb-6">Vacancies Posted (Monthly)</h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={monthlyData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                <XAxis dataKey="name" stroke="#94A3B8" />
                                <YAxis stroke="#94A3B8" />
                                <Tooltip contentStyle={{ backgroundColor: '#1E293B', borderColor: '#334155', color: '#fff' }} />
                                <Bar dataKey="vacancies" fill="#EC4899" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
                    <h3 className="text-lg font-bold text-white mb-4">Recent Activity</h3>
                    <div className="space-y-3">
                        {recentActivity.map((a, i) => (
                            <div key={i} className="flex items-start gap-3 py-2 border-b border-slate-700/50 last:border-0">
                                <span className="text-xl mt-0.5">{a.icon}</span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-slate-300 truncate">{a.msg}</p>
                                    <p className="text-xs text-slate-500 mt-0.5">{a.time}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
