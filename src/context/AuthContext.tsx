import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

type AuthContextType = {
  isAuth: boolean;
  isLoading: boolean;
  user: any;
  checkAuth: () => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuth, setIsAuth] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
  const navigate = useNavigate();

  const checkAuth = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/auth/me`, {
        withCredentials: true, // Sends the cookie
      });
      if (res.data.success) {
        setIsAuth(true);
        if (res.data.user.role === "admin") {
          navigate("/superadmin", { replace: true });
        } else if (res.data.user.role === "user") {
          navigate("/", { replace: true });
        } else {
          navigate("/login", { replace: true });
        }
        setUser(res.data.user);
      }
    } catch {
      setIsAuth(false);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    await axios.post(
      `${BASE_URL}/auth/logout`,
      {},
      {
        withCredentials: true,
      },
    );

    setIsAuth(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    checkAuth();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isAuth,
        isLoading,
        user,
        checkAuth,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
};
