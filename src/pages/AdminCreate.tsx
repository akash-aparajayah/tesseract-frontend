import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createUserApi } from "../services/adminApi";

interface FormData {
  name: string;
  email: string;
  password: string;
  role: "ADMIN" | "SUPER_ADMIN" | "USER";
  active: boolean;
}

export default function AdminCreate() {
  const navigate = useNavigate();

  const [form, setForm] = useState<FormData>({
    name: "",
    email: "",
    password: "",
    role: "USER",
    active: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const validate = () => {
    if (!form.name.trim()) return "Name is required";
    if (!form.email.trim()) return "Email is required";
    if (!form.password) return "Password is required";
    if (form.password.length < 8) return "Password must be at least 8 characters";
    return "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate();
    if (err) {
      setError(err);
      return;
    }
    setError("");
    setLoading(true);
    try {
      const response = await createUserApi({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role,
        active: form.active,
      });
      // Adjust based on your API response structure
      const newUserId = response.data.id || response.data.user?.id;
      navigate(`/admin/users/${newUserId}`);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to create user");
      setLoading(false);
    }
  };

  return (
    <div className="admin-form-container">
      <div className="admin-form-header">
        <h1>Create User</h1>
        <p>Add a new user to the system</p>
      </div>
      <form className="admin-form" onSubmit={handleSubmit}>
        {error && <div className="form-error">{error}</div>}
        <div className="form-group">
          <label>Full Name *</label>
          <input type="text" placeholder="Enter full name" value={form.name}
                 onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div className="form-group">
          <label>Email *</label>
          <input type="email" placeholder="Enter email" value={form.email}
                 onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div className="form-group">
          <label>Password * (min 8 characters)</label>
          <input type="password" placeholder="Enter password" value={form.password}
                 onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </div>
        <div className="form-group">
          <label>Role *</label>
          <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as FormData["role"] })}>
            <option value="USER">User</option>
            <option value="ADMIN">Admin</option>
            <option value="SUPER_ADMIN">Super Admin</option>
          </select>
        </div>
        <div className="form-group">
          <label>Status *</label>
          <select value={form.active ? "active" : "inactive"}
                  onChange={(e) => setForm({ ...form, active: e.target.value === "active" })}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        <div className="form-actions">
          <button type="button" className="btn-cancel" onClick={() => navigate("/dashboard/admin")}>
            Cancel
          </button>
          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? "Creating..." : "Create User"}
          </button>
        </div>
      </form>
    </div>
  );
}