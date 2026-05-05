import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }: any) {
  const isAuth = localStorage.getItem("isAuth");

  if (!isAuth) {
    return <Navigate to="/login" />;
  }

  return children;
}