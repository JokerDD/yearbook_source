import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Upload, Download, Users, Copy } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function StudentManagement({ onUpdate }) {
  const [students, setStudents] = useState([]);
  const [colleges, setColleges] = useState([]);
  const [selectedCollege, setSelectedCollege] = useState("");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [uploadData, setUploadData] = useState({
    college_id: "",
    csvText: "",
  });
  const [createdStudents, setCreatedStudents] = useState([]);
  const [showCredentials, setShowCredentials] = useState(false);
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [collegesRes, studentsRes] = await Promise.all([
        axios.get(`${API}/colleges`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API}/students`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      setColleges(collegesRes.data);
      setStudents(studentsRes.data);
    } catch (error) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleBulkUpload = async (e) => {
    e.preventDefault();
    try {
      const lines = uploadData.csvText.split("\n").filter((line) => line.trim());
      const students = [];

      for (let i = 0; i < lines.length; i++) {
        const parts = lines[i].split(",").map((p) => p.trim());
        if (parts.length >= 2) {
          students.push({
            name: parts[0],
            email: parts[1],
          });
        }
      }

      const response = await axios.post(
        `${API}/students/bulk-upload`,
        {
          college_id: uploadData.college_id,
          students: students,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setCreatedStudents(response.data.students);
      setShowCredentials(true);
      toast.success(`${response.data.created_count} students created!`);
      fetchData();
      onUpdate();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to upload students");
    }
  };

  const copyCredentials = () => {
    const text = createdStudents
      .map((s) => `${s.name},${s.email},${s.password}`)
      .join("\n");
    navigator.clipboard.writeText(text);
    toast.success("Credentials copied to clipboard!");
  };

  const downloadCSV = () => {
    const csvContent =
      "Name,Email,Password\n" +
      createdStudents.map((s) => `${s.name},${s.email},${s.password}`).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "student_credentials.csv";
    a.click();
  };

  const filteredStudents = selectedCollege
    ? students.filter((s) => s.college_id === selectedCollege)
    : students;

  if (loading) {
    return <div className="text-center py-8 text-muted">Loading...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-jakarta font-bold text-primary">
            Student Management
          </h2>
          <p className="text-muted mt-1">
            Upload students and manage their profiles
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" data-testid="upload-students-button">
              <Upload className="w-4 h-4" />
              Upload Students
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="font-jakarta text-2xl">
                Bulk Upload Students
              </DialogTitle>
            </DialogHeader>

            {!showCredentials ? (
              <form onSubmit={handleBulkUpload} className="space-y-6 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="college">Select College</Label>
                  <Select
                    value={uploadData.college_id}
                    onValueChange={(value) =>
                      setUploadData({ ...uploadData, college_id: value })
                    }
                  >
                    <SelectTrigger data-testid="college-select">
                      <SelectValue placeholder="Choose a college" />
                    </SelectTrigger>
                    <SelectContent>
                      {colleges.map((college) => (
                        <SelectItem key={college.id} value={college.id}>
                          {college.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="csv">Student Data (CSV Format)</Label>
                  <p className="text-sm text-muted">
                    Enter student data in format: Name, Email (one per line)
                  </p>
                  <textarea
                    id="csv"
                    className="w-full h-48 px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 font-mono text-sm"
                    placeholder="John Doe, john.doe@college.edu\nJane Smith, jane.smith@college.edu\nMike Johnson, mike.j@college.edu"
                    value={uploadData.csvText}
                    onChange={(e) =>
                      setUploadData({ ...uploadData, csvText: e.target.value })
                    }
                    required
                    data-testid="csv-input"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={!uploadData.college_id}
                  data-testid="submit-upload-button"
                >
                  Upload Students
                </Button>
              </form>
            ) : (
              <div className="space-y-4 mt-4">
                <div className="bg-success/10 border border-success/20 rounded-lg p-4">
                  <p className="text-success font-medium mb-2">
                    ✓ {createdStudents.length} students created successfully!
                  </p>
                  <p className="text-sm text-muted">
                    Save these credentials and share them with students.
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={copyCredentials}
                    variant="outline"
                    className="flex-1 gap-2"
                    data-testid="copy-credentials-button"
                  >
                    <Copy className="w-4 h-4" />
                    Copy Credentials
                  </Button>
                  <Button
                    onClick={downloadCSV}
                    variant="outline"
                    className="flex-1 gap-2"
                    data-testid="download-csv-button"
                  >
                    <Download className="w-4 h-4" />
                    Download CSV
                  </Button>
                </div>

                <div className="border border-border rounded-lg overflow-hidden">
                  <div className="bg-secondary px-4 py-2 font-mono text-xs font-medium text-muted">
                    Name | Email | Password
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {createdStudents.map((student, idx) => (
                      <div
                        key={idx}
                        className="px-4 py-3 border-t border-border font-mono text-sm hover:bg-secondary/50"
                      >
                        <div className="grid grid-cols-3 gap-2">
                          <span className="truncate">{student.name}</span>
                          <span className="truncate">{student.email}</span>
                          <span className="font-medium text-accent">
                            {student.password}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={() => {
                    setShowCredentials(false);
                    setCreatedStudents([]);
                    setDialogOpen(false);
                    setUploadData({ college_id: "", csvText: "" });
                  }}
                  className="w-full"
                  data-testid="close-credentials-button"
                >
                  Done
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <div className="mb-6">
        <Label>Filter by College</Label>
        <Select value={selectedCollege} onValueChange={setSelectedCollege}>
          <SelectTrigger className="w-full md:w-64 mt-2" data-testid="filter-college-select">
            <SelectValue placeholder="All Colleges" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Colleges</SelectItem>
            {colleges.map((college) => (
              <SelectItem key={college.id} value={college.id}>
                {college.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filteredStudents.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-border rounded-xl">
          <Users className="w-12 h-12 text-muted mx-auto mb-4" />
          <p className="text-lg text-muted">
            No students yet. Upload students to get started!
          </p>
        </div>
      ) : (
        <div className="border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium text-primary">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-primary">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-primary">
                    College
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-primary">
                    Completion
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredStudents.map((student) => {
                  const college = colleges.find(
                    (c) => c.id === student.college_id
                  );
                  return (
                    <tr
                      key={student.id}
                      className="hover:bg-secondary/50"
                      data-testid={`student-row-${student.id}`}
                    >
                      <td className="px-6 py-4 text-sm text-primary">
                        {student.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-muted">
                        {student.email}
                      </td>
                      <td className="px-6 py-4 text-sm text-muted">
                        {college?.name || "Unknown"}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 bg-secondary rounded-full h-2 w-24">
                            <div
                              className="h-full bg-accent rounded-full transition-all"
                              style={{
                                width: `${student.profile_completion || 0}%`,
                              }}
                            />
                          </div>
                          <span className="text-sm font-medium text-accent">
                            {student.profile_completion || 0}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
