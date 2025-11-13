import React from 'react';
import { MdClose, MdNotifications, MdCalendarToday, MdInfo, MdWarning, MdCheckCircle, MdError, MdMarkEmailRead } from 'react-icons/md';
import { formatDistanceToNow, format } from 'date-fns';

const ViewNotificationModal = ({ isOpen, onClose, notification, onMarkAsRead }) => {
  if (!isOpen || !notification) return null;

  const getNotificationIcon = (type) => {
    switch(type?.toLowerCase()) {
      case 'success':
        return <MdCheckCircle className="text-green-600 text-2xl" />;
      case 'warning':
        return <MdWarning className="text-yellow-600 text-2xl" />;
      case 'info':
        return <MdInfo className="text-blue-600 text-2xl" />;
      case 'error':
        return <MdError className="text-red-600 text-2xl" />;
      default:
        if (type?.includes('alert') || type?.includes('warning')) {
          return <MdWarning className="text-yellow-600 text-2xl" />;
        }
        if (type?.includes('success') || type?.includes('complete')) {
          return <MdCheckCircle className="text-green-600 text-2xl" />;
        }
        if (type?.includes('error') || type?.includes('fail')) {
          return <MdError className="text-red-600 text-2xl" />;
        }
        return <MdInfo className="text-blue-600 text-2xl" />;
    }
  };

  const getImpactColor = (impact) => {
    switch(impact) {
      case 'High': return 'bg-red-100 text-red-800 border-red-200';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    try {
      const date = new Date(dateString);
      return format(date, 'PPpp'); // e.g., "Nov 13, 2025 at 1:26 PM"
    } catch (error) {
      return 'Invalid date';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#BE741E] bg-opacity-10 rounded-lg">
              <MdNotifications className="text-[#BE741E] text-2xl" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-800">Notification Details</h2>
              <p className="text-sm text-gray-600">View notification information</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!notification.read && (
              <button 
                onClick={() => {
                  onMarkAsRead && onMarkAsRead(notification.id);
                }}
                className="text-green-600 hover:text-green-800 p-2 rounded-lg hover:bg-green-50 transition duration-200"
                title="Mark as read"
              >
                <MdMarkEmailRead className="text-xl" />
              </button>
            )}
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-50 transition duration-200"
            >
              <MdClose className="text-xl" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Title and Status */}
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4 flex-1">
              <div className="flex-shrink-0 mt-1">
                {getNotificationIcon(notification.filterType || notification.type)}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">{notification.title}</h3>
                <div className="flex items-center gap-2 mb-3">
                  <span className={`px-3 py-1 text-sm font-medium rounded-full border ${getImpactColor(notification.impact)}`}>
                    {notification.impact} Impact
                  </span>
                  {!notification.read && (
                    <span className="px-3 py-1 text-sm font-medium rounded-full bg-red-100 text-red-800 border border-red-200">
                      Unread
                    </span>
                  )}
                  {notification.read && (
                    <span className="px-3 py-1 text-sm font-medium rounded-full bg-green-100 text-green-800 border border-green-200">
                      Read
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Deletion Warning for Read Notifications */}
          {notification.read && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <MdWarning className="text-yellow-600 text-lg mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-medium text-yellow-800 mb-1">Scheduled for Deletion</h4>
                  <p className="text-sm text-yellow-700">
                    This notification has been marked as read and will be automatically deleted soon to keep your notifications organized.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Message */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <MdInfo className="text-gray-500" />
              Message
            </h4>
            <p className="text-gray-800 leading-relaxed">{notification.message}</p>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Type</h4>
              <p className="text-gray-800 font-medium">{notification.type}</p>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Filter Type</h4>
              <p className="text-gray-800 font-medium">{notification.filterType}</p>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <MdCalendarToday className="text-gray-500" />
                Created
              </h4>
              <p className="text-gray-800">{formatDate(notification.createdAt)}</p>
              <p className="text-sm text-gray-500 mt-1">{notification.time}</p>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Impact Level</h4>
              <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full border ${getImpactColor(notification.impact)}`}>
                {notification.impact}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <div className="text-sm text-gray-500">
              ID: {notification.id}
            </div>
            <div className="flex items-center gap-3">
              {!notification.read && (
                <button 
                  onClick={() => {
                    onMarkAsRead && onMarkAsRead(notification.id);
                  }}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition duration-200 flex items-center gap-2"
                >
                  <MdMarkEmailRead />
                  Mark as Read
                </button>
              )}
              <button 
                onClick={onClose}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition duration-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewNotificationModal;
