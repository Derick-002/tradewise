import React, { useState, useEffect } from 'react';
import { MdAdd, MdSearch, MdFilterList, MdEdit, MdDelete, MdVisibility, MdInventory, MdCheckCircle, MdSchedule, MdAccountBalance, MdShoppingCart } from 'react-icons/md';
import { format, formatDistanceToNow } from 'date-fns';
import { useNavigate, useParams } from 'react-router-dom';
import AddItemForm from './forms/AddItemForm';
import ViewModal from './modals/ViewModal';
import EditModal from './modals/EditModal';
import AddToCartButton from './buttons/AddToCartButton';
import Cart from './Cart';
import { useCart } from '../contexts/CartContext';
import { getStockImagesQuery, createStockImageMutation, updateStockImageMutation, deleteStockImageMutation, findStockImagesByQuery } from '../utils/gqlQuery';
import { backendGqlApi } from '../utils/axiosInstance';
import { toast } from 'react-toastify';

const Stock = () => {
  const navigate = useNavigate();
  const { stockId } = useParams();
  const { addToCart, getCartItemCount } = useCart();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [isAddItemFormOpen, setIsAddItemFormOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [stockItems, setStockItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [stats, setStats] = useState({
    totalProducts: 0,
    inStock: 0,
    lowStock: 0,
    outOfStock: 0
  });

  useEffect(() => {
    async function getStockImages() {
      try {
        setLoading(true);
        const response = await backendGqlApi.post('', {
          query: getStockImagesQuery
        });
        
        const stockData = response.data.data.getStockImages;
        
        // Transform the API data to match the component's expected format
        const transformedData = stockData.map(item => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          low_stock_quantity: item.low_stock_quantity || 5,
          status: item.quantity <= 0 ? 'Out of Stock' : item.quantity < (item.low_stock_quantity || 5) ? 'Low Stock' : 'In Stock',
          unit: item.unit,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt
        }));
        
        setStockItems(transformedData);
        
        // Update stats based on fetched data
        setStats({
          totalProducts: transformedData.length,
          inStock: transformedData.filter(item => item.status === 'In Stock').length,
          lowStock: transformedData.filter(item => item.status === 'Low Stock').length,
          outOfStock: transformedData.filter(item => item.status === 'Out of Stock').length
        });
        
      } catch (err) {
        setError('Failed to load stock data');
      } finally {
        setLoading(false);
      }
    }

    getStockImages();
  }, []);

  // Handle URL parameter for direct stock item viewing
  useEffect(() => {
    if (stockId && stockItems.length > 0) {
      const stockItem = stockItems.find(item => item.id === stockId);
      if (stockItem) {
        setSelectedItem(stockItem);
        setIsViewModalOpen(true);
      } else {
        // If stock item not found in current list, fetch it from backend
        fetchStockItem(stockId);
      }
    }
  }, [stockId, stockItems]);

  // Fetch specific stock item from backend
  const fetchStockItem = async (id) => {
    try {
      const response = await backendGqlApi.post('', {
        query: findStockImagesByQuery,
        variables: { id }
      });
      
      if (response.data.data.getStockImage) {
        const item = response.data.data.getStockImage;
        const transformedItem = {
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          low_stock_quantity: item.low_stock_quantity || 5,
          status: item.quantity <= 0 ? 'Out of Stock' : item.quantity < (item.low_stock_quantity || 5) ? 'Low Stock' : 'In Stock',
          unit: item.unit,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt
        };
        setSelectedItem(transformedItem);
        setIsViewModalOpen(true);
      }
    } catch (error) {
      console.error('Error fetching stock item:', error);
      toast.error('Stock item not found');
      navigate('/dashboard');
    }
  };

  const filteredItems = stockItems.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'In Stock': return 'bg-green-100 text-green-800';
      case 'Low Stock': return 'bg-yellow-100 text-yellow-800';
      case 'Out of Stock': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleEdit = (item) => {
    setSelectedItem(item);
    setIsEditModalOpen(true);
  };

  const handleUpdateItem = async (updatedItem) => {
    setLoading(true);
    
    try {
      const response = await backendGqlApi.post('', {
        query: updateStockImageMutation,
        variables: {
          stockImageId: updatedItem.id,
          name: updatedItem.name,
          unit: updatedItem.unit,
          low_stock_quantity: parseInt(updatedItem.low_stock_quantity)
        }
      });

      if (response.data.data.updateStockImage) {
        const updated = response.data.data.updateStockImage;
        
        // Update local state with API response
        setStockItems(prevItems => 
          prevItems.map(item => 
            item.id === updated.id ? {
              ...item,
              name: updated.name,
              unit: updated.unit,
              low_stock_quantity: updated.low_stock_quantity,
              quantity: updated.quantity,
              status: updated.quantity <= 0 ? 'Out of Stock' : updated.quantity < (updated.low_stock_quantity || 5) ? 'Low Stock' : 'In Stock',
              updatedAt: updated.updatedAt
            } : item
          )
        );
        
        toast.success('Item updated successfully!');
        setIsEditModalOpen(false);
      }
    } catch (error) {
      toast.error('Failed to update item');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (item) => {
    addToCart(item);
    alert(`${item.quantity} ${item.name}(s) added to cart!`);
  };

  const handleDelete = (item) => {
    setItemToDelete(item);
    setIsDeleteModalOpen(true);
    setDeleteConfirmText('');
  };

  const confirmDelete = async () => {
    if (deleteConfirmText === 'DELETE') {
      setLoading(true);
      
      try {
        const response = await backendGqlApi.post('', {
          query: deleteStockImageMutation,
          variables: {
            stockImageId: itemToDelete.id
          }
        });
        
        // Check for GraphQL errors
        if (response.data?.errors) {
          throw new Error(response.data.errors[0]?.message || 'GraphQL error occurred');
        }

        if (response.data?.data?.stockImage || response.data?.data?.deleteStockImage) {
          // Remove from local state
          setStockItems(prevItems => prevItems.filter(item => item.id !== itemToDelete.id));
          
          // Update stats
          setStats(prevStats => ({
            ...prevStats,
            totalProducts: prevStats.totalProducts - 1,
            ...(itemToDelete.status === 'In Stock' && { inStock: prevStats.inStock - 1 }),
            ...(itemToDelete.status === 'Low Stock' && { lowStock: prevStats.lowStock - 1 }),
            ...(itemToDelete.status === 'Out of Stock' && { outOfStock: prevStats.outOfStock - 1 })
          }));
          
          toast.success('Item deleted successfully!');
          setIsDeleteModalOpen(false);
          setIsViewModalOpen(false);
          setItemToDelete(null);
          setSelectedItem(null);
          setDeleteConfirmText('');
        } else {
          throw new Error('Delete operation failed');
        }
      } catch (error) {
        toast.error(error.message || 'Failed to delete item');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleAddItem = async (newItem) => {
    setLoading(true);
    
    try {
      const response = await backendGqlApi.post('', {
        query: createStockImageMutation,
        variables: {
          name: newItem.name,
          unit: newItem.unit,
          low_stock_quantity: parseInt(newItem.low_stock_quantity) || 5
        }
      });

      if (response.data.data.createStockImage) {
        const created = response.data.data.createStockImage;
        
        // Transform and add to local state
        const newItemObj = {
          id: created.id,
          name: created.name,
          unit: created.unit,
          quantity: created.quantity,
          low_stock_quantity: created.low_stock_quantity,
          status: created.quantity <= 0 ? 'Out of Stock' : created.quantity < (created.low_stock_quantity || 5) ? 'Low Stock' : 'In Stock',
          createdAt: created.createdAt,
          updatedAt: created.updatedAt
        };

        setStockItems(prevItems => [...prevItems, newItemObj]);
        
        // Update stats
        setStats(prevStats => ({
          ...prevStats,
          totalProducts: prevStats.totalProducts + 1,
          ...(newItemObj.status === 'In Stock' && { inStock: prevStats.inStock + 1 }),
          ...(newItemObj.status === 'Low Stock' && { lowStock: prevStats.lowStock + 1 }),
          ...(newItemObj.status === 'Out of Stock' && { outOfStock: prevStats.outOfStock + 1 })
        }));
        
        toast.success('Item added successfully!');
        setIsAddItemFormOpen(false);
        return true;
      }
    } catch (err) {
      toast.error('Failed to add item');
      return false;
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="space-y-6 relative">
      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#BE741E]"></div>
            <p className="text-gray-700 font-medium">Processing...</p>
          </div>
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
          <button 
            onClick={() => setError('')}
            className="ml-2 text-red-500 hover:text-red-700"
          >
            ×
          </button>
        </div>
      )}
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Inventory Management</h2>
          <p className="text-gray-600">Manage your product stock and inventory levels</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsCartOpen(true)}
            className="bg-[#BE741E] text-white px-4 py-3 rounded-lg hover:bg-[#BE741E] transition duration-200 flex items-center gap-2 relative"
          >
            <MdShoppingCart className="text-xl" />
            Cart
            {getCartItemCount() > 0 && (
              <span className="absolute -top-2 -right-2 bg-[#BE741E] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {getCartItemCount()}
              </span>
            )}
          </button>
          <button 
            onClick={() => setIsAddItemFormOpen(true)}
            className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition duration-200 flex items-center gap-2"
          >
            <MdAdd className="text-xl" />
            Add New Item
          </button>
        </div>
      </div>

      
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

      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-[#BE741E] text-white p-6 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100">Total Items</p>
              <p className="text-3xl font-bold">{stats.totalProducts}</p>
            </div>
            <div className="text-4xl opacity-80"><MdInventory className="text-6xl" /></div>
          </div>
        </div>
        <div className="bg-[#BE741E] text-white p-6 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100">In Stock</p>
              <p className="text-3xl font-bold">{stats.inStock}</p>
            </div>
            <div className="text-4xl opacity-80"><MdCheckCircle className="text-6xl" /></div>
          </div>
        </div>
        <div className="bg-[#BE741E] text-white p-6 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100">Low Stock</p>
              <p className="text-3xl font-bold">{stats.lowStock}</p>
            </div>
            <div className="text-4xl opacity-80"><MdSchedule className="text-6xl" /></div>
          </div>
        </div>
        <div className="bg-[#BE741E] text-white p-6 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100">Out of Stock</p>
              <p className="text-3xl font-bold">{stats.outOfStock}</p>
            </div>
            <div className="text-4xl opacity-80"><MdDelete className="text-6xl" /></div>
          </div>
        </div>
      </div>

      {/* Stock Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">Current Stock</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Product Name</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Unit</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Quantity</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Status</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition duration-150">
                  <td className="px-6 py-4 text-sm text-gray-900 font-medium capitalize">{item.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{item.unit}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{item.quantity}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(item.status)}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => {
                          setSelectedItem(item);
                          setIsViewModalOpen(true);
                          navigate(`/stock/${item.id}`);
                        }}
                        className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50 transition duration-200"
                        title="View Details"
                      >
                        <MdVisibility className="text-lg" />
                      </button>
                      <button 
                        onClick={() => handleEdit(item)}
                        className="text-green-600 hover:text-green-800 p-2 rounded-lg hover:bg-green-50 transition duration-200"
                        title="Edit Item"
                      >
                        <MdEdit className="text-lg" />
                      </button>
                      <button 
                        onClick={() => handleDelete(item)}
                        className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50 transition duration-200"
                        title="Delete Item"
                      >
                        <MdDelete className="text-lg" />
                      </button>
                      <AddToCartButton 
                        item={item}
                        onAddToCart={handleAddToCart}
                        className="ml-2"
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      
      <AddItemForm 
        isOpen={isAddItemFormOpen}
        onClose={() => setIsAddItemFormOpen(false)}
        onSave={handleAddItem}
      />

      <ViewModal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedItem(null);
          navigate('/dashboard');
        }}
        data={selectedItem}
        title="Product Details"
        onEdit={handleEdit}
        onDelete={handleDelete}
        fields={[
          { key: 'name', label: 'Product Name', render: (value) => value?.charAt(0).toUpperCase() + value?.slice(1) },
          { key: 'unit', label: 'Unit' },
          { key: 'quantity', label: 'Quantity' },
          { key: 'low_stock_quantity', label: 'Low Stock Threshold' },
          { key: 'status', label: 'Status' },
          { key: 'createdAt', label: 'Created At', render: (value) => value ? formatDistanceToNow(new Date(value), { addSuffix: true }) : 'N/A' },
          { key: 'updatedAt', label: 'Last Updated', render: (value) => value ? formatDistanceToNow(new Date(value), { addSuffix: true }) : 'N/A' }
        ]}
      />

      <EditModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedItem(null);
        }}
        data={selectedItem}
        title="Edit Product"
        onSave={handleUpdateItem}
        fields={[
          { key: 'name', label: 'Product Name', required: true, placeholder: 'Enter product name' },
          { key: 'unit', label: 'Unit', required: true, type: 'select', options: [
            { value: 'Piece', label: 'Piece' },
            { value: 'Kilogram', label: 'Kilogram' },
            { value: 'Litre', label: 'Litre' }
          ]},
          { key: 'quantity', label: 'Quantity', type: 'number', disabled: true },
          { key: 'low_stock_quantity', label: 'Min Stock Level', type: 'number', min: 0, placeholder: '5' }
        ]}
      />

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">Confirm Deletion</h2>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-gray-600">
                Are you sure you want to delete <span className="font-semibold capitalize">{itemToDelete?.name}</span>?
              </p>
              <p className="text-sm text-gray-500">
                Type <span className="font-bold text-red-600">DELETE</span> to confirm:
              </p>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Type DELETE"
                autoFocus
              />
            </div>
            <div className="flex items-center justify-end gap-4 p-6 border-t border-gray-200">
              <button
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setItemToDelete(null);
                  setDeleteConfirmText('');
                }}
                className="px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition duration-200"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleteConfirmText !== 'DELETE'}
                className={`px-6 py-3 rounded-lg transition duration-200 ${
                  deleteConfirmText === 'DELETE'
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cart Modal */}
      <Cart 
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
      />
    </div>
  );
};

export default Stock;