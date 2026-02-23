import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Edit2, Shield, Trash2 } from 'lucide-react';

function Users() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const token = localStorage.getItem('adminToken');
    const adminUser = JSON.parse(localStorage.getItem('adminUser'));

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/auth/users', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUsers(res.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching users:', error);
            setLoading(false);
        }
    };

    const toggleRole = async (userId, currentRole) => {
        const newRole = currentRole === 'admin' ? 'student' : 'admin';
        try {
            await axios.put(`http://localhost:5000/api/auth/users/${userId}/role`, { role: newRole }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Update local state
            setUsers(users.map(u => u._id === userId ? { ...u, role: newRole } : u));
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to update role');
        }
    };

    const deleteUser = async (userId) => {
        if (!window.confirm("Are you sure you want to delete this user?")) return;
        try {
            await axios.delete(`http://localhost:5000/api/auth/users/${userId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUsers(users.filter(u => u._id !== userId));
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to delete user');
        }
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold text-white mb-6">Manage Users</h1>

            <div className="bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-white/5 text-gray-400 text-sm uppercase">
                                <th className="px-6 py-4 font-semibold">Name</th>
                                <th className="px-6 py-4 font-semibold">Email</th>
                                <th className="px-6 py-4 font-semibold">Role</th>
                                <th className="px-6 py-4 font-semibold">Class</th>
                                <th className="px-6 py-4 font-semibold">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-8 text-center text-gray-400">Loading users...</td>
                                </tr>
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-8 text-center text-gray-400">No users found.</td>
                                </tr>
                            ) : (
                                users.map((user) => (
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
