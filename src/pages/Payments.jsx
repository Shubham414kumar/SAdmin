import React, { useState, useEffect } from 'react';
import api from '../api';
import { Search, Download, Filter } from 'lucide-react';

function Payments() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const res = await api.get('/payment/orders');
            setOrders(res.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching orders:', error);
            setLoading(false);
        }
    };

    const filteredOrders = orders.filter(o => {
        const matchSearch = (o.userId?.name || '').toLowerCase().includes(search.toLowerCase()) ||
            (o.userId?.email || '').toLowerCase().includes(search.toLowerCase()) ||
            (o.razorpayOrderId || '').toLowerCase().includes(search.toLowerCase());
        const matchStatus = statusFilter === 'all' || o.status === statusFilter;
        return matchSearch && matchStatus;
    });

    const exportCSV = () => {
        const headers = ['User', 'Email', 'Order ID', 'Amount', 'Status', 'Payment ID', 'Date'];
        const rows = filteredOrders.map(o => [
            o.userId?.name || 'Unknown',
            o.userId?.email || '',
            o.razorpayOrderId || '',
            o.amount || 0,
            o.status || '',
            o.paymentId || '',
            o.createdAt ? new Date(o.createdAt).toLocaleString() : ''
        ]);
        const csv = [headers, ...rows].map(row => row.map(v => `"${v}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `saarthiprep-payments-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const totalRevenue = filteredOrders.filter(o => o.status === 'paid').reduce((sum, o) => sum + (o.amount || 0), 0);

    return (
        <div className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Payment History <span className="text-sm text-gray-400 font-normal">({filteredOrders.length})</span></h1>
                    <p className="text-emerald-400 text-sm mt-1">Total Revenue: ₹{totalRevenue.toLocaleString()}</p>
                </div>
                <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/30 transition-colors text-sm font-semibold">
                    <Download size={16} /> Export CSV
                </button>
            </div>

            {/* Search & Filter */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <div className="relative flex-1">
                    <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search by name, email, or order ID..."
                        className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500/50 placeholder-gray-500"
                    />
                </div>
                <div className="relative">
                    <Filter size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <select
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                        className="pl-10 pr-8 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500/50 appearance-none"
                    >
                        <option value="all">All Status</option>
                        <option value="paid">Paid</option>
                        <option value="created">Pending</option>
                        <option value="failed">Failed</option>
                    </select>
                </div>
            </div>

            <div className="bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-white/5 text-gray-400 text-sm uppercase">
                                <th className="px-6 py-4 font-semibold">User</th>
                                <th className="px-6 py-4 font-semibold">Order ID</th>
                                <th className="px-6 py-4 font-semibold">Amount</th>
                                <th className="px-6 py-4 font-semibold">Status</th>
                                <th className="px-6 py-4 font-semibold">Payment ID</th>
                                <th className="px-6 py-4 font-semibold">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-8 text-center text-gray-400">Loading orders...</td>
                                </tr>
                            ) : filteredOrders.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-8 text-center text-gray-400">No orders found.</td>
                                </tr>
                            ) : (
                                filteredOrders.map((order) => (
                                    <tr key={order._id} className="hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="text-white font-medium">{order.userId?.name || 'Unknown'}</div>
                                            <div className="text-gray-500 text-xs">{order.userId?.email}</div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-300 font-mono text-xs">{order.razorpayOrderId}</td>
                                        <td className="px-6 py-4 text-white font-bold">₹{order.amount}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${order.status === 'paid'
                                                ? 'bg-green-500/20 text-green-400'
                                                : order.status === 'failed'
                                                    ? 'bg-red-500/20 text-red-400'
                                                    : 'bg-yellow-500/20 text-yellow-400'
                                                }`}>
                                                {order.status?.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-300 font-mono text-xs">{order.paymentId || '-'}</td>
                                        <td className="px-6 py-4 text-gray-400 text-sm">
                                            {new Date(order.createdAt).toLocaleString()}
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

export default Payments;
