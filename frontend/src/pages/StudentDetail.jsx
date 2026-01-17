import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, Edit2, Save, X, Heart, Trash2 } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function StudentDetail() {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  
  const [student, setStudent] = useState(null);
  const [college, setCollege] = useState(null);
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [editingTestimonialId, setEditingTestimonialId] = useState(null);
  const [editingTestimonialText, setEditingTestimonialText] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    fetchStudentDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId]);

  const fetchStudentDetail = async () => {
    try {
      const [studentRes, testimonialsRes] = await Promise.all([
        axios.get(`${API}/students/${studentId}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API}/students/${studentId}/testimonials`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      setStudent(studentRes.data.student);
      setCollege(studentRes.data.college);
      setTestimonials(testimonialsRes.data || []);
      setEditData({
        profile: studentRes.data.student.profile || {},
        yearbook_answers: studentRes.data.student.yearbook_answers || {},
      });
    } catch (error) {
      toast.error("Failed to load student details");
      navigate("/admin");
    } finally {
      setLoading(false);
    }
  };

  const handleEditChange = (section, field, value) => {
    setEditData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleSave = async () => {
    try {
      await axios.put(`${API}/students/${studentId}`, editData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Student updated successfully");
      setIsEditing(false);
      fetchStudentDetail();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to update student");
    }
  };

  const handleDeleteTestimonial = async (fromStudentId) => {
    if (!window.confirm("Are you sure you want to delete this testimonial?")) {
      return;
    }

    try {
      await axios.delete(
        `${API}/testimonials/${fromStudentId}/${studentId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      toast.success("Testimonial deleted successfully");
      fetchStudentDetail();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to delete testimonial");
    }
  };

  const handleEditTestimonial = (testimonial) => {
    setEditingTestimonialId(testimonial.from_student_id);
    setEditingTestimonialText(testimonial.text);
  };

  const handleSaveTestimonial = async (fromStudentId) => {
    const wordCount = editingTestimonialText.trim().split(/\s+/).filter(w => w.length > 0).length;
    
    if (wordCount > 30) {
      toast.error(`Testimonial exceeds 30 words limit (${wordCount} words)`);
      return;
    }

    if (wordCount < 1) {
      toast.error("Testimonial cannot be empty");
      return;
    }

    try {
      await axios.put(
        `${API}/testimonials/${fromStudentId}/${studentId}`,
        { text: editingTestimonialText },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      toast.success("Testimonial updated successfully");
      setEditingTestimonialId(null);
      setEditingTestimonialText("");
      fetchStudentDetail();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to update testimonial");
    }
  };

  const handleDeleteStudent = async () => {
    try {
      await axios.delete(`${API}/students/${studentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Student deleted successfully");
      setShowDeleteDialog(false);
      navigate("/admin");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to delete student");
      setShowDeleteDialog(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Student not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/admin")}
              className="hover:bg-gray-200"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{student.name}</h1>
              <p className="text-gray-600">{student.email}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
              className={isEditing ? "bg-green-600 hover:bg-green-700" : "bg-blue-600 hover:bg-blue-700"}
            >
              {isEditing ? (
                <>
                  <Save className="mr-2 h-4 w-4" /> Save
                </>
              ) : (
                <>
                  <Edit2 className="mr-2 h-4 w-4" /> Edit
                </>
              )}
            </Button>
            {isEditing && (
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditing(false);
                  setEditData({
                    profile: student.profile || {},
                    yearbook_answers: student.yearbook_answers || {},
                  });
                }}
              >
                <X className="mr-2 h-4 w-4" /> Cancel
              </Button>
            )}
            <Button
              variant="destructive"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </Button>
          </div>
        </div>

        {/* Basic Info */}
        <Card className="mb-6 shadow-md">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-semibold text-gray-700">User ID</Label>
                <p className="text-gray-900 mt-1 p-2 bg-gray-50 rounded">{student.id}</p>
              </div>
              <div>
                <Label className="text-sm font-semibold text-gray-700">Email</Label>
                <p className="text-gray-900 mt-1 p-2 bg-gray-50 rounded">{student.email}</p>
              </div>
              <div>
                <Label className="text-sm font-semibold text-gray-700">Name</Label>
                <p className="text-gray-900 mt-1 p-2 bg-gray-50 rounded">{student.name}</p>
              </div>
              <div>
                <Label className="text-sm font-semibold text-gray-700">College</Label>
                <p className="text-gray-900 mt-1 p-2 bg-gray-50 rounded">{college?.name || "N/A"}</p>
              </div>
              <div>
                <Label className="text-sm font-semibold text-gray-700">User Type</Label>
                <p className="text-gray-900 mt-1 p-2 bg-gray-50 rounded capitalize">{student.user_type}</p>
              </div>
              <div>
                <Label className="text-sm font-semibold text-gray-700">Profile Completion</Label>
                <div className="mt-1">
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-blue-600 h-2.5 rounded-full"
                      style={{ width: `${student.profile_completion || 0}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{student.profile_completion || 0}%</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Section */}
        <Card className="mb-6 shadow-md">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b">
            <CardTitle>Student Profile</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-semibold text-gray-700">Full Name</Label>
                {isEditing ? (
                  <Input
                    value={editData.profile?.full_name || ""}
                    onChange={(e) => handleEditChange("profile", "full_name", e.target.value)}
                    className="mt-1"
                  />
                ) : (
                  <p className="text-gray-900 mt-1 p-2 bg-gray-50 rounded">{student.profile?.full_name || "Not provided"}</p>
                )}
              </div>
              <div>
                <Label className="text-sm font-semibold text-gray-700">Phone</Label>
                {isEditing ? (
                  <Input
                    value={editData.profile?.phone || ""}
                    onChange={(e) => handleEditChange("profile", "phone", e.target.value)}
                    className="mt-1"
                  />
                ) : (
                  <p className="text-gray-900 mt-1 p-2 bg-gray-50 rounded">{student.profile?.phone || "Not provided"}</p>
                )}
              </div>
              <div>
                <Label className="text-sm font-semibold text-gray-700">Bio</Label>
                {isEditing ? (
                  <Textarea
                    value={editData.profile?.bio || ""}
                    onChange={(e) => handleEditChange("profile", "bio", e.target.value)}
                    className="mt-1"
                    rows={3}
                  />
                ) : (
                  <p className="text-gray-900 mt-1 p-2 bg-gray-50 rounded whitespace-pre-wrap">{student.profile?.bio || "Not provided"}</p>
                )}
              </div>
              <div>
                <Label className="text-sm font-semibold text-gray-700">Location</Label>
                {isEditing ? (
                  <Input
                    value={editData.profile?.location || ""}
                    onChange={(e) => handleEditChange("profile", "location", e.target.value)}
                    className="mt-1"
                  />
                ) : (
                  <p className="text-gray-900 mt-1 p-2 bg-gray-50 rounded">{student.profile?.location || "Not provided"}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Photos Section */}
        {student.photos && student.photos.length > 0 && (
          <Card className="mb-6 shadow-md">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
              <CardTitle>Photos</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {student.photos.map((photo, idx) => (
                  <div key={idx} className="text-center">
                    {photo.file_url.startsWith("data:") ? (
                      <img src={photo.file_url} alt={`Slot ${photo.slot_index}`} className="w-full h-40 object-cover rounded" />
                    ) : (
                      <a href={photo.file_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                        View Photo {photo.slot_index}
                      </a>
                    )}
                    <p className="text-sm text-gray-600 mt-2">Slot {photo.slot_index}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Yearbook Answers Section */}
        <Card className="shadow-md">
          <CardHeader className="bg-gradient-to-r from-yellow-50 to-orange-50 border-b">
            <CardTitle>Yearbook Answers</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {Object.keys(editData.yearbook_answers || {}).length > 0 ? (
              <div className="space-y-4">
                {Object.entries(editData.yearbook_answers).map(([key, value]) => (
                  <div key={key}>
                    <Label className="text-sm font-semibold text-gray-700">{key}</Label>
                    {isEditing ? (
                      <Textarea
                        value={value || ""}
                        onChange={(e) => handleEditChange("yearbook_answers", key, e.target.value)}
                        className="mt-1"
                        rows={2}
                      />
                    ) : (
                      <p className="text-gray-900 mt-1 p-2 bg-gray-50 rounded whitespace-pre-wrap">{value}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600">No yearbook answers provided yet</p>
            )}
          </CardContent>
        </Card>

        {/* Testimonials Section */}
        <Card className="shadow-md">
          <CardHeader className="bg-gradient-to-r from-pink-50 to-rose-50 border-b">
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-pink-600" />
              Testimonials Received ({testimonials.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {testimonials.length === 0 ? (
              <p className="text-gray-600 text-center py-8">No testimonials received yet</p>
            ) : (
              <div className="space-y-4">
                {testimonials.map((testimonial, idx) => (
                  <div
                    key={idx}
                    className="p-4 bg-gradient-to-br from-pink-50 to-rose-50 rounded-lg border border-pink-200"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <p className="font-semibold text-pink-900">
                          {testimonial.from_student_name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(testimonial.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {testimonial.word_count || 0} words
                        </Badge>
                        {editingTestimonialId !== testimonial.from_student_id && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditTestimonial(testimonial)}
                              className="h-8 w-8 p-0 hover:bg-blue-100"
                            >
                              <Edit2 className="h-4 w-4 text-blue-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteTestimonial(testimonial.from_student_id)}
                              className="h-8 w-8 p-0 hover:bg-red-100"
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                    
                    {editingTestimonialId === testimonial.from_student_id ? (
                      <div className="space-y-2">
                        <Textarea
                          value={editingTestimonialText}
                          onChange={(e) => setEditingTestimonialText(e.target.value)}
                          rows={3}
                          className="text-gray-800"
                        />
                        <div className="flex items-center justify-between">
                          <p className={`text-xs font-medium ${editingTestimonialText.trim().split(/\s+/).filter(w => w.length > 0).length > 30 ? "text-red-600" : "text-gray-600"}`}>
                            {editingTestimonialText.trim().split(/\s+/).filter(w => w.length > 0).length} / 30 words
                          </p>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleSaveTestimonial(testimonial.from_student_id)}
                              className="bg-green-600 hover:bg-green-700 h-8"
                            >
                              <Save className="h-4 w-4 mr-1" /> Save
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingTestimonialId(null)}
                              className="h-8"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-800 leading-relaxed italic">
                        "{testimonial.text}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Student</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete {student.name}? This action cannot be undone. All testimonials related to this student will also be deleted.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex gap-3">
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDeleteStudent}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}