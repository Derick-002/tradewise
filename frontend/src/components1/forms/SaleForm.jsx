import React, { useEffect, useState } from 'react';
import { MdClose, MdSave, MdAttachMoney, MdAdd, MdDelete } from 'react-icons/md';
import { toast } from 'react-toastify';
import { backendGqlApi } from '../../utils/axiosInstance';

const allProductsNameQuery = `
  query {
    productNames: getStockImages {
      id
      name
    }
  }
`;

export const createSaleTransactionMutation = `
  mutation CreateTransaction(
    $type: ENTransactionType!
    $products: [GqlTransactionCreateProductInput!]!
    $description: String!
    $secondParty: String!
    $financialDetails: GqlFinancialCreateInput
  ) {
    createTransaction(
      type: $type
      products: $products
      description: $description
      secondParty: $secondParty
      financialDetails: $financialDetails
    ) {
      id
      type
      description
      secondParty
      stock {
        id
      }
      products {
        id
        name
        quantity
        price
      }
    }
  }
`;

const SaleForm = ({ isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    description: '',
    secondParty: '',
    financialType: 'Credit',
    amount: '',
    financialDescription: '',
    collateral: '',
    deadline: ''
  });

  const [allProductsName, setAllProductsName] = useState([]);

  const fetchProductsName = async() => {
    const response = await backendGqlApi.post('/graphql', {
      query: allProductsNameQuery
    });
    setAllProductsName(response.data.data.productNames);
  }

  useEffect(() => {
    if (isOpen) {
      fetchProductsName();
    }
  }, [isOpen]);

  const [products, setProducts] = useState([]);
  const [includeFinancialDetails, setIncludeFinancialDetails] = useState(false);
  
  // Format number with comma separators
  const formatCurrency = (amount) => {
    return amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleProductChange = (index, field, value) => {
    setProducts(prev => prev.map((product, i) => 
      i === index ? { ...product, [field]: value } : product
    ));
  };

  const addProduct = () => {
    setProducts(prev => [...prev, { name: '', price: '', quantity: '' }]);
  };

  const removeProduct = (index) => {
    setProducts(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate that there is at least one product
    if (products.length === 0) {
      toast.error('Please add at least one product');
      return;
    }
    
    // Check if any product has empty required fields
    const hasInvalidProduct = products.some(product => 
      !product.name || !product.price || !product.quantity
    );

    if (hasInvalidProduct) {
      toast.error('Please fill in all required fields (Product, Price, Quantity) for all products');
      return;
    }

    try {
      // Prepare products for the mutation
      const productsInput = products.map(product => ({
        name: product.name,
        price: parseFloat(product.price),
        quantity: parseInt(product.quantity)
      }));

      // Calculate total amount from products
      const totalAmount = products
        .filter(p => p.name && p.price && p.quantity)
        .reduce((sum, product) => sum + (parseFloat(product.price) * parseInt(product.quantity)), 0);

      // Prepare financial details only if enabled
      let financialDetails = null;
      if (includeFinancialDetails) {
        financialDetails = {
          type: formData.financialType,
          amount: formData.amount ? parseFloat(formData.amount) : totalAmount,
          description: formData.financialDescription || `Payment for ${formData.description}`,
          collateral: formData.collateral || null,
          deadline: formData.deadline ? new Date(formData.deadline).toISOString() : null
        };
      }

      // Make the API call
      const response = await backendGqlApi.post('/graphql', {
        query: createSaleTransactionMutation,
        variables: {
          type: "Sale",
          description: formData.description,
          secondParty: formData.secondParty,
          products: productsInput,
          financialDetails
        }
      });

      // Handle GraphQL errors
      if (response.data.errors) {
        throw new Error(response.data.errors[0].message);
      }

      // console.log('Sale created successfully:', response.data.data.createTransaction);
      toast.success('Sale created successfully!');

      // Reset form on success
      setFormData({
        description: '',
        secondParty: '',
        financialType: 'Credit',
        amount: '',
        financialDescription: '',
        collateral: '',
        deadline: ''
      });
      setProducts([]);
      setIncludeFinancialDetails(false);
      
      // Call the onSave callback if provided
      if (onSave) {
        onSave(response.data.data.createTransaction);
      }
      
      // Close the modal
      onClose();

    } catch (error) {
      console.error('Error creating sale:', error);
      toast.error(`Error creating sale: ${error.message}`);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl mx-auto max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-[#BE741E] p-2 rounded-lg">
                <MdAttachMoney className="text-[#fff] text-xl" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800">New Sale</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition duration-200"
            >
              <MdClose className="text-2xl" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Product sale"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Second Party (Customer) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="secondParty"
                  value={formData.secondParty}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Customer Name"
                />
              </div>
            </div>
          </div>

          {/* Financial Details Toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div>
              <h3 className="text-sm font-semibold text-gray-800">Add Financial Details (Debit/Credit)</h3>
              <p className="text-xs text-gray-600 mt-1">Include payment or credit information for this transaction</p>
            </div>
            <button
              type="button"
              onClick={() => setIncludeFinancialDetails(!includeFinancialDetails)}
              className={`px-4 py-2 rounded-lg font-medium transition duration-200 ${
                includeFinancialDetails
                  ? 'bg-green-500 text-white hover:bg-green-600'
                  : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
              }`}
            >
              {includeFinancialDetails ? 'Enabled' : 'Disabled'}
            </button>
          </div>

          {/* Financial Details */}
          {includeFinancialDetails && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">Financial Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Financial Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="financialType"
                    value={formData.financialType}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="Credit">Credit</option>
                    <option value="Debit">Debit</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount (Optional - defaults to total)
                  </label>
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleChange}
                    step="0.01"
                    min="0"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Leave empty to use product total"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Financial Description (Optional)
                  </label>
                  <input
                    type="text"
                    name="financialDescription"
                    value={formData.financialDescription}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Payment for sale"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Collateral (Optional)
                  </label>
                  <input
                    type="text"
                    name="collateral"
                    value={formData.collateral}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Receipt #1234"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Deadline (Optional)
                  </label>
                  <input
                    type="date"
                    name="deadline"
                    value={formData.deadline}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Products Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">Products</h3>
              <button
                type="button"
                onClick={addProduct}
                className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition duration-200 flex items-center gap-2 text-sm"
              >
                <MdAdd className="text-lg" />
                Add Product
              </button>
            </div>

            {/* Products Table */}
            {products.length > 0 && (
              <div className="border border-gray-300 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[600px]">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Product</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Price</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Qty</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Total</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {products.map((product, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-3 py-3">
                            <select
                              value={product.name}
                              onChange={(e) => handleProductChange(index, 'name', e.target.value)}
                              className="w-full px-2 py-3 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent truncate"
                              title={product.name}
                            >
                              <option value="">Select product</option>
                              {allProductsName.map((productOption) => (
                                <option key={productOption.id} value={productOption.name} title={productOption.name}>
                                  {productOption.name.length > 30 
                                    ? `${productOption.name.substring(0, 30)}...` 
                                    : productOption.name}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-3 py-3">
                            <input
                              type="number"
                              value={product.price}
                              onChange={(e) => handleProductChange(index, 'price', e.target.value)}
                              placeholder="0.00"
                              step="0.01"
                              min="0"
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                            />
                          </td>
                          <td className="px-3 py-3">
                            <input
                              type="number"
                              value={product.quantity}
                              onChange={(e) => handleProductChange(index, 'quantity', e.target.value)}
                              placeholder="0"
                              min="1"
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                            />
                          </td>
                          <td className="px-3 py-3 text-sm font-medium text-gray-900">
                            {product.price && product.quantity ? 
                              `${formatCurrency(parseFloat(product.price) * parseInt(product.quantity) || 0)} RWF` : 
                              '0.00 RWF'
                            }
                          </td>
                          <td className="px-3 py-3">
                            <button
                              type="button"
                              onClick={() => removeProduct(index)}
                              className="text-red-500 hover:text-red-700 transition duration-200 p-1"
                            >
                              <MdDelete className="text-lg" title="Remove Product" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Total Amount */}
            {products.length > 0 && products.some(p => p.name && p.price && p.quantity) && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Total Amount:</span>
                  <span className="text-lg font-bold text-blue-600">
                    {formatCurrency(products
                      .filter(p => p.name && p.price && p.quantity)
                      .reduce((sum, product) => sum + (parseFloat(product.price) * parseInt(product.quantity)), 0))} RWF
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-[#BE741E] text-white rounded-lg transition duration-200 flex items-center gap-2"
            >
              <MdSave className="text-xl" />
              Create Sale
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SaleForm;
