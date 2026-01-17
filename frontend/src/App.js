import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import Login from "./pages/Login.jsx";
import SignUp from "./pages/SignUp.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import StudentDashboard from "./pages/StudentDashboard.jsx";
import StudentDetail from "./pages/StudentDetail.jsx";
import "@/App.css";

function ProtectedRoute({ children, requiredType }) {
  const token = localStorage.getItem("token");
  const userType = localStorage.getItem("userType");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (requiredType && userType !== requiredType) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute requiredType="admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/students/:studentId"
            element={
              <ProtectedRoute requiredType="admin">
                <StudentDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/*"
            element={
              <ProtectedRoute requiredType="student">
                <StudentDashboard />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" />
    </div>
  );
}

export default App;
