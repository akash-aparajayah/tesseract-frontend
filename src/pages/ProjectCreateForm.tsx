import React, { useState, useRef, ChangeEvent, DragEvent, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createProject } from "../services/projectApi";
import { useToast } from "../hooks/useToast";
import "../styles/ProjectCreation.css";


// ============================================================
// IMAGE UPLOADER (file only, no URL)
// ============================================================
interface ImageUploaderProps {
  onImageSelect: (imageDataUrl: string) => void;
  onImageRemove: () => void;
  initialImage?: string;
  maxSizeMB?: number;
  acceptedFormats?: string[];
}

const ImageUploader: React.FC<ImageUploaderProps> = ({
  onImageSelect,
  onImageRemove,
  initialImage = "",
  maxSizeMB = 5,
  acceptedFormats = ["image/jpeg", "image/png", "image/webp", "image/gif"],
}) => {
  const [previewSrc, setPreviewSrc] = useState<string>(initialImage);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (previewSrc && previewSrc.startsWith("blob:")) {
        URL.revokeObjectURL(previewSrc);
      }
    };
  }, [previewSrc]);

  const validateFile = (file: File): boolean => {
    setError(null);
    if (!acceptedFormats.includes(file.type)) {
      setError(`Invalid format. Allowed: ${acceptedFormats.map(f => f.split("/")[1]).join(", ")}`);
      return false;
    }
    const maxBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxBytes) {
      setError(`File too large. Max size: ${maxSizeMB}MB`);
      return false;
    }
    return true;
  };

  const processFile = (file: File) => {
    if (!validateFile(file)) {
      setPreviewSrc("");
      onImageRemove();
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      setPreviewSrc(dataUrl);
      onImageSelect(dataUrl);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleRemove = () => {
    setPreviewSrc("");
    onImageRemove();
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="image-uploader">
      <div
        className={`drop-zone ${isDragging ? "dragging" : ""}`}
        onClick={() => fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedFormats.join(",")}
          onChange={handleFileSelect}
          style={{ display: "none" }}
        />
        {previewSrc ? (
          <img src={previewSrc} alt="Preview" className="preview-image" />
        ) : (
          <>
            <div className="upload-icon">🖼️</div>
            <p>Drag & drop or click to select</p>
            <small>Max {maxSizeMB}MB · {acceptedFormats.map(f => f.split("/")[1]).join(", ")}</small>
          </>
        )}
      </div>
      {previewSrc && (
        <button className="remove-image-btn" onClick={handleRemove}>
          ✕ Remove Image
        </button>
      )}
      {error && <div className="upload-error">{error}</div>}
    </div>
  );
};

// ============================================================
// MAIN PROJECT CREATE FORM
// ============================================================
export default function ProjectCreateForm() {
  const navigate = useNavigate();
  const { showToast, ToastContainer } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    project_name: "",
    project_description: "",
    image_url: "",
  });
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [touched, setTouched] = useState({ project_name: false, project_description: false });

  const handleImageSelect = (imageDataUrl: string) => {
    setFormData((prev) => ({ ...prev, image_url: imageDataUrl }));
  };
  const handleImageRemove = () => {
    setFormData((prev) => ({ ...prev, image_url: "" }));
  };
  const toggleImageUpload = () => setShowImageUpload((prev) => !prev);

  const handleBlur = (field: "project_name" | "project_description") => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const isFieldInvalid = (field: "project_name" | "project_description") => {
    return touched[field] && !formData[field].trim();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ project_name: true, project_description: true });
    if (!formData.project_name.trim() || !formData.project_description.trim()) {
      showToast("Project name and description are required", "error");
      return;
    }
    setIsSubmitting(true);

    const payload = {
      project_name: formData.project_name.trim(),
      project_description: formData.project_description.trim(),
      image_url: formData.image_url || null,
      isActive: true,
    };

    try {
      const res = await createProject(payload);
      console.log("Full API Response:", res);
      console.log("res.data:", res?.data);
      console.log("res.data.data:", res?.data?.data);

      // Try different possible paths for the project ID
      const projectId = res?.data?.data?.project?.id ||
        res?.data?.data?.id ||
        res?.data?.data?.project_id ||
        res?.data?.project?.id ||
        res?.data?.id;

      console.log("Extracted projectId:", projectId);

      if (res?.data?.success && projectId) {
        console.log("Project created with ID:", projectId);

        // Create new project object
        const newProject = {
          id: projectId,
          name: formData.project_name.trim(),
          description: formData.project_description.trim(),
          status: "active" as const,
          created: new Date().toISOString().split('T')[0],
          services: [],
          logo: formData.image_url || "",
          sms_config: {},
          email_config: {},
          whatsapp_config: {}
        };

        // Save to localStorage
        const existingProjects = JSON.parse(localStorage.getItem('allProjects') || '[]');
        const updatedProjects = [newProject, ...existingProjects];
        localStorage.setItem('allProjects', JSON.stringify(updatedProjects));

        // Dispatch event
        window.dispatchEvent(new CustomEvent('projectUpdated', {
          detail: newProject
        }));

        showToast("Project created successfully!", "success");

        // Navigate to the project view page
        const navigatePath = `/dashboard/project/${projectId}/view`;
        console.log("Navigating to:", navigatePath);

        setTimeout(() => {
          navigate(navigatePath);
        }, 500);
      } else {
        console.error("Project creation failed or no ID:", {
          success: res?.data?.success,
          projectId: projectId,
          fullData: res?.data
        });
        showToast("Project created but could not retrieve ID", "error");
      }
    } catch (error: unknown) {
      console.error("API Error:", error);
      showToast(error instanceof Error ? error.message : "Error creating project", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="create-project-container">
        <h1 className="page-main-title">Create Project</h1>
        <div className="full-page-bg">

          <div className="form-card">
            <h3 className="form-header">Create Project</h3>
            <div className="form-header">
              <p>Fill in the details below</p>
              <div className="header-underline"></div>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Project Name <span className="required-star">*</span></label>
                <input
                  type="text"
                  placeholder="e.g., Marketing Website Redesign"
                  value={formData.project_name}
                  onChange={(e) => setFormData({ ...formData, project_name: e.target.value })}
                  onBlur={() => handleBlur("project_name")}
                  className={isFieldInvalid("project_name") ? "input-error" : ""}
                />
                {isFieldInvalid("project_name") && <span className="error-msg">Project name is required</span>}
              </div>

              <div className="form-group">
                <label>Description <span className="required-star">*</span></label>
                <textarea
                  placeholder="Tell us about your project..."
                  rows={3}
                  value={formData.project_description}
                  onChange={(e) => setFormData({ ...formData, project_description: e.target.value })}
                  onBlur={() => handleBlur("project_description")}
                  className={isFieldInvalid("project_description") ? "input-error" : ""}
                />
                {isFieldInvalid("project_description") && <span className="error-msg">Description is required</span>}
              </div>

              <div className="image-toggle">
                <button type="button" onClick={toggleImageUpload} className="toggle-btn">
                  {showImageUpload ? "✕ Hide Project Image" : "+ Add Project Image (Optional)"}
                </button>
              </div>

              {showImageUpload && (
                <div className="image-upload-wrapper">
                  <ImageUploader
                    onImageSelect={handleImageSelect}
                    onImageRemove={handleImageRemove}
                    maxSizeMB={3}
                  />
                </div>
              )}

              <div className="form-actions">
                <button type="button" className="btn-cancel" onClick={() => navigate("/dashboard/project")}>
                  Cancel
                </button>
                <button type="submit" className="btn-submit" disabled={isSubmitting}>
                  {isSubmitting ? "Creating..." : "Create Project"}
                </button>
              </div>
            </form>
            <ToastContainer />
          </div>
        </div>
      </div>
    </>
  );
}