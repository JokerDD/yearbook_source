import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function ProfileSection({ profileData, onUpdate }) {
  const [formData, setFormData] = useState({
    full_name: "",
    nickname: "",
    phone: "",
    date_of_birth: "",
  });
  const [saving, setSaving] = useState(false);
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (profileData?.user?.profile) {
      setFormData({
        full_name: profileData.user.profile.full_name || "",
        nickname: profileData.user.profile.nickname || "",
        phone: profileData.user.profile.phone || "",
        date_of_birth: profileData.user.profile.date_of_birth || "",
      });
    }
  }, [profileData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      await axios.put(`${API}/profile`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success("Profile updated successfully!");
      onUpdate();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h3 className="text-2xl font-jakarta font-bold text-primary mb-2">
        Profile Details
      </h3>
      <p className="text-muted mb-6">
        Enter your personal information for the yearbook
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="full_name">Full Name *</Label>
            <Input
              id="full_name"
              placeholder="Enter your full name"
              value={formData.full_name}
              onChange={(e) =>
                setFormData({ ...formData, full_name: e.target.value })
              }
              required
              data-testid="full-name-input"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="nickname">Known As (Nickname) *</Label>
            <Input
              id="nickname"
              placeholder="Your nickname"
              value={formData.nickname}
              onChange={(e) =>
                setFormData({ ...formData, nickname: e.target.value })
              }
              required
              data-testid="nickname-input"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number *</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+1 234 567 8900"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              required
              data-testid="phone-input"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dob">Date of Birth *</Label>
            <Input
              id="dob"
              type="date"
              value={formData.date_of_birth}
              onChange={(e) =>
                setFormData({ ...formData, date_of_birth: e.target.value })
              }
              required
              data-testid="dob-input"
            />
          </div>
        </div>

        <Button
          type="submit"
          className="gap-2"
          disabled={saving}
          data-testid="save-profile-button"
        >
          <Save className="w-4 h-4" />
          {saving ? "Saving..." : "Save Profile"}
        </Button>
      </form>
    </div>
  );
}
