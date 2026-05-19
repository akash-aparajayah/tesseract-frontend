import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/ProjectDashboard.css";
import {
  Eye, Pencil, Trash2, Plus, Settings, Search, FileText,
  Users, CheckCircle, XCircle, AlertCircle, X, Lock
} from 'lucide-react';
import noDataImg from "../assets/illustration/No data.gif";
import errorImg from "../assets/illustration/error.svg";

interface Project {
  id: number;
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

const mockProjects: Project[] = [
  { id: 1, name: "Notification System", description: "Multi-channel notification service", status: "active", created: "2025-01-10", services: ["sms", "email", "whatsapp"], sms_config: {}, email_config: {}, whatsapp_config: {} },
  { id: 2, name: "E-Commerce App", description: "Online shopping platform", status: "active", created: "2025-02-15", services: ["sms", "email", "whatsapp"], sms_config: {}, email_config: {}, whatsapp_config: {} },
  { id: 3, name: "HR Management System", description: "Payroll & HR tools", status: "inactive", created: "2025-03-01", services: ["email"], sms_config: {}, email_config: {}, whatsapp_config: {} },
  { id: 4, name: "Support Tracker", description: "Ticket tracking", status: "active", created: "2025-03-10", services: ["sms", "whatsapp"], sms_config: {}, email_config: {}, whatsapp_config: {} },
  { id: 5, name: "Sales Dashboard", description: "Real-time analytics", status: "active", created: "2025-03-20", services: ["email", "whatsapp"], sms_config: {}, email_config: {}, whatsapp_config: {} },
  { id: 6, name: "Inventory Manager", description: "Stock management", status: "inactive", created: "2025-04-01", services: ["sms"], sms_config: {}, email_config: {}, whatsapp_config: {} },
  { id: 7, name: "Customer Portal", description: "Self-service portal", status: "active", created: "2025-04-05", services: ["whatsapp"], sms_config: {}, email_config: {}, whatsapp_config: {} },
  { id: 8, name: "Analytics Pipeline", description: "Data pipeline", status: "active", created: "2025-04-10", services: ["sms", "email"], sms_config: {}, email_config: {}, whatsapp_config: {} },
  { id: 9, name: "API Gateway", description: "Central gateway", status: "active", created: "2025-04-15", services: ["email"], sms_config: {}, email_config: {}, whatsapp_config: {} },
];

export default function ProjectDashboard() {
  const navigate = useNavigate();

  const [projects, setProjects] = useState<Project[]>(() => {
    const savedProjects = localStorage.getItem('allProjects');
    if (savedProjects) {
      try {
        const parsed = JSON.parse(savedProjects);
        return parsed.length > 0 ? parsed : mockProjects;
      } catch {
        return mockProjects;
      }
    }
    localStorage.setItem('allProjects', JSON.stringify(mockProjects));
    return mockProjects;
  });

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [rowsPerPage, setRowsPerPage] = useState<number>(5);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showViewModal, setShowViewModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ name: "", description: "", status: "", services: [] as string[] });
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('allProjects', JSON.stringify(projects));
  }, [projects]);

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

  const toggleDropdown = (id: number, e: React.MouseEvent) => {
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

  const handleRowsChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRowsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  const toggleStatus = (id: number) => {
    setProjects(prev => {
      const updatedProjects = prev.map(p => {
        if (p.id === id) {
          const updatedProject = {
            ...p,
            status: p.status === "active" ? "inactive" as const : "active" as const,
            updatedAt: new Date().toISOString().split('T')[0],
          };
          const currentProject = localStorage.getItem('currentProject');
          if (currentProject) {
            try {
              const parsed = JSON.parse(currentProject);
              if (parsed.id === id) {
                localStorage.setItem('currentProject', JSON.stringify(updatedProject));
              }
            } catch { }
          }
          window.dispatchEvent(new CustomEvent('projectUpdated', { detail: updatedProject }));
          return updatedProject;
        }
        return p;
      });
      return updatedProjects;
    });
  };

  const handleDelete = (id: number) => {
    setProjects(prev => prev.filter(p => p.id !== id));
    setShowDeleteConfirm(null);
  };

  const handleView = (project: Project) => {
    localStorage.setItem('currentProject', JSON.stringify(project));
    navigate(`/dashboard/project/${project.id}/view`);
  };

  const handleEditOpen = () => {
    if (selectedProject) {
      setEditForm({
        name: selectedProject.name,
        description: selectedProject.description || "",
        status: selectedProject.status,
        services: [...selectedProject.services]
      });
      setShowViewModal(false);
      setShowEditModal(true);
    }
  };

  const handleUpdate = () => {
    if (selectedProject) {
      const updatedProject = {
        ...selectedProject,
        name: editForm.name,
        description: editForm.description,
        status: editForm.status as "active" | "inactive",
        services: editForm.services,
      };
      setProjects(prev => prev.map(p => p.id === selectedProject.id ? updatedProject : p));
      setSelectedProject(updatedProject);
      setShowEditModal(false);
      window.dispatchEvent(new CustomEvent('projectUpdated', { detail: updatedProject }));
      localStorage.setItem('currentProject', JSON.stringify(updatedProject));
    }
  };

  const activeCount = projects.filter(p => p.status === "active").length;
  const inactiveCount = projects.length - activeCount;

  return (
    <div className="project-dashboard">
      {fetchError && (
        <div className="errorBanner">
          <AlertCircle size={16} />
          <span>{fetchError}</span>
          <button onClick={() => setFetchError(null)}>
            <X size={14} />
          </button>
        </div>
      )}



      {/* Abstract Cards */}
      <div className="statsGrid">
        <div className={`statCard cardTotal`}>
          <div className="leftArt"></div>
          <div className="leftDots"></div>
          <div className="leftLine"></div>
          <div className="lineOverlay"></div>
          <div className="statLeft">
            <div className="statLabel">Total Projects</div>
            <div className="statNumber">{projects.length}</div>
          </div>
          <div className="centerGem"></div>
          <div className="statIcon">
            <Users size={26} />
          </div>
        </div>

        <div className={`statCard cardActive`}>
          <div className="leftArt"></div>
          <div className="leftDots"></div>
          <div className="leftLine"></div>
          <div className="lineOverlay"></div>
          <div className="statLeft">
            <div className="statLabel">Active</div>
            <div className="statNumber">{activeCount}</div>
          </div>
          <div className="centerGem"></div>
          <div className="statIcon">
            <CheckCircle size={26} />
          </div>
        </div>

        <div className={`statCard cardInactive`}>
          <div className="leftArt"></div>
          <div className="leftDots"></div>
          <div className="leftLine"></div>
          <div className="lineOverlay"></div>
          <div className="statLeft">
            <div className="statLabel">Inactive</div>
            <div className="statNumber">{inactiveCount}</div>
          </div>
          <div className="centerGem"></div>
          <div className="statIcon">
            <XCircle size={26} />
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="toolbar">
        <div className="searchBox">
          <Search size={16} className="searchIcon" />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="searchInput"
          />
        </div>
        <div className="actionsGroup">
          <button className="addBtn" onClick={() => navigate("/dashboard/project-create")}>
            <Plus size={16} /> Create Project
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="tableWrapper">
        <table className="table">
          <thead>
            <tr>
              <th className="colNo">S.No</th>
              <th className="colProject">Project Name</th>
              <th className="colStatus">Status</th>
              <th className="colCreated">Created</th>
              <th className="colLogs">Logs</th>
              <th className="colActions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedProjects.length > 0 ? (
              paginatedProjects.map((project, index) => {
                const serialNumber = (currentPage - 1) * rowsPerPage + index + 1;
                return (
                  <tr key={project.id}>
                    <td className="colNo">{serialNumber}</td>
                    <td className="colProject">
                      <div className="projectCell">
                        <div className="projectAvatar">
                          {project.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="projectName">{project.name}</span>
                      </div>
                    </td>
                    <td className="colStatus">
                      <div
                        className={`toggleCompact ${project.status === "active" ? "active" : ""}`}
                        onClick={() => toggleStatus(project.id)}
                      >
                        <div className="knob">
                          <svg viewBox="0 0 24 24" stroke="currentColor">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                          </svg>
                        </div>
                        <span className={`statusText textInactive`}>Inactive</span>
                        <span className={`statusText textActive`}>Active</span>
                      </div>
                    </td>
                    <td className="colCreated">{project.created}</td>
                    <td className="colLogs">
                      <button className="logsBtn" onClick={() => navigate(`/dashboard/project/${project.id}/logs`)}>
                        <FileText size={14} /> View Logs
                      </button>
                    </td>
                    <td className="colActions">
                      <div className="actionMenu">
                        <button
                          className="dotsBtn"
                          onClick={(e) => toggleDropdown(project.id, e)}
                        >
                          <Settings size={16} />
                        </button>
                      </div>

                      {openDropdownId === project.id && (
                        <div className="dropdown show">
                          <button onClick={() => handleView(project)}>
                            <Eye size={14} /> View
                          </button>

                          <button
                            onClick={() =>
                              navigate(`/dashboard/project-edit-basic/${project.id}`, {
                                state: { project }
                              })
                            }
                          >
                            <Pencil size={14} /> Edit
                          </button>

                          <button
                            className="deleteBtn"
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
                <td colSpan={6} className="noData">
                  <img
                    src={fetchError ? errorImg : noDataImg}
                    alt="No data"
                    className="noDataImg"
                  />
                  <p>
                    {fetchError
                      ? "Unable to load projects. Please try again."
                      : "No projects found"}
                  </p>
                  {!fetchError && (
                    <button onClick={() => navigate("/dashboard/project-create")} className="retryBtn">
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
        <div className="pagination">
          <button
            className="pageBtn"
            disabled={currentPage === 1}
            onClick={() => goToPage(currentPage - 1)}
          >
            ← Prev
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              className={`pageBtn ${currentPage === page ? "activePage" : ""}`}
              onClick={() => goToPage(page)}
            >
              {page}
            </button>
          ))}
          <button
            className="pageBtn"
            disabled={currentPage === totalPages}
            onClick={() => goToPage(currentPage + 1)}
          >
            Next →
          </button>
          <span className="pageInfo">
            Page {currentPage} of {totalPages}
          </span>
        </div>
      )}

      {/* VIEW MODAL */}
      {showViewModal && selectedProject && (
        <div className="modal-overlay" onClick={() => setShowViewModal(false)}>
          <div className="modal-container" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Project Details</h2>
              <button className="close-btn" onClick={() => setShowViewModal(false)}>×</button>
            </div>
            <div className="view-details">
              <div className="detail-row"><label>Name:</label><span>{selectedProject.name}</span></div>
              <div className="detail-row"><label>Description:</label><span>{selectedProject.description || "—"}</span></div>
              <div className="detail-row"><label>Status:</label><span className={`status-text ${selectedProject.status}`}>{selectedProject.status === "active" ? "Active" : "Inactive"}</span></div>
              <div className="detail-row"><label>Created:</label><span>{selectedProject.created}</span></div>
            </div>
            <div className="modal-actions">
              <button className="btn-edit" onClick={handleEditOpen}>✏️ Edit</button>
              <button className="btn-cancel" onClick={() => setShowViewModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {showEditModal && selectedProject && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-container" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Project</h2>
              <button className="close-btn" onClick={() => setShowEditModal(false)}>×</button>
            </div>
            <div className="form-group">
              <label>Project Name</label>
              <input type="text" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} rows={3} />
            </div>
            <div className="form-group">
              <label>Status</label>
              <select value={editForm.status} onChange={e => setEditForm({ ...editForm, status: e.target.value })}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowEditModal(false)}>Cancel</button>
              <button className="btn-create" onClick={handleUpdate}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {showDeleteConfirm !== null && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(null)}>
          <div className="modal-container delete-confirm" onClick={e => e.stopPropagation()}>
            <h3>Delete Project</h3>
            <p>Are you sure you want to delete this project?</p>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowDeleteConfirm(null)}>Cancel</button>
              <button className="btn-delete" onClick={() => handleDelete(showDeleteConfirm)}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}