import React, { useState, useMemo, useEffect, useCallback } from "react";
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
} from "lucide-react";

import noDataImg from "../assets/illustration/No data.svg";
import errorImg from "../assets/illustration/error.svg";
import Loader from "@/components/common/Loader";

import {
getAllUsersApi,
activateOrDeactivateUserApi,

} from "../services/adminApi";

/* =========================================================
   TYPES (matching actual API)
========================================================= */

interface Admin {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "SUPER_ADMIN";
  active: boolean;
}

/* =========================================================
   API SERVICE LAYER (NO FALLBACK DATA)
========================================================= */

const api = {
  async getAdmins(): Promise<Admin[]> {
    try {
      const response = await getAllUsersApi();
      console.log("GET USERS RESPONSE:", response);
      const data = response?.data?.data;
      if (!data || !Array.isArray(data) || data.length === 0) {
        return [];
      }
      return data.map((item: Admin) => ({
        id: item.id,
        name: item.name,
        email: item.email,
        role: item.role,
        active: item.active,
      }));
    } catch (error) {
      console.error("GET ADMINS ERROR:", error);
      return []; // empty array → triggers illustration
    }
  },

  async toggleStatus(id: string, currentActive: boolean): Promise<Admin> {
    try {
      const newActive = !currentActive;
      const response = await activateOrDeactivateUserApi(id, newActive);
      return response.data;
    } catch (error) {
      console.error("TOGGLE STATUS ERROR:", error);
      throw error;
    }
  },

  async deleteAdmin(id: string): Promise<void> {
    try {
      await deleteUserApi(id);
    } catch (error) {
      console.error("DELETE ADMIN ERROR:", error);
      throw error;
    }
  },

  async createAdmin(admin: Omit<Admin, "id">): Promise<Admin> {
    try {
      const response = await createUserApi(admin);
      return response.data;
    } catch (error) {
      console.error("CREATE ADMIN ERROR:", error);
      throw error;
    }
  },
};

/* =========================================================
   HELPERS
========================================================= */

const getInitials = (name: string) => name?.charAt(0)?.toUpperCase();

/* =========================================================
   MAIN COMPONENT
========================================================= */

const AdminPanel: React.FC = () => {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "ADMIN" | "SUPER_ADMIN">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 5;
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  /* =========================================================
     FETCH ADMINS
  ========================================================= */
  const fetchAdmins = useCallback(async () => {
    try {
      setLoading(true);
      setFetchError(null);
      const data = await api.getAdmins();
      setAdmins(data);
      if (data.length === 0) {
        console.log("No admins found");
      }
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : "Failed to load admins");
      setAdmins([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  /* =========================================================
     STATS
  ========================================================= */
  const totalCount = admins.length;
  const activeCount = admins.filter((a) => a.active).length;
  const inactiveCount = admins.filter((a) => !a.active).length;

  /* =========================================================
     FILTERING & PAGINATION
  ========================================================= */
  const filteredAdmins = useMemo(() => {
    let filtered = [...admins];

    if (searchTerm) {
      filtered = filtered.filter(
        (admin) =>
          admin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          admin.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (roleFilter !== "all") {
      filtered = filtered.filter((admin) => admin.role === roleFilter);
    }
    if (statusFilter !== "all") {
      const isActive = statusFilter === "active";
      filtered = filtered.filter((admin) => admin.active === isActive);
    }
    return filtered;
  }, [admins, searchTerm, roleFilter, statusFilter]);

  const totalPages = Math.ceil(filteredAdmins.length / rowsPerPage);
  const paginatedAdmins = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredAdmins.slice(start, start + rowsPerPage);
  }, [filteredAdmins, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, roleFilter, statusFilter]);

  // Clamp current page if it exceeds total pages
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    } else if (totalPages === 0) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  /* =========================================================
     ACTIONS
  ========================================================= */
  const handleToggleStatus = async (id: string, currentActive: boolean) => {
    try {
      const updatedAdmin = await api.toggleStatus(id, currentActive);
      setAdmins((prev) =>
        prev.map((admin) => (admin.id === id ? updatedAdmin : admin))
      );
    } catch (error) {
      alert("Failed to update status");
    }
  };

  const handleView = (admin: Admin) => {
    alert(`Name: ${admin.name}\nEmail: ${admin.email}\nRole: ${admin.role}\nActive: ${admin.active}`);
  };

  const handleEdit = (admin: Admin) => {
    alert(`Edit ${admin.name}`);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this admin permanently?")) return;
    try {
      await api.deleteAdmin(id);
      setAdmins((prev) => prev.filter((admin) => admin.id !== id));
    } catch (error) {
      alert("Failed to delete admin");
    }
  };

  const handleAddAdmin = () => {
    alert("Open Add Admin Modal");
  };

  // Dropdown logic
  useEffect(() => {
    const handleClickOutside = () => setOpenDropdownId(null);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

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

  /* =========================================================
     LOADING
  ========================================================= */
  if (loading) return <Loader />;

  return (
    <div className={styles.container}>
      {/* Non‑blocking error banner */}
      {fetchError && (
        <div className={styles.errorBanner}>
          <AlertCircle size={16} />
          <span>{fetchError}</span>
          <button onClick={() => setFetchError(null)}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* Header */}
      <div className={styles.header}>
        <h1>Admin Control Panel</h1>
      </div>

      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        <div className={`${styles.statCard} ${styles.cardTotal}`}>
          <div className={styles.statLeft}>
            <div className={styles.statLabel}>Total Users</div>
            <div className={styles.statNumber}>{totalCount}</div>
          </div>
          <div className={styles.statIcon}>
            <Users size={22} />
          </div>
        </div>
        <div className={`${styles.statCard} ${styles.cardActive}`}>
          <div className={styles.statLeft}>
            <div className={styles.statLabel}>Active</div>
            <div className={styles.statNumber}>{activeCount}</div>
          </div>
          <div className={styles.statIcon}>
            <UserCheck size={22} />
          </div>
        </div>
        <div className={`${styles.statCard} ${styles.cardInactive}`}>
          <div className={styles.statLeft}>
            <div className={styles.statLabel}>Inactive</div>
            <div className={styles.statNumber}>{inactiveCount}</div>
          </div>
          <div className={styles.statIcon}>
            <UserX size={22} />
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.searchBox}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        <div className={styles.actionsGroup}>
          <select
            className={styles.roleSelect}
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as any)}
          >
            <option value="all">All Roles</option>
            <option value="SUPER_ADMIN">Super Admin</option>
            <option value="ADMIN">Admin</option>
          </select>
          <select
            className={styles.roleSelect}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <button className={styles.addBtn} onClick={handleAddAdmin}>
            <UserPlus size={16} /> Add User
          </button>
        </div>
      </div>

      {/* Table with conditional illustrations */}
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
                        <div className={styles.userAvatar}>
                          {getInitials(admin.name)}
                        </div>
                        <span className={styles.userName}>{admin.name}</span>
                      </div>
                    </td>
                    <td className={styles.colEmail}>{admin.email}</td>
                    <td className={styles.colRole}>
                      <span
                        className={`${styles.roleBadge} ${getRoleBadge(admin.role)}`}
                      >
                        {getRoleDisplay(admin.role)}
                      </span>
                    </td>
                    <td className={styles.colStatus}>
                      <div className={styles.statusCell}>
                        <div
                          className={`${styles.toggle} ${admin.active ? styles.active : ""}`}
                          onClick={() => handleToggleStatus(admin.id, admin.active)}
                        >
                          <div className={styles.knob} />
                        </div>
                        <span
                          className={`${styles.statusText} ${
                            admin.active ? styles.statusActive : styles.statusInactive
                          }`}
                        >
                          {admin.active ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </td>
                    <td className={styles.colActions}>
                      <div className={styles.actionMenu}>
                        <button
                          className={styles.dotsBtn}
                          onClick={(e) => toggleDropdown(admin.id, e)}
                        >
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
                            <button
                              className={styles.deleteBtn}
                              onClick={() => handleDelete(admin.id)}
                            >
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
                  <img
                    src={fetchError ? errorImg : noDataImg}
                    alt={fetchError ? "Error" : "No Data"}
                    className={styles.noDataImg}
                  />
                  <p>
                    {fetchError
                      ? "Unable to load users. Please try again."
                      : "No users found"}
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

      {/* Pagination */}
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
              className={`${styles.pageBtn} ${
                currentPage === page ? styles.activePage : ""
              }`}
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
    </div>
  );
};

export default AdminPanel;