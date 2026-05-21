import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styles from "../styles/userDetail.module.css";
import noDataImg from "../assets/illustration/No-data.svg";

import {
  ArrowLeft,
  Mail,
  Briefcase,
  AlertCircle,
  Eye,
  X,
  Server,
  FolderOpen,
  Search,
  Trash2,
} from "lucide-react";

import Loader from "@/components/common/Loader";

interface User {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "SUPER_ADMIN" | "USER";
  active: boolean;
}

interface EnvironmentItem {
  public_id: string;
  env_name: string;
}

type Environment = EnvironmentItem[];

interface Project {
  id: string;
  name: string;
  description?: string;
  environment?: Environment;
}

const MOCK_USER: User = {
  id: "1",
  name: "John Doe",
  email: "john.doe@example.com",
  role: "USER",
  active: true,
};

const MOCK_ASSIGNED_PROJECTS: Project[] = [
  {
    id: "1",
    name: "E-Commerce Platform",
    description: "Frontend + Backend Integration",
    environment: [
      { public_id: "1", env_name: "Production" },
      { public_id: "2", env_name: "Staging" },
      { public_id: "3", env_name: "Development" },
      { public_id: "10", env_name: "Sandbox" },
    ],
  },
  {
    id: "2",
    name: "Analytics Dashboard",
    description: "Real-time monitoring system",
    environment: [
      { public_id: "4", env_name: "UAT" },
      { public_id: "5", env_name: "Preview" },
    ],
  },
  {
    id: "3",
    name: "Mobile Application",
    description: "Cross platform mobile app",
    environment: [
      { public_id: "7", env_name: "Demo" },
      { public_id: "8", env_name: "QA" },
    ],
  },
];

const UserDetailView: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [assignedProjects, setAssignedProjects] = useState<Project[]>([]);
  const [globalSearch, setGlobalSearch] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false); // ✅ Added missing state
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setUser(MOCK_USER);
      setAssignedProjects(MOCK_ASSIGNED_PROJECTS);
      setLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, [id]);

  // Optional: Close drawer on ESC key
  const closeDrawer = () => {
    setDrawerOpen(false);
    setSelectedProject(null);
  };

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape" && drawerOpen) {
        closeDrawer();
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [drawerOpen]);

  const handleToggleUserStatus = () => {
    if (!user) return;
    setUser({ ...user, active: !user.active });
  };

  const handleViewEnvironment = (project: Project) => {
    setSelectedProject(project);
    setDrawerOpen(true);
  };

  const handleDeleteSingleEnvironment = (envId: string) => {
    if (!selectedProject) return;
    const envToDelete = selectedProject.environment?.find(e => e.public_id === envId);
    const confirmDelete = window.confirm(
      `Delete environment "${envToDelete?.env_name}" from "${selectedProject.name}"?`
    );
    if (!confirmDelete) return;

    const updatedProjects = assignedProjects.map((project) =>
      project.id === selectedProject.id
        ? {
            ...project,
            environment: project.environment?.filter((env) => env.public_id !== envId),
          }
        : project
    );
    setAssignedProjects(updatedProjects);
    setSelectedProject({
      ...selectedProject,
      environment: selectedProject.environment?.filter((env) => env.public_id !== envId),
    });
  };

  const getRoleDisplay = () => {
    switch (user?.role) {
      case "SUPER_ADMIN":
        return "Super Admin";
      case "ADMIN":
        return "Admin";
      default:
        return "User";
    }
  };

  const filteredAssignedProjects = useMemo(() => {
    if (!globalSearch.trim()) return assignedProjects;
    return assignedProjects.filter(
      (project) =>
        project.name.toLowerCase().includes(globalSearch.toLowerCase()) ||
        project.description?.toLowerCase().includes(globalSearch.toLowerCase())
    );
  }, [assignedProjects, globalSearch]);

  if (loading) return <Loader />;

  if (!user) {
    return (
      <div className={styles.errorContainer}>
        <AlertCircle size={40} />
        <h3>User Not Found</h3>
        <button className={styles.backBtn} onClick={() => navigate("/dashboard/admin")}>
          <ArrowLeft size={16} /> Back
        </button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.singleColumnLayout}>
        {/* USER CARD */}
        <div className={styles.userCard}>
          <div className={styles.avatarPhotoRow}>
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className={styles.userInfoWrapper}>
            <div className={styles.userTopRow}>
              <h2 className={styles.userName}>{user.name}</h2>
              <span className={user.active ? styles.badgeActive : styles.badgeInactive}>
                {user.active ? "Active" : "Inactive"}
              </span>
            </div>
            <div className={styles.userMeta}>
              <div className={styles.userEmail}>
                <Mail size={15} /> {user.email}
              </div>
              <div className={styles.userRole}>{getRoleDisplay()}</div>
            </div>
          </div>
          <div className={styles.switchWrapper}>
            <div
              className={`${styles.switch} ${user.active ? styles.active : ""}`}
              onClick={handleToggleUserStatus}
            >
              <div className={styles.slider} />
            </div>
          </div>
        </div>

        {/* PROJECTS SECTION */}
        <div className={styles.projectsSection}>
          <div className={styles.sectionHeader}>
            <div className={styles.headerLeft}>
              <div className={styles.sectionIcon}>
                <Briefcase size={18} />
              </div>
              <div>
                <h3>Assigned Projects</h3>
                <p>{filteredAssignedProjects.length} Projects</p>
              </div>
            </div>
            <div className={styles.headerSearch}>
              <Search size={15} className={styles.headerSearchIcon} />
              <input
                type="text"
                placeholder="Search projects..."
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                className={styles.headerSearchInput}
              />
            </div>
          </div>

          <div className={styles.projectGrid}>
            {filteredAssignedProjects.length === 0 ? (
              <div className={styles.noProjects}>
                <p>No Projects Found</p>
                <img src={noDataImg} alt="No data" />
              </div>
            ) : (
              filteredAssignedProjects.map((project) => (
                <div key={project.id} className={styles.projectCard}>
                  <div className={styles.cardContent}>
                    <div className={styles.folderIcon}>
                      <FolderOpen size={24} />
                    </div>
                    <div className={styles.projectInfo}>
                      <strong>{project.name}</strong>
                      <p>{project.description || "No description available"}</p>
                      
                      {/* Environment list as vertical bullet points */}
                      <div className={styles.envListVertical}>
                        {project.environment && project.environment.length > 0 ? (
                          <>
                            {project.environment.slice(0, 2).map((env) => (
                              <div key={env.public_id} className={styles.envItem}>
                                <span className={styles.envBullet}>•</span>
                                <span className={styles.envName}>{env.env_name}</span>
                              </div>
                            ))}
                            {project.environment.length > 2 && (
                              <div className={styles.envMore}>
                                +{project.environment.length - 2} more
                              </div>
                            )}
                          </>
                        ) : (
                          <div className={styles.noEnvBadge}>No environments</div>
                        )}
                      </div>
                    </div>
                    <button
                      className={styles.viewBtn}
                      onClick={() => handleViewEnvironment(project)}
                    >
                      <Eye size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* DRAWER - list all environments with individual delete */}
      {drawerOpen && selectedProject && (
        <>
          <div className={styles.drawerOverlay} onClick={closeDrawer} />
          <div className={styles.drawer}>
            <div className={styles.drawerHeader}>
              <div>
                <h3>Environment Details</h3>
                <p className={styles.drawerProjectName}>{selectedProject.name}</p>
              </div>
              <button onClick={closeDrawer} className={styles.closeDrawerBtn}>
                <X size={18} />
              </button>
            </div>
            <div className={styles.drawerContent}>
              {selectedProject.environment && selectedProject.environment.length > 0 ? (
                <div className={styles.envList}>
                  {selectedProject.environment.map((env) => (
                    <div key={env.public_id} className={styles.envCard}>
                      <div className={styles.envCardHeader}>
                        <Server size={18} />
                        <strong>{env.env_name}</strong>
                        <button
                          onClick={() => handleDeleteSingleEnvironment(env.public_id)}
                          className={styles.deleteEnvBtn}
                        >
                          <Trash2 size={15} /> Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.noEnvMessage}>
                  <img src={noDataImg} alt="No environment" />
                  <p>No Environments Configured</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default UserDetailView;