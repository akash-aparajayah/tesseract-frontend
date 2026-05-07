import { useState } from "react";
import { FaUserAlt, FaSearch, FaBell } from "react-icons/fa";
import { jwtDecode } from "jwt-decode";
import styles from "../componentStyles/Topbar.module.css";

interface DecodedToken {
  name?: string;
  email?: string;
  role?: string;
}

const formatRole = (role?: string) => {
  if (!role) return "";

  return role
    .toLowerCase()
    .split("_")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1)
    )
    .join(" ");
};

const getUserFromToken = () => {
  const token = localStorage.getItem("accessToken");

  if (!token)
    return { name: "User", role: "" };

  try {
    const decoded: DecodedToken =
      jwtDecode(token);

    return {
      name:
        decoded.name ||
        decoded.email?.split("@")[0] ||
        "User",

      role: formatRole(decoded.role),
    };
  } catch (e) {
    console.error(
      "Error decoding token:",
      e
    );

    return { name: "User", role: "" };
  }
};

export default function TopBar() {
  const [search, setSearch] = useState("");

  const [bellActive, setBellActive] =
    useState(false);

  const {
    name: userName,
    role: userRole,
  } = getUserFromToken();

  const handleBell = () => {
    setBellActive(true);

    setTimeout(
      () => setBellActive(false),
      600
    );
  };

  const handleSearch = (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    console.log("Search:", search);
  };

  return (
    <header className={styles.topBar}>
      <div className={styles.topBarLeft}>
        <form
          className={styles.searchForm}
          onSubmit={handleSearch}
        >
          <FaSearch
            className={styles.searchIcon}
          />

          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />
        </form>
      </div>

      <div className={styles.topBarRight}>
        {/* Bell */}
        <div
          className={`${styles.bell} ${
            bellActive
              ? styles.animate
              : ""
          }`}
          onClick={handleBell}
        >
          <FaBell />

          <span
            className={styles.badge}
          ></span>
        </div>

        {/* Profile */}
        <div className={styles.profile}>
          <div className={styles.avatar}>
            <FaUserAlt />
          </div>

          <div className={styles.info}>
            <span className={styles.name}>
              {userName}
            </span>

            <span className={styles.role}>
              {userRole || "Member"}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}