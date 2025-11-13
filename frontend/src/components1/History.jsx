import React, { useState, useEffect } from 'react';
import { MdSearch, MdFilterList, MdCalendarToday, MdReceipt, MdShoppingCart, MdAttachMoney, MdAccountBalance, MdTrendingUp, MdVisibility } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import { backendGqlApi } from '../utils/axiosInstance';
import { findallTransactionsQuery } from '../utils/gqlQuery';
import { toast } from 'react-toastify';
import { formatDistanceToNow } from 'date-fns';


const History = () => {
  const navigate = useNavigate();
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        const response = await backendGqlApi.post('/graphql', {
          query: findallTransactionsQuery,
        });

        if (response.data.errors) {
          console.error('Transaction API errors:', response.data.errors);
          toast.error('Failed to load transactions');
          setError('Failed to load transactions');
          return;
        }

        const transactionsData = response.data.data.transactions;
        setTransactions(transactionsData);
      } catch (err) {
        setError('Failed to load transactions');
        console.error('Transaction error:', err);
        toast.error('Failed to load transactions');
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  const filteredTransactions = transactions.filter(t => {
    const typeMatch = selectedFilter === 'all' || t.type?.toLowerCase() === selectedFilter;
    const searchMatch = searchTerm === '' || 
      t.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.product?.toLowerCase().includes(searchTerm.toLowerCase());
    return typeMatch && searchMatch;
  });

  // Calculate summary statistics
  const totalTransactions = transactions.length;
  const totalSales = transactions
    .filter(t => t.type?.toLowerCase() === 'sale')
    .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
  const totalPurchases = transactions
    .filter(t => t.type?.toLowerCase() === 'purchase')
    .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
  const netProfit = totalSales - totalPurchases;

  const handleTransactionClick = (transaction) => {
    navigate(`/transaction/${transaction.id}`);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type) => {
    return type === 'sale' ? <MdShoppingCart className="text-[#BE741E]" /> : <MdAttachMoney className="text-[#BE741E]" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#BE741E]"></div>
        <p className="ml-4 text-gray-600">Loading transactions...</p>
      </div>
    );
  }

  if (error) {
    return <div className="text-center py-8 text-red-600">{error}</div>;
  }

  return (
    <div className="space-y-6 ">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Transaction History</h2>
          <p className="text-gray-600">View all your sales and purchase transactions</p>
        </div>
        <div className="flex items-center gap-2">
          <MdCalendarToday className="text-gray-400" />
          <span className="text-sm text-gray-600">Last 30 days</span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Transactions</p>
              <p className="text-3xl font-bold text-gray-800">{totalTransactions}</p>
            </div>
            <div className="bg-[#BE741E] p-3 mt-4 rounded-lg">
              <MdReceipt className="text-white text-2xl" />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Sales</p>
              <p className="text-2xl font-bold text-gray-800">{totalSales.toLocaleString()} Frw</p>
            </div>
            <div className="bg-[#BE741E] p-3 rounded-lg">
              <MdShoppingCart className="text-[#fff] text-2xl" />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Purchases</p>
              <p className="text-2xl font-bold text-gray-800">{totalPurchases.toLocaleString()} Frw</p>
            </div>
            <div className="bg-[#BE741E] p-3 rounded-lg">
              <MdAttachMoney className="text-[#fff] text-2xl" />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Net Profit</p>
              <p className="text-2xl font-bold text-gray-800">{netProfit.toLocaleString()} Frw</p>
            </div>
            <div className="bg-[#BE741E] p-3 rounded-lg">
              <MdTrendingUp className="text-white text-2xl" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <MdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl" />
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedFilter('all')}
              className={`px-4 py-2 rounded-lg transition duration-200 ${
                selectedFilter === 'all' 
                  ? 'bg-black text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setSelectedFilter('sale')}
              className={`px-4 py-2 rounded-lg transition duration-200 ${
                selectedFilter === 'sale' 
                  ? 'bg-[#BE741E] text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Sales ({transactions.filter(t => t.type?.toLowerCase() === 'sale').length})
            </button>
            <button
              onClick={() => setSelectedFilter('purchase')}
              className={`px-4 py-2 rounded-lg transition duration-200 ${
                selectedFilter === 'purchase' 
                  ? 'bg-[#BE741E] text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Purchases ({transactions.filter(t => t.type?.toLowerCase() === 'purchase').length})
            </button>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">Recent Transactions</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Type</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Description</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Amount</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Date</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Status</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((transaction) => (
                  <tr 
                    key={transaction.id} 
                    className="hover:bg-gray-50 transition duration-150 cursor-pointer"
                    onClick={() => handleTransactionClick(transaction)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(transaction.type)}
                        <span className="text-sm font-medium capitalize text-gray-900">
                          {transaction.type}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                      {transaction.description || transaction.product || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {parseFloat(transaction.amount || 0).toLocaleString()} Frw
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {transaction.createdAt 
                        ? new Date(transaction.createdAt).toLocaleDateString()
                        : 'N/A'
                      }
                      <br />
                      <span className="text-xs text-gray-400">
                        {transaction.createdAt 
                          ? formatDistanceToNow(new Date(transaction.createdAt), { addSuffix: true })
                          : ''
                        }
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${
                        transaction.status ? getStatusColor(transaction.status) : 'bg-gray-100 text-gray-800'
                      }`}>
                        {transaction.status || 'completed'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTransactionClick(transaction);
                        }}
                        className="text-[#BE741E] hover:text-[#A0621A] p-2 rounded-lg hover:bg-orange-50 transition duration-200"
                        title="View Details"
                      >
                        <MdVisibility className="text-lg" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                    {searchTerm || selectedFilter !== 'all' 
                      ? 'No transactions found matching your criteria' 
                      : 'No transactions available'
                    }
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default History;
