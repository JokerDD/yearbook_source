import React, { useState, useCallback } from "react";
import axios from "axios";
import { toast } from "sonner";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Upload, X, Image as ImageIcon } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function PhotoSection({ profileData, onUpdate }) {
  const [uploading, setUploading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const token = localStorage.getItem("token");

  const photoSlots = profileData?.college?.photo_slots || 4;
  const uploadedPhotos = profileData?.user?.photos || [];

  const onDrop = useCallback(
    async (acceptedFiles) => {
      if (!acceptedFiles.length || selectedSlot === null) return;

      const file = acceptedFiles[0];
      setUploading(true);

      try {
        const formData = new FormData();
        formData.append("file", file);

        const response = await axios.post(
          `${API}/photos/upload?slot_index=${selectedSlot}`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data",
            },
          }
        );

        toast.success("Photo uploaded successfully!");
        setSelectedSlot(null);
        onUpdate();
      } catch (error) {
        toast.error(error.response?.data?.detail || "Failed to upload photo");
      } finally {
        setUploading(false);
      }
    },
    [selectedSlot, token, onUpdate]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".webp"],
    },
    maxFiles: 1,
    disabled: selectedSlot === null || uploading,
  });

  const getPhotoForSlot = (slotIndex) => {
    return uploadedPhotos.find((p) => p.slot_index === slotIndex);
  };

  return (
    <div>
      <h3 className="text-2xl font-jakarta font-bold text-primary mb-2">
        Photo Upload
      </h3>
      <p className="text-muted mb-6">
        Upload {photoSlots} photos for your yearbook profile. Click on a slot to
        upload.
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {Array.from({ length: photoSlots }).map((_, index) => {
          const photo = getPhotoForSlot(index);
          const isSelected = selectedSlot === index;

          return (
            <div
              key={index}
              className={`relative aspect-square border-2 rounded-xl overflow-hidden cursor-pointer transition-all ${
                isSelected
                  ? "border-accent shadow-lg"
                  : photo
                  ? "border-success hover:border-success/50"
                  : "border-dashed border-border hover:border-accent/50"
              }`}
              onClick={() => setSelectedSlot(index)}
              data-testid={`photo-slot-${index}`}
            >
              {photo ? (
                <>
                  <img
                    src={photo.file_url}
                    alt={`Slot ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                    <p className="text-white text-sm font-medium">
                      Click to replace
                    </p>
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-secondary/30">
                  <ImageIcon
                    className={`w-8 h-8 mb-2 ${
                      isSelected ? "text-accent" : "text-muted"
                    }`}
                  />
                  <p
                    className={`text-xs text-center ${
                      isSelected ? "text-accent font-medium" : "text-muted"
                    }`}
                  >
                    {isSelected ? "Ready to upload" : `Slot ${index + 1}`}
                  </p>
                </div>
              )}
              {isSelected && (
                <div className="absolute top-2 right-2">
                  <div className="w-6 h-6 bg-accent rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">✓</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {selectedSlot !== null && (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${
            isDragActive
              ? "border-accent bg-accent/5"
              : "border-border hover:border-accent/50"
          }`}
          data-testid="dropzone"
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mb-4">
              <Upload className="w-8 h-8 text-accent" />
            </div>
            {uploading ? (
              <p className="text-lg text-primary font-medium">Uploading...</p>
            ) : isDragActive ? (
              <p className="text-lg text-accent font-medium">
                Drop the photo here
              </p>
            ) : (
              <>
                <p className="text-lg text-primary font-medium mb-2">
                  Upload photo for Slot {selectedSlot + 1}
                </p>
                <p className="text-muted">
                  Drag & drop an image here, or click to select
                </p>
                <p className="text-sm text-muted mt-2">
                  Supports: JPG, PNG, WebP
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {selectedSlot === null && (
        <div className="border-2 border-dashed border-border rounded-xl p-12 text-center">
          <ImageIcon className="w-12 h-12 text-muted mx-auto mb-4" />
          <p className="text-muted">Select a photo slot above to start uploading</p>
        </div>
      )}
    </div>
  );
}
