import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GraduationCap } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function SignUp() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignUp = async (e) => {
    e.preventDefault();
    
    if (!fullName || !email || !password || !confirmPassword) {
      toast.error("Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(`${API}/auth/register`, {
        email,
        password,
        full_name: fullName,
        user_type: "student",
      });

      const { access_token, user_type, user_data } = response.data;

      localStorage.setItem("token", access_token);
      localStorage.setItem("userType", user_type);
      localStorage.setItem("userData", JSON.stringify(user_data));

      toast.success("Sign up successful!");

      if (user_type === "admin") {
        navigate("/admin/dashboard");
      } else {
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("Sign up error:", error);
      const errorMsg = error.response?.data?.detail || error.message || "Sign up failed";
      console.error("Error message:", errorMsg);
      toast.error(errorMsg);
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
            Join the
            <br />
            Yearbook
          </h1>
          <p className="text-xl text-white/90">
            Create your account and start capturing memories
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
              Create Account
            </h2>
            <p className="text-muted">
              Sign up to access your yearbook portal
            </p>
          </div>

          <form onSubmit={handleSignUp} className="space-y-5" data-testid="signup-form">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="h-11"
                data-testid="fullname-input"
              />
            </div>

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
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-11"
                data-testid="password-input"
              />
              <p className="text-xs text-muted">At least 6 characters</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="h-11"
                data-testid="confirm-password-input"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-primary hover:bg-primary/90 text-white font-semibold"
              data-testid="signup-button"
            >
              {loading ? "Creating Account..." : "Create Account"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-muted">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-primary font-semibold hover:underline"
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
