import React, { useState, useEffect } from 'react';
import { MdAdd, MdSearch, MdFilterList, MdEdit, MdDelete, MdVisibility, MdShoppingCart, MdAttachMoney, MdInventory, MdCheckCircle, MdSchedule, MdAccountBalance, MdTrendingUp } from 'react-icons/md';
import SaleForm from './forms/SaleForm';
import { backendGqlApi } from '../utils/axiosInstance';
import { findallTransactionsQuery } from '../utils/gqlQuery';
import { toast } from 'react-toastify';
import ViewModal from './modals/ViewModal';
import '../index.css'

const SellingProducts = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSaleFormOpen, setIsSaleFormOpen] = useState(false);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
  const [visibleCount, setVisibleCount] = useState(10);

  // Fetch sale transactions from the backend
  useEffect(() => {
    const fetchSales = async () => {
      try {
        setLoading(true);
        const response = await backendGqlApi.post('/graphql', {
          query: findallTransactionsQuery,
          variables: {
            type: 'Sale'
          }
        });

        if (response.data.errors) {
          throw new Error(response.data.errors[0].message);
        }

        const transactions = response.data.data.transactions || [];
        
        // Transform the transaction data to match the expected format
        const transformedSales = transactions.map(transaction => ({
          id: transaction.id,
          product: transaction.products.map(p => p.name).join(', '), // for search/filter only
          products: transaction.products || [], // for modal table
          customer: transaction.secondParty,
          quantity: transaction.products.reduce((sum, p) => sum + p.quantity, 0),
          unitPrice: transaction.products.length > 0 ? transaction.products[0].price : 0,
          totalPrice: transaction.products.reduce((sum, p) => sum + (p.price * p.quantity), 0),
          date: new Date(transaction.createdAt).toISOString().split('T')[0],
          paymentMethod: transaction.financials && transaction.financials.length > 0 ? 'Recorded' : 'Not Recorded'
        }));

        setSales(transformedSales);
      } catch (error) {
        console.error('Error fetching sales:', error);
        toast.error(`Error loading sales: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchSales();
  }, []);

  const filteredSales = sales.filter(sale => {
    const matchesSearch = sale.product?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sale.customer?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const visibleSales = filteredSales.slice(0, visibleCount);

  // Infinite scroll handler
  const handleScroll = () => {
    const bottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 2;
    if (bottom && visibleCount < filteredSales.length) {
      setVisibleCount((prev) => prev + 10);
    }
  };

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [visibleCount, filteredSales.length]);

  const totalRevenue = sales.reduce((sum, sale) => sum + sale.totalPrice, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <span className="text-gray-600 text-lg">Loading sales...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 overflow-auto" >
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Sales Management</h2>
          <p className="text-gray-600">Manage your product sales and customer orders</p>
        </div>
        <button 
          onClick={() => setIsSaleFormOpen(true)}
          className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition duration-200 flex items-center gap-2"
        >
          <MdAdd className="text-xl" />
          New Sale
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-[#BE741E] text-white p-6 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white">Total Sales</p>
              <p className="text-3xl font-bold">{sales.length}</p>
            </div>
            <div className="text-4xl opacity-80"><MdInventory className="text-6xl" /></div>
          </div>
        </div>
        <div className="bg-[#BE741E] text-white p-6 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white">Total Products</p>
              <p className="text-3xl font-bold">{sales.reduce((sum, s) => sum + s.quantity, 0)}</p>
            </div>
            <div className="text-4xl opacity-80"><MdInventory className="text-6xl" /></div>
          </div>
        </div>
        <div className="bg-[#BE741E] text-white p-6 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white">Customers</p>
              <p className="text-3xl font-bold">{new Set(sales.map(s => s.customer)).size}</p>
            </div>
            <div className="text-4xl opacity-80"><MdAccountBalance className="text-6xl" /></div>
          </div>
        </div>
        <div className="bg-[#BE741E] text-white p-6 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white">Total Revenue</p>
              <p className="text-2xl font-bold">{(totalRevenue / 1000000).toFixed(1)}M</p>
            </div>
            <div className="text-4xl opacity-80"><MdAccountBalance className="text-6xl" /></div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition duration-200">
            <div className="bg-green-100 p-2 rounded-lg">
              <MdShoppingCart className="text-green-600 text-xl" />
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-800">Create New Sale</p>
              <p className="text-sm text-gray-600">Record a new customer order</p>
            </div>
          </button>
          <button className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition duration-200">
            <div className="bg-blue-100 p-2 rounded-lg">
              <MdAttachMoney className="text-blue-600 text-xl" />
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-800">Record Payment</p>
              <p className="text-sm text-gray-600">Mark sale as paid</p>
            </div>
          </button>
          <button className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition duration-200">
            <div className="bg-purple-100 p-2 rounded-lg">
              <MdTrendingUp className="text-purple-600 text-xl" />
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-800">Sales Report</p>
              <p className="text-sm text-gray-600">View detailed analytics</p>
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
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
            />
          </div>

        </div>
      </div>

      {/* Sales Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">Sales Orders</h3>
        </div>
        <div className="overflow-x-auto scrollbar-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Product</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Customer</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Quantity</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Unit Price</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Total</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Date</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Payment</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {visibleSales.map((sale) => (
                <tr key={sale.id} className="hover:bg-gray-50 transition duration-150">
                  <td className="px-6 py-4 text-sm text-gray-900 font-medium">{sale.product}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{sale.customer}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{sale.quantity}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{sale.unitPrice.toLocaleString()} Frw</td>
                  <td className="px-6 py-4 text-sm text-gray-900 font-semibold">{sale.totalPrice.toLocaleString()} Frw</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{new Date(sale.date).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{sale.paymentMethod}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button className="text-blue-600 hover:text-blue-800 p-1" onClick={() => {
                        setSelectedSale(sale);
                        setIsViewModalOpen(true);
                      }}>
                        <MdVisibility className="text-lg" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {visibleCount < filteredSales.length && (
          <div className="p-4 text-center">
            <span className="text-gray-500">Scroll down to load more...</span>
          </div>
        )}
        {visibleCount >= filteredSales.length && filteredSales.length > 0 && (
          <div className="p-4 text-center">
            <span className="text-gray-500">No more sales!</span>
          </div>
        )}
      </div>

      {/* Sale Form */}
      <SaleForm 
        isOpen={isSaleFormOpen}
        onClose={() => setIsSaleFormOpen(false)}
        onSave={(newSale) => {
          setIsSaleFormOpen(false);
        }}
      />

      {/* View Transaction Modal */}
      <ViewModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        data={selectedSale}
        title="Sale Details"
        fields={[
          {
            key: 'products',
            label: 'Products',
            fullWidth: true,
            render: (products, data) => {
              const productList = data?.products || [];
              return (
                <div className="overflow-x-auto col-span-2">
                  <table className="min-w-full border border-gray-200 rounded-lg">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase">Product Name</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase">Quantity</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase">Unit Price</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {productList.length > 0 ? productList.map((product, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-3 py-2 text-gray-900 font-medium">{product.name || 'N/A'}</td>
                          <td className="px-3 py-2 text-gray-700">{product.quantity || 0}</td>
                          <td className="px-3 py-2 text-gray-700">{product.price?.toLocaleString() || '0'} Frw</td>
                          <td className="px-3 py-2 font-semibold text-gray-900">{((product.price || 0) * (product.quantity || 0)).toLocaleString()} Frw</td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan="4" className="px-3 py-4 text-center text-gray-500">No products found</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              );
            },
          },
          { key: 'customer', label: 'Customer' },
          { key: 'totalPrice', label: 'Total Price', render: v => v?.toLocaleString() + ' Frw' },
          { key: 'date', label: 'Date', render: v => v ? new Date(v).toLocaleDateString() : '' },
          { key: 'paymentMethod', label: 'Payment Method' },
        ]}
      />
    </div>
  );
};

export default SellingProducts;
