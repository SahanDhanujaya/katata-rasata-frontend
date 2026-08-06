import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface Props {
  role: string;
}

export default function RoleRoute({ role }: Props) {
  const { user } = useAuth();

  if (user?.role !== role) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
