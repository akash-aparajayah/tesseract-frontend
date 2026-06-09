import React, { useState, useEffect, useMemo } from "react";
import styles from "../styles/dashboard.module.css";
import { useToast } from "../hooks/useToast";
import { getUserApi, healthCheckApi } from "../services/authApi";
import { userAssignProjectEnv } from "../services/projectApi";

// Used to display roles like "Super Admin", "Admin", "User"
const formatRole = (role?: string) => {
  if (!role) return "";
  return role
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};
// import Loader from "@/components/common/Loader"; // removed – replaced with skeleton

type ServiceStatus = {
  api: string;
  database: string;
  redis: string;
};

/* ---------- SKELETON COMPONENT ---------- */
const DashboardSkeleton: React.FC = () => {
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
      <div className={styles.dashboard}>
        {/* Hero skeleton */}
        <div className={styles.hero}>
          <div className={styles.heroContent}>
            <div style={{ ...skeletonPulse, width: "120px", height: "28px", borderRadius: "20px" }} />
            <div style={{ ...skeletonPulse, width: "220px", height: "16px", borderRadius: "12px", marginTop: "8px" }} />
          </div>
          <div className={styles.heroCompany}>
            <div style={{ ...skeletonPulse, width: "48px", height: "48px", borderRadius: "12px" }} />
            <div style={{ marginLeft: "12px" }}>
              <div style={{ ...skeletonPulse, width: "240px", height: "20px", borderRadius: "8px" }} />
              <div style={{ ...skeletonPulse, width: "180px", height: "14px", borderRadius: "6px", marginTop: "8px" }} />
            </div>
          </div>
        </div>

        {/* Stats cards skeleton */}
        <div className={styles.statsGrid}>
          {[1, 2, 3].map((i) => (
            <div key={i} className={styles.statCard} style={{ ...skeletonPulse, height: "100px" }} />
          ))}
        </div>

        {/* Two columns skeleton */}
        <div className={styles.twoColumns}>
          {/* Left column – profile card */}
          <div className={styles.leftCol}>
            <div className={styles.aadharCard} style={{ ...skeletonPulse, height: "360px" }} />
          </div>
          {/* Right column – system health card */}
          <div className={styles.rightCol}>
            <div className={styles.aadharCard} style={{ ...skeletonPulse, height: "360px" }} />
          </div>
        </div>
      </div>
    </>
  );
};

const Dashboard: React.FC = () => {
  const { showToast, ToastContainer } = useToast();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState({
    id: 1,
    name: "",
    role: "",
    email: "",
    lastLogin: "",
    status: "Active",
  });
  const [stats, setStats] = useState([
    { label: "Users", value: 0, icon: "👥", color: "#4f8ef7", bg: "#e8f0ff" },
    { label: "Services", value: 0, icon: "⚙️", color: "#00c896", bg: "#e0faf3" },
    { label: "Projects", value: 0, icon: "📁", color: "#f5a623", bg: "#fff4e0" },

  ]);


  const [distribution, setDistribution] = useState([
    { name: "Services", value: 0, color: "#00c896", percent: 0 },
    { name: "Projects", value: 0, color: "#f5a623", percent: 0 },
    { name: "Users", value: 0, color: "#4f8ef7", percent: 0 },
  ]);
  const [uptime, setUptime] = useState("0");
  const [services, setServices] = useState<ServiceStatus>({
    api: "unknown",
    database: "unknown",
    redis: "unknown",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const profileData = (await getUserApi()).data;
        const healthData = await healthCheckApi();

        // Use public_id because environment assignments are linked to public_id
        const userId =
          profileData.data.users.public_id;

        const workspaceData = await userAssignProjectEnv(
          String(userId)
        );

        // Count assigned projects from workspace
        const projectCount =
          workspaceData?.data?.length || 0;

        // Count assigned services from workspace
        const serviceCount =
          workspaceData?.data?.reduce(
            (projectTotal: number, project: any) =>
              projectTotal +
              project.environments.reduce(
                (envTotal: number, env: any) =>
                  envTotal +
                  (env.services?.length || 0),
                0
              ),
            0
          ) || 0;

        // Logged-in user always counts as 1
        const userCount = 1;

        setProfile({
          id: profileData.data.users.id,
          name: profileData.data.users.user_name,
          role: formatRole(profileData.data.users.role),
          email: profileData.data.users.email,
          lastLogin: profileData?.data?.lastLogin || "",
          status: profileData.data.users.is_deleted === false ? "Active" : "Inactive",
        });

        // Dashboard counts based on assigned workspace data
        setStats([
          {
            label: "Users",
            value: userCount,
            icon: "👥",
            color: "#4f8ef7",
            bg: "#e8f0ff",
          },
          {
            label: "Services",
            value: serviceCount,
            icon: "⚙️",
            color: "#00c896",
            bg: "#e0faf3",
          },
          {
            label: "Projects",
            value: projectCount,
            icon: "📁",
            color: "#f5a623",
            bg: "#fff4e0",
          },
        ]);

        // Update donut chart using workspace counts
        const total =
          userCount +
          serviceCount +
          projectCount;

        setDistribution([
          {
            name: "Services",
            value: serviceCount,
            color: "#00c896",
            percent: total > 0 ? (serviceCount / total) * 100 : 0,
          },
          {
            name: "Projects",
            value: projectCount,
            color: "#f5a623",
            percent: total > 0 ? (projectCount / total) * 100 : 0,
          },
          {
            name: "Users",
            value: userCount,
            color: "#4f8ef7",
            percent: total > 0 ? (userCount / total) * 100 : 0,
          },
        ]);

        setUptime(healthData?.data?.uptimeFormatted ?? "0");
        if (healthData?.data?.services) {
          setServices({
            api: healthData.data.services.api || "unknown",
            database: healthData.data.services.database || "unknown",
            redis: healthData.data.services.redis || "unknown",
          });
        }
      } catch (error) {
        console.error("Dashboard API error:", error);
        showToast("Failed to load dashboard data", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [showToast]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")} ${ampm}`;
  };

  const formatDate = (date: Date) => {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const dayName = days[date.getDay()];
    const month = months[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    const dayType = date.getDay() === 0 || date.getDay() === 6 ? "Weekend" : "Weekday";
    return `${dayName}, ${month} ${day}, ${year} · ${dayType}`;
  };

  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const donutSegments = useMemo(() => {
    return distribution.map((item, idx) => {
      const dashArray = (item.percent / 100) * circumference;
      const dashOffset = -distribution
        .slice(0, idx)
        .reduce((sum, prev) => sum + (prev.percent / 100) * circumference, 0);
      return { ...item, dashArray, dashOffset };
    });
  }, [distribution, circumference]);

  const getServiceStatus = (status: string) => {
    const isConnected = status === "running" || status === "connected";
    return {
      color: isConnected ? "#00c896" : "#f75f5f",
      text: isConnected ? "Connected" : "Disconnected",
    };
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <>
      <ToastContainer />
      <div className={styles.dashboard}>
        {/* Hero Section */}
        <div className={styles.hero}>
          <div className={styles.heroContent}>
            <div className={styles.heroTime}>{formatTime(currentTime)}</div>
            <div className={styles.heroDate}>{formatDate(currentTime)}</div>
          </div>
          <div className={styles.heroCompany}>
            <div className={styles.companyLogo}>AT</div>
            <div>
              <div className={styles.companyName}>Aparajayah Technologies Pvt Ltd</div>
              <div className={styles.companyQuote}>"Consistency beats talent every time."</div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className={styles.statsGrid}>
          {stats.map((stat, idx) => (
            <div className={styles.statCard} key={idx}>
              <div className={styles.statIcon} style={{ background: stat.bg, color: stat.color }}>
                {stat.icon}
              </div>
              <div className={styles.statInfo}>
                <p className={styles.statLabel}>{stat.label}</p>
                <h3 className={styles.statValue}>{stat.value}</h3>
              </div>
            </div>
          ))}
        </div>

        {/* Two Columns */}
        <div className={styles.twoColumns}>
          {/* Left Column - Profile Card */}
          <div className={styles.leftCol}>
            <div className={`${styles.aadharCard} ${styles.animatedAadhar}`}>
              <div className={styles.aadharHeader}>
                <div className={styles.aadharLogo}>
                  <span>🔷</span>
                  <span>USER PROFILE</span>
                </div>
                <div className={styles.aadharTitle}>IDENTITY</div>
              </div>
              <div className={styles.aadharBodyRow}>
                <div className={styles.aadharAvatarRow}>
                  <div className={styles.avatarPhotoRow}>👤</div>
                  <div className={styles.avatarLabelRow}>Photo</div>
                </div>
                <div className={styles.profileDetailsGrid}>
                  <div className={styles.detailItem}>
                    <label>Name</label>
                    <p>{profile.name}</p>
                  </div>
                  <div className={styles.detailItem}>
                    <label>Role / Type</label>
                    <p>{profile.role}</p>
                  </div>
                  <div className={styles.detailItem}>
                    <label>Status</label>
                    <p className={profile.status === "Active" ? styles.statusActive : styles.statusInactive}>
                      {profile.status === "Active" ? "● Active" : profile.status}
                    </p>
                  </div>
                  <div className={styles.detailItem}>
                    <label>Last Login</label>
                    <p>{profile.lastLogin || formatTime(currentTime)}</p>
                  </div>
                  <div className={`${styles.detailItem} ${styles.detailFullWidth}`}>
                    <label>Email Address</label>
                    <p>{profile.email}</p>
                  </div>
                </div>
              </div>
              <div className={styles.aadharFooter}>
                <div className={styles.aadharId}>User ID: ADI-{profile.id}</div>
                <div className={styles.aadharSignature}>Authorised Signature</div>
              </div>
            </div>
          </div>

          {/* Right Column - System Health Card */}
          <div className={styles.rightCol}>
            <div className={`${styles.aadharCard} ${styles.pieCard} ${styles.animatedAadhar}`}>
              <div className={styles.aadharHeader}>
                <div className={styles.aadharLogo}>
                  <span>📊</span>
                  <span>SYSTEM HEALTH</span>
                </div>
                <div className={styles.aadharTitle}>RESOURCE METRICS</div>
              </div>
              <div className={styles.pieCardBodyRow}>
                {/* Donut Chart */}
                <div className={styles.donutChartWrapper}>
                  <svg width="140" height="140" viewBox="0 0 140 140">
                    <circle cx="70" cy="70" r="54" fill="none" stroke="#eef1f8" strokeWidth="20" />
                    {donutSegments.map((seg, idx) => (
                      <circle
                        key={idx}
                        cx="70"
                        cy="70"
                        r="54"
                        fill="none"
                        stroke={seg.color}
                        strokeWidth="20"
                        strokeDasharray={`${seg.dashArray} ${circumference}`}
                        strokeDashoffset={seg.dashOffset}
                        transform="rotate(-90 70 70)"
                        style={{
                          animation: `donutFill 0.8s ease-out ${idx * 0.15}s forwards`,
                        }}
                      />
                    ))}
                    <text x="70" y="64" textAnchor="middle" fontSize="20" fontWeight="800" fill="#1a1a2e">
                      {uptime}
                    </text>
                    <text x="70" y="80" textAnchor="middle" fontSize="10" fill="#7a8499">
                      Uptime
                    </text>
                  </svg>
                </div>

                {/* Legend */}
                <div className={styles.donutLegendRow}>
                  {distribution.map((item, idx) => (
                    <div key={idx} className={styles.legendItemRow}>
                      <span className={styles.legendDotRow} style={{ background: item.color }}></span>
                      <span>{item.name}</span>
                      <strong>{item.value}</strong>
                    </div>
                  ))}
                </div>

                {/* Service Cards */}
                <div className={styles.serviceCardsRowRight}>
                  <div className={styles.serviceCardMini}>
                    <div className={styles.serviceCardIconMini}>🗄️</div>
                    <div>
                      <div className={styles.serviceCardLabelMini}>DATABASE</div>
                      <div className={styles.serviceCardStatusMini}>
                        <span className={styles.serviceStatusDotMini} style={{ backgroundColor: getServiceStatus(services.database).color }}></span>
                        <span>{getServiceStatus(services.database).text}</span>
                      </div>
                    </div>
                  </div>
                  <div className={styles.serviceCardMini}>
                    <div className={styles.serviceCardIconMini}>📦</div>
                    <div>
                      <div className={styles.serviceCardLabelMini}>REDIS</div>
                      <div className={styles.serviceCardStatusMini}>
                        <span className={styles.serviceStatusDotMini} style={{ backgroundColor: getServiceStatus(services.redis).color }}></span>
                        <span>{getServiceStatus(services.redis).text}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className={styles.aadharFooter}>
                <div className={styles.aadharId}>Last updated: {formatTime(currentTime)}</div>
                <div className={styles.aadharSignature}>Live Metrics</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;