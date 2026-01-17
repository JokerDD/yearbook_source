import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
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
import { Upload, Download, Users, Copy, Eye } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function StudentManagement({ onUpdate }) {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [colleges, setColleges] = useState([]);
  const [selectedCollege, setSelectedCollege] = useState("");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [uploadData, setUploadData] = useState({
    college_id: "",
    csvText: "",
    fileType: "csv", // csv or xlsx
  });
  const [createdStudents, setCreatedStudents] = useState([]);
  const [showCredentials, setShowCredentials] = useState(false);
  
  // Filter states
  const [filters, setFilters] = useState({
    name: "",
    email: "",
    college: "",
    completion: "",
  });
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
      let students = [];

      if (uploadData.fileType === "csv") {
        // Parse CSV format
        const lines = uploadData.csvText.split("\n").filter((line) => line.trim());
        for (let i = 0; i < lines.length; i++) {
          const parts = lines[i].split(",").map((p) => p.trim());
          if (parts.length >= 2 && parts[0] && parts[1]) {
            students.push({
              name: parts[0],
              email: parts[1],
              phone: parts[2] || "", // Optional phone
            });
          }
        }
      } else if (uploadData.fileType === "xlsx") {
        // Parse XLSX file
        if (!uploadData.xlsxFile) {
          toast.error("Please select an Excel file");
          return;
        }
        try {
          const XLSX = await import("xlsx");
          const arrayBuffer = await uploadData.xlsxFile.arrayBuffer();
          const workbook = XLSX.read(arrayBuffer, { type: "array" });
          
          console.log("=== EXCEL DEBUG INFO ===");
          console.log("Sheet names:", workbook.SheetNames);
          
          if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
            toast.error("Excel file appears to be empty");
            return;
          }

          const sheetName = workbook.SheetNames[0];
          console.log("Using sheet:", sheetName);
          
          const worksheet = workbook.Sheets[sheetName];
          console.log("Worksheet object keys:", Object.keys(worksheet));
          console.log("Worksheet ref (range):", worksheet["!ref"]);
          
          // Get raw cell data to debug
          console.log("=== RAW WORKSHEET CELLS ===");
          Object.keys(worksheet).forEach(cellRef => {
            if (cellRef !== "!ref" && cellRef !== "!margins") {
              console.log(`Cell ${cellRef}:`, worksheet[cellRef]);
            }
          });
          
          const data = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
          
          console.log("=== SHEET TO JSON RESULT ===");
          console.log("Total rows in Excel:", data.length);
          console.log("Raw Excel data:", JSON.stringify(data, null, 2));
          console.table(data);
          
          if (data.length > 0) {
            const firstRowKeys = Object.keys(data[0]);
            console.log("=== FIRST ROW ANALYSIS ===");
            console.log("First row keys:", firstRowKeys);
            console.log("First row keys (stringified):", JSON.stringify(firstRowKeys));
            console.log("Number of keys:", firstRowKeys.length);
            console.log("First row values:", data[0]);
            console.log("First row values (stringified):", JSON.stringify(data[0], null, 2));
            
            // Log each key and its value with character codes
            console.log("=== KEY-VALUE PAIRS ===");
            firstRowKeys.forEach(key => {
              const value = data[0][key];
              const trimmedKey = key.trim();
              const lowerKey = trimmedKey.toLowerCase();
              console.log(`Key: "${key}" (trimmed: "${trimmedKey}", lower: "${lowerKey}") => Value: "${value}"`);
            });
          } else {
            console.error("❌ sheet_to_json returned empty array!");
          }

          // Validate and parse data with flexible column matching
          const firstRowKeys = Object.keys(data[0] || {});
          console.log("=== COLUMN TYPE DETECTION ===");
          
          // Detect which columns are Name, Email, Phone by examining the keys (headers)
          let nameColIndex = null;
          let emailColIndex = null;
          let phoneColIndex = null;
          
          firstRowKeys.forEach((key, idx) => {
            const lowerKey = key.toLowerCase().trim();
            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            const phonePattern = /^\d{10}$|^\d{3}-\d{3}-\d{4}$|^\+\d{1,3}\d{7,14}$/;
            
            console.log(`Column ${idx}: "${key}"`);
            
            if (emailPattern.test(key)) {
              console.log(`  → Detected as EMAIL column (matches email format)`);
              emailColIndex = idx;
            } else if (phonePattern.test(key)) {
              console.log(`  → Detected as PHONE column (matches phone format)`);
              phoneColIndex = idx;
            } else if (lowerKey === "name" || lowerKey === "student" || lowerKey === "student name" || lowerKey === "full name") {
              console.log(`  → Detected as NAME column (exact match)`);
              nameColIndex = idx;
            } else {
              // If not email or phone, assume it's NAME
              console.log(`  → Detected as NAME column (by elimination)`);
              if (nameColIndex === null) {
                nameColIndex = idx;
              }
            }
          });
          
          console.log(`=== COLUMN MAPPING ===`);
          console.log(`Name column index: ${nameColIndex} (${firstRowKeys[nameColIndex]})`);
          console.log(`Email column index: ${emailColIndex} (${firstRowKeys[emailColIndex]})`);
          console.log(`Phone column index: ${phoneColIndex} (${firstRowKeys[phoneColIndex]})`);
          
          // Now parse all data rows
          for (let rowIdx = 0; rowIdx < data.length; rowIdx++) {
            const row = data[rowIdx];
            
            let name = "";
            let email = "";
            let phone = "";
            
            if (nameColIndex !== null) {
              name = String(row[firstRowKeys[nameColIndex]] || "").trim();
            }
            if (emailColIndex !== null) {
              email = String(row[firstRowKeys[emailColIndex]] || "").trim();
            }
            if (phoneColIndex !== null) {
              phone = String(row[firstRowKeys[phoneColIndex]] || "").trim();
            }
            
            console.log(`Row ${rowIdx} parsed: name="${name}", email="${email}", phone="${phone}"`);

            if (!name || !email) {
              console.warn(`Row ${rowIdx} SKIPPED - missing name or email`);
              continue;
            }

            students.push({
              name,
              email,
              phone,
            });
            console.log(`Row ${rowIdx} ✓ ADDED to students list`);
          }
          
          console.log("=== END EXCEL DEBUG ===");
          console.log("Final students array:", students);
        } catch (parseError) {
          console.error("Excel parsing error:", parseError);
          toast.error(`Excel parsing error: ${parseError.message}`);
          return;
        }
      }

      if (students.length === 0) {
        console.error("❌ NO VALID STUDENTS FOUND");
        console.error("Students array is empty after parsing");
        console.error("Please check your Excel file format");
        toast.error("No valid students found. Check the format and try again.");
        return;
      }

      console.log("=== SENDING TO BACKEND ===");
      console.log("College ID:", uploadData.college_id);
      console.log("Students count:", students.length);
      console.log("Students data being sent:", JSON.stringify(students, null, 2));

      const payload = {
        college_id: uploadData.college_id,
        students: students,
      };
      console.log("Full payload:", JSON.stringify(payload, null, 2));

      const response = await axios.post(
        `${API}/students/bulk-upload`,
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log("=== UPLOAD SUCCESS ===");
      console.log("Upload response:", response.data);
      setCreatedStudents(response.data.students);
      setShowCredentials(true);
      toast.success(`${response.data.created_count} students created!`);
      fetchData();
      onUpdate();
    } catch (error) {
      console.error("Upload error:", error);
      console.error("Error response:", error.response);
      const errorMsg = 
        error.response?.data?.detail || 
        error.response?.data?.message ||
        error.message ||
        "Failed to upload students";
      toast.error(errorMsg);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.name.endsWith(".xlsx")) {
        setUploadData({ ...uploadData, xlsxFile: file, fileType: "xlsx" });
        toast.success(`Excel file selected: ${file.name}`);
      } else {
        toast.error("Please select a valid Excel file (.xlsx)");
      }
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

  const filteredStudents = students.filter((student) => {
    const college = colleges.find((c) => c.id === student.college_id);
    
    // Apply all filters with AND logic - with null/undefined checks
    const matchesName = !filters.name || (student.name && student.name.toLowerCase().includes(filters.name.toLowerCase()));
    const matchesEmail = !filters.email || (student.email && student.email.toLowerCase().includes(filters.email.toLowerCase()));
    const matchesCollege = !filters.college || student.college_id === filters.college;
    const matchesCompletion =
      !filters.completion ||
      (filters.completion === "0-25" && student.profile_completion <= 25) ||
      (filters.completion === "26-50" && student.profile_completion > 25 && student.profile_completion <= 50) ||
      (filters.completion === "51-75" && student.profile_completion > 50 && student.profile_completion <= 75) ||
      (filters.completion === "76-100" && student.profile_completion > 75);
    
    return matchesName && matchesEmail && matchesCollege && matchesCompletion;
  });

  const handleFilterChange = (filterName, value) => {
    setFilters((prev) => ({
      ...prev,
      [filterName]: value,
    }));
  };

  const handleClearFilters = () => {
    setFilters({
      name: "",
      email: "",
      college: "",
      completion: "",
    });
  };

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
                  <Label>Upload Format</Label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={uploadData.fileType === "csv"}
                        onChange={() =>
                          setUploadData({ ...uploadData, fileType: "csv", xlsxFile: null })
                        }
                        className="w-4 h-4"
                      />
                      <span className="text-sm">CSV Format (Paste Text)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={uploadData.fileType === "xlsx"}
                        onChange={() =>
                          setUploadData({ ...uploadData, fileType: "xlsx", csvText: "" })
                        }
                        className="w-4 h-4"
                      />
                      <span className="text-sm">Excel File (.xlsx)</span>
                    </label>
                  </div>
                </div>

                {uploadData.fileType === "csv" ? (
                  <div className="space-y-2">
                    <Label htmlFor="csv">Student Data (CSV Format)</Label>
                    <p className="text-sm text-muted">
                      Format: Name, Email, Phone (optional)
                      <br />
                      One student per line
                    </p>
                    <textarea
                      id="csv"
                      className="w-full h-48 px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 font-mono text-sm"
                      placeholder="John Doe,john@college.edu,+1-555-0001&#10;Jane Smith,jane@college.edu,+1-555-0002&#10;Mike Johnson,mike@college.edu"
                      value={uploadData.csvText}
                      onChange={(e) =>
                        setUploadData({ ...uploadData, csvText: e.target.value })
                      }
                      required
                      data-testid="csv-input"
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="excel">Excel File (.xlsx)</Label>
                    <p className="text-sm text-muted mb-2">
                      Required columns: Name, Email
                      <br />
                      Optional columns: Phone
                    </p>
                    <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:bg-accent/5 cursor-pointer transition"
                      onClick={() => document.getElementById("excel-input")?.click()}
                    >
                      <Upload className="w-8 h-8 text-muted mx-auto mb-2" />
                      <p className="font-medium text-sm">
                        {uploadData.xlsxFile ? uploadData.xlsxFile.name : "Click to upload or drag and drop"}
                      </p>
                      <p className="text-xs text-muted">Excel files only (.xlsx)</p>
                      <input
                        id="excel-input"
                        type="file"
                        accept=".xlsx"
                        onChange={handleFileSelect}
                        className="hidden"
                        data-testid="excel-input"
                      />
                    </div>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={
                    !uploadData.college_id ||
                    (uploadData.fileType === "csv" ? !uploadData.csvText : !uploadData.xlsxFile)
                  }
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

      <div className="mb-6 space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-primary">Filters</h3>
          {(filters.name || filters.email || filters.college || filters.completion) && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearFilters}
              className="text-xs"
            >
              Clear All Filters
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Name Filter */}
          <div>
            <Label className="text-sm font-medium mb-1 block">Filter by Name</Label>
            <Input
              placeholder="Search name..."
              value={filters.name}
              onChange={(e) => handleFilterChange("name", e.target.value)}
              className="w-full"
            />
          </div>

          {/* Email Filter */}
          <div>
            <Label className="text-sm font-medium mb-1 block">Filter by Email</Label>
            <Input
              placeholder="Search email..."
              value={filters.email}
              onChange={(e) => handleFilterChange("email", e.target.value)}
              className="w-full"
            />
          </div>

          {/* College Filter */}
          <div>
            <Label className="text-sm font-medium mb-1 block">Filter by College</Label>
            <Select value={filters.college || "all"} onValueChange={(value) => handleFilterChange("college", value === "all" ? "" : value)}>
              <SelectTrigger className="w-full">
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

          {/* Completion Filter */}
          <div>
            <Label className="text-sm font-medium mb-1 block">Filter by Completion</Label>
            <Select value={filters.completion || "all"} onValueChange={(value) => handleFilterChange("completion", value === "all" ? "" : value)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All Completion Levels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="0-25">0 - 25%</SelectItem>
                <SelectItem value="26-50">26 - 50%</SelectItem>
                <SelectItem value="51-75">51 - 75%</SelectItem>
                <SelectItem value="76-100">76 - 100%</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="text-sm text-muted">
          Showing {filteredStudents.length} of {students.length} students
        </div>
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
                      className="hover:bg-secondary/50 cursor-pointer transition"
                      onClick={() => navigate(`/admin/students/${student.id}`)}
                      data-testid={`student-row-${student.id}`}
                    >
                      <td className="px-6 py-4 text-sm text-primary font-medium">
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
                          <Eye className="w-4 h-4 text-muted" />
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
