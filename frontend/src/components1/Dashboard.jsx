import { useState, useEffect } from 'react';
import { MdTrendingUp, MdInventory, MdShoppingCart, MdBusiness, MdDateRange } from 'react-icons/md';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import './Dashboard.css';
import { useSelector } from 'react-redux';
import { backendGqlApi } from '../utils/axiosInstance';
import { getAnalytics } from '../utils/gqlQuery';
import { toast } from 'react-toastify';

const Dashboard = () => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 90); // Default to 90 days ago for more data
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const { user } = useSelector((state) => state.auth);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await backendGqlApi.post('/graphql', {
        query: getAnalytics,
        variables: {
          start: new Date(startDate + 'T00:00:00').toISOString(),
          end: new Date(endDate + 'T23:59:59').toISOString()
        }
      });
      
      if (response.data.errors) {
        const errorMessage = response.data.errors[0].message;
        setError('Failed to load analytics data: ' + errorMessage);
        toast.error('Failed to load analytics data');
        console.error('GraphQL errors:', response.data.errors);
        return;
      }
      
      if (response.data.data?.stockAnalysis) {
        setAnalyticsData(response.data.data.stockAnalysis);
        setError('');
      } else {
        setError('No analytics data received');
      }
    } catch (err) {
      setError('Failed to connect to analytics service');
      console.error('Analytics data error:', err);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, [startDate, endDate]);

  if (loading) {
    return <div className="text-center py-8">Loading analytics data...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-600">{error}</div>;
  }

  if (!analyticsData) {
    return <div className="text-center py-8">No analytics data available</div>;
  }

  // Prepare chart data for sales vs purchases over time (using your original format)
  const chartData = [
    { name: 'Sales', sales: analyticsData.totalSales || 0, purchases: 0 },
    { name: 'Purchases', sales: 0, purchases: analyticsData.totalPurchases || 0 }
  ];

  return (
    <div className="dashboard-container">
      {/* Date Range Picker */}
      <div className="bg-white rounded-lg shadow p-6 border border-gray-100 mb-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <MdDateRange className="h-5 w-5 text-[#BE741E]" />
            <h3 className="text-lg font-medium text-gray-900">Analytics Period</h3>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">From:</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#BE741E] focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">To:</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#BE741E] focus:border-transparent"
              />
            </div>
          </div>
        </div>
        <div className="mt-4 text-sm text-gray-600">
          <p><strong>Analysis Period:</strong> {new Date(analyticsData.analysisPeriod.startDate).toLocaleDateString()} - {new Date(analyticsData.analysisPeriod.endDate).toLocaleDateString()}</p>
          <p><strong>Business:</strong> {analyticsData.stock?.trader?.enterpriseName || 'N/A'}</p>
        </div>
      </div>

      {/* Analytics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-2 md:mb-8">
        <div className="stats-card">
          <div className="flex items-center">
            <div className="stats-card-icon bg-[#BE741E]">
              <MdTrendingUp className="h-6 w-6 text-white" />
            </div>
            <div className="stats-card-content">
              <p className="stats-card-title">Total Sales</p>
              <p className="stats-card-value">
                {analyticsData.totalSales?.toFixed(2) || '0.00'} Frw
              </p>
              <p className="stats-card-subtitle">{analyticsData.products?.sold?.length || 0} products sold</p>
            </div>
          </div>
        </div>

        <div className="stats-card">
          <div className="flex items-center">
            <div className="stats-card-icon bg-[#BE741E]">
              <MdShoppingCart className="h-6 w-6 text-white" />
            </div>
            <div className="stats-card-content">
              <p className="stats-card-title">Total Purchases</p>
              <p className="stats-card-value">
                {analyticsData.totalPurchases?.toFixed(2) || '0.00'} Frw
              </p>
              <p className="stats-card-subtitle">{analyticsData.products?.bought?.length || 0} products bought</p>
            </div>
          </div>
        </div>

        <div className="stats-card">
          <div className="flex items-center">
            <div className="stats-card-icon bg-[#BE741E]">
              <MdInventory className="h-6 w-6 text-white" />
            </div>
            <div className="stats-card-content">
              <p className="stats-card-title">Net Profit</p>
              <p className="stats-card-value">
                {analyticsData.profit?.toFixed(2) || '0.00'} Frw
              </p>
              <p className="stats-card-subtitle">
                {analyticsData.profit >= 0 ? 'Profit' : 'Loss'}
              </p>
            </div>
          </div>
        </div>

        <div className="stats-card">
          <div className="flex items-center">
            <div className="stats-card-icon bg-[#BE741E]">
              <MdBusiness className="h-6 w-6 text-white" />
            </div>
            <div className="stats-card-content">
              <p className="stats-card-title">Transactions</p>
              <p className="stats-card-value">
                {analyticsData.transactions?.length || 0}
              </p>
              <p className="stats-card-subtitle">Total transactions</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 md:mt-8 bg-white rounded-lg shadow p-6 border border-gray-100">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Sales vs Purchases</h3>
        {(() => {
          // Logic: Check if we have any meaningful financial data
          const totalSales = analyticsData.totalSales || 0;
          const totalPurchases = analyticsData.totalPurchases || 0;
          const hasFinancialData = totalSales > 0 || totalPurchases > 0;
          
          if (!hasFinancialData) {
            return (
              <div className="flex items-center justify-center h-[300px] text-gray-500">
                <div className="text-center">
                  <p className="text-lg mb-2">No financial data available</p>
                  <p className="text-sm">Try selecting a different date range with transactions</p>
                </div>
              </div>
            );
          }
          
          return (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="sales" stroke="#BE741E" strokeWidth={2} />
                <Line type="monotone" dataKey="purchases" stroke="#000" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          );
        })()}
      </div>

      <div className="mt-8 bg-white rounded-lg shadow p-6 border border-gray-100">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Inventory Distribution</h3>
        {(() => {
          const boughtCount = analyticsData.products?.bought?.length || 0;
          const soldCount = analyticsData.products?.sold?.length || 0;
          const hasData = boughtCount > 0 || soldCount > 0;
          
          if (!hasData) {
            return (
              <div className="flex items-center justify-center h-[300px] text-gray-500">
                <div className="text-center">
                  <p className="text-lg mb-2">No product data available</p>
                  <p className="text-sm">Try selecting a different date range</p>
                </div>
              </div>
            );
          }
          
          return (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={[
                    { name: "Products Bought", value: boughtCount },
                    { name: "Products Sold", value: soldCount }
                  ]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                  label
                >
                  <Cell fill="#BE741E" />
                  <Cell fill="#000" />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          );
        })()}
      </div>

      {/* Financial Details */}
      <div className="mt-8 bg-white rounded-lg shadow p-6 border border-gray-100">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Financial Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h4 className="text-lg font-medium text-green-800 mb-2">Credits</h4>
            <p className="text-2xl font-bold text-green-600">
              {analyticsData.finance?.credits?.toFixed(2) || '0.00'} Frw
            </p>
          </div>
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <h4 className="text-lg font-medium text-red-800 mb-2">Debits</h4>
            <p className="text-2xl font-bold text-red-600">
              {analyticsData.finance?.debits?.toFixed(2) || '0.00'} Frw
            </p>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="mt-8 bg-white rounded-lg shadow p-6 border border-gray-100">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Transactions</h3>
        {analyticsData.transactions?.length > 0 ? (
          <div className="space-y-4">
            {analyticsData.transactions.slice(0, 10).map((transaction, index) => (
              <div key={transaction.id || index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{transaction.description}</p>
                  <p className="text-sm text-gray-600">
                    Type: <span className="capitalize">{transaction.type?.toLowerCase()}</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">
                    {new Date(transaction.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">No transactions found for this period</p>
        )}
      </div>

      {/* Products Summary */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Products Bought */}
        <div className="bg-white rounded-lg shadow p-6 border border-gray-100">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Products Bought</h3>
          {analyticsData.products?.bought?.length > 0 ? (
            <div className="space-y-3">
              {analyticsData.products.bought.slice(0, 5).map((product, index) => (
                <div key={product.id || index} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{product.name}</p>
                    <p className="text-sm text-gray-600">Qty: {product.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-[#BE741E]">{product.price?.toFixed(2)} Frw</p>
                  </div>
                </div>
              ))}
              {analyticsData.products.bought.length > 5 && (
                <p className="text-sm text-gray-500 text-center">
                  +{analyticsData.products.bought.length - 5} more products
                </p>
              )}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No products bought in this period</p>
          )}
        </div>

        {/* Products Sold */}
        <div className="bg-white rounded-lg shadow p-6 border border-gray-100">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Products Sold</h3>
          {analyticsData.products?.sold?.length > 0 ? (
            <div className="space-y-3">
              {analyticsData.products.sold.slice(0, 5).map((product, index) => (
                <div key={product.id || index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{product.name}</p>
                    <p className="text-sm text-gray-600">Qty: {product.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-green-600">{product.price?.toFixed(2)} Frw</p>
                  </div>
                </div>
              ))}
              {analyticsData.products.sold.length > 5 && (
                <p className="text-sm text-gray-500 text-center">
                  +{analyticsData.products.sold.length - 5} more products
                </p>
              )}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No products sold in this period</p>
          )}
        </div>
      </div>

      {/* Stock Information */}
      {analyticsData.stock && (
        <div className="mt-8 bg-white rounded-lg shadow p-6 border border-gray-100">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Stock Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm font-medium text-gray-600">Stock ID</p>
              <p className="text-lg font-semibold text-gray-900">{analyticsData.stock.id}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm font-medium text-gray-600">Created</p>
              <p className="text-lg font-semibold text-gray-900">
                {new Date(analyticsData.stock.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm font-medium text-gray-600">Last Updated</p>
              <p className="text-lg font-semibold text-gray-900">
                {new Date(analyticsData.stock.updatedAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
