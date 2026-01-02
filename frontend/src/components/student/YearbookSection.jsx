import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Save } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function YearbookSection({ profileData, onUpdate }) {
  const [answers, setAnswers] = useState({});
  const [saving, setSaving] = useState(false);
  const token = localStorage.getItem("token");

  const questions = profileData?.college?.yearbook_questions || [];

  useEffect(() => {
    if (profileData?.user?.yearbook_answers) {
      setAnswers(profileData.user.yearbook_answers);
    }
  }, [profileData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      await axios.put(
        `${API}/yearbook-answers`,
        { answers },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.success("Yearbook answers saved successfully!");
      onUpdate();
    } catch (error) {
      toast.error(
        error.response?.data?.detail || "Failed to save yearbook answers"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h3 className="text-2xl font-jakarta font-bold text-primary mb-2">
        Yearbook Questions
      </h3>
      <p className="text-muted mb-6">
        Share your memories and thoughts for the yearbook
      </p>

      {questions.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-border rounded-xl">
          <p className="text-muted">
            No yearbook questions configured for your college yet.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {questions.map((question, index) => (
            <div key={index} className="space-y-2">
              <Label htmlFor={`q-${index}`}>
                {index + 1}. {question}
              </Label>
              <Textarea
                id={`q-${index}`}
                placeholder="Your answer..."
                value={answers[index] || ""}
                onChange={(e) =>
                  setAnswers({ ...answers, [index]: e.target.value })
                }
                rows={3}
                data-testid={`yearbook-answer-${index}`}
              />
            </div>
          ))}

          <Button
            type="submit"
            className="gap-2"
            disabled={saving}
            data-testid="save-yearbook-button"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving..." : "Save Answers"}
          </Button>
        </form>
      )}
    </div>
  );
}
