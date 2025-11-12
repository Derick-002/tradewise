import React, { useState } from 'react';
import { MdClose, MdAccountBalance, MdCalendarToday, MdDescription, MdSecurity, MdPayment, MdEdit, MdCheckCircle } from 'react-icons/md';
import FinancialForm from '../forms/FinancialForm';

const ViewFinancialModal = ({ isOpen, onClose, financial, onMarkAsPaid, onUpdateFinancial }) => {
  const [isEditMode, setIsEditMode] = useState(false);
  if (!isOpen || !financial) return null;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTypeColor = (type) => {
    return type === 'Credit' ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100';
  };

  const getStatusColor = (paid) => {
    return paid ? 'text-green-600 bg-green-100' : 'text-yellow-600 bg-yellow-100';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-[#BE741E] p-2 rounded-lg">
                <MdAccountBalance className="text-white text-xl" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800">Financial Details</h2>
            </div>
            <div className="flex items-center gap-2">
              {!financial.paid && (
                <>
                  <button
                    onClick={() => setIsEditMode(true)}
                    className="text-green-600 hover:text-green-800 p-2 rounded-lg hover:bg-green-50 transition duration-200"
                    title="Edit Financial"
                  >
                    <MdEdit className="text-xl" />
                  </button>
                  <button
                    onClick={() => {
                      onMarkAsPaid && onMarkAsPaid(financial);
                      onClose();
                    }}
                    className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50 transition duration-200"
                    title="Mark as Paid"
                  >
                    <MdCheckCircle className="text-xl" />
                  </button>
                </>
              )}
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition duration-200"
              >
                <MdClose className="text-2xl" />
              </button>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Type and Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className='hidden'>
              <label className="block text-sm font-medium text-gray-700 mb-2 disabled">
                Financial ID
              </label>
              <div className="px-4 py-3 bg-gray-50 rounded-lg border">
                <span className="font-mono text-sm">{financial.id}</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type
              </label>
              <div className="px-4 py-3 bg-gray-50 rounded-lg border">
                <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full capitalize ${getTypeColor(financial.type)}`}>
                  {financial.type}
                </span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Status
              </label>
              <div className="px-4 py-3 bg-gray-50 rounded-lg border">
                <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(financial.paid)}`}>
                  {financial.paid ? 'Paid' : 'Unpaid'}
                </span>
              </div>
            </div>
          </div>

          {/* Amount */}
          <div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MdPayment className="inline mr-2" />
                Amount
              </label>
              <div className="px-4 py-3 bg-gray-50 rounded-lg border">
                <span className={`text-lg font-semibold ${
                  financial.type === 'credit' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {financial.type === 'credit' ? '+' : '-'}{financial.amount.toLocaleString()} Frw
                </span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MdDescription className="inline mr-2" />
              Description
            </label>
            <div className="px-4 py-3 bg-gray-50 rounded-lg border">
              <p className="text-gray-800">{financial.description}</p>
            </div>
          </div>

          {/* Deadline */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MdCalendarToday className="inline mr-2" />
              Deadline
            </label>
            <div className="px-4 py-3 bg-gray-50 rounded-lg border">
              <p className="text-gray-800">{formatDate(financial.deadline)}</p>
            </div>
          </div>

          {/* Collateral */}
          {financial.collateral && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MdSecurity className="inline mr-2" />
                Collateral
              </label>
              <div className="px-4 py-3 bg-gray-50 rounded-lg border">
                <p className="text-gray-900">{financial.collateral}</p>
              </div>
            </div>
          )}

          {/* Additional Information */}
          <div className="bg-gray-200 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Additional Information</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-900 font-medium">Created:</span>
                <p className="text-gray-700">{formatDate(financial.createdAt || financial.deadline)}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-4 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-300 transition duration-200"
          >
            Close
          </button>
        </div>
      </div>
      
      {/* Edit Form Modal */}
      <FinancialForm 
        isOpen={isEditMode}
        onClose={() => setIsEditMode(false)}
        initialData={financial}
        isEdit={true}
        onSave={(updatedFinancial) => {
          if (onUpdateFinancial) {
            onUpdateFinancial(updatedFinancial);
          } else {
            console.log('Updated Financial Data:', updatedFinancial);
          }
          setIsEditMode(false);
          onClose(); // Close the view modal too
        }}
      />
    </div>
  );
};

export default ViewFinancialModal;
