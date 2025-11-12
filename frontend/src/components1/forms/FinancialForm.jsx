import React, { useState, useEffect } from 'react';
import { MdClose, MdSave, MdAccountBalance } from 'react-icons/md';
import { toast } from 'react-toastify';
import { backendGqlApi } from '../../utils/axiosInstance';
import { createFinancial } from '../../utils/gqlQuery';

const FinancialForm = ({ isOpen, onClose, onSave, initialData, isEdit }) => {
  const [formData, setFormData] = useState({
    type: 'Credit',
    amount: '',
    description: '',
    collateral: '',
    deadline: ''
  });

  // Pre-populate form when editing
  useEffect(() => {
    if (isEdit && initialData) {
      // Format deadline for datetime-local input
      const formattedDeadline = initialData.deadline 
        ? new Date(initialData.deadline).toISOString().slice(0, 16)
        : '';
      
      setFormData({
        type: initialData.type || 'Credit',
        amount: initialData.amount || '',
        description: initialData.description || '',
        collateral: initialData.collateral || '',
        deadline: formattedDeadline
      });
    } else {
      // Reset to default for new financial
      setFormData({
        type: 'Credit',
        amount: '',
        description: '',
        collateral: '',
        deadline: ''
      });
    }
  }, [isEdit, initialData, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isEdit) {
      // For edit mode, just console log the data
      const updatedFinancial = {
        id: initialData?.id,
        type: formData.type,
        amount: parseFloat(formData.amount),
        description: formData.description,
        collateral: formData.collateral,
        deadline: new Date(formData.deadline).toISOString()
      };
      
      // console.log('Edit Financial Data:', updatedFinancial);
      onSave(updatedFinancial);
      return;
    }
    
    try {
      // Create the financial object with the exact structure requested
      const financial = {
        type: formData.type, // Use proper case for GraphQL enum (Credit/Debit)
        amount: parseFloat(formData.amount),
        description: formData.description,
        collateral: formData.collateral,
        deadline: new Date(formData.deadline).toISOString()
      };
      
      // Make the GraphQL API call
      const response = await backendGqlApi.post('/graphql', {
        query: createFinancial,
        variables: financial
      });

      if (response.data.errors) {
        console.log(response.data.errors);
        toast.error('Error creating financial record: ' + response.data.errors[0].message);
        return;
      }
      
      // Success
      toast.success(`${formData.type} record created successfully!`);
      
      onSave(response.data.data.financial);
      
      // Reset form
      setFormData({
        type: 'Credit',
        amount: '',
        description: '',
        collateral: '',
        deadline: ''
      });
      
      onClose();
    } catch (error) {
      console.error('Error creating financial record:', error);
      toast.error('Failed to create financial record. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-[#BE741E] p-2 rounded-lg">
                <MdAccountBalance className="text-white text-xl" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800">{isEdit ? 'Edit Financial' : 'New Financial'}</h2>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type *
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#BE741E] focus:border-transparent"
              >
                <option value="Credit">Credit</option>
                <option value="Debit">Debit</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount *
              </label>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                required
                min="0"
                step="100"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#BE741E] focus:border-transparent"
                placeholder="100"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <input
                type="text"
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#BE741E] focus:border-transparent"
                placeholder="Loan to John Doe"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Collateral *
              </label>
              <input
                type="text"
                name="collateral"
                value={formData.collateral}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#BE741E] focus:border-transparent"
                placeholder="Car"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Deadline *
              </label>
              <input
                type="datetime-local"
                name="deadline"
                value={formData.deadline}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#BE741E] focus:border-transparent"
              />
            </div>
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
              className="px-6 py-3 bg-[#BE741E] text-white rounded-lg hover:bg-[#A0631A] transition duration-200 flex items-center gap-2"
            >
              <MdSave className="text-xl" />
              {isEdit ? 'Update Financial' : 'Save Financial'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FinancialForm;
