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
} from "lucide-react";

import noDataImg from "../assets/No data-cuate.svg";
import Loader from "@/components/common/Loader";

import { getAllAdminApi } from "../services/adminApi";

/* =========================================================
   TYPES
========================================================= */

interface Admin {
  id: number;
  name: string;
  email: string;
  role: "admin" | "super_admin" | "viewer";
  status: boolean;
}

/* =========================================================
   DEFAULT FALLBACK DATA
   This data will show if API fails or returns empty.
========================================================= */

const fallbackAdmins: Admin[] = [
  {
    id: 1,
    name: "Super Admin",
    email: "superadmin@example.com",
    role: "super_admin",
    status: true,
  },
  {
    id: 2,
    name: "Admin User",
    email: "admin@example.com",
    role: "admin",
    status: true,
  },
  {
    id: 3,
    name: "Viewer User",
    email: "viewer@example.com",
    role: "viewer",
    status: false,
  },
];

/* =========================================================
   API SERVICE LAYER
========================================================= */

const api = {
  async getAdmins(): Promise<Admin[]> {
    try {
      const response = await getAllAdminApi();
      console.log("GET ADMINS RESPONSE:", response);
      if (!response || response.status !== 200) {
        throw new Error("Failed to fetch admins");
      }

      const data = await response.data;

      /* =========================================================
         IF BACKEND RETURNS EMPTY ARRAY
         RETURN EMPTY ARRAY
         SO ILLUSTRATION WILL SHOW
      ========================================================= */
      if (!data || data.length === 0) {
        return [];
      }

      return data;
    } catch (error) {
      console.error("GET ADMINS ERROR:", error);

      /* =========================================================
         IF API FAILS
         RETURN DEFAULT DATA
      ========================================================= */
      return fallbackAdmins;
    }
  },

  /* =========================================================
     CREATE ADMIN
  ========================================================= */
  async createAdmin(admin: Omit<Admin, "id">): Promise<Admin> {
    try {
      const response = await fetch("/api/admins", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(admin),
      });

      if (!response.ok) {
        throw new Error("Failed to create admin");
      }

      return await response.json();
    } catch (error) {
      console.error("CREATE ADMIN ERROR:", error);
      throw error;
    }
  },

  /* =========================================================
     TOGGLE STATUS
  ========================================================= */
  async toggleStatus(id: number, currentStatus: string): Promise<Admin> {
    try {
      const newStatus = currentStatus === "Active" ? "Inactive" : "Active";

      const response = await fetch(await toggleAdminStatusApi(id), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to toggle status");
      }

      return await response.json();
    } catch (error) {
      console.error("TOGGLE STATUS ERROR:", error);
      throw error;
    }
  },
};

/* =========================================================
   HELPERS
========================================================= */

const getInitials = (name: string) => {
  return name.charAt(0).toUpperCase();
};

/* =========================================================
   MAIN COMPONENT
========================================================= */

const AdminPanel: React.FC = () => {
  /* =========================================================
     STATE
  ========================================================= */

  const [admins, setAdmins] = useState<Admin[]>([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  /* =========================================================
     FILTER STATES
  ========================================================= */

  const [searchTerm, setSearchTerm] = useState("");

  const [roleFilter, setRoleFilter] = useState<
    "all" | "admin" | "super_admin" | "viewer"
  >("all");

  /* =========================================================
     SECOND FILTER
     STATUS FILTER
  ========================================================= */

  const [statusFilter, setStatusFilter] = useState<
    "all" | true | false
  >("all");

  /* =========================================================
     PAGINATION
  ========================================================= */

  const [currentPage, setCurrentPage] = useState(1);

  const rowsPerPage = 5;

  /* =========================================================
     FETCH ADMINS
  ========================================================= */

  const fetchAdmins = useCallback(async () => {
    try {
      setLoading(true);

      setError(null);

      const data = await api.getAdmins();

      setAdmins(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load admins");
    } finally {
      setLoading(false);
    }
  }, []);

  /* =========================================================
     LOAD DATA ON MOUNT
  ========================================================= */

  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  /* =========================================================
     STATS
  ========================================================= */

  const totalCount = admins.length;

  const activeCount = admins.filter((a) => a.status === true).length;

  const inactiveCount = admins.filter((a) => a.status === false).length;

  /* =========================================================
     FILTERING
  ========================================================= */

  const filteredAdmins = useMemo(() => {
    let filtered = [...admins];

    /* SEARCH FILTER */
    if (searchTerm) {
      filtered = filtered.filter(
        (admin) =>
          admin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          admin.email.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    /* ROLE FILTER */
    if (roleFilter !== "all") {
      filtered = filtered.filter((admin) => admin.role === roleFilter);
    }

    /* STATUS FILTER */
    if (statusFilter !== "all") {
      filtered = filtered.filter((admin) => admin.status === statusFilter);
    }

    return filtered;
  }, [admins, searchTerm, roleFilter, statusFilter]);

  /* =========================================================
     PAGINATION LOGIC
  ========================================================= */

  const totalPages = Math.ceil(filteredAdmins.length / rowsPerPage);

  const paginatedAdmins = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;

    return filteredAdmins.slice(start, start + rowsPerPage);
  }, [filteredAdmins, currentPage]);

  /* =========================================================
     RESET PAGE ON FILTER CHANGE
  ========================================================= */

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, roleFilter, statusFilter]);

  /* =========================================================
     TOGGLE STATUS
  ========================================================= */

  const handleToggleStatus = async (id: number, currentStatus: string) => {
    try {
      const updatedAdmin = await api.toggleStatus(id, currentStatus);

      setAdmins((prev) =>
        prev.map((admin) => (admin.id === id ? updatedAdmin : admin)),
      );
    } catch (error) {
      alert("Failed to update status");
    }
  };

  /* =========================================================
     VIEW ADMIN
  ========================================================= */

  const handleView = (admin: Admin) => {
    alert(
      `
Name: ${admin.name}
Email: ${admin.email}
Role: ${admin.role}
Status: ${admin.status}
`,
    );
  };

  /* =========================================================
     EDIT ADMIN
  ========================================================= */

  const handleEdit = (admin: Admin) => {
    alert(`Edit ${admin.name}`);
  };

  /* =========================================================
     DELETE ADMIN
  ========================================================= */

  const handleDelete = async (id: number) => {
    const confirmDelete = window.confirm("Delete this admin permanently?");

    if (!confirmDelete) return;

    try {
      await api.deleteAdmin(id);

      setAdmins((prev) => prev.filter((admin) => admin.id !== id));
    } catch (error) {
      alert("Failed to delete admin");
    }
  };

  /* =========================================================
     ADD ADMIN
  ========================================================= */

  const handleAddAdmin = () => {
    alert("Open Add Admin Modal");
  };

  /* =========================================================
     ROLE BADGE STYLES
  ========================================================= */

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "super_admin":
        return styles.roleSuper;

      case "admin":
        return styles.roleAdmin;

      default:
        return styles.roleUser;
    }
  };

  /* =========================================================
     ROLE DISPLAY TEXT
  ========================================================= */

  const getRoleDisplay = (role: string) => {
    switch (role) {
      case "super_admin":
        return "Super Admin";

      case "admin":
        return "Admin";

      default:
        return "Viewer";
    }
  };

  /* =========================================================
     PAGE CHANGE
  ========================================================= */

  const changePage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  /* =========================================================
     LOADING SCREEN
  ========================================================= */

  if (loading) {
    return <Loader />;
  }

  /* =========================================================
     ERROR SCREEN
  ========================================================= */

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.errorState}>
          <p>{error}</p>

          <button onClick={fetchAdmins}>Retry</button>
        </div>
      </div>
    );
  }

  /* =========================================================
     MAIN UI
  ========================================================= */

  return (
    <div className={styles.container}>
      {/* =========================================================
         PAGE HEADER
      ========================================================= */}

      <div className={styles.header}>
        <h1>Admin Control Panel</h1>
        <p>Manage all admin users and permissions</p>
      </div>

      {/* =========================================================
         STATS CARDS
      ========================================================= */}

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

      {/* =========================================================
         TOOLBAR
      ========================================================= */}

      <div className={styles.toolbar}>
        {/* SEARCH */}
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

        {/* FILTERS + BUTTON */}
        <div className={styles.actionsGroup}>
          {/* ROLE FILTER */}
          <select
            className={styles.roleSelect}
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as typeof roleFilter)}
          >
            <option value="all">All Roles</option>

            <option value="super_admin">Super Admin</option>

            <option value="admin">Admin</option>

            <option value="viewer">Viewer</option>
          </select>

          {/* STATUS FILTER */}
          <select
            className={styles.roleSelect}
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as typeof statusFilter)
            }
          >
            <option value="all">All Status</option>

            <option value="Active">Active</option>

            <option value="Inactive">Inactive</option>
          </select>

          {/* ADD BUTTON */}
          <button className={styles.addBtn} onClick={handleAddAdmin}>
            <UserPlus size={16} />
            Add User
          </button>
        </div>
      </div>

      {/* =========================================================
         TABLE
      ========================================================= */}

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
            {/* =========================================================
               IF DATA EXISTS
            ========================================================= */}

            {paginatedAdmins.length > 0 ? (
              paginatedAdmins.map((admin, index) => {
                const isActive = admin.status === "Active";

                const serialNumber =
                  (currentPage - 1) * rowsPerPage + index + 1;

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

                    <td className={styles.colEmail}>
                      <span className={styles.userEmail}>{admin.email}</span>
                    </td>

                    <td className={styles.colRole}>
                      <span
                        className={`${styles.roleBadge} ${getRoleBadge(
                          admin.role,
                        )}`}
                      >
                        {getRoleDisplay(admin.role)}
                      </span>
                    </td>

                    <td className={styles.colStatus}>
                      <div className={styles.statusCell}>
                        <div
                          className={`${styles.toggle} ${
                            isActive ? styles.active : ""
                          }`}
                          onClick={() =>
                            handleToggleStatus(admin.id, admin.status)
                          }
                        >
                          <div className={styles.knob} />
                        </div>

                        <span
                          className={`${styles.statusText} ${
                            isActive
                              ? styles.statusActive
                              : styles.statusInactive
                          }`}
                        >
                          {admin.status}
                        </span>
                      </div>
                    </td>

                    <td className={styles.colActions}>
                      <div className={styles.actionMenu}>
                        <button className={styles.dotsBtn}>
                          <Settings size={16} />
                        </button>

                        <div className={styles.dropdown}>
                          <button onClick={() => handleView(admin)}>
                            <Eye size={14} />
                            View
                          </button>

                          <button onClick={() => handleEdit(admin)}>
                            <Pencil size={14} />
                            Edit
                          </button>

                          <button
                            className={styles.deleteBtn}
                            onClick={() => handleDelete(admin.id)}
                          >
                            <Trash2 size={14} />
                            Delete
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              /* =========================================================
                 NO DATA ILLUSTRATION
                 THIS SHOWS IF API RETURNS EMPTY ARRAY
              ========================================================= */

              <tr>
                <td colSpan={6} className={styles.noData}>
                  <img
                    src={noDataImg}
                    alt="No Data"
                    className={styles.noDataImg}
                  />

                  <p>No users found</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* =========================================================
         PAGINATION
      ========================================================= */}

      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            className={styles.pageBtn}
            disabled={currentPage === 1}
            onClick={() => changePage(currentPage - 1)}
          >
            <ChevronLeft size={14} />
            Prev
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              className={`${styles.pageBtn} ${
                currentPage === page ? styles.activePage : ""
              }`}
              onClick={() => changePage(page)}
            >
              {page}
            </button>
          ))}

          <button
            className={styles.pageBtn}
            disabled={currentPage === totalPages}
            onClick={() => changePage(currentPage + 1)}
          >
            Next
            <ChevronRight size={14} />
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
