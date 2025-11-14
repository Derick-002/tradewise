import React, { useState, useEffect } from 'react';
import { MdAdd, MdSearch, MdFilterList, MdEdit, MdDelete, MdVisibility, MdAttachMoney, MdAccountBalance, MdTrendingUp, MdTrendingDown, MdCreditCard, MdAccountBalanceWallet, MdReceipt, MdWarning, MdCheckCircle } from 'react-icons/md';
import { toast } from 'react-toastify';
import { useNavigate, useParams } from 'react-router-dom';
import { backendGqlApi } from '../utils/axiosInstance';
import { findAllFinancials, makeFinancialPaid, updateFinancials } from '../utils/gqlQuery';
import FinancialForm from './forms/FinancialForm';
import ViewFinancialModal from './modals/ViewFinancialModal';

const CreditsDebit = () => {
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isFinancialFormOpen, setIsFinancialFormOpen] = useState(false);
  const [financials, setFinancials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFinancial, setSelectedFinancial] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(10);
  const [isConfirmPaidOpen, setIsConfirmPaidOpen] = useState(false);
  const [financialToMarkPaid, setFinancialToMarkPaid] = useState(null);
  const [confirmPaidText, setConfirmPaidText] = useState('');
  const navigate = useNavigate();
  const { financialId } = useParams();

  // Fetch financials from backend
  const fetchFinancials = async () => {
    try {
      setLoading(true);
      const response = await backendGqlApi.post('/graphql', {
        query: findAllFinancials
      });
      
      if (response.data.errors) {
        return toast.error('Error fetching financials: ' + response.data.errors[0].message);
      }

      // Use backend data as-is, convert isPaidBack to boolean
      const financialsWithPaidStatus = response.data.data.financials.map(financial => ({
        ...financial,
        paid: Boolean(financial.isPaidBack) // Convert 0/1 to false/true
      }));
      
      setFinancials(financialsWithPaidStatus);
    } catch (error) {
      console.error('Error fetching financials:', error);
      toast.error('Failed to fetch financial data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinancials();
  }, []);

  // Handle URL params - open modal if financialId is present
  useEffect(() => {
    if (financialId && financials.length > 0) {
      const financial = financials.find(f => f.id === financialId);
      if (financial) {
        setSelectedFinancial(financial);
        setIsViewModalOpen(true);
      }
    }
  }, [financialId, financials]);

  // Helper function to check if deadline is approaching (within 1 day)
  const isDeadlineApproaching = (deadline) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const timeDiff = deadlineDate.getTime() - now.getTime();
    const daysDiff = timeDiff / (1000 * 3600 * 24);
    return daysDiff <= 1 && daysDiff > 0;
  };

  // Helper function to check if deadline is overdue
  const isOverdue = (deadline) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    return deadlineDate < now;
  };

  // Handle view financial
  const handleViewFinancial = (financial) => {
    setSelectedFinancial(financial);
    setIsViewModalOpen(true);
    navigate(`/financials/${financial.id}`);
  };

  // Handle close view modal
  const handleCloseViewModal = () => {
    setSelectedFinancial(null);
    setIsViewModalOpen(false);
    navigate('/dashboard');
  };

  // Open confirmation modal for marking as paid
  const handleMarkAsPaid = (financial) => {
    if (!financial.paid) {
      setFinancialToMarkPaid(financial);
      setConfirmPaidText('');
      setIsConfirmPaidOpen(true);
    }
  };

  // Actually perform mark-as-paid after confirmation
  const confirmMarkAsPaid = async () => {
    if (!financialToMarkPaid || confirmPaidText.toLowerCase().trim() !== 'mark as paid') return;

    try {
      const response = await backendGqlApi.post('/graphql', {
        query: makeFinancialPaid,
        variables: { financialId: financialToMarkPaid.id }
      });
      
      if (response.data.errors) {
        toast.error('Error marking financial as paid: ' + response.data.errors[0].message);
        return;
      }
      
      toast.success('Financial marked as paid successfully!');
      setIsConfirmPaidOpen(false);
      setFinancialToMarkPaid(null);
      setConfirmPaidText('');
      fetchFinancials(); // Refresh the data
    } catch (error) {
      console.error('Error marking financial as paid:', error);
      toast.error('Failed to mark financial as paid');
    }
  };

  // Handle update financial
  const handleUpdateFinancial = async (updatedFinancial) => {
    try {
      const response = await backendGqlApi.post('/graphql', {
        query: updateFinancials,
        variables: {
          financialId: updatedFinancial.id,
          input: {
            amount: updatedFinancial.amount,
            description: updatedFinancial.description,
            collateral: updatedFinancial.collateral,
            deadline: updatedFinancial.deadline
          }
        }
      });

      if (response.data.errors) {
        toast.error('Error updating financial: ' + response.data.errors[0].message);
        return;
      }
      
      toast.success('Financial updated successfully!');
      fetchFinancials(); // Refresh the data
    } catch (error) {
      console.error('Error updating financial:', error);
      toast.error('Failed to update financial');
    }
  };

  const formatDeadline = (deadline) => {
    return new Date(deadline).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const filteredTransactions = financials
    .filter(t => {
      // Filter by type
      const typeMatch = selectedFilter === 'all' || t.type.toLowerCase() === selectedFilter;
      // Filter by search term (description)
      const searchMatch = searchTerm === '' || t.description.toLowerCase().includes(searchTerm.toLowerCase());
      return typeMatch && searchMatch;
    });

  const visibleTransactions = filteredTransactions.slice(0, visibleCount);

  // Infinite scroll handler
  const handleScroll = () => {
    const bottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 2;
    if (bottom && visibleCount < filteredTransactions.length) {
      setVisibleCount((prev) => prev + 10);
    }
  };

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [visibleCount, filteredTransactions.length]);

  const totalCredits = financials.filter(t => t.type === 'Credit').reduce((sum, t) => sum + t.amount, 0);
  const totalDebits = financials.filter(t => t.type === 'Debit').reduce((sum, t) => sum + t.amount, 0);
  const netBalance = totalDebits - totalCredits; // Debits (money owed to user) minus Credits (money user owes)

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type) => {
    return type === 'Credit' ? (
      <MdTrendingDown className="text-red-500 text-lg" />
    ) : (
      <MdTrendingUp className="text-green-500 text-lg" />
    );
  };

  return (
    <div className="space-y-6 overflow-auto ">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Financial Management</h2>
          <p className="text-gray-600">Track your credits, debits, and financial transactions</p>
        </div>
        <button 
          onClick={() => setIsFinancialFormOpen(true)}
          className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition duration-200 flex items-center gap-2"
        >
          <MdAdd className="text-xl" />
          New Financial
        </button>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-[#BE741E] text-white p-6 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white">Total Credits</p>
              <p className="text-3xl font-bold">{(totalCredits / 1000000).toFixed(1)}M</p>
            </div>
            <div className="text-4xl opacity-80"><MdTrendingDown className="text-6xl" /></div>
          </div>
        </div>
        <div className="bg-[#BE741E] text-white p-6 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white">Total Debits</p>
              <p className="text-3xl font-bold">{(totalDebits / 1000000).toFixed(1)}M</p>
            </div>
            <div className="text-4xl opacity-80"><MdTrendingUp className="text-6xl" /></div>
          </div>
        </div>
        <div className="bg-[#BE741E] text-white p-6 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white">Net Balance</p>
              <p className={`text-3xl font-bold ${netBalance >= 0 ? 'text-white' : 'text-red-200'}`}>
                {(netBalance / 1000000).toFixed(1)}M
              </p>
            </div>
            <div className="text-4xl opacity-80"><MdTrendingUp className="text-6xl" /></div>
          </div>
        </div>
        <div className="bg-[#BE741E] text-white p-6 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white">Transactions</p>
              <p className="text-3xl font-bold">{financials.length}</p>
            </div>
            <div className="text-4xl opacity-80"><MdReceipt className="text-6xl" /></div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button 
            onClick={() => setIsFinancialFormOpen(true)}
            className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition duration-200"
          >
            <div className="bg-green-100 p-2 rounded-lg">
              <MdTrendingUp className="text-green-600 text-xl" />
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-800">Record Credit</p>
              <p className="text-sm text-gray-600">Add incoming payment</p>
            </div>
          </button>
          <button 
            onClick={() => setIsFinancialFormOpen(true)}
            className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition duration-200"
          >
            <div className="bg-red-100 p-2 rounded-lg">
              <MdTrendingDown className="text-red-600 text-xl" />
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-800">Record Debit</p>
              <p className="text-sm text-gray-600">Add outgoing payment</p>
            </div>
          </button>
          <button className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition duration-200">
            <div className="bg-purple-100 p-2 rounded-lg">
              <MdAttachMoney className="text-purple-600 text-xl" />
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-800">Financial Reports</p>
              <p className="text-sm text-gray-600">Generate detailed Reports</p>
            </div>
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <MdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl" />
            <input
              type="text"
              placeholder="Search by description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
            />
          </div>
          <select
            value={selectedFilter}
            onChange={(e) => setSelectedFilter(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
          >
            <option value="all">All Transactions</option>
            <option value="credit">Credits Only</option>
            <option value="debit">Debits Only</option>
          </select>
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
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Paid</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Deadline</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Collateral</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                    Loading financial data...
                  </td>
                </tr>
              ) : filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                    No financial records found
                  </td>
                </tr>
              ) : (
                visibleTransactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50 transition duration-150">
                    {/* Type */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(transaction.type)}
                        <span className={`text-sm font-medium ${
                          transaction.type === 'Credit' ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {transaction.type}
                        </span>
                      </div>
                    </td>

                    {/* Description */}
                    <td className="px-6 py-4">
                      <div className="max-w-xs">
                        <p className="text-sm text-gray-900 font-medium truncate">{transaction.description}</p>
                        <p className={`text-xs font-semibold ${
                          transaction.type === 'Credit' ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {transaction.type === 'Credit' ? '-' : '+'}{transaction.amount.toLocaleString()} Frw
                        </p>
                      </div>
                    </td>
                    
                    {/* Paid Status */}
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${
                        transaction.paid ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {transaction.paid ? 'Paid' : 'Unpaid'}
                      </span>
                    </td>
                    
                    {/* Deadline with Warning */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">
                          {formatDeadline(transaction.deadline)}
                        </span>
                        {!transaction.paid && isOverdue(transaction.deadline) && (
                          <MdWarning className="text-red-500 text-lg" title="Overdue" />
                        )}
                        {!transaction.paid && isDeadlineApproaching(transaction.deadline) && (
                          <MdWarning className="text-yellow-500 text-lg" title="Deadline approaching" />
                        )}
                      </div>
                    </td>
     
                    {/* Collateral */}
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">
                        {transaction.collateral || 'N/A'}
                      </span>
                    </td>
                    
                    {/* Actions */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleViewFinancial(transaction)}
                          className="text-blue-600 hover:text-blue-800 p-1"
                          title="View/Edit Details"
                        >
                          <MdEdit className="text-lg" />
                        </button>
                        {!transaction.paid && (
                          <button 
                            onClick={() => handleMarkAsPaid(transaction)}
                            className="text-green-600 hover:text-green-800 p-1"
                            title="Mark as Paid"
                          >
                            <MdCheckCircle className="text-lg" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Financial Form */}
      <FinancialForm 
        isOpen={isFinancialFormOpen}
        onClose={() => setIsFinancialFormOpen(false)}
        onSave={(newFinancial) => {
          // Refresh the financials list after adding new one
          fetchFinancials();
          setIsFinancialFormOpen(false);
        }}
      />
      
      {/* View Financial Modal */}
      <ViewFinancialModal 
        isOpen={isViewModalOpen}
        onClose={handleCloseViewModal}
        financial={selectedFinancial}
        onMarkAsPaid={handleMarkAsPaid}
        onUpdateFinancial={handleUpdateFinancial}
      />

      {/* Confirm Mark as Paid Modal */}
      {isConfirmPaidOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">Confirm Mark as Paid</h2>
              <button
                onClick={() => {
                  setIsConfirmPaidOpen(false);
                  setFinancialToMarkPaid(null);
                  setConfirmPaidText('');
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-gray-600">
                You are about to mark this financial record as <span className="font-semibold text-[#BE741E]">paid back</span>.
                This action affects your financial tracking and <span className="font-semibold">cannot be undone</span>.
                Once marked as paid, you won't be able to revert it back to unpaid from here.
              </p>
              <p className="text-sm text-gray-500">
                Type <span className="font-bold text-[#BE741E]">mark as paid</span> to confirm:
              </p>
              <input
                type="text"
                value={confirmPaidText}
                onChange={(e) => setConfirmPaidText(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#BE741E] focus:border-transparent"
                placeholder="Type mark as paid"
                autoFocus
              />
            </div>
            <div className="flex items-center justify-end gap-4 p-6 border-t border-gray-200">
              <button
                onClick={() => {
                  setIsConfirmPaidOpen(false);
                  setFinancialToMarkPaid(null);
                  setConfirmPaidText('');
                }}
                className="px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition duration-200"
              >
                Cancel
              </button>
              <button
                onClick={confirmMarkAsPaid}
                disabled={confirmPaidText.toLowerCase().trim() !== 'mark as paid'}
                className={`px-6 py-3 rounded-lg transition duration-200 ${
                  confirmPaidText.toLowerCase().trim() === 'mark as paid'
                    ? 'bg-[#BE741E] text-white hover:bg-[#a4641c]'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Confirm Paid
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreditsDebit;
