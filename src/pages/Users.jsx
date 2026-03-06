import React, { useState, useEffect } from 'react';
import api from '../api';
import { Shield, Trash2, Search, Download, Filter } from 'lucide-react';

function Users() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const token = localStorage.getItem('adminToken');
    const adminUser = JSON.parse(localStorage.getItem('adminUser'));

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await api.get('/auth/users');
            // Handle both old format (array) and new paginated format
            const data = Array.isArray(res.data) ? res.data : res.data.users || [];
            setUsers(data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching users:', error);
            setLoading(false);
        }
    };

    const toggleRole = async (userId, currentRole) => {
        const newRole = currentRole === 'admin' ? 'student' : 'admin';
        try {
            await api.put(`/auth/users/${userId}/role`, { role: newRole });
            setUsers(users.map(u => u._id === userId ? { ...u, role: newRole } : u));
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to update role');
        }
    };

    const deleteUser = async (userId) => {
        if (!window.confirm("Are you sure you want to delete this user?")) return;
        try {
            await api.delete(`/auth/users/${userId}`);
            setUsers(users.filter(u => u._id !== userId));
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to delete user');
        }
    };

    const exportCSV = () => {
        const headers = ['Name', 'Email', 'Role', 'Class', 'Exam Category', 'Joined'];
        const rows = filteredUsers.map(u => [
            u.name || '',
            u.email || '',
            u.role || '',
            u.class || '',
            u.examCategory || '',
            u.createdAt ? new Date(u.createdAt).toLocaleDateString() : ''
        ]);
        const csv = [headers, ...rows].map(row => row.map(v => `"${v}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `saarthiprep-users-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // Filter users
    const filteredUsers = users.filter(u => {
        const matchName = u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase());
        const matchRole = roleFilter === 'all' || u.role === roleFilter;
        return matchName && matchRole;
    });

    return (
        <div className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                <h1 className="text-2xl font-bold text-white">Manage Users <span className="text-sm text-gray-400 font-normal">({filteredUsers.length})</span></h1>
                <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/30 transition-colors text-sm font-semibold">
                    <Download size={16} /> Export CSV
                </button>
            </div>

            {/* Search & Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <div className="relative flex-1">
                    <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search by name or email..."
                        className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500/50 placeholder-gray-500"
                    />
                </div>
                <div className="relative">
                    <Filter size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <select
                        value={roleFilter}
                        onChange={e => setRoleFilter(e.target.value)}
                        className="pl-10 pr-8 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500/50 appearance-none"
                    >
                        <option value="all">All Roles</option>
                        <option value="student">Students</option>
                        <option value="admin">Admins</option>
                    </select>
                </div>
            </div>

            <div className="bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-white/5 text-gray-400 text-sm uppercase">
                                <th className="px-6 py-4 font-semibold">Name</th>
                                <th className="px-6 py-4 font-semibold">Email</th>
                                <th className="px-6 py-4 font-semibold">Role</th>
                                <th className="px-6 py-4 font-semibold">Class</th>
                                <th className="px-6 py-4 font-semibold">Joined</th>
                                <th className="px-6 py-4 font-semibold">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-8 text-center text-gray-400">Loading users...</td>
                                </tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-8 text-center text-gray-400">No users found.</td>
                                </tr>
                            ) : (
                                filteredUsers.map((user) => (
                                    <tr key={user._id} className="hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center">
                                                <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold mr-3">
                                                    {user.name ? user.name.charAt(0).toUpperCase() : '?'}
                                                </div>
                                                <span className="text-white font-medium">{user.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-300">{user.email}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${user.role === 'admin'
                                                ? 'bg-purple-500/20 text-purple-400'
                                                : 'bg-emerald-500/20 text-emerald-400'
                                                }`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-300">
                                            {user.class ? `Class ${user.class}` : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-gray-300 text-sm">
                                            {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={() => toggleRole(user._id, user.role)}
                                                    disabled={user._id === adminUser?.id}
                                                    title={user.role === 'admin' ? "Demote to Student" : "Promote to Admin"}
                                                    className={`p-1.5 rounded-lg transition-colors ${user._id === adminUser?.id
                                                        ? 'text-gray-600 bg-gray-800 cursor-not-allowed'
                                                        : 'text-indigo-400 hover:bg-indigo-500/20 bg-indigo-500/10'
                                                        }`}
                                                >
                                                    <Shield size={16} />
                                                </button>
                                                <button
                                                    onClick={() => deleteUser(user._id)}
                                                    disabled={user._id === adminUser?.id}
                                                    title="Delete User"
                                                    className={`p-1.5 rounded-lg transition-colors ${user._id === adminUser?.id
                                                        ? 'text-gray-600 bg-gray-800 cursor-not-allowed'
                                                        : 'text-red-400 hover:bg-red-500/20 bg-red-500/10'
                                                        }`}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default Users;
