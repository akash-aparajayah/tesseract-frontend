import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styles from "../styles/userDetail.module.css";
import noDataImg from "../assets/illustration/No-data.svg";
import {
  getUserDetailsWithProjectsAndEnvironments,
  activateOrDeactivateUserApi,
  removeEnvironmentFromUser,
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
  CheckCircle,
  XCircle,
} from "lucide-react";

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

interface ProjectApiResponse {
  public_id: string;
  project_name: string;
  project_description?: string;
  environments?: Array<{
    public_id: string;
    environment_name: string;
  }>;
}

/* ---------------- SKELETON LOADER ---------------- */
const SkeletonLoader: React.FC = () => (
  <div className={styles.skeletonContainer}>
    <div className={styles.skeletonUserCard}>
      <div className={styles.skeletonAvatar} />
      <div className={styles.skeletonUserInfo}>
        <div className={styles.skeletonLine} style={{ width: "60%" }} />
        <div className={styles.skeletonLine} style={{ width: "40%" }} />
        <div className={styles.skeletonLine} style={{ width: "80%" }} />
      </div>
    </div>
    <div className={styles.skeletonProjects}>
      {[1, 2, 3].map((i) => (
        <div key={i} className={styles.skeletonProjectCard} />
      ))}
    </div>
  </div>
);

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
          (project: ProjectApiResponse) => ({
            id: project.public_id,
            name: project.project_name,
            description: project.project_description,
            environment: (project.environments || []).map((env) => ({
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
  if (!selectedProject || !user) return;

  const envToDelete = selectedProject.environment?.find(
    (e) => e.public_id === envId
  );
  if (!envToDelete) return;

  setDeletingEnv(envId);
  try {
    // Call the API
    await removeEnvironmentFromUser({
      user_id: user.id,
      environment_id: envId,
      project_id: selectedProject.id,
    });

    // Update local state (optimistic update)
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

    // Toast with environment name
    showToast(`Environment "${envToDelete.env_name}" removed successfully`, "success");
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

  const filteredAssignedProjects = useMemo(() => {
    if (!globalSearch.trim()) return assignedProjects;
    return assignedProjects.filter(
      (project) =>
        project.name.toLowerCase().includes(globalSearch.toLowerCase()) ||
        project.description?.toLowerCase().includes(globalSearch.toLowerCase())
    );
  }, [assignedProjects, globalSearch]);

  if (loading) return <SkeletonLoader />;

  if (!user) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorCard}>
          <AlertCircle size={48} strokeWidth={1.5} />
          <h3>User Not Found</h3>
          <p>The user you're looking for doesn't exist or has been removed.</p>
          <button
            className={styles.backBtn}
            onClick={() => navigate("/dashboard/admin")}
          >
            <ArrowLeft size={16} /> Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.bgGradient} />
      <div className={styles.bgDotPattern} />

      <div className={styles.singleColumnLayout}>
        {/* USER CARD */}
        <div className={styles.userCard}>
          <div className={styles.userCardGradient} />
          <div className={styles.userCardContent}>
            <div className={styles.avatarSection}>
              <div className={styles.avatarWrapper}>
                <div className={styles.avatarRing}>
                  <div className={styles.avatarPhotoRow}>
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                </div>
                <div
                  className={`${styles.statusDot} ${
                    user.active ? styles.statusActive : styles.statusInactive
                  }`}
                />
              </div>
            </div>
            <div className={styles.userInfoWrapper}>
              <div className={styles.userTopRow}>
                <h2 className={styles.userName}>{user.name}</h2>
                <span
                  className={
                    user.active ? styles.badgeActive : styles.badgeInactive
                  }
                >
                  {user.active ? (
                    <>
                      <CheckCircle size={12} /> Active
                    </>
                  ) : (
                    <>
                      <XCircle size={12} /> Inactive
                    </>
                  )}
                </span>
              </div>
              <div className={styles.userMeta}>
                <div className={styles.userEmail}>
                  <Mail size={14} /> {user.email}
                </div>
                <div className={styles.userRole}>{getRoleDisplay()}</div>
              </div>
              <div className={styles.userStats}>
                <div className={styles.statItem}>
                  <Briefcase size={14} />
                  <span>{assignedProjects.length} Projects</span>
                </div>
                <div className={styles.statDivider} />
                <div className={styles.statItem}>
                  <Server size={14} />
                  <span>
                    {assignedProjects.reduce(
                      (acc, p) => acc + (p.environment?.length || 0),
                      0
                    )}{" "}
                    Environments
                  </span>
                </div>
              </div>
            </div>
            <div className={styles.switchWrapper}>
              <div className={styles.toggleLabel}>
                <span>{user.active ? "Active" : "Inactive"}</span>
              </div>
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
        </div>

        {/* PROJECTS SECTION */}
        <div className={styles.projectsSection}>
          <div className={styles.sectionHeader}>
            <div className={styles.headerLeft}>
              <div className={styles.headerIconWrapper}>
                <Briefcase size={18} />
              </div>
              <div>
                <h3>Assigned Projects</h3>
                <p>
                  {filteredAssignedProjects.length} project
                  {filteredAssignedProjects.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
            <div className={styles.headerSearch}>
              <Search size={16} className={styles.headerSearchIcon} />
              <input
                className={styles.headerSearchInput}
                placeholder="Search projects by name or description..."
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
              />
            </div>
          </div>

          <div className={styles.projectGrid}>
            {filteredAssignedProjects.length === 0 ? (
              <div className={styles.noProjects}>
                <div className={styles.noProjectsContent}>
                  <img src={noDataImg} alt="No data" />
                  <h4>No Projects Found</h4>
                  <p>Try adjusting your search or check back later.</p>
                </div>
              </div>
            ) : (
              filteredAssignedProjects.map((project) => (
                <div key={project.id} className={styles.projectCard}>
                  <div className={styles.projectCardGlow} />
                  <div className={styles.cardContent}>
                    <div className={styles.folderIcon}>
                      <FolderOpen size={24} />
                    </div>
                    <div className={styles.projectInfo}>
                      <strong>{project.name}</strong>
                      <p>{project.description || "No description provided"}</p>
                      <div className={styles.envListVertical}>
                        {project.environment?.slice(0, 3).map((env) => (
                          <div key={env.public_id} className={styles.envItem}>
                            <span className={styles.envBullet}>●</span>
                            <span className={styles.envName}>
                              {env.env_name}
                            </span>
                          </div>
                        ))}
                        {project.environment && project.environment.length > 3 && (
                          <div className={styles.envMore}>
                            +{project.environment.length - 3} more environments
                          </div>
                        )}
                        {(!project.environment ||
                          project.environment.length === 0) && (
                          <div className={styles.envEmpty}>No environments</div>
                        )}
                      </div>
                    </div>
                    <button
                      className={styles.viewBtn}
                      onClick={() => handleViewEnvironment(project)}
                      aria-label="View environments"
                    >
                      <Eye size={16} />
                      <span>View</span>
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
              <div className={styles.drawerHeaderInfo}>
                <div className={styles.drawerHeaderIcon}>
                  <Server size={20} />
                </div>
                <div>
                  <h3>Environment Details</h3>
                  <p className={styles.drawerProjectName}>
                    {selectedProject.name}
                  </p>
                </div>
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
                      <div className={styles.envCardIcon}>
                        <Server size={18} />
                      </div>
                      <div className={styles.envCardInfo}>
                        <strong>{env.env_name}</strong>
                        <span>Environment</span>
                      </div>
                      <button
                        className={styles.deleteEnvBtn}
                        onClick={() =>
                          handleDeleteSingleEnvironment(env.public_id)
                        }
                        disabled={deletingEnv === env.public_id}
                      >
                        {deletingEnv === env.public_id ? (
                          <span >
                            Removing...
                          </span>
                        ) : (
                          <>
                            <Trash2 size={14} /> Remove
                          </>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.noEnvMessage}>
                  <img src={noDataImg} alt="No environments" />
                  <p>No environments assigned to this project</p>
                  <span>Environments will appear here once assigned</span>
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