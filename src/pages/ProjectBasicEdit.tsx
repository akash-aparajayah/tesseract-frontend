import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from "../hooks/useToast";
import "../styles/ProjectEdit.css";

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
        services: [] as string[],
        logo: "" as string,
    });
    const [imagePreview, setImagePreview] = useState<string>("");
    const [isSubmitting, setIsSubmitting] = useState(false);

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
            services: project.services ? project.services.map((s: string) => s.toUpperCase()) : [],
            logo: project.logo || "", // ADD THIS
        });
        setImagePreview(project.logo || ""); // ADD THIS
    }, [project, navigate, showToast]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

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
            services: formData.services,
            logo: formData.logo || project.logo, // Keep existing logo if not changed
            updatedAt: new Date().toISOString().split('T')[0],
            updatedBy: "Current User",
        };

        try {
            // Store with project-specific key
            localStorage.setItem(`project_${project.id}`, JSON.stringify(updatedProject));
            localStorage.setItem('currentProject', JSON.stringify(updatedProject));

            window.dispatchEvent(new CustomEvent('projectUpdated', {
                detail: updatedProject
            }));

            await new Promise(resolve => setTimeout(resolve, 500));
            showToast("Project updated successfully! ✨", "success");

            setTimeout(() => {
                navigate(`/dashboard/project`, {
                    state: { project: updatedProject }
                });
            }, 1000);
        } catch (error) {
            showToast(error instanceof Error ? error.message : "Error updating project", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!project) return <div className="loading">Loading...</div>;
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
        setFormData({ ...formData, logo: "" });
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };
    return (
        <div className="project-edit-page">
            <ToastContainer />

            {/* Breadcrumbs */}
            <div className="breadcrumbs-row">
                <button className="breadcrumb-link" onClick={() => navigate("/dashboard")}>Dashboard</button>
                <span className="breadcrumb-separator">›</span>
                <button className="breadcrumb-link" onClick={() => navigate("/dashboard/project")}>Projects</button>
                <span className="breadcrumb-separator">›</span>
                <button
                    className="breadcrumb-link"
                    onClick={() => navigate(`/dashboard/project`)}
                >
                    {project.name}
                </button>
                <span className="breadcrumb-separator">›</span>
                <span className="breadcrumb-current">Edit</span>
            </div>

            {/* Page Header */}
            <div className="edit-page-header">
                <h1>

                    Edit Project
                </h1>
                <p>Update project details and configuration</p>
            </div>

            {/* Edit Form Card */}
            <form onSubmit={handleSubmit}>
                <div className="edit-form-card">
                    {/* Card Header */}
                    <div className="edit-form-card-header">
                        <div className="edit-form-card-header-content">
                            <div className="project-avatar">
                                {project.logo || '📁'}
                            </div>
                            <div className="card-header-info">
                                <h3>{project.name}</h3>
                                <p>Project ID: #{project.id} • Created: {project.created}</p>
                            </div>
                        </div>
                    </div>

                    {/* Form Body */}
                    <div className="edit-form-body">
                        {/* Basic Information Section */}
                        <div className="form-section">
                            <div className="section-title">
                                <span className="section-icon">📋</span>
                                Basic Information
                            </div>

                            <div className="form-group">
                                <label>
                                    Project Name <span className="required">*</span>
                                </label>
                                <input
                                    type="text"
                                    className="input-field"
                                    value={formData.project_name}
                                    onChange={(e) => setFormData({ ...formData, project_name: e.target.value })}
                                    placeholder="Enter project name"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Description</label>
                                <textarea
                                    className="textarea-field"
                                    rows={4}
                                    value={formData.project_description}
                                    onChange={(e) => setFormData({ ...formData, project_description: e.target.value })}
                                    placeholder="Describe your project's purpose and goals..."
                                />
                                <div className="char-count">
                                    {formData.project_description.length}/500 characters
                                </div>
                            </div>
                        </div>

                        {/* Image & Status Row */}
                        <div className="image-status-row">
                            <div className="form-group">
                                <label>Project Logo</label>
                                <div className="image-upload-container">
                                    <div
                                        className="image-preview-area"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        {imagePreview ? (
                                            <>
                                                <img src={imagePreview} alt="Project logo preview" className="image-preview" />
                                                <div className="image-overlay">
                                                    <span>Change Image</span>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="image-placeholder">
                                                <span className="upload-icon">📷</span>
                                                <span className="upload-text">Click to upload logo</span>
                                                <span className="upload-hint">PNG, JPG, GIF or WebP (max 5MB)</span>
                                            </div>
                                        )}
                                    </div>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/jpeg,image/png,image/gif,image/webp"
                                        onChange={handleImageChange}
                                        style={{ display: 'none' }}
                                    />
                                    {imagePreview && (
                                        <button
                                            type="button"
                                            className="btn-remove-image"
                                            onClick={handleRemoveImage}
                                        >
                                            🗑️ Remove
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Project Status</label>
                                <select
                                    className="input-field"
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                >
                                    <option value="active">🟢 Active</option>
                                    <option value="inactive">🔴 Inactive</option>
                                </select>
                            </div>
                        </div>


                    </div>

                    {/* Form Footer */}
                    <div className="edit-form-footer">
                        <div className="footer-left">
                            * Required fields
                        </div>
                        <div className="footer-actions">
                            <button
                                type="button"
                                className="btn-outline"
                                onClick={() => navigate("/dashboard/project")}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="btn-primary"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <>
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        Save Changes
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
}