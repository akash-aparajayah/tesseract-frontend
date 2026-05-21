import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import styles from "../styles/ProjectDashboard.module.css";
import {
  Eye, Pencil, Trash2, Plus, Settings, Search, FileText,
  Users, CheckCircle, XCircle, AlertCircle, X,
} from 'lucide-react';
import noDataImg from "../assets/illustration/No data.gif";
import errorImg from "../assets/illustration/error.svg";
import { useToast } from "../hooks/useToast";
import { createProject, getProjects, updateProjectStatus, } from "../services/projectApi";

interface Project {
  id: string;
  name: string;
  description?: string;
  status: "active" | "inactive";
  created: string;
  services: string[];
  logo?: string;
  updatedAt?: string;
  updatedBy?: string;
  sms_config?: any;
  email_config?: any;
  whatsapp_config?: any;
}


export default function ProjectDashboard() {
  const navigate = useNavigate();
  const { showToast, ToastContainer } = useToast();

  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [rowsPerPage] = useState<number>(5);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedProject] = useState<Project | null>(null);
  const [showViewModal, setShowViewModal] = useState<boolean>(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [showCreatePanel, setShowCreatePanel] = useState(false);
  const [showEditPanel, setShowEditPanel] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [showDiscardModal, setShowDiscardModal] = useState(false);
  const [pendingClose, setPendingClose] = useState<"create" | "edit" | null>(null);

  // Create form states
  const [createForm, setCreateForm] = useState({
    project_name: "",
    project_description: "",
  });
  const [createImagePreview, setCreateImagePreview] = useState("");
  const [createTouched, setCreateTouched] = useState({ project_name: false });
  const [isFormDirty, setIsFormDirty] = useState(false);
  const createFileRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);





  // Edit form states
  const [editForm, setEditForm] = useState({
    project_name: "",
    project_description: "",
    status: "active" as "active" | "inactive",
    logo: "",
  });
  const [editImagePreview, setEditImagePreview] = useState("");
  const [editTouched, setEditTouched] = useState({ project_name: false });
  const editFileRef = useRef<HTMLInputElement>(null);


  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setIsLoading(true);
      setFetchError(null);

      const response = await getProjects();
      console.log("Projects Response:", response);

      const projectsData = response?.data || [];

      const formattedProjects = projectsData.map(
        (project: any) => ({
          id: project.public_id,                          // ✅ public_id
          name: project.project_name,                     // ✅ project_name
          description: project.project_description || "",  // ✅ may not exist
          status: project.is_active ? "active" : "inactive", // ✅ is_active
          created: project.created_at || "",               // ✅ created_at
          services: project.services || [],
          logo: project.image_url || "",
          sms_config: {},
          email_config: {},
          whatsapp_config: {},
        })
      );

      setProjects(formattedProjects);
    } catch (error: any) {
      console.log("Fetch error:", error);
      if (error?.code !== 'ERR_CANCELED') {
        setFetchError("Failed to fetch projects");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // useEffect(() => {
  //   localStorage.setItem('allProjects', JSON.stringify(projects));
  // }, [projects]);



  useEffect(() => {
    const handleProjectUpdate = (event: Event) => {
      const customEvent = event as CustomEvent;
      const updatedProject = customEvent.detail;
      setProjects(prevProjects =>
        prevProjects.map(p =>
          p.id === updatedProject.id
            ? {
              ...p,
              name: updatedProject.name,
              description: updatedProject.description,
              status: updatedProject.status,
              logo: updatedProject.logo,
              services: updatedProject.services,
              updatedAt: updatedProject.updatedAt,
              updatedBy: updatedProject.updatedBy
            }
            : p
        )
      );
    };
    window.addEventListener('projectUpdated', handleProjectUpdate);
    return () => window.removeEventListener('projectUpdated', handleProjectUpdate);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (openDropdownId !== null) {
        // Check if click is outside the actionMenu
        const target = e.target as Element;
        if (!target.closest('.actionMenu')) {
          setOpenDropdownId(null);
        }
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [openDropdownId]);

  // Reset create form
  const resetCreateForm = () => {
    setCreateForm({ project_name: "", project_description: "" });
    setCreateImagePreview("");
    setCreateTouched({ project_name: false });
    setIsFormDirty(false);
  };

  // Handle create submit
  const handleCreateSubmit = async () => {
    if (!createForm.project_name.trim()) {
      setCreateTouched({ project_name: true });
      showToast("Project name is required", "error");
      return;
    }

    setIsSubmitting(true);

    const payload = {
      project_name: createForm.project_name.trim(),
      project_description: createForm.project_description.trim(),
      image_url: createImagePreview || null,
      isActive: true,
    };

    try {
      const res = await createProject(payload);
      console.log("Full API Response:", res);

      // Extract project ID from response
      const projectId =
        res?.data?.data?.project?.id ||
        res?.data?.data?.id ||
        res?.data?.data?.project_id ||
        res?.data?.project?.id ||
        res?.data?.id;

      console.log("Extracted projectId:", projectId);

      if (res?.data?.success) {
        showToast("Project created successfully!", "success");

        // Refresh the projects list
        await fetchProjects();

        // Close panel and reset form
        setShowCreatePanel(false);
        resetCreateForm();

        // Navigate to project view
        if (projectId) {
          setTimeout(() => {
            navigate(`/dashboard/project/${projectId}/view`);
          }, 500);
        } else {
          showToast("Project created but could not retrieve ID", "error");
        }
      } else {
        showToast(
          res?.data?.message || "Project creation failed",
          "error"
        );
      }
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : (error as any)?.response?.data?.message || "Error creating project";
      showToast(message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle edit submit
  const handleEditSubmit = async () => {
    if (!editForm.project_name.trim()) {
      setEditTouched({ project_name: true });
      showToast("Project name is required", "error");
      return;
    }

    if (!editingProject) return;

    setIsSubmitting(true);

    const updatedProject = {
      ...editingProject,
      name: editForm.project_name.trim(),
      description: editForm.project_description.trim(),
      status: editForm.status,
      logo: editImagePreview || editForm.logo,
      updatedAt: new Date().toISOString().split('T')[0],
      updatedBy: "Current User",
    };

    try {
      localStorage.setItem(`project_${editingProject.id}`, JSON.stringify(updatedProject));
      localStorage.setItem('currentProject', JSON.stringify(updatedProject));

      const allProjects = JSON.parse(localStorage.getItem('allProjects') || '[]');
      const updatedAllProjects = allProjects.map((p: any) =>
        String(p.id) === String(editingProject.id) ? updatedProject : p
      );
      localStorage.setItem('allProjects', JSON.stringify(updatedAllProjects));

      // Update local state
      setProjects(prev =>
        prev.map(p => p.id === editingProject.id ? updatedProject : p)
      );

      window.dispatchEvent(new CustomEvent('projectUpdated', { detail: updatedProject }));

      showToast("Project updated successfully!", "success");
      setShowEditPanel(false);
      setEditingProject(null);
      setIsFormDirty(false);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Error updating project", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open create panel
  const handleOpenCreate = () => setShowCreatePanel(true);

  // Open edit panel
  const handleOpenEdit = (project: Project) => {
    setEditingProject(project);
    setEditForm({
      project_name: project.name,
      project_description: project.description || "",
      status: project.status,
      logo: project.logo || "",
    });
    setEditImagePreview(project.logo || "");
    setEditTouched({ project_name: false });
    setIsFormDirty(false);
    setShowEditPanel(true);
  };

  // Close with discard check
  const handleClosePanel = (type: "create" | "edit") => {
    setPendingClose(type);
    setShowDiscardModal(true);
  };

  // Confirm discard
  const handleConfirmDiscard = () => {
    setShowDiscardModal(false);
    if (pendingClose === "create") {
      setShowCreatePanel(false);
      resetCreateForm();
    } else if (pendingClose === "edit") {
      setShowEditPanel(false);
      setEditingProject(null);
      setIsFormDirty(false);
    }
    setPendingClose(null);
  };

  const toggleDropdown = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenDropdownId((prev) => (prev === id ? null : id));
  };

  const filteredProjects = projects.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalPages = Math.ceil(filteredProjects.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedProjects = filteredProjects.slice(startIndex, startIndex + rowsPerPage);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const toggleStatus = async (id: string) => {
    const project = projects.find(p => p.id === id);
    if (!project) return;

    const newStatus = project.status === "active" ? false : true;

    try {
      await updateProjectStatus(id, newStatus);

      // Update local state
      setProjects(prev =>
        prev.map(p =>
          p.id === id
            ? { ...p, status: newStatus ? "active" : "inactive" }
            : p
        )
      );

      showToast(`Project ${newStatus ? "activated" : "deactivated"}`, "success");
    } catch (error: any) {
      showToast(error?.response?.data?.message || "Failed to update status", "error");
    }
  };

  // const handleDelete = async (id: string) => {
  //   try {
  //     await deleteProject(id.toString());
  //     showToast("Project deleted", "success");
  //     await fetchProjects(); // Refresh list
  //     setShowDeleteConfirm(null);
  //   } catch (error: any) {
  //     showToast(error?.response?.data?.message || "Failed to delete project", "error");
  //   }
  // };

  const handleView = (project: Project) => {
    localStorage.setItem('currentProject', JSON.stringify(project));
    navigate(`/dashboard/project/${project.id}/view`);
  };

  const activeCount = projects.filter(p => p.status === "active").length;
  const inactiveCount = projects.length - activeCount;

  return (
    <div className={styles["project-dashboard"]}>
      {fetchError && (
        <div className={styles["errorBanner"]}>
          <AlertCircle size={16} />
          <span>{fetchError}</span>
          <button onClick={() => setFetchError(null)}>
            <X size={14} />
          </button>
        </div>
      )}



      {/* Abstract Cards */}
      <div className={styles["statsGrid"]}>
        <div className={`${styles["statCard"]} ${styles["cardTotal"]}`}>
          <div className={styles["leftArt"]}></div>
          <div className={styles["leftDots"]}></div>
          <div className={styles["leftLine"]}></div>
          <div className={styles["lineOverlay"]}></div>
          <div className={styles["statLeft"]}>
            <div className={styles["statLabel"]}>Total Projects</div>
            <div className={styles["statNumber"]}>{projects.length}</div>
          </div>
          <div className={styles["centerGem"]}></div>
          <div className={styles["statIcon"]}>
            <Users size={26} />
          </div>
        </div>

        <div className={`${styles["statCard"]} ${styles["cardActive"]}`}>
          <div className={styles["leftArt"]}></div>
          <div className={styles["leftDots"]}></div>
          <div className={styles["leftLine"]}></div>
          <div className={styles["lineOverlay"]}></div>
          <div className={styles["statLeft"]}>
            <div className={styles["statLabel"]}>Active</div>
            <div className={styles["statNumber"]}>{activeCount}</div>
          </div>
          <div className={styles["centerGem"]}></div>
          <div className={styles["statIcon"]}>
            <CheckCircle size={26} />
          </div>
        </div>

        <div className={`${styles["statCard"]} ${styles["cardInactive"]}`}>
          <div className={styles["leftArt"]}></div>
          <div className={styles["leftDots"]}></div>
          <div className={styles["leftLine"]}></div>
          <div className={styles["lineOverlay"]}></div>
          <div className={styles["statLeft"]}>
            <div className={styles["statLabel"]}>Inactive</div>
            <div className={styles["statNumber"]}>{inactiveCount}</div>
          </div>
          <div className={styles["centerGem"]}></div>
          <div className={styles["statIcon"]}>
            <XCircle size={26} />
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className={styles["toolbar"]}>
        <div className={styles["searchBox"]}>
          <Search size={16} className={styles["searchIcon"]} />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className={styles["searchInput"]}
          />
        </div>
        <div className={styles["actionsGroup"]}>
          <button className={styles["addBtn"]} onClick={handleOpenCreate}>
            <Plus size={16} /> Create Project
          </button>
        </div>
      </div>

      {/* Table */}
      <div className={styles["tableWrapper"]}>
        <table className={styles["table"]}>
          <thead>
            <tr>
              <th className={styles["colNo"]}>S.No</th>
              <th className={styles["colProject"]}>Project Name</th>
              <th className={styles["colStatus"]}>Status</th>
              <th className={styles["colCreated"]}>Created</th>
              <th className={styles["colLogs"]}>Logs</th>
              <th className={styles["colActions"]}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className={styles["noData"]}>
                  <p>Loading projects...</p>
                </td>
              </tr>
            ) : paginatedProjects.length > 0 ? (
              paginatedProjects.map((project, index) => {
                const serialNumber = (currentPage - 1) * rowsPerPage + index + 1;
                return (
                  <tr key={project.id}>
                    <td className={styles["colNo"]}>{serialNumber}</td>
                    <td className={styles["colProject"]}>
                      <div className={styles["projectCell"]}>
                        <div className={styles["projectAvatar"]}>
                          {project.name.charAt(0).toUpperCase()}
                        </div>
                        <span className={styles["projectName"]}>{project.name}</span>
                      </div>
                    </td>
                    <td className={styles["colStatus"]}>
                      <div
                        className={`${styles["toggleCompact"]} ${project.status === "active" ? styles["active"] : ""}`}
                        onClick={() => toggleStatus(project.id)}
                      >
                        <div className={styles["knob"]}>
                          <svg viewBox="0 0 24 24" stroke="currentColor">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                          </svg>
                        </div>
                        <span className={`${styles["statusText"]} ${styles["textInactive"]}`}>Inactive</span>
                        <span className={`${styles["statusText"]} ${styles["textActive"]}`}>Active</span>
                      </div>
                    </td>
                    <td className={styles["colCreated"]}>{project.created}</td>
                    <td className={styles["colLogs"]}>
                      <button className={styles["logsBtn"]} onClick={() => navigate(`/dashboard/project/${project.id}/logs`)}>
                        <FileText size={14} /> View Logs
                      </button>
                    </td>
                    <td className={styles["colActions"]}>
                      <div className={styles["actionMenu"]}>
                        <button
                          className={styles["dotsBtn"]}
                          onClick={(e) => toggleDropdown(project.id, e)}
                        >
                          <Settings size={16} />
                        </button>
                      </div>

                      {openDropdownId === project.id && (
                        <div className={`${styles["dropdown"]} ${styles["show"]}`}>
                          <button onClick={() => handleView(project)}>
                            <Eye size={14} /> View
                          </button>

                          <button onClick={() => handleOpenEdit(project)}>
                            <Pencil size={14} /> Edit
                          </button>

                          <button
                            className={styles["deleteBtn"]}
                            onClick={() => setShowDeleteConfirm(project.id)}
                          >
                            <Trash2 size={14} /> Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={6} className={styles["noData"]}>
                  <img
                    src={fetchError ? errorImg : noDataImg}
                    alt="No data"
                    className={styles["noDataImg"]}
                  />
                  <p>
                    {fetchError
                      ? "Unable to load projects. Please try again."
                      : "No projects found"}
                  </p>
                  {fetchError ? (
                    <button onClick={() => fetchProjects()} className={styles["retryBtn"]}>
                      Retry
                    </button>
                  ) : (
                    <button onClick={handleOpenCreate} className={styles["retryBtn"]}>
                      Create Project
                    </button>
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className={styles["pagination"]}>
          <button
            className={styles["pageBtn"]}
            disabled={currentPage === 1}
            onClick={() => goToPage(currentPage - 1)}
          >
            ← Prev
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              className={`${styles["pageBtn"]} ${currentPage === page ? styles["activePage"] : ""}`}
              onClick={() => goToPage(page)}
            >
              {page}
            </button>
          ))}
          <button
            className={styles["pageBtn"]}
            disabled={currentPage === totalPages}
            onClick={() => goToPage(currentPage + 1)}
          >
            Next →
          </button>
          <span className={styles["pageInfo"]}>
            Page {currentPage} of {totalPages}
          </span>
        </div>
      )}

      {/* VIEW MODAL */}
      {showViewModal && selectedProject && (
        <div className={styles["modal-overlay"]} onClick={() => setShowViewModal(false)}>
          <div className={styles["modal-container"]} onClick={e => e.stopPropagation()}>
            <div className={styles["modal-header"]}>
              <h2>Project Details</h2>
              <button className={styles["close-btn"]} onClick={() => setShowViewModal(false)}>×</button>
            </div>
            <div className={styles["view-details"]}>
              <div className={styles["detail-row"]}><label>Name:</label><span>{selectedProject.name}</span></div>
              <div className={styles["detail-row"]}><label>Description:</label><span>{selectedProject.description || "—"}</span></div>
              <div className={styles["detail-row"]}><label>Status:</label><span className={`${styles["status-text"]} ${styles[selectedProject.status]}`}>{selectedProject.status === "active" ? "Active" : "Inactive"}</span></div>
              <div className={styles["detail-row"]}><label>Created:</label><span>{selectedProject.created}</span></div>
            </div>
            <div className={styles["modal-actions"]}>
              <button className={styles["btn-edit"]} onClick={() => {
                setShowViewModal(false);
                setTimeout(() => handleOpenEdit(selectedProject), 200);
              }}>✏️ Edit</button>
              <button className={styles["btn-cancel"]} onClick={() => setShowViewModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}


      {/* DELETE CONFIRMATION MODAL */}
      {/* {showDeleteConfirm !== null && (
        <div className={styles["modal-overlay"]} onClick={() => setShowDeleteConfirm(null)}>
          <div className={`${styles["modal-container"]} ${styles["delete-confirm"]}`} onClick={e => e.stopPropagation()}>
            <h3>Delete Project</h3>
            <p>Are you sure you want to delete this project?</p>
            <div className={styles["modal-actions"]}>
              <button className={styles["btn-cancel"]} onClick={() => setShowDeleteConfirm(null)}>Cancel</button>
              <button className={styles["btn-delete"]} onClick={() => handleDelete(showDeleteConfirm)}>Delete</button>
            </div>
          </div>
        </div>
      )} */}


      {/* ========== CREATE PROJECT PANEL ========== */}
      {showCreatePanel && (
        <>
          <div className={styles["panel-backdrop"]} />
          <div className={styles["dashboard-slide-panel"]}>
            <div className={styles["panel-header"]}>
              <h2>Create Project</h2>
              <button className={styles["panel-close-btn"]} onClick={() => handleClosePanel("create")}>
                <X size={20} />
              </button>
            </div>

            <div className={styles["panel-body"]}>
              <p className={styles["panel-subtitle"]}>Fill in the details below</p>

              <div className={styles["form-group"]}>
                <label>Project Name <span className={styles["required"]}>*</span></label>
                <input
                  type="text"
                  placeholder="e.g., Marketing Website Redesign"
                  value={createForm.project_name}
                  onChange={(e) => {
                    setCreateForm(prev => ({ ...prev, project_name: e.target.value }));
                    setIsFormDirty(true);
                  }}
                  className={createTouched.project_name && !createForm.project_name.trim() ? styles["input-error"] : ""}
                  onBlur={() => setCreateTouched(prev => ({ ...prev, project_name: true }))}
                />
                {createTouched.project_name && !createForm.project_name.trim() && (
                  <span className={styles["error-msg"]}>Project name is required</span>
                )}
              </div>

              <div className={styles["form-group"]}>
                <label>Description</label>
                <textarea
                  placeholder="Tell us about your project..."
                  rows={4}
                  value={createForm.project_description}
                  onChange={(e) => {
                    setCreateForm(prev => ({ ...prev, project_description: e.target.value }));
                    setIsFormDirty(true);
                  }}
                />
              </div>

              <div className={styles["form-group"]}>
                <label>Project Image (Optional)</label>
                <div className={styles["image-drop-zone"]} onClick={() => createFileRef.current?.click()}>
                  <input
                    ref={createFileRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setCreateImagePreview(reader.result as string);
                          setIsFormDirty(true);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    style={{ display: "none" }}
                  />
                  {createImagePreview ? (
                    <div className={styles["image-preview-wrap"]}>
                      <img src={createImagePreview} alt="Preview" />
                      <button type="button" className={styles["remove-img-btn"]} onClick={(e) => {
                        e.stopPropagation();
                        setCreateImagePreview("");
                      }}>
                        ✕ Remove
                      </button>
                    </div>
                  ) : (
                    <div className={styles["upload-placeholder"]}>
                      <span className={styles["upload-icon"]}>🖼️</span>
                      <p>Click to upload image</p>
                      <small>Max 3MB · jpeg, png, webp, gif</small>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className={styles["panel-footer"]}>
              <button className={styles["btn-cancel"]} onClick={() => handleClosePanel("create")}>Cancel</button>
              <button className={styles["btn-submit"]} onClick={handleCreateSubmit} disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Project"}
              </button>
            </div>
          </div>
        </>
      )}

      {/* ========== EDIT PROJECT PANEL ========== */}
      {showEditPanel && editingProject && (
        <>
          <div className={styles["panel-backdrop"]} />
          <div className={styles["dashboard-slide-panel"]}>
            <div className={styles["panel-header"]}>
              <h2>Edit Project</h2>
              <button className={styles["panel-close-btn"]} onClick={() => handleClosePanel("edit")}>
                <X size={20} />
              </button>
            </div>

            <div className={styles["panel-body"]}>
              <p className={styles["panel-subtitle"]}>Update project details</p>

              <div className={styles["form-group"]}>
                <label>Project Name <span className={styles["required"]}>*</span></label>
                <input
                  type="text"
                  value={editForm.project_name}
                  onChange={(e) => {
                    setEditForm(prev => ({ ...prev, project_name: e.target.value }));
                    setIsFormDirty(true);
                  }}
                  className={editTouched.project_name && !editForm.project_name.trim() ? styles["input-error"] : ""}
                  onBlur={() => setEditTouched(prev => ({ ...prev, project_name: true }))}
                />
                {editTouched.project_name && !editForm.project_name.trim() && (
                  <span className={styles["error-msg"]}>Project name is required</span>
                )}
              </div>

              <div className={styles["form-group"]}>
                <label>Description</label>
                <textarea
                  placeholder="Tell us about your project..."
                  rows={4}
                  value={editForm.project_description}
                  onChange={(e) => {
                    setEditForm(prev => ({ ...prev, project_description: e.target.value }));
                    setIsFormDirty(true);
                  }}
                />
              </div>

              <div className={styles["form-group"]}>
                <label>Status</label>
                <select
                  value={editForm.status}
                  onChange={(e) => {
                    setEditForm(prev => ({ ...prev, status: e.target.value as "active" | "inactive" }));
                    setIsFormDirty(true);
                  }}
                  className={styles["status-select"]}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className={styles["form-group"]}>
                <label>Project Image (Optional)</label>
                <div className={styles["image-drop-zone"]} onClick={() => editFileRef.current?.click()}>
                  <input
                    ref={editFileRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setEditImagePreview(reader.result as string);
                          setIsFormDirty(true);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    style={{ display: "none" }}
                  />
                  {editImagePreview ? (
                    <div className={styles["image-preview-wrap"]}>
                      <img src={editImagePreview} alt="Preview" />
                      <button type="button" className={styles["remove-img-btn"]} onClick={(e) => {
                        e.stopPropagation();
                        setEditImagePreview("");
                        setEditForm(prev => ({ ...prev, logo: "" }));
                      }}>
                        ✕ Remove
                      </button>
                    </div>
                  ) : (
                    <div className={styles["upload-placeholder"]}>
                      <span className={styles["upload-icon"]}>🖼️</span>
                      <p>Click to upload image</p>
                      <small>Max 3MB</small>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className={styles["panel-footer"]}>
              <button className={styles["btn-cancel"]} onClick={() => handleClosePanel("edit")}>Cancel</button>
              <button className={styles["btn-submit"]} onClick={handleEditSubmit} disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </>
      )}

      {/* ========== DISCARD CHANGES MODAL ========== */}
      {showDiscardModal && (
        <div className={styles["modal-overlay"]} onClick={() => setShowDiscardModal(false)}>
          <div className={styles["modal-box"]} onClick={e => e.stopPropagation()}>
            <h3>Discard Changes?</h3>
            <p>You have unsaved changes. Are you sure you want to leave?</p>
            <div className={styles["modal-actions"]}>
              <button className={styles["btn-cancel"]} onClick={() => setShowDiscardModal(false)}>
                Continue Editing
              </button>
              <button className={styles["btn-discard"]} onClick={handleConfirmDiscard}>
                Discard Changes
              </button>
            </div>
          </div>
        </div>
      )}
      <ToastContainer />
    </div>
  );
}