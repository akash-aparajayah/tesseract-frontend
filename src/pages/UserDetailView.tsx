import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styles from "../styles/userDetail.module.css";
import noDataImg from "../assets/illustration/No-data.svg";
import {
  getUserDetailsWithProjectsAndEnvironments,
  activateOrDeactivateUserApi,
  // unassignEnvironmentApi,
} from "../services/adminApi";
import { useToast } from "../hooks/useToast";

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

/* ---------------- TYPES ---------------- */
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

interface Project {
  id: string;
  name: string;
  description?: string;
  environment?: EnvironmentItem[];
}

/* ---------------- COMPONENT ---------------- */
const UserDetailView: React.FC = () => {
  const { userId: id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [assignedProjects, setAssignedProjects] = useState<Project[]>([]);
  const [globalSearch, setGlobalSearch] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [togglingStatus, setTogglingStatus] = useState(false);
  const [deletingEnv, setDeletingEnv] = useState<string | null>(null);

  /* ---------------- FETCH USER ---------------- */
  useEffect(() => {
    const fetchUser = async (userId: string) => {
      try {
        setLoading(true);
        const response = await getUserDetailsWithProjectsAndEnvironments(userId);
        const res = response?.data;

        if (!res) {
          setUser(null);
          return;
        }

        const mappedUser: User = {
          id: res.public_id,
          name: res.user_name,
          email: res.email,
          role: res.role ?? "USER",
          active: res.is_active,
        };

        const mappedProjects: Project[] = (res.projects || []).map(
          (project: any) => ({
            id: project.public_id,
            name: project.project_name,
            description: project.project_description,
            environment: (project.environments || []).map((env: any) => ({
              public_id: env.public_id,
              env_name: env.environment_name,
            })),
          })
        );

        setUser(mappedUser);
        setAssignedProjects(mappedProjects);
      } catch (err) {
        console.error("API Error:", err);
        showToast("Failed to load user details", "error");
        setUser(null);
        setAssignedProjects([]);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchUser(id);
  }, [id, showToast]);

  /* ---------------- DRAWER HANDLERS ---------------- */
  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
    setSelectedProject(null);
  }, []);

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeDrawer();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [closeDrawer]);

  /* ---------------- ACTIONS WITH API ---------------- */
  const handleToggleUserStatus = async () => {
    if (!user) return;
    setTogglingStatus(true);
    try {
      await activateOrDeactivateUserApi(user.id, !user.active);
      setUser({ ...user, active: !user.active });
      showToast(`User ${!user.active ? "activated" : "deactivated"}`, "success");
    } catch (error) {
      console.error(error);
      showToast("Failed to update user status", "error");
    } finally {
      setTogglingStatus(false);
    }
  };

  const handleViewEnvironment = (project: Project) => {
    const fresh = assignedProjects.find((p) => p.id === project.id);
    setSelectedProject(fresh || project);
    setDrawerOpen(true);
  };

  const handleDeleteSingleEnvironment = async (envId: string) => {
    if (!selectedProject) return;

    const envToDelete = selectedProject.environment?.find(
      (e) => e.public_id === envId
    );
    if (!envToDelete) return;

    const confirmDelete = window.confirm(
      `Remove environment "${envToDelete.env_name}" from this project?`
    );
    if (!confirmDelete) return;

    setDeletingEnv(envId);
    try {
      // await unassignEnvironmentApi(selectedProject.id, envId);

      const updatedProjects = assignedProjects.map((project) =>
        project.id === selectedProject.id
          ? {
              ...project,
              environment: project.environment?.filter(
                (env) => env.public_id !== envId
              ),
            }
          : project
      );
      setAssignedProjects(updatedProjects);

      setSelectedProject((prev) =>
        prev
          ? {
              ...prev,
              environment: prev.environment?.filter(
                (env) => env.public_id !== envId
              ),
            }
          : null
      );

      showToast("Environment removed successfully", "success");
    } catch (error) {
      console.error(error);
      showToast("Failed to remove environment", "error");
    } finally {
      setDeletingEnv(null);
    }
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

  /* ---------------- FILTER ---------------- */
  const filteredAssignedProjects = useMemo(() => {
    if (!globalSearch.trim()) return assignedProjects;
    return assignedProjects.filter(
      (project) =>
        project.name.toLowerCase().includes(globalSearch.toLowerCase()) ||
        project.description?.toLowerCase().includes(globalSearch.toLowerCase())
    );
  }, [assignedProjects, globalSearch]);

  /* ---------------- LOADING & ERROR ---------------- */
  if (loading) return <Loader />;

  if (!user) {
    return (
      <div className={styles.errorContainer}>
        <AlertCircle size={40} />
        <h3>User Not Found</h3>
        <button
          className={styles.backBtn}
          onClick={() => navigate("/dashboard/admin")}
        >
          <ArrowLeft size={16} /> Back
        </button>
      </div>
    );
  }

  /* ---------------- RENDER ---------------- */
  return (
    <div className={styles.container}>
      <div className={styles.singleColumnLayout}>
        {/* USER CARD */}
        <div className={styles.userCard}>
          <div className={styles.avatarPhotoRow}>
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className={styles.userInfoWrapper}>
            <div className={styles.userTopRow}>
              <h2 className={styles.userName}>{user.name}</h2>
              <span
                className={
                  user.active ? styles.badgeActive : styles.badgeInactive
                }
              >
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
              onClick={!togglingStatus ? handleToggleUserStatus : undefined}
              style={{
                opacity: togglingStatus ? 0.6 : 1,
                cursor: togglingStatus ? "not-allowed" : "pointer",
              }}
            >
              <div className={styles.slider} />
            </div>
          </div>
        </div>

        {/* PROJECTS SECTION */}
        <div className={styles.projectsSection}>
          <div className={styles.sectionHeader}>
            <div className={styles.headerLeft}>
              <Briefcase size={18} />
              <div>
                <h3>Assigned Projects</h3>
                <p>{filteredAssignedProjects.length} Projects</p>
              </div>
            </div>
            <div className={styles.headerSearch}>
              <Search size={15} className={styles.headerSearchIcon} />
              <input
                className={styles.headerSearchInput}
                placeholder="Search projects..."
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
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
                      <p>{project.description}</p>
                      <div className={styles.envListVertical}>
                        {project.environment?.slice(0, 2).map((env) => (
                          <div key={env.public_id} className={styles.envItem}>
                            <span className={styles.envBullet}>•</span>
                            <span className={styles.envName}>{env.env_name}</span>
                          </div>
                        ))}
                        {project.environment && project.environment.length > 2 && (
                          <div className={styles.envMore}>
                            +{project.environment.length - 2} more
                          </div>
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

      {/* DRAWER */}
      {drawerOpen && selectedProject && (
        <>
          <div className={styles.drawerOverlay} onClick={closeDrawer} />
          <div className={styles.drawer}>
            <div className={styles.drawerHeader}>
              <div>
                <h3>Environment Details</h3>
                <p className={styles.drawerProjectName}>{selectedProject.name}</p>
              </div>
              <button className={styles.closeDrawerBtn} onClick={closeDrawer}>
                <X size={18} />
              </button>
            </div>
            <div className={styles.drawerContent}>
              {selectedProject.environment?.length ? (
                <div className={styles.envList}>
                  {selectedProject.environment.map((env) => (
                    <div key={env.public_id} className={styles.envCard}>
                      <div className={styles.envCardHeader}>
                        <strong>
                          <Server size={16} /> {env.env_name}
                        </strong>
                        <button
                          className={styles.deleteEnvBtn}
                          onClick={() =>
                            handleDeleteSingleEnvironment(env.public_id)
                          }
                          disabled={deletingEnv === env.public_id}
                        >
                          {deletingEnv === env.public_id ? (
                            "Removing..."
                          ) : (
                            <>
                              <Trash2 size={14} /> Remove
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.noEnvMessage}>
                  <img src={noDataImg} alt="" />
                  <p>No Environments</p>
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