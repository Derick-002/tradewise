import React from 'react';
import { ToastContainer, toast, Slide } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Custom close button with more visible X icon
const AppToastCloseButton = (props) => {
  const { closeToast } = props;
  return React.createElement(
    'button',
    {
      type: 'button',
      onClick: (e) => {
        // Ensure the click does not bubble to the toast body
        if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
        if (typeof closeToast === 'function') closeToast(e);
      },
      'aria-label': 'Close notification',
      title: 'Close',
      className:
        'ml-3 text-gray-700 hover:text-gray-900 focus:outline-none text-lg font-bold leading-none',
    },
    '×'
  );
};

// Stable references to avoid resetting toast timers on re-render
const TOAST_CLASS = 'relative flex items-center px-4 py-3 rounded-xl shadow-lg bg-gray-200 text-gray-900 border-l-4 border-[#BE741E] mt-2 max-w-md w-full';
const TOAST_BODY_CLASS = 'flex-1 text-sm font-medium';
const TOAST_PROGRESS_CLASS = 'bg-[#BE741E]';
const renderCloseButton = (props) => React.createElement(AppToastCloseButton, props);

// Central app-themed toast API
export const appToast = {
  success(message, options = {}) {
    return toast.success(message, {
      icon: '✅',
      autoClose: 3000,
      ...options,
    });
  },
  error(message, options = {}) {
    return toast.error(message, {
      icon: '⚠️',
      autoClose: 3000,
      ...options,
    });
  },
  info(message, options = {}) {
    return toast.info(message, {
      icon: 'ℹ️',
      autoClose: 3000,
      ...options,
    });
  },
  warning(message, options = {}) {
    return toast.warning(message, {
      icon: '⚠️',
      autoClose: 3000,
      ...options,
    });
  },
};

// Central container with app theme & behavior (no JSX to keep this file pure JS)
export function AppToastContainer() {
  return React.createElement(ToastContainer, {
    position: 'top-right',
    autoClose: 3000,
    hideProgressBar: false,
    newestOnTop: true,
    closeOnClick: true,
    // Do not pause auto-close on hover or when window loses focus
    pauseOnHover: false,
    draggable: true,
    pauseOnFocusLoss: false,
    theme: 'colored',
    transition: Slide,
    // Use stable references so timers are not reset on prop changes
    closeButton: renderCloseButton,
    toastClassName: TOAST_CLASS,
    bodyClassName: TOAST_BODY_CLASS,
    progressClassName: TOAST_PROGRESS_CLASS,
  });
}
