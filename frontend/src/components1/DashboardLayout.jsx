import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { MdDashboard, MdStorage, MdHistory, MdShoppingBag, MdAttachMoney, MdNotifications, MdCreditCard, MdLogout, MdHome } from "react-icons/md";
import logo from '../assets/logo.png';
import Dashboard from './Dashboard';
import Stock from './Stock';
import History from './History';
import BuyingProducts from './BuyingProducts';
import SellingProducts from './SellingProducts';
import Notification from './Notification';
import CreditsDebit from './CreditsDebit';
import Profile from './Profile';
import '../index.css';
// Removed mock imports - using real backend data
import { CgProfile } from "react-icons/cg";

import { toast, ToastContainer } from 'react-toastify';
import { handleError } from '../utils/handleError';
import { useSelector, useDispatch } from "react-redux";
import { logoutUser } from "../features/auth/authThuck";
import { backendGqlApi } from '../utils/axiosInstance';
import { findallTransactionsQuery, findATransactionQuery, getAllNotifications, markAsRead } from '../utils/gqlQuery';
import { formatDistanceToNow } from 'date-fns';
import TransactionSkeleton from './skeletons/TransactionSkeleton';

const DashboardLayout = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const params = useParams();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(() => {
    // Load saved tab from localStorage, default to 'dashboard'
    return localStorage.getItem('dashboardActiveTab') || 'dashboard';
  });
  const { user } = useSelector((state) => state.auth);

  // Handle transaction URL routing with backend search
  useEffect(() => {
    if (params.id && location.pathname.includes('/transaction/')) {
      // Search for specific transaction in backend
      const searchTransaction = async () => {
        try {
          setIsSearchingTransaction(true);
          
          // First try to find the specific transaction by ID
          const response = await backendGqlApi.post('/graphql', {
            query: findATransactionQuery,
            variables: { transactionId: params.id }
          });

          if (response.data.data?.transaction) {
            const transaction = response.data.data.transaction;
            
            // Set the correct tab based on transaction type
            if (transaction.type === 'Sale') {
              setActiveTab('selling');
            } else if (transaction.type === 'Purchase') {
              setActiveTab('buying');
            } else {
              // Default to buying if unknown type
              setActiveTab('buying');
            }
            
            // toast.success(`Transaction found: ${transaction.type} transaction`);
          } else {
            // Transaction not found
            toast.error(`Transaction ${params.id} not found`);
            navigate('/dashboard');
          }
        } catch (error) {
          console.error('Error searching for transaction:', error);
          toast.error(`Error finding transaction: ${error.message}`);
          // Default to buying if error
          setActiveTab('buying');
        } finally {
          setIsSearchingTransaction(false);
        }
      };

      searchTransaction();
    } else {
      setIsSearchingTransaction(false);
    }
  }, [params.id, location.pathname, navigate]);

  useEffect(() => {
    if (!user) navigate("/login");
    if (!user?.isVerified) navigate("/email");
  }, [user, navigate]);

  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSearchingTransaction, setIsSearchingTransaction] = useState(false);

  const tabs = [
    { id: 'dashboard', name: 'Dashboard', icon: <MdDashboard className="mr-4 text-xl text-white" /> },
    { id: 'stock', name: 'Stock', icon: <MdStorage className="mr-4 text-xl text-white" /> },
    { id: 'history', name: 'History', icon: <MdHistory className="mr-4 text-xl text-white" /> },
    { id: 'buying', name: 'Buying Products', icon: <MdShoppingBag className="mr-4 text-xl text-white" /> },
    { id: 'selling', name: 'Selling Products', icon: <MdAttachMoney className="mr-4 text-xl text-white" /> },
    { id: 'notification', name: 'Notification', icon: <MdNotifications className="mr-4 text-xl text-white" /> },
    { id: 'credits', name: 'Credits/Debit', icon: <MdCreditCard className="mr-4 text-xl text-white" /> },
    { id: 'profile', name: 'Profile', icon: <CgProfile className="mr-4 text-xl text-white" /> },
  ];

  const handleLogout = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await dispatch(logoutUser());
      // Clear saved tab on logout
      localStorage.removeItem('dashboardActiveTab');
      toast.success("Logged out successfully !!!");
      navigate("/login");
    } catch (error) {
      const { message } = handleError(error);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    // Show skeleton while searching for transaction
    if (isSearchingTransaction) {
      return <TransactionSkeleton />;
    }

    switch (activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'stock': return <Stock />;
      case 'history': return <History />;
      case 'buying': return <BuyingProducts />;
      case 'selling': return <SellingProducts />;
      case 'notification': return <Notification />;
      case 'credits': return <CreditsDebit />;
      case 'profile': return <Profile />;
      default: return <Dashboard />;
    }
  };

  // Save activeTab to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('dashboardActiveTab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await backendGqlApi.post('/graphql', {
          query: getAllNotifications,
        });

        if (response.data.errors) {
          console.error('Error fetching notifications:', response.data.errors);
          return;
        }

        const notificationsData = response.data.data.getNotifications;
        
        // Transform backend data and show only unread notifications in dropdown
        const unreadNotifications = notificationsData
          .filter(notif => !notif.read)
          .slice(0, 5) // Show only first 5 unread notifications
          .map(notif => ({
            id: notif.id,
            title: notif.title,
            message: notif.message,
            priority: notif.impact?.toLowerCase() || 'low', // Map impact to priority
            created_at: notif.createdAt,
            timeAgo: notif.createdAt ? formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true }) : 'Just now'
          }));

        setNotifications(unreadNotifications);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };

    fetchNotifications();
  }, []);

  const markNotificationAsRead = async (notificationId) => {
    try {
      const response = await backendGqlApi.post('/graphql', {
        query: markAsRead,
        variables: { id: notificationId }
      });

      if (response.data.errors) {
        console.error('Error marking notification as read:', response.data.errors);
        toast.error('Failed to mark notification as read');
        return;
      }

      // Remove from dropdown (since we only show unread notifications)
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      toast.success('Notification marked as read');
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('Failed to mark notification as read');
    }
  };

  return (
    <div className="flex h-screen bg-white font-sans text-gray-800 hide-scrollbar">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop={true} closeOnClick pauseOnHover draggable theme="colored" />

      {/* Sidebar (navbar) */}
      <div className="w-64 shadow-2xl flex flex-col border-r border-gray-200 hide-scrollbar" style={{ backgroundColor: '#be741e' }}>
        <div className="p-6 border-b border-gray-200 flex items-center">
          <img src={logo} alt="TradeWise logo" className='w-[50px] h-[40px] rounded-full mr-1' />
          <h1 className="text-2xl font-bold tracking-wide text-white">TradeWise</h1>
        </div>

        <nav className="flex-grow p-4 md:p-6 space-y-2 hide-scrollbar">
          <ul>
            {tabs.map((tab) => (
              <li key={tab.id} className="mt-1">
                <button
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center py-3 px-3 md:px-4 text-white rounded-lg transition duration-200 font-medium cursor-pointer ${
                    activeTab === tab.id 
                      ? 'bg-black text-white shadow-lg transform scale-105' 
                      : 'hover:bg-black hover:shadow-md'
                  }`}
                >
                  {tab.icon}
                  <span className="truncate">{tab.name}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4 md:p-6 border-t border-gray-200">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center py-3 px-4 text-black hover:bg-white rounded-lg transition duration-200 font-medium cursor-pointer bg-white hover:shadow-md"
          >
            <MdLogout className="mr-4 text-xl"/>
            Logout
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden bg-white text-gray-800 hide-scrollbar">
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-white border-b border-gray-200 shadow-sm text-gray-800">
          <div className="text-2xl md:text-3xl font-semibold">
            Welcome Back your {"Enterprise " + user?.enterpriseName || 'Enterprise'}!
            <p className="text-sm font-normal mt-1">
              {/* Here's your dashboard overview, be able to track you daily and monthly expense. */}
              Here's your business dashboard — track performance, monitor expenses, and stay on top of your goals.
            </p>
          </div>
          <div className="relative flex flex-row items-center justify-center text-center">
            <button
              className='text-gray-600 mx-2 hover:text-black'
              onClick={() => navigate('/')}
              title="Go to Home"
            >
              <MdHome size={24} />
            </button>
            <button className='text-gray-600 mx-2 hover:text-black' onClick={() => setActiveTab('profile')}>
              <CgProfile size={24}/>
            </button>
            <div className="relative">
              <button onClick={() => setShowNotifications(!showNotifications)} className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none">
                <MdNotifications className="h-6 w-6" />
                {notifications.length > 0 && ( 
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center"> {notifications.length} </span> 
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg z-50 border">
                  <div className="py-2">
                    <div className="px-4 py-2 border-b">
                      <h3 className="text-sm font-medium text-gray-900">Notifications</h3>
                    </div>
                    {notifications.length > 0 ? (
                      notifications.map((notification) => (
                        <div key={notification.id} className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0" onClick={() => markNotificationAsRead(notification.id)} >
                          <div className="flex items-start">
                            <div className="flex-shrink-0">
                              <div className={`w-2 h-2 rounded-full ${ notification.priority === 'high' ? 'bg-red-400' :  notification.priority === 'medium' ? 'bg-yellow-400' : 'bg-blue-400' }`}></div>
                            </div>
                            <div className="ml-3 flex-1">
                              <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                              <p className="text-sm text-gray-600">{notification.message}</p>
                              <p className="text-xs text-gray-400 mt-1">{notification.timeAgo}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-sm text-gray-500">No new notifications</div>
                    )}
                    <div className="border-t border-gray-200">
                      <button 
                        onClick={() => {
                          setActiveTab('notification');
                          setShowNotifications(false);
                        }}
                        className="w-full px-4 py-2 text-sm text-[#BE741E] hover:bg-gray-50 font-medium"
                      >
                        View All Notifications
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>
        
        <main className="flex-1 overflow-x-hidden hide-scrollbar overflow-y-auto bg-gray-50 p-4 md:p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
