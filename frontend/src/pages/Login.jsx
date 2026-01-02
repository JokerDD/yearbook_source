import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GraduationCap } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${API}/auth/login`, {
        email,
        password,
      });

      const { access_token, user_type, user_data } = response.data;

      localStorage.setItem("token", access_token);
      localStorage.setItem("userType", user_type);
      localStorage.setItem("userData", JSON.stringify(user_data));

      toast.success("Login successful!");

      if (user_type === "admin") {
        navigate("/admin/dashboard");
      } else {
        navigate("/dashboard");
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div
        className="hidden lg:flex lg:w-1/2 relative bg-cover bg-center"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1614620027003-8800eebb10f7?crop=entropy&cs=srgb&fm=jpg&q=85')",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/90 to-primary/70" />
        <div className="relative z-10 p-12 flex flex-col justify-center">
          <h1 className="text-5xl font-jakarta font-bold text-white mb-4">
            Yearbook
            <br />
            Management
          </h1>
          <p className="text-xl text-white/90">
            Capture memories, celebrate achievements
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-accent/10 rounded-xl mb-4">
              <GraduationCap className="w-8 h-8 text-accent" />
            </div>
            <h2 className="text-3xl font-jakarta font-bold text-primary mb-2">
              Welcome Back
            </h2>
            <p className="text-muted">
              Sign in to access your yearbook portal
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6" data-testid="login-form">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="your.email@college.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11"
                data-testid="email-input"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-11"
                data-testid="password-input"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
              disabled={loading}
              data-testid="login-button"
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <div className="mt-8 p-4 bg-secondary/50 rounded-lg">
            <p className="text-sm text-muted text-center">
              <strong>Demo Credentials:</strong>
              <br />
              Admin: admin@yearbook.com / admin123
              <br />
              (Create a college and students to test student login)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
