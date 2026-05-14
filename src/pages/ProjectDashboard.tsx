import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/ProjectDashboard.css";
import { Eye, Pencil, Trash2, Plus, Settings, Search, FileText } from 'lucide-react';

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

  // Initialize projects from localStorage or mock data
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
    // Save initial mock data to localStorage
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

  // Save projects to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('allProjects', JSON.stringify(projects));
  }, [projects]);

  // Listen for project updates from other pages
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

  // Filter & Pagination
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

          // Update currentProject if it's the same
          const currentProject = localStorage.getItem('currentProject');
          if (currentProject) {
            try {
              const parsed = JSON.parse(currentProject);
              if (parsed.id === id) {
                localStorage.setItem('currentProject', JSON.stringify(updatedProject));
              }
            } catch { }
          }

          window.dispatchEvent(new CustomEvent('projectUpdated', {
            detail: updatedProject
          }));

          return updatedProject;
        }
        return p;
      });
      return updatedProjects;
    });
  };

  const handleDelete = (id: number) => {
    setProjects(prev => {
      const updated = prev.filter(p => p.id !== id);
      return updated;
    });
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

      setProjects(prev => prev.map(p =>
        p.id === selectedProject.id ? updatedProject : p
      ));
      setSelectedProject(updatedProject);
      setShowEditModal(false);

      window.dispatchEvent(new CustomEvent('projectUpdated', {
        detail: updatedProject
      }));

      localStorage.setItem('currentProject', JSON.stringify(updatedProject));
    }
  };

  const activeCount = projects.filter(p => p.status === "active").length;
  const inactiveCount = projects.length - activeCount;

  return (
    <div className="project-dashboard">
      <div className="dashboard-header">
        <div>
          <h1>Project Management</h1>
          {/* <p className="subtitle">Manage and monitor all your projects</p> */}
        </div>

      </div>

      {/* Stat Cards */}
      <div className="stats-container">
        <div className="stat-card total">
          <div className="stat-icon total-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <line x1="3" y1="9" x2="21" y2="9" />
              <line x1="9" y1="21" x2="9" y2="9" />
            </svg>
          </div>
          <div className="stat-info">
            <div className="stat-number">{projects.length}</div>
            <div className="stat-label">Total Projects</div>
          </div>
        </div>
        <div className="stat-card active">
          <div className="stat-icon active-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <div className="stat-info">
            <div className="stat-number">{activeCount}</div>
            <div className="stat-label">Active Projects</div>
          </div>
        </div>
        <div className="stat-card inactive">
          <div className="stat-icon inactive-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="8" y1="12" x2="16" y2="12" />
            </svg>
          </div>
          <div className="stat-info">
            <div className="stat-number">{inactiveCount}</div>
            <div className="stat-label">Inactive Projects</div>
          </div>
        </div>
      </div>

      <div className="search-create-row">
        <div className="search-bar">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search by project name or description..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          />
        </div>
        <button className="create-project-btn" onClick={() => navigate("/dashboard/project-create")}>
          <Plus size={16} /> Create Project
        </button>
      </div>

      <div className="table-wrapper">
        <table className="projects-table">
          <thead>
            <tr>
              <th>S.No</th>
              <th>Project Name</th>
              <th>Status</th>
              <th>Created</th>
              <th>Logs</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedProjects.length === 0 ? (
              <tr><td colSpan={6} className="empty-row">No projects found.</td></tr>
            ) : (
              paginatedProjects.map((project, idx) => (
                <tr key={project.id} className={project.status === "inactive" ? "inactive-row" : ""}>
                  <td>{(currentPage - 1) * rowsPerPage + idx + 1}</td>
                  <td className="project-name">{project.name}</td>
                  <td>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={project.status === "active"}
                        onChange={() => toggleStatus(project.id)}
                      />
                      <span className="slider round"></span>
                    </label>
                    <span className={`status-text ${project.status}`}>
                      {project.status === "active" ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>{project.created}</td>
                  <td>
                    <button className="logs-btn" onClick={() => navigate(`/dashboard/project/${project.id}/logs`)}>
                      <FileText size={14} /> View Logs
                    </button>
                  </td>
                  <td>
                    <div className="actions-dropdown">
                      <button className="three-dots">
                        <Settings size={18} />
                      </button>
                      <div className="dropdown-menu">
                        <div className="dropdown-item" onClick={() => handleView(project)}>
                          <Eye size={14} /> View
                        </div>
                        <div className="dropdown-item" onClick={() => navigate(`/dashboard/project-edit-basic/${project.id}`, { state: { project } })}>
                          <Pencil size={14} /> Edit
                        </div>
                        {/* <div className="dropdown-item" onClick={() => {
                          localStorage.setItem('currentProject', JSON.stringify(project));


                          navigate(
                            "/dashboard/provider-config",
                            {
                              state: {
                                project
                              }
                            }
                          );
                        }}>
                          <Globe size={14} /> Environments
                        </div> */}
                        <div className="dropdown-item delete" onClick={() => setShowDeleteConfirm(project.id)}>
                          <Trash2 size={14} /> Delete
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {filteredProjects.length > 0 && (
        <div className="pagination-container">
          <div className="rows-selector">
            <span>Rows per page:</span>
            <select value={rowsPerPage} onChange={handleRowsChange}>
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={15}>15</option>
            </select>
          </div>
          <div className="pagination">
            <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}>← Previous</button>
            <span className="page-info">Page {currentPage} of {totalPages}</span>
            <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages}>Next →</button>
          </div>
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