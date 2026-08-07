import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import axios from "axios";

type AuthContextType = {
  isAuth: boolean;
  isLoading: boolean;
  user: { role?: string; [key: string]: unknown } | null;
  checkAuth: () => Promise<{ role?: string; [key: string]: unknown } | null>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuth, setIsAuth] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<AuthContextType["user"]>(null);
  const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

  const checkAuth = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/auth/me`, {
        withCredentials: true,
      });
      if (res.data.success) {
        setIsAuth(true);
        setUser(res.data.user);
        return res.data.user; // <-- return it directly
      }
      setIsAuth(false);
      setUser(null);
      return null;
    } catch {
      setIsAuth(false);
      setUser(null);
      return null;
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
