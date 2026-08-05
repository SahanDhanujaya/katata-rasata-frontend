import { Navigate } from "react-router-dom";

const PrivateRouter = ({ children }: any) => {
  const isSuperAuth = localStorage.getItem("isSuperAuth");

  if (!isSuperAuth) {
    return <Navigate to="/login" />;
  }

  return children;
};

export default PrivateRouter;