import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from "../hooks/useToast";
import "../styles/ProjectCreation.css";

export default function ProjectBasicEdit() {
    const navigate = useNavigate();
    const location = useLocation();
    const { showToast, ToastContainer } = useToast();
    const project = location.state?.project;
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState({
        project_name: "",
        project_description: "",
        status: "active",
        logo: "" as string,
    });

    const [imagePreview, setImagePreview] = useState<string>("");
    const [showImageUpload, setShowImageUpload] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [touched, setTouched] = useState({ project_name: false, project_description: false });

    useEffect(() => {
        if (!project) {
            showToast("Project data not found. Redirecting...", "error");
            setTimeout(() => navigate("/dashboard/project"), 1500);
            return;
        }
        setFormData({
            project_name: project.name || "",
            project_description: project.description || "",
            status: project.status || "active",
            logo: project.logo || "",
        });
        setImagePreview(project.logo || "");
        if (project.logo) setShowImageUpload(true);
    }, [project, navigate, showToast]);

    const toggleImageUpload = () => setShowImageUpload((prev) => !prev);

    const handleBlur = (field: "project_name" | "project_description") => {
        setTouched((prev) => ({ ...prev, [field]: true }));
    };

    const isFieldInvalid = (field: "project_name" | "project_description") => {
        return touched[field] && !formData[field].trim();
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (!file.type.match(/image\/(jpeg|png|gif|webp)/)) {
                showToast("Please upload a valid image (JPEG, PNG, GIF, or WebP)", "error");
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                showToast("Image size should be less than 5MB", "error");
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                setImagePreview(base64String);
                setFormData({ ...formData, logo: base64String });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveImage = () => {
        setImagePreview("");
        setFormData((prev) => ({ ...prev, logo: "" }));
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setTouched({ project_name: true, project_description: true });

        if (!formData.project_name.trim()) {
            showToast("Project name is required", "error");
            return;
        }

        setIsSubmitting(true);

        const updatedProject = {
            ...project,
            name: formData.project_name.trim(),
            description: formData.project_description.trim(),
            status: formData.status,
            logo: formData.logo, // Use formData.logo directly (could be empty string "")
            updatedAt: new Date().toISOString().split('T')[0],
            updatedBy: "Current User",
        };

        try {
            // Save to all storage locations
            localStorage.setItem(`project_${project.id}`, JSON.stringify(updatedProject));
            localStorage.setItem('currentProject', JSON.stringify(updatedProject));

            // Update allProjects - THIS WAS THE MISSING PART
            const allProjects = JSON.parse(localStorage.getItem('allProjects') || '[]');
            const updatedAllProjects = allProjects.map((p: any) =>
                String(p.id) === String(project.id) ? updatedProject : p
            );
            localStorage.setItem('allProjects', JSON.stringify(updatedAllProjects));

            // Dispatch event for all pages to update
            window.dispatchEvent(new CustomEvent('projectUpdated', { detail: updatedProject }));

            showToast("Project updated successfully!", "success");
            setTimeout(() => navigate("/dashboard/project"), 500);
        } catch (error) {
            showToast(error instanceof Error ? error.message : "Error updating project", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!project) return <div className="loading">Loading...</div>;

    return (
        <div className="create-project-container">

            <div className="full-page-bg">

                <div className="form-card">
                    <h2 className="form-header">Edit Project</h2>
                    <div className="form-header">
                        <p>Update project details below</p>
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
                            <label>Description</label>
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

                        <div className="form-group">
                            <label>Status</label>
                            <select
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                style={{
                                    padding: '10px 14px',
                                    border: '2px solid #e2e8f0',
                                    borderRadius: '10px',
                                    fontSize: '14px',
                                    color: '#1e293b',
                                    fontFamily: 'inherit',
                                    background: 'white',
                                    cursor: 'pointer',
                                }}
                            >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>

                        <div className="image-toggle">
                            <button type="button" onClick={toggleImageUpload} className="toggle-btn">
                                {showImageUpload ? "✕ Hide Project Image" : "+ Add Project Image (Optional)"}
                            </button>
                        </div>

                        {showImageUpload && (
                            <div className="image-upload-wrapper">
                                <div className="image-uploader">
                                    <div
                                        className="drop-zone"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/jpeg,image/png,image/webp,image/gif"
                                            onChange={handleImageChange}
                                            style={{ display: "none" }}
                                        />
                                        {imagePreview ? (
                                            <img src={imagePreview} alt="Preview" className="preview-image" />
                                        ) : (
                                            <>
                                                <div className="upload-icon">🖼️</div>
                                                <p>Drag & drop or click to select</p>
                                                <small>Max 5MB · jpeg, png, webp, gif</small>
                                            </>
                                        )}
                                    </div>
                                    {imagePreview && (
                                        <button className="remove-image-btn" onClick={handleRemoveImage}>
                                            ✕ Remove Image
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="form-actions">
                            <button type="button" className="btn-cancel" onClick={() => navigate("/dashboard/project")}>
                                Cancel
                            </button>
                            <button type="submit" className="btn-submit" disabled={isSubmitting}>
                                {isSubmitting ? "Saving..." : "Save Changes"}
                            </button>
                        </div>
                    </form>
                    <ToastContainer />
                </div>
            </div>
        </div>
    );
}