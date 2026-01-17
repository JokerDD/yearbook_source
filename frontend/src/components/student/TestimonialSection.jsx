import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Send, Heart, MessageCircle, Users } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function TestimonialSection() {
  const token = localStorage.getItem("token");
  const [collegeStudents, setCollegeStudents] = useState([]);
  const [receivedTestimonials, setReceivedTestimonials] = useState([]);
  const [writtenTestimonials, setWrittenTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [testimonialText, setTestimonialText] = useState("");
  const [wordCount, setWordCount] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const STUDENTS_PER_PAGE = 10;

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = async () => {
    try {
      const [studentsRes, receivedRes, writtenRes] = await Promise.all([
        axios.get(`${API}/college/students`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API}/testimonials/received`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API}/testimonials/written`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setCollegeStudents(studentsRes.data || []);
      setReceivedTestimonials(receivedRes.data || []);
      setWrittenTestimonials(writtenRes.data || []);

      // If there's a written testimonial for the first student, pre-select it
      if (studentsRes.data && studentsRes.data.length > 0) {
        const firstStudent = studentsRes.data[0];
        const existingTestimonial = (writtenRes.data || []).find(
          (t) => t.to_student_id === firstStudent.id
        );
        if (existingTestimonial) {
          setSelectedStudent(firstStudent);
          setTestimonialText(existingTestimonial.text);
          setWordCount(existingTestimonial.word_count || 0);
        }
      }
    } catch (error) {
      toast.error("Failed to load testimonial data");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleTextChange = (e) => {
    const text = e.target.value;
    setTestimonialText(text);
    const words = text.trim().split(/\s+/).filter((w) => w.length > 0);
    setWordCount(words.length);
  };

  const handleSelectStudent = (student) => {
    // Check if there's already a testimonial for this student
    const existingTestimonial = writtenTestimonials.find(
      (t) => t.to_student_id === student.id
    );

    setSelectedStudent(student);
    if (existingTestimonial) {
      setTestimonialText(existingTestimonial.text);
      setWordCount(existingTestimonial.word_count || 0);
    } else {
      setTestimonialText("");
      setWordCount(0);
    }
  };

  const handleSubmitTestimonial = async () => {
    if (!selectedStudent) {
      toast.error("Please select a student");
      return;
    }

    if (!testimonialText.trim()) {
      toast.error("Please write a testimonial");
      return;
    }

    if (wordCount > 30) {
      toast.error("Testimonial exceeds 30 words limit");
      return;
    }

    setSubmitting(true);
    try {
      const response = await axios.post(
        `${API}/testimonials`,
        {
          to_student_id: selectedStudent.id,
          text: testimonialText,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.success(response.data.message);
      setTestimonialText("");
      setWordCount(0);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to submit testimonial");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredStudents = collegeStudents.filter((student) =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination logic
  const totalPages = Math.ceil(filteredStudents.length / STUDENTS_PER_PAGE);
  const startIndex = (currentPage - 1) * STUDENTS_PER_PAGE;
  const endIndex = startIndex + STUDENTS_PER_PAGE;
  const paginatedStudents = filteredStudents.slice(startIndex, endIndex);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading testimonials...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Received Testimonials */}
      <Card className="shadow-md border-l-4 border-l-pink-500">
        <CardHeader className="bg-gradient-to-r from-pink-50 to-rose-50">
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-pink-600" />
            Testimonials for You
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {receivedTestimonials.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MessageCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>No testimonials yet. Encourage classmates to write one!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {receivedTestimonials.map((testimonial, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-gradient-to-br from-pink-50 to-rose-50 rounded-lg border border-pink-200"
                >
                  <div className="flex justify-between items-start mb-2">
                    <p className="font-semibold text-pink-900">
                      {testimonial.from_student_name}
                    </p>
                    <Badge variant="outline" className="text-xs">
                      {testimonial.word_count || 0} words
                    </Badge>
                  </div>
                  <p className="text-gray-800 leading-relaxed italic">
                    "{testimonial.text}"
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    {new Date(testimonial.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Write Testimonial */}
      <Card className="shadow-md border-l-4 border-l-blue-500">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-blue-600" />
              Write a Testimonial
            </CardTitle>
            <Badge variant="secondary" className="text-sm">
              {writtenTestimonials.length} Written
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          {/* Student Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Select a Classmate ({filteredStudents.length} found)
            </label>
            <Input
              placeholder="Search by name..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1); // Reset to first page on search
              }}
              className="mb-3"
            />
            
            {/* Student Grid - Paginated */}
            {filteredStudents.length === 0 ? (
              <p className="text-gray-500 text-sm col-span-full text-center py-4">
                {collegeStudents.length === 0 ? "No classmates available" : "No results found"}
              </p>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2 min-h-32">
                  {paginatedStudents.map((student) => {
                    const hasTestimonial = writtenTestimonials.some(
                      (t) => t.to_student_id === student.id
                    );
                    const isSelected = selectedStudent?.id === student.id;

                    return (
                      <button
                        key={student.id}
                        onClick={() => handleSelectStudent(student)}
                        className={`p-3 rounded-lg text-sm font-medium transition h-full ${
                          isSelected
                            ? "bg-blue-600 text-white border-2 border-blue-700"
                            : hasTestimonial
                            ? "bg-green-100 text-green-900 border border-green-300 hover:bg-green-200"
                            : "bg-gray-100 text-gray-900 border border-gray-300 hover:bg-gray-200"
                        }`}
                      >
                        <div className="truncate">{student.name}</div>
                        {hasTestimonial && !isSelected && (
                          <div className="text-xs opacity-75">✓ Written</div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4 p-3 bg-gray-50 rounded-lg">
                    <Button
                      variant="outline"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="text-sm"
                    >
                      ← Previous
                    </Button>
                    <span className="text-sm font-medium text-gray-700">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="text-sm"
                    >
                      Next →
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>

          {selectedStudent && (
            <>
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-gray-700">
                  Writing testimonial for: <span className="font-semibold text-blue-900">{selectedStudent.name}</span>
                </p>
              </div>

              {/* Testimonial Text Area */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Your Testimonial (Max 30 words)
                </label>
                <Textarea
                  placeholder="Share your thoughts about this classmate... (keep it positive and within 30 words)"
                  value={testimonialText}
                  onChange={handleTextChange}
                  rows={4}
                  className="resize-none"
                />
                <div className="flex justify-between items-center mt-2">
                  <p className={`text-sm font-medium ${wordCount > 30 ? "text-red-600" : wordCount > 25 ? "text-orange-600" : "text-gray-600"}`}>
                    {wordCount} / 30 words
                  </p>
                  {wordCount > 30 && (
                    <p className="text-xs text-red-600">Exceeds limit by {wordCount - 30} words</p>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <Button
                onClick={handleSubmitTestimonial}
                disabled={submitting || wordCount === 0 || wordCount > 30}
                className="w-full bg-blue-600 hover:bg-blue-700 gap-2"
              >
                <Send className="h-4 w-4" />
                {submitting ? "Submitting..." : "Submit Testimonial"}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* College Students Info */}
      {collegeStudents.length === 0 && (
        <Card className="shadow-md">
          <CardContent className="pt-6 text-center">
            <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-600">
              No other students in your college yet. Testimonials will appear once classmates join.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
