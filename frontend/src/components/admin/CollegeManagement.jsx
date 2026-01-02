import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, GraduationCap } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function CollegeManagement({ onUpdate }) {
  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    yearbook_questions: "",
    photo_slots: 4,
  });
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchColleges();
  }, []);

  const fetchColleges = async () => {
    try {
      const response = await axios.get(`${API}/colleges`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setColleges(response.data);
    } catch (error) {
      toast.error("Failed to load colleges");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const questions = formData.yearbook_questions
        .split("\n")
        .filter((q) => q.trim());

      await axios.post(
        `${API}/colleges`,
        {
          name: formData.name,
          yearbook_questions: questions,
          photo_slots: parseInt(formData.photo_slots),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.success("College created successfully!");
      setDialogOpen(false);
      setFormData({ name: "", yearbook_questions: "", photo_slots: 4 });
      fetchColleges();
      onUpdate();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to create college");
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-muted">Loading...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-jakarta font-bold text-primary">
            College Management
          </h2>
          <p className="text-muted mt-1">
            Create and manage college configurations
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" data-testid="create-college-button">
              <Plus className="w-4 h-4" />
              Create College
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="font-jakarta text-2xl">
                Create New College
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-6 mt-4">
              <div className="space-y-2">
                <Label htmlFor="name">College Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., IIM Bangalore"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                  data-testid="college-name-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="questions">Yearbook Questions</Label>
                <Textarea
                  id="questions"
                  placeholder="Enter one question per line:\nMost likely to be found at\nMost caught doing\nOne thing this college taught me"
                  value={formData.yearbook_questions}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      yearbook_questions: e.target.value,
                    })
                  }
                  rows={6}
                  required
                  data-testid="yearbook-questions-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="photo_slots">Number of Photo Slots</Label>
                <Input
                  id="photo_slots"
                  type="number"
                  min="1"
                  max="10"
                  value={formData.photo_slots}
                  onChange={(e) =>
                    setFormData({ ...formData, photo_slots: e.target.value })
                  }
                  required
                  data-testid="photo-slots-input"
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                data-testid="submit-college-button"
              >
                Create College
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {colleges.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-border rounded-xl">
          <GraduationCap className="w-12 h-12 text-muted mx-auto mb-4" />
          <p className="text-lg text-muted">
            No colleges yet. Create one to get started!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {colleges.map((college) => (
            <div
              key={college.id}
              className="border border-border rounded-xl p-6 hover:border-accent/50 transition-colors"
              data-testid={`college-card-${college.id}`}
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <GraduationCap className="w-6 h-6 text-accent" />
                </div>
                <div className="flex-1">
                  <h3 className="font-jakarta font-bold text-lg text-primary mb-2">
                    {college.name}
                  </h3>
                  <div className="space-y-2 text-sm text-muted">
                    <p>
                      <strong>{college.yearbook_questions.length}</strong>{" "}
                      Yearbook Questions
                    </p>
                    <p>
                      <strong>{college.photo_slots}</strong> Photo Slots
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
