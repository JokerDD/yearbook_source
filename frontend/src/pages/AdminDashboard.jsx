import React, { useState, useEffect } from "react";
import { Routes, Route, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { LogOut, Users, GraduationCap, Plus } from "lucide-react";
import CollegeManagement from "../components/admin/CollegeManagement";
import StudentManagement from "../components/admin/StudentManagement";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function AdminDashboard() {
  const [stats, setStats] = useState({ colleges: 0, students: 0 });
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [collegesRes, studentsRes] = await Promise.all([
        axios.get(`${API}/colleges`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API}/students`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setStats({
        colleges: collegesRes.data.length,
        students: studentsRes.data.length,
      });
    } catch (error) {
      console.error("Failed to fetch stats", error);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    toast.success("Logged out successfully");
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <nav className="bg-white border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-accent" />
            </div>
            <div>
              <h1 className="text-xl font-jakarta font-bold text-primary">
                Admin Dashboard
              </h1>
              <p className="text-sm text-muted">Yearbook Management</p>
            </div>
          </div>
          <Button
            onClick={handleLogout}
            variant="ghost"
            className="gap-2"
            data-testid="logout-button"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted font-medium">Total Colleges</p>
                <p className="text-3xl font-jakarta font-bold text-primary">
                  {stats.colleges}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted font-medium">Total Students</p>
                <p className="text-3xl font-jakarta font-bold text-primary">
                  {stats.students}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-border rounded-xl shadow-sm">
          <div className="border-b border-border">
            <nav className="flex gap-1 p-2">
              <Link to="/admin/dashboard">
                <Button
                  variant="ghost"
                  className="gap-2"
                  data-testid="colleges-tab"
                >
                  <GraduationCap className="w-4 h-4" />
                  Colleges
                </Button>
              </Link>
              <Link to="/admin/students">
                <Button
                  variant="ghost"
                  className="gap-2"
                  data-testid="students-tab"
                >
                  <Users className="w-4 h-4" />
                  Students
                </Button>
              </Link>
            </nav>
          </div>

          <div className="p-6">
            <Routes>
              <Route
                path="/dashboard"
                element={<CollegeManagement onUpdate={fetchStats} />}
              />
              <Route
                path="/students"
                element={<StudentManagement onUpdate={fetchStats} />}
              />
              <Route
                index
                element={<CollegeManagement onUpdate={fetchStats} />}
              />
            </Routes>
          </div>
        </div>
      </div>
    </div>
  );
}
