import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import styles from "../styles/adminPanel.module.css";

import {
  Users,
  UserCheck,
  UserX,
  Search,
  UserPlus,
  Settings,
  Pencil,
  Eye,
  Trash2,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  X,
  Lock,
  Loader2, // fixed import (was Loder2)
} from "lucide-react";

import noDataImg from "../assets/illustration/No data.gif";
import errorImg from "../assets/illustration/error.svg";
// import Loader from "@/components/common/Loader"; // not used anymore
import { useToast } from "../hooks/useToast";

import {
  getAllUsersApi,
  activateOrDeactivateUserApi,
  deleteUserApi,
  createUserApi,
} from "../services/adminApi";

interface Admin {
  id: string;
  user_name: string;
  email: string;
  role: "ADMIN" | "SUPER_ADMIN" | "USER";
  is_active: boolean;
}

interface RawAdmin {
  public_id?: string;
  id?: string;
  user_name: string;
  email: string;
  role: "ADMIN" | "SUPER_ADMIN" | "USER";
  is_active: boolean;
}

const api = {
  async getAdmins(): Promise<Admin[]> {
    try {
      const response = await getAllUsersApi();
      const data = response?.data?.data as RawAdmin[];
      if (!data || !Array.isArray(data) || data.length === 0) return [];
      return data
        .map((item: RawAdmin) => {
          const id = item.public_id ?? item.id;
          if (!id) return null;
          return {
            id,
            user_name: item.user_name,
            email: item.email,
            role: item.role,
            is_active: item.is_active,
          };
        })
        .filter((item): item is Admin => item !== null);
    } catch (error) {
      console.error("GET ADMINS ERROR:", error);
      return [];
    }
  },

  async toggleStatus(id: string, currentActive: boolean) {
    await activateOrDeactivateUserApi(id, !currentActive);
    return true;
  },

  async deleteAdmin(id: string): Promise<void> {
    await deleteUserApi(id);
  },

  async createAdmin(
    admin: Omit<Admin, "id"> & { password: string }
  ): Promise<Admin> {
    const response = await createUserApi(
      admin.user_name,
      admin.email,
      admin.password,
      admin.role,
      admin.is_active
    );
    const userData = response.data.data;
    return {
      id: userData.public_id,
      user_name: userData.user_name,
      email: userData.email,
      role: userData.role,
      is_active: userData.is_active,
    };
  },
};

const getInitials = (name: string) => name?.charAt(0)?.toUpperCase() || "";

/* ---------- SKELETON LOADER (MOVED OUTSIDE COMPONENT) ---------- */
const SkeletonLoader: React.FC = () => {
  const skeletonPulse = {
    animation: "skeletonPulse 1.5s ease-in-out infinite",
    background: "#e2e8f0",
    borderRadius: "0.75rem",
  };
  return (
    <>
      <style>{`
        @keyframes skeletonPulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }
      `}</style>
      <div className={styles.statsGrid}>
        {[1, 2, 3].map((i) => (
          <div key={i} className={styles.statCard} style={{ ...skeletonPulse, height: "100px" }} />
        ))}
      </div>
      <div className={styles.toolbar}>
        <div className={styles.searchBox} style={{ ...skeletonPulse, height: "40px", width: "260px" }} />
        <div className={styles.actionsGroup} style={{ display: "flex", gap: "0.75rem" }}>
          <div style={{ ...skeletonPulse, width: "120px", height: "40px", borderRadius: "2rem" }} />
          <div style={{ ...skeletonPulse, width: "120px", height: "40px", borderRadius: "2rem" }} />
          <div style={{ ...skeletonPulse, width: "120px", height: "40px", borderRadius: "2rem" }} />
        </div>
      </div>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>S.NO</th><th>User</th><th>Email</th><th>Role</th><th>Status</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4, 5].map((i) => (
              <tr key={i}>
                <td><div style={{ ...skeletonPulse, height: "20px", width: "30px" }} /></td>
                <td><div style={{ ...skeletonPulse, height: "40px", width: "150px", borderRadius: "2rem" }} /></td>
                <td><div style={{ ...skeletonPulse, height: "20px", width: "180px" }} /></td>
                <td><div style={{ ...skeletonPulse, height: "24px", width: "80px", borderRadius: "2rem" }} /></td>
                <td><div style={{ ...skeletonPulse, height: "28px", width: "90px", borderRadius: "2rem" }} /></td>
                <td><div style={{ ...skeletonPulse, height: "32px", width: "32px", borderRadius: "50%" }} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

/* ---------- MAIN COMPONENT ---------- */
const AdminPanel: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "ADMIN" | "SUPER_ADMIN" | "USER">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 5;
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "USER" as "ADMIN" | "SUPER_ADMIN" | "USER",
    active: true,
  });
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState("");

  const fetchAdmins = useCallback(async () => {
    try {
      setLoading(true);
      setFetchError(null);
      const data = await api.getAdmins();
      setAdmins(data);
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : "Failed to load admins");
      setAdmins([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const loadAdmins = async () => {
      await fetchAdmins();
    };

    loadAdmins();
  }, [fetchAdmins]);

  const totalCount = admins.length;
  const activeCount = admins.filter((a) => a.is_active).length;
  const inactiveCount = admins.filter((a) => !a.is_active).length;

  const filteredAdmins = useMemo(() => {
    let filtered = [...admins];
    if (searchTerm) {
      filtered = filtered.filter(
        (admin) =>
          admin.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          admin.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (roleFilter !== "all") filtered = filtered.filter((admin) => admin.role === roleFilter);
    if (statusFilter !== "all") {
      const isActive = statusFilter === "active";
      filtered = filtered.filter((admin) => admin.is_active === isActive);
    }
    return filtered;
  }, [admins, searchTerm, roleFilter, statusFilter]);

  const totalPages = Math.ceil(filteredAdmins.length / rowsPerPage);
  const paginatedAdmins = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredAdmins.slice(start, start + rowsPerPage);
  }, [filteredAdmins, currentPage]);

  useEffect(() => setCurrentPage(1), [searchTerm, roleFilter, statusFilter]);
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) setCurrentPage(totalPages);
    else if (totalPages === 0) setCurrentPage(1);
  }, [currentPage, totalPages]);

  const handleToggleStatus = async (id: string, currentActive: boolean) => {
    try {
      await api.toggleStatus(id, currentActive);
      setAdmins((prev) =>
        prev.map((admin) => (admin.id === id ? { ...admin, is_active: !currentActive } : admin))
      );
      showToast(`User ${!currentActive ? "activated" : "deactivated"}`, "success");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Failed to toggle status", "error");
    }
  };

  const handleView = (admin: Admin) => navigate(`/dashboard/user/${admin.id}`);
  const handleEdit = (admin: Admin) => navigate(`/dashboard/user/${admin.id}/edit`);
  const handleDelete = async (id: string) => {
    try {
      await api.deleteAdmin(id);
      setAdmins((prev) => prev.filter((admin) => admin.id !== id));
      showToast("User deleted successfully", "success");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Failed to delete admin", "error");
    }
  };

  const openDrawer = () => {
    setFormData({
      name: "",
      email: "",
      password: "",
      role: "USER",
      active: true,
    });
    setFormError("");
    setIsClosing(false);
    setIsDrawerOpen(true);
  };

  const closeDrawerWithAnimation = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsDrawerOpen(false);
      setIsClosing(false);
    }, 400);
  };

  const validateForm = () => {
    if (!formData.name.trim()) return "Name is required";
    if (!formData.email.trim()) return "Email is required";
    if (!formData.password) return "Password is required";
    if (formData.password.length < 8) return "Password must be at least 8 characters";
    return "";
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validateForm();
    if (err) {
      setFormError(err);
      return;
    }
    setCreating(true);
    setFormError("");
    try {
      const newUser = await api.createAdmin({
        user_name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        role: formData.role,
        is_active: formData.active,
      });
      if (newUser && newUser.id) {
        showToast("User created successfully", "success");
        closeDrawerWithAnimation();
        navigate(`/dashboard/user/${newUser.id}/assign-projects`);
      } else {
        throw new Error("User ID missing from API response");
      }
    } catch (error) {
      console.error("Create error:", error);
      showToast(error instanceof Error ? error.message : "Failed to create admin", "error");
      setCreating(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (openDropdownId && !(e.target as Element).closest(".actionMenu")) {
        setOpenDropdownId(null);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [openDropdownId]);

  const toggleDropdown = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenDropdownId((prev) => (prev === id ? null : id));
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "SUPER_ADMIN":
        return styles.roleSuper;
      case "ADMIN":
        return styles.roleAdmin;
      default:
        return styles.roleUser;
    }
  };

  const getRoleDisplay = (role: string) => {
    switch (role) {
      case "SUPER_ADMIN":
        return "Super Admin";
      case "ADMIN":
        return "Admin";
      default:
        return "User";
    }
  };

  if (loading) return <SkeletonLoader />;

  return (
    <div className={styles.container}>
      {fetchError && (
        <div className={styles.errorBanner}>
          <AlertCircle size={16} />
          <span>{fetchError}</span>
          <button onClick={() => setFetchError(null)}>
            <X size={14} />
          </button>
        </div>
      )}

      <div className={styles.statsGrid}>
        <div className={`${styles.statCard} ${styles.cardTotal}`}>
          <div className={styles.leftArt}></div>
          <div className={styles.leftDots}></div>
          <div className={styles.leftLine}></div>
          <div className={styles.lineOverlay}></div>
          <div className={styles.statLeft}>
            <div className={styles.statLabel}>Total Users</div>
            <div className={styles.statNumber}>{totalCount}</div>
          </div>
          <div className={styles.centerGem}></div>
          <div className={styles.statIcon}>
            <Users size={26} />
          </div>
        </div>

        <div className={`${styles.statCard} ${styles.cardActive}`}>
          <div className={styles.leftArt}></div>
          <div className={styles.leftDots}></div>
          <div className={styles.leftLine}></div>
          <div className={styles.lineOverlay}></div>
          <div className={styles.statLeft}>
            <div className={styles.statLabel}>Active</div>
            <div className={styles.statNumber}>{activeCount}</div>
          </div>
          <div className={styles.centerGem}></div>
          <div className={styles.statIcon}>
            <UserCheck size={26} />
          </div>
        </div>

        <div className={`${styles.statCard} ${styles.cardInactive}`}>
          <div className={styles.leftArt}></div>
          <div className={styles.leftDots}></div>
          <div className={styles.leftLine}></div>
          <div className={styles.lineOverlay}></div>
          <div className={styles.statLeft}>
            <div className={styles.statLabel}>Inactive</div>
            <div className={styles.statNumber}>{inactiveCount}</div>
          </div>
          <div className={styles.centerGem}></div>
          <div className={styles.statIcon}>
            <UserX size={26} />
          </div>
        </div>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.searchBox}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className={styles.searchInput}
          />
        </div>
        <div className={styles.actionsGroup}>
          <select
            className={styles.roleSelect}
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value as never);
              setCurrentPage(1);
            }}
          >
            <option value="all">All Roles</option>
            <option value="SUPER_ADMIN">Super Admin</option>
            <option value="ADMIN">Admin</option>
            <option value="USER">User</option>
          </select>
          <select
            className={styles.roleSelect}
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as never);
              setCurrentPage(1);
            }}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <button className={styles.addBtn} onClick={openDrawer}>
            <UserPlus size={16} /> Add User
          </button>
        </div>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.colNo}>S.NO</th>
              <th className={styles.colUser}>User</th>
              <th className={styles.colEmail}>Email</th>
              <th className={styles.colRole}>Role</th>
              <th className={styles.colStatus}>Status</th>
              <th className={styles.colActions}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedAdmins.length > 0 ? (
              paginatedAdmins.map((admin, index) => {
                const serialNumber = (currentPage - 1) * rowsPerPage + index + 1;
                return (
                  <tr key={admin.id}>
                    <td className={styles.colNo}>{serialNumber}</td>
                    <td className={styles.colUser}>
                      <div className={styles.userCell}>
                        <div className={styles.userAvatar}>{getInitials(admin.user_name)}</div>
                        <span className={styles.userName}>{admin.user_name}</span>
                      </div>
                    </td>
                    <td className={styles.colEmail}>{admin.email}</td>
                    <td className={styles.colRole}>
                      <span className={`${styles.roleBadge} ${getRoleBadge(admin.role)}`}>
                        {getRoleDisplay(admin.role)}
                      </span>
                    </td>
                    <td className={styles.colStatus}>
                      <div
                        className={`${styles.toggleCompact} ${admin.is_active ? styles.active : ""}`}
                        onClick={() => handleToggleStatus(admin.id, admin.is_active)}
                      >
                        <div className={styles.knob}>
                          <svg viewBox="0 0 24 24" stroke="currentColor">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                          </svg>
                        </div>
                        <span className={`${styles.statusText} ${styles.textInactive}`}>Inactive</span>
                        <span className={`${styles.statusText} ${styles.textActive}`}>Active</span>
                      </div>
                    </td>
                    <td className={styles.colActions}>
                      <div className="actionMenu">
                        <button className={styles.dotsBtn} onClick={(e) => toggleDropdown(admin.id, e)}>
                          <Settings size={16} />
                        </button>
                        {openDropdownId === admin.id && (
                          <div className={styles.dropdown}>
                            <button onClick={() => handleView(admin)}>
                              <Eye size={14} /> View
                            </button>
                            <button onClick={() => handleEdit(admin)}>
                              <Pencil size={14} /> Edit
                            </button>
                            <button className={styles.deleteBtn} onClick={() => handleDelete(admin.id)}>
                              <Trash2 size={14} /> Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={6} className={styles.noData}>
                  <img src={fetchError ? errorImg : noDataImg} alt="No data" className={styles.noDataImg} />
                  <p>
                    {fetchError ? "Unable to load users. Please try again." : "No users found"}
                  </p>
                  {fetchError && (
                    <button onClick={fetchAdmins} className={styles.retryBtn}>
                      Retry
                    </button>
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            className={styles.pageBtn}
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => p - 1)}
          >
            <ChevronLeft size={14} /> Prev
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              className={`${styles.pageBtn} ${currentPage === page ? styles.activePage : ""}`}
              onClick={() => setCurrentPage(page)}
            >
              {page}
            </button>
          ))}
          <button
            className={styles.pageBtn}
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => p + 1)}
          >
            Next <ChevronRight size={14} />
          </button>
          <span className={styles.pageInfo}>
            Page {currentPage} of {totalPages}
          </span>
        </div>
      )}

      {isDrawerOpen && (
        <>
          <div
            className={`${styles.drawerOverlay} ${isClosing ? styles.drawerOverlayClosing : ""}`}
            onClick={closeDrawerWithAnimation}
          />
          <div className={`${styles.drawer} ${isClosing ? styles.drawerClosing : ""}`}>
            <div className={styles.drawerHeader}>
              <h3>Create New User</h3>
              <button className={styles.drawerClose} onClick={closeDrawerWithAnimation}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateSubmit} className={styles.drawerForm}>
              {formError && <div className={styles.formError}>{formError}</div>}

              <div className={styles.formGroup}>
                <label>
                  Full Name <span className={styles.requiredStar}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter full name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  autoFocus
                />
              </div>

              <div className={styles.formGroup}>
                <label>
                  Email <span className={styles.requiredStar}>*</span>
                </label>
                <input
                  type="email"
                  placeholder="user@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div className={styles.formGroup}>
                <label>
                  Password <span className={styles.requiredStar}>*</span>{" "}
                  <span className={styles.passwordHint}>(min 8 characters)</span>
                </label>
                <div className={styles.passwordWrapper}>
                  <Lock size={16} className={styles.passwordIcon} />
                  <input
                    type="password"
                    placeholder="Enter password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>
                  Role <span className={styles.requiredStar}>*</span>
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as never })}
                >
                  <option value="USER">User</option>
                  <option value="ADMIN">Admin</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>
                  Status <span className={styles.requiredStar}>*</span>
                </label>
                <select
                  value={formData.active ? "active" : "inactive"}
                  onChange={(e) => setFormData({ ...formData, active: e.target.value === "active" })}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className={styles.drawerActions}>
                <button type="button" className={styles.cancelBtn} onClick={closeDrawerWithAnimation}>
                  Cancel
                </button>
                <button type="submit" className={styles.submitBtn} disabled={creating}>
                  {creating ? (
                    <>
                      <Loader2 size={16} className={styles.spinner} /> Creating...
                    </>
                  ) : (
                    "Create User"
                  )}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminPanel;