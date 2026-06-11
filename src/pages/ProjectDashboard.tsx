import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import styles from "../styles/ProjectDashboard.module.css";
import {
  Eye, Pencil, Trash2, Plus, Settings, Search, FileText,
  Users, CheckCircle, XCircle, AlertCircle, X, FolderOpen, FunnelPlus, ChevronLeft, ChevronRight,
} from 'lucide-react';
import noDataImg from "../assets/illustration/No data.gif";
import errorImg from "../assets/illustration/error.svg";
import { useToast } from "../hooks/useToast";
import { createProject, getProjects, updateProjectStatus, updateProject, deleteProject, getProjectById } from "../services/projectApi";
import SkeletonLoader from "@/components/common/SkeletonLoader";

interface Project {
  id: string;
  name: string;
  description?: string;
  status: "active" | "inactive";
  created: string;
  services: string[];
  image_url?: string;
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
  const [, setCreateImageFile] =
    useState<File | null>(null);
  const [createTouched, setCreateTouched] = useState({ project_name: false });
  const [projectNameExists, setProjectNameExists] = useState(false);
  const [isFormDirty, setIsFormDirty] = useState(false);
  const createFileRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter states
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  const [filters, setFilters] = useState({
    status: "",
    createdDate: "",
  });

  const hasActiveFilters =
    filters.status !== "" ||
    filters.createdDate !== "";

  // ------------- Profile states
  const [, setProfileImage] = useState("");

  const fetchProfileImage = async () => {
    try {
      const response = await fetch(
        "http://192.168.29.26:8500/api/users/profile",
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const data = await response.json();

      if (data?.success) {
        setProfileImage(data?.data?.profile_image || "");
      }
    } catch (error) {
      console.error("Failed to fetch profile image", error);
    }
  };

  // Edit form states
  const [editForm, setEditForm] = useState({
    project_name: "",
    project_description: "",
    status: "active" as "active" | "inactive",
    image_url: "",
  });
  const [editImagePreview, setEditImagePreview] = useState("");
  const [, setEditImageFile] =
    useState<File | null>(null);

  const [, setRemoveEditImage] =
    useState(false);
  const [editTouched, setEditTouched] = useState({ project_name: false });
  const editFileRef = useRef<HTMLInputElement>(null);


  useEffect(() => {
    if (showCreatePanel || showEditPanel || showFilterPanel) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [showCreatePanel, showEditPanel, showFilterPanel]);

  useEffect(() => {
    fetchProjects();
    fetchProfileImage();
  }, []);

  useEffect(() => {
    const exists = projects.some(
      (p) =>
        p.name.trim().toLowerCase() ===
        createForm.project_name.trim().toLowerCase()
    );

    setProjectNameExists(
      createForm.project_name.trim().length > 0 && exists
    );
  }, [createForm.project_name, projects]);

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
          image_url: project.image_url || "",
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

    if (projectNameExists) {
      showToast("Project name already exists", "error");
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

      const createdProject =
        res?.data?.data?.project ||
        res?.data?.data ||
        res?.data;

      console.log("Created Project:", createdProject);
      console.log("FULL RESPONSE:", res.data);

      const projectsRes = await getProjects();
      console.log("GET PROJECTS RESPONSE:", projectsRes);
      console.log("GET PROJECTS RESPONSE DATA:", projectsRes?.data);
      const projects = projectsRes?.data || [];
      console.log("PROJECTS ARRAY:", projects);
      const latestProject = projects.find(
        (p: any) =>
          p.project_name?.trim().toLowerCase() ===
          createForm.project_name.trim().toLowerCase()
      );

      const projectPublicId = latestProject?.public_id;
      console.log("MATCHED PROJECT:", latestProject);
      console.log("PROJECT PUBLIC ID:", projectPublicId);

      console.log("LATEST PROJECT:", latestProject);

      if (!projectPublicId) {
        showToast("Failed to get project public_id", "error");
        return;
      }

      if (res?.data?.success) {
        showToast("Project created successfully!", "success");

        // Refresh the projects list
        await fetchProjects();

        // Close panel and reset form
        setShowCreatePanel(false);
        resetCreateForm();

        // Navigate to project view
        setTimeout(() => {
          navigate(`/dashboard/project/${projectPublicId}/view`);
        }, 500);
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
    if (!editingProject) return;

    if (!editForm.project_name.trim()) {
      setEditTouched({ project_name: true });
      showToast("Project name is required", "error");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        project_name: editForm.project_name.trim(),
        project_description: editForm.project_description.trim(),
        image_url: editImagePreview || null,
        isActive: editForm.status === "active",
      };

      await updateProject(editingProject.id, payload);

      showToast("Project updated successfully", "success");

      setShowEditPanel(false);
      setEditingProject(null);

      await fetchProjects();

    } catch (error: any) {
      showToast(
        error?.response?.data?.message || "Failed to update project",
        "error"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open create panel
  const handleOpenCreate = () => setShowCreatePanel(true);

  // Open edit panel
  const handleOpenEdit = async (project: Project) => {
    try {
      const res = await getProjectById(project.id);

      const projectData = res.data || res;

      const formattedProject = {
        id: projectData.public_id,
        name: projectData.project_name,
        description: projectData.project_description || "",
        status: (projectData.is_active ? "active" : "inactive") as "active" | "inactive",
        created: projectData.created_at || "",
        image_url: projectData.image_url || "",
        services: projectData.services || [],
      };

      setEditingProject(formattedProject);

      setEditForm({
        project_name: formattedProject.name,
        project_description: formattedProject.description,
        status: formattedProject.status,
        image_url: formattedProject.image_url || "",
      });

      setEditImagePreview(formattedProject.image_url || "");

      setEditTouched({ project_name: false });

      setIsFormDirty(false);

      setShowEditPanel(true);

    } catch (error) {
      console.error(error);

      showToast("Failed to load project details", "error");
    }
  };

  // Close with discard check
  const handleClosePanel = (type: "create" | "edit") => {

    // CREATE PANEL
    if (type === "create") {

      const hasCreateValues =
        createForm.project_name.trim() !== "" ||
        createForm.project_description.trim() !== "" ||
        createImagePreview !== "";

      if (hasCreateValues) {
        setPendingClose(type);
        setShowDiscardModal(true);
      } else {
        setShowCreatePanel(false);
        resetCreateForm();
      }

      return;
    }

    // EDIT PANEL
    if (type === "edit") {

      const hasEditChanges =
        isFormDirty;

      if (hasEditChanges) {
        setPendingClose(type);
        setShowDiscardModal(true);
      } else {
        setShowEditPanel(false);
        setEditingProject(null);
      }
    }
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

  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.description &&
        p.description.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus =
      !filters.status ||
      p.status === filters.status;

    const matchesCreated =
      !filters.createdDate ||
      p.created?.includes(filters.createdDate);

    return (
      matchesSearch &&
      matchesStatus &&
      matchesCreated
    );
  });

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


  const handleDelete = async (id: string) => {
    try {
      await deleteProject(id);

      showToast("Project deleted successfully", "success");

      setShowDeleteConfirm(null);

      await fetchProjects();

    } catch (error: any) {
      showToast(
        error?.response?.data?.message || "Failed to delete project",
        "error"
      );
    }
  };


  const handleView = (project: Project) => {

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
      {isLoading ? (
        <SkeletonLoader variant="stats" count={3} />
      ) : (
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
      )
      }

      {/* Toolbar */}
      <div className={styles["toolbar"]}>
        <div className={styles["searchBox"]}>
          <Search
            size={16}
            className={styles["searchIcon"]}
          />

          <input
            type="text"
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className={styles["searchInput"]}
          />

          {searchTerm.trim() !== "" && (
            <button
              type="button"
              className={styles["clearSearchBtn"]}
              onClick={() => {
                setSearchTerm("");
                setCurrentPage(1);
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>
        <div className={styles["actionsGroup"]}>

          <button
            className={`${styles["addBtn"]} ${hasActiveFilters ? styles["filterActiveBtn"] : ""
              }`}
            onClick={() => setShowFilterPanel(true)}
          >
            <FunnelPlus size={16} />
            Filter
          </button>

          <button
            className={styles["addBtn"]}
            onClick={handleOpenCreate}
          >
            <Plus size={16} />
            Create Project
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
                <td colSpan={6} style={{ padding: "0" }}>
                  <div style={{ padding: "24px" }}>
                    <SkeletonLoader variant="table" rows={5} columns={6} />
                  </div>
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
                          {project.image_url ? (
                            <img
                              src={project.image_url}
                              alt={project.name}
                              className={styles["projectAvatarImage"]}
                            />
                          ) : (
                            project.name.charAt(0).toUpperCase()
                          )}
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
                          <FolderOpen size={14} />
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
            <ChevronLeft size={14} />
            <span>Prev</span>
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
            <span>Next</span>
            <ChevronRight size={14} />
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
      {showDeleteConfirm !== null && (
        <div className={styles["modal-overlay"]} onClick={() => setShowDeleteConfirm(null)}>
          <div className={`${styles["modal-container"]} ${styles["delete-confirm"]}`} onClick={e => e.stopPropagation()}>
            <div className={styles.deleteModalIcon}>
              <Trash2 size={18} />
            </div>
            <h3>Delete Project</h3>
            <p>Are you sure you want to delete this project?</p>
            <div className={styles["modal-actions"]}>
              <button className={styles["btn-cancel"]} onClick={() => setShowDeleteConfirm(null)}>Cancel</button>
              <button className={styles["btn-delete"]} onClick={() => handleDelete(showDeleteConfirm)}>Delete</button>
            </div>
          </div>
        </div>
      )}


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
                  <span className={styles["error-msg"]}>
                    Project name is required
                  </span>
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

                          setCreateImagePreview(
                            reader.result as string
                          );

                          setCreateImageFile(file);

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

                          setEditImagePreview(
                            reader.result as string
                          );

                          setEditImageFile(file);

                          setRemoveEditImage(false);

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

                        setEditImageFile(null);

                        setRemoveEditImage(true);

                        setEditForm(prev => ({
                          ...prev,
                          image_url: ""
                        }));

                        setIsFormDirty(true);
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


      {/* Filter Panel */}
      {showFilterPanel && (

        <>
          <div
            className={styles["filterOverlay"]}
            onClick={() => setShowFilterPanel(false)}
          />

          <div
            className={styles["dashboard-slide-panel"]}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles["panel-header"]}>
              <h2>Filter Projects</h2>

              <button
                className={styles["panel-close-btn"]}
                onClick={() => setShowFilterPanel(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className={styles["panel-body"]}>

              <div className={styles["form-group"]}>
                <label>Status</label>

                <select
                  value={filters.status}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      status: e.target.value,
                    }))
                  }
                >
                  <option value="">All Projects</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className={styles["form-group"]}>
                <label>Created Date</label>

                <input
                  type="date"
                  value={filters.createdDate}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      createdDate: e.target.value,
                    }))
                  }
                />
              </div>

              <div className={styles["form-group"]}>
                <label>Total Results</label>

                <input
                  type="text"
                  value={filteredProjects.length}
                  readOnly
                />
              </div>

            </div>

            <div className={styles["panel-footer"]}>

              <button
                className={`${styles["clearFilterBtn"]} ${hasActiveFilters
                  ? styles["clearFilterActive"]
                  : styles["clearFilterDisabled"]
                  }`}
                disabled={!hasActiveFilters}
                onClick={() =>
                  setFilters({
                    status: "",
                    createdDate: "",
                  })
                }
              >
                Clear Filters
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