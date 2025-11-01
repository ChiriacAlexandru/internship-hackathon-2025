import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useAuth } from "../context/AuthContext.jsx";

const ProtectedRoute = () => {
  const location = useLocation();
  const { token, isCheckingToken } = useAuth();

  if (isCheckingToken) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950 text-slate-200">
        <span className="animate-pulse text-sm uppercase tracking-widest">
          Loading...
        </span>
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
