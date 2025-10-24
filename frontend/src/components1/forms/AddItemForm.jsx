import React, { useState } from 'react';
import { MdClose, MdSave, MdInventory } from 'react-icons/md';

const AddItemForm = ({ isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    unit: '',
    low_stock_quantity: '5'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };


  const handleSubmit = (e) => {
    e.preventDefault();
    
    const submitData = {
      name: formData.name.trim(),
      unit: formData.unit,
      low_stock_quantity: parseInt(formData.low_stock_quantity) || 5
    };
  
    onSave(submitData);

    setFormData({
      name: '',
      unit: '',
      low_stock_quantity: '5'
    });
    
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-[#BE741E] p-2 rounded-lg">
                <MdInventory className="text-[#fff] text-xl" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800">Add New Item</h2>
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
                Product Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#BE741E] focus:border-transparent"
                placeholder="Enter product name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Unit *
              </label>
              <select
                name="unit"
                value={formData.unit}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#BE741E] focus:border-transparent"
              >
                <option value="">Select unit</option>
                <option value="Piece">Piece</option>
                <option value="Kilogram">Kilogram</option>
                <option value="Litre">Litre</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Min Stock Level
              </label>
              <input
                type="number"
                name="low_stock_quantity"
                value={formData.low_stock_quantity}
                onChange={handleChange}
                min="0"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#BE741E] focus:border-transparent"
                placeholder="5"
              />
              <p className="text-sm text-gray-500 mt-1">Alert when stock falls below this level (default: 5)</p>
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
              className="px-6 py-3 bg-[#BE741E] text-white rounded-lg transition duration-200 flex items-center gap-2"
            >
              <MdSave className="text-xl" />
              Save Item
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


export default AddItemForm;
