import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { LogOut, User, BookOpen, Camera, CheckCircle2 } from "lucide-react";
import ProfileSection from "../components/student/ProfileSection.jsx";
import YearbookSection from "../components/student/YearbookSection.jsx";
import PhotoSection from "../components/student/PhotoSection.jsx";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function StudentDashboard() {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("profile");
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await axios.get(`${API}/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProfileData(response.data);
    } catch (error) {
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    toast.success("Logged out successfully");
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted">Loading...</p>
        </div>
      </div>
    );
  }

  const completion = profileData?.profile_completion || 0;

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <nav className="bg-white border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
              <User className="w-6 h-6 text-accent" />
            </div>
            <div>
              <h1 className="text-xl font-jakarta font-bold text-primary">
                {profileData?.user?.name || "Student Dashboard"}
              </h1>
              <p className="text-sm text-muted">
                {profileData?.college?.name || "Yearbook Portal"}
              </p>
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
        <div className="mb-8">
          <div className="bg-white border border-border rounded-xl p-8 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-jakarta font-bold text-primary mb-1">
                  Profile Completion
                </h2>
                <p className="text-muted">
                  Complete all sections to finalize your yearbook entry
                </p>
              </div>
              <div className="text-right">
                <div className="text-4xl font-jakarta font-bold text-accent">
                  {completion}%
                </div>
                <p className="text-sm text-muted">Completed</p>
              </div>
            </div>
            <div className="w-full bg-secondary rounded-full h-3 overflow-hidden">
              <div
                className="h-full bg-accent transition-all duration-500 ease-out"
                style={{ width: `${completion}%` }}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white border border-border rounded-xl p-4 space-y-2">
              <button
                onClick={() => setActiveTab("profile")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  activeTab === "profile"
                    ? "bg-accent/10 text-accent"
                    : "hover:bg-secondary text-muted"
                }`}
                data-testid="profile-tab"
              >
                <User className="w-5 h-5" />
                <span className="font-medium">Profile Details</span>
              </button>
              <button
                onClick={() => setActiveTab("yearbook")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  activeTab === "yearbook"
                    ? "bg-accent/10 text-accent"
                    : "hover:bg-secondary text-muted"
                }`}
                data-testid="yearbook-tab"
              >
                <BookOpen className="w-5 h-5" />
                <span className="font-medium">Yearbook Questions</span>
              </button>
              <button
                onClick={() => setActiveTab("photos")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  activeTab === "photos"
                    ? "bg-accent/10 text-accent"
                    : "hover:bg-secondary text-muted"
                }`}
                data-testid="photos-tab"
              >
                <Camera className="w-5 h-5" />
                <span className="font-medium">Photo Upload</span>
              </button>
            </div>
          </div>

          <div className="lg:col-span-3">
            <div className="bg-white border border-border rounded-xl p-8 shadow-sm">
              {activeTab === "profile" && (
                <ProfileSection
                  profileData={profileData}
                  onUpdate={fetchProfile}
                />
              )}
              {activeTab === "yearbook" && (
                <YearbookSection
                  profileData={profileData}
                  onUpdate={fetchProfile}
                />
              )}
              {activeTab === "photos" && (
                <PhotoSection
                  profileData={profileData}
                  onUpdate={fetchProfile}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
