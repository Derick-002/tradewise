import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Navigate } from "react-router-dom";
import { fetchUser } from "../features/auth/authThuck";
import { CgSpinner } from "react-icons/cg";

const ProtectedRoute = ({ children, requireAuth = true, verified = true }) => {
  const { user, loading } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const [fetched, setFetched] = useState(false);

  // Only fetch user if not present and not already loading
  // This prevents the race condition after login/signup
  useEffect(() => {
    if (user === null && !loading && !fetched) {
      dispatch(fetchUser());
      setFetched(true);
    }
  }, [user, loading, fetched, dispatch]);

  // Show spinner while loading
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col justify-center items-center gap-6 text-center">
          <CgSpinner className="animate-spin text-[#BE741E]" size={80} />
          <span className="text-3xl font-extrabold text-gray-800">
            Authenticating<span className="dots"></span>
          </span>
        </div>
      </div>
    );
  }

  // Redirect based on auth requirement
  if (requireAuth && !user) {
    return <Navigate to="/login" replace />;
  }

  // Don't redirect if we're in a loading state (ongoing auth operation)
  if (!requireAuth && user && !loading) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
