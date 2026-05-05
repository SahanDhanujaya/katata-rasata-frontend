import { BrowserRouter, Routes, Route } from "react-router-dom";
import Billing from "./pages/Billing";
import AddItem from "./pages/AddItem";
import ViewBills from "./pages/ViewBills";
import Login from "./pages/Login";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<Login />} />

        {/* Protected */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <Navbar />
              <Routes>
                <Route path="/" element={<Billing />} />
                <Route path="/add" element={<AddItem />} />
                <Route path="/report" element={<ViewBills />} />
              </Routes>
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;