import React, { useEffect, useState } from 'react';
import {
  MdNotifications, 
  MdNotificationsActive, 
  MdNotificationsOff, 
  MdDelete, MdInfo, MdWarning, 
  MdMarkEmailRead, 
  MdCheckCircle, 
  MdCalendarToday,
  MdError
} from 'react-icons/md';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate, useParams } from 'react-router-dom';
import { backendGqlApi } from '../utils/axiosInstance';
import { getAllNotifications, markAsRead, markAllAsRead, getANotification } from '../utils/gqlQuery'
import { toast } from 'react-toastify';
import ViewNotificationModal from './modals/ViewNotificationModal';


const Notification = () => {
  const navigate = useNavigate();
  const { notificationId } = useParams();
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedImpact, setSelectedImpact] = useState('all');
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [markingAllAsRead, setMarkingAllAsRead] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);

  const filteredNotifications = notifications
    .filter(n => {
      // Filter by filterType (not type)
      const typeMatch = selectedFilter === 'all' || n.filterType?.toUpperCase() === selectedFilter;
      // Filter by impact
      const impactMatch = selectedImpact === 'all' || n.impact === selectedImpact;
      return typeMatch && impactMatch;
    });

  const unreadCount = notifications.filter(n => !n.read).length;

  
  // Get icon based on notification type
  const getNotificationIcon = (type) => {
    switch(type?.toLowerCase()) {
      case 'success':
        return <MdCheckCircle className="text-[#BE741E]" />;
      case 'warning':
        return <MdWarning className="text-[#BE741E]" />;
      case 'info':
        return <MdInfo className="text-[#BE741E]" />;
      case 'error':
        return <MdError className="text-[#BE741E]" />;
      default:
        return <MdInfo className="text-[#BE741E]" />;
    }
  };

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true);
        const response = await backendGqlApi.post('/graphql', {
          query: getAllNotifications,
        });
    
        if (response.data.errors) {
          toast.error('Error fetching notifications: ' + response.data.errors[0].message);
          return;
        }

        const notificationsData = response.data.data.getNotifications;
        
        // Transform backend data to match component format
        const transformedNotifications = notificationsData.map(notif => ({
          id: notif.id,
          type: notif.type || 'info', // Keep original type for display
          filterType: notif.filterType || 'INFO', // Use filterType for filtering
          title: notif.title,
          message: notif.message,
          time: notif.createdAt ? formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true }) : 'Just now',
          read: Boolean(notif.read),
          impact: notif.impact || 'Low',
          createdAt: notif.createdAt,
          icon: getNotificationIcon(notif.filterType || notif.type)
        }));

        setNotifications(transformedNotifications);
      } catch (error) {
        console.error('Error fetching notifications:', error);
        toast.error('Failed to load notifications');
      } finally {
        setLoading(false);
      }
    }

    fetchNotifications();
  }, []);

  // Handle URL parameter for direct notification viewing
  useEffect(() => {
    if (notificationId && notifications.length > 0) {
      const notification = notifications.find(notif => notif.id === notificationId);
      if (notification) {
        setSelectedNotification(notification);
        setIsViewModalOpen(true);
      } else {
        // If notification not found in current list, fetch it from backend
        fetchNotification(notificationId);
      }
    }
  }, [notificationId, notifications]);

  // Fetch specific notification from backend
  const fetchNotification = async (id) => {
    try {
      const response = await backendGqlApi.post('/graphql', {
        query: getANotification,
        variables: { id }
      });
      
      if (response.data.data.getANotification) {
        const notif = response.data.data.getANotification;
        const transformedNotification = {
          id: notif.id,
          type: notif.type || 'info',
          filterType: notif.filterType || 'INFO',
          title: notif.title,
          message: notif.message,
          time: notif.createdAt ? formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true }) : 'Just now',
          read: Boolean(notif.read),
          impact: notif.impact || 'Low',
          createdAt: notif.createdAt,
          icon: getNotificationIcon(notif.filterType || notif.type)
        };
        setSelectedNotification(transformedNotification);
        setIsViewModalOpen(true);
      }
    } catch (error) {
      console.error('Error fetching notification:', error);
      toast.error('Notification not found');
      navigate('/dashboard');
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      const response = await backendGqlApi.post('/graphql', {
        query: markAsRead,
        variables: { id: notificationId }
      });

      if (response.data.errors) {
        console.log("Error: ", response);
        toast.error('Error marking notification as read: ' + response.data.errors[0].message);
        return;
      }

      // Update the notification in local state
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, read: true }
            : notification
        )
      );

      toast.success('Notification marked as read');
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('Failed to mark notification as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    if (markingAllAsRead) return; // Prevent multiple clicks
    
    try {
      setMarkingAllAsRead(true);
      const response = await backendGqlApi.post('/graphql', {
        query: markAllAsRead
      });

      if (response.data.errors) {
        console.log("Error: ", response);
        toast.error('Error marking all notifications as read: ' + response.data.errors[0].message);
        return;
      }

      // Check if the mutation was successful
      if (response.data.data.markAllAsRead) {
        // Update all notifications to read in local state
        setNotifications(prev => prev.map(notification => ({ ...notification, read: true })));
        toast.success('All notifications marked as read');
      } else {
        toast.error('Failed to mark all notifications as read');
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast.error('Failed to mark all notifications as read');
    } finally {
      setMarkingAllAsRead(false);
    }
  };

  const getTypeColor = (type) => {
    // Handle actual backend notification types
    if (type?.includes('alert') || type?.includes('warning')) {
      return 'bg-yellow-50 border-yellow-200';
    }
    if (type?.includes('success') || type?.includes('complete')) {
      return 'bg-green-50 border-green-200';
    }
    if (type?.includes('error') || type?.includes('fail')) {
      return 'bg-red-50 border-red-200';
    }
    // Default for info and other types
    return 'bg-blue-50 border-blue-200';
  };

  return (
    <div className="space-y-6 ">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Notifications</h2>
          <p className="text-gray-600">Stay updated with your business activities</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">{unreadCount} unread</span>
          <button 
            onClick={handleMarkAllAsRead}
            disabled={markingAllAsRead}
            className={`px-4 py-2 rounded-lg transition duration-200 flex items-center gap-2 ${
              markingAllAsRead 
                ? 'bg-gray-400 text-white cursor-not-allowed' 
                : 'bg-black text-white hover:bg-gray-800'
            }`}
          >
            {markingAllAsRead ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Marking...
              </>
            ) : (
              <>
                <MdMarkEmailRead className="text-xl" />
                Mark All Read
              </>
            )}
          </button>
        </div>
      </div>

      {/* Notification Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Notifications</p>
              <p className="text-2xl font-bold text-gray-800">{notifications.length}</p>
            </div>
            <div className="bg-[#BE741E] p-3 rounded-lg">
              <MdNotifications className="text-[#fff] text-2xl" />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Unread</p>
              <p className="text-2xl font-bold text-[#000]">{unreadCount}</p>
            </div>
            <div className="bg-[#BE741E] p-3 rounded-lg">
              <MdNotificationsActive className="text-[#fff] text-2xl" />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Read</p>
              <p className="text-2xl font-bold text-[#000]">{notifications.length - unreadCount}</p>
            </div>
            <div className="bg-[#BE741E] p-3 rounded-lg">
              <MdNotificationsOff className="text-[#fff] text-2xl" />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Today</p>
              <p className="text-2xl font-bold text-black">{notifications.filter(n => n.time.includes('minutes') || n.time.includes('hour')).length}</p>
            </div>
            <div className="bg-[#BE741E] p-3 rounded-lg">
              <MdCalendarToday className="text-white text-2xl" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Type
            </label>
            <select
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#BE741E] focus:border-transparent"
            >
              <option value="all">All Types ({notifications.length})</option>
              <option value="SUCCESS">Success ({notifications.filter(n => n.filterType?.toUpperCase() === 'SUCCESS').length})</option>
              <option value="WARNING">Warning ({notifications.filter(n => n.filterType?.toUpperCase() === 'WARNING').length})</option>
              <option value="INFO">Info ({notifications.filter(n => n.filterType?.toUpperCase() === 'INFO').length})</option>
            </select>
          </div>

          {/* Impact Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Impact
            </label>
            <select
              value={selectedImpact}
              onChange={(e) => setSelectedImpact(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#BE741E] focus:border-transparent"
            >
              <option value="all">All Impact Levels</option>
              <option value="Low">Low ({notifications.filter(n => n.impact === 'Low').length})</option>
              <option value="Medium">Medium ({notifications.filter(n => n.impact === 'Medium').length})</option>
              <option value="High">High ({notifications.filter(n => n.impact === 'High').length})</option>
            </select>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#BE741E]"></div>
            <p className="ml-4 text-gray-600">Loading notifications...</p>
          </div>
        ) : filteredNotifications.map((notification) => (
          <div 
            key={notification.id} 
            className={`p-6 rounded-xl border transition duration-200 hover:shadow-md ${
              notification.read ? 'bg-white' : 'bg-blue-50'
            } ${getTypeColor(notification.type)}`}
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 mt-1">
                {notification.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-gray-800">{notification.title}</h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      notification.impact === 'High' ? 'bg-red-100 text-red-800' :
                      notification.impact === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {notification.impact}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">{notification.time}</span>
                    {!notification.read && (
                      <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                    )}
                  </div>
                </div>
                <p className="text-gray-600 mt-2">{notification.message}</p>
                <div className="flex items-center gap-2 mt-4">
                  <button 
                    onClick={() => {
                      setSelectedNotification(notification);
                      setIsViewModalOpen(true);
                      navigate(`/notifications/${notification.id}`);
                    }}
                    className="text-[#BE741E] hover:text-blue-800 text-sm font-medium"
                  >
                    View Details
                  </button>
                  {!notification.read && (
                    <button 
                      onClick={() => handleMarkAsRead(notification.id)}
                      className="text-green-600 hover:text-green-800 text-sm flex items-center gap-1"
                      title="Mark as read"
                    >
                      <MdMarkEmailRead className="text-lg" />
                      <span className="text-xs">Mark as read</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {!loading && filteredNotifications.length === 0 && (
        <div className="text-center py-12">
          <MdNotificationsOff className="text-gray-400 text-6xl mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
          <p className="text-gray-600">You're all caught up! No new notifications at the moment.</p>
        </div>
      )}

      {/* View Notification Modal */}
      <ViewNotificationModal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedNotification(null);
          navigate('/dashboard');
        }}
        notification={selectedNotification}
        onMarkAsRead={handleMarkAsRead}
      />
    </div>
  );
};

export default Notification;
