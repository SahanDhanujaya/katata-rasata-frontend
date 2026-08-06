import { Routes, Route } from "react-router-dom";

import Login from "../pages/Login";

import Billing from "../pages/Billing";
import AddItem from "../pages/AddItem";
import ViewBills from "../pages/ViewBills";

import SuperAdminPage from "../pages/admin/SuperAdminPage";
import ComisPage from "../pages/admin/ComisPage";

import ProtectedRoute from "../components/ProtectedRoute";
import RoleRoute from "./RoleRoute";

import MainLayout from "../layouts/MainLayout";
import AdminLayout from "../layouts/AdminLayout";

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}

      <Route path="/login" element={<Login />} />

      {/* User Routes */}

      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Billing />} />

          <Route path="/add" element={<AddItem />} />

          <Route path="/report" element={<ViewBills />} />
        </Route>
      </Route>

      {/* Admin Routes */}

      <Route element={<ProtectedRoute />}>
        <Route element={<RoleRoute role="admin" />}>
          <Route element={<AdminLayout />}>
            <Route path="/superadmin" element={<SuperAdminPage />} />

            <Route path="/superadmin/comis" element={<ComisPage />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  );
}
