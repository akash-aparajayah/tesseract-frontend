import { useEffect, useState, useRef, useCallback, memo } from "react";
import { useParams } from "react-router-dom";
import {
  ChevronDown,
  ChevronRight,
  FolderOpen,
  FolderClosedIcon,
  Layers,
  Search,
  Wrench,
  RotateCcwKeyIcon,
  Server,
  Copy,
  FlaskConical,
  Rocket,
  Shield,
  Link,
  Check,
  CircleCheckBigIcon,
  Mail,
  ArrowRightFromLine,
  GaugeIcon,
  Star,
  FileLock,
  ShieldCheck,
  ArrowLeftRight,
  MessageSquareMore,
  MessageCircleMore,
  LockKeyholeIcon,
  LockKeyholeOpen,
  CreditCard,
  ChevronUp,
} from "lucide-react";
import styles from "../styles/Workspace.module.css";
import workspaceIllustration from "../assets/illustration/Empty (1).gif";
import sidebarIllustration from "../assets/illustration/error.svg";
import { Skeleton } from "@/components/common/SkeletonLoader";
import {
  userAssignProjectEnv,
  revealProviderCredentials,
} from "@/services/projectApi";
import { useToast } from "../hooks/useToast";
import { verifyUser } from "@/services/authApi";

// ---------- Types ----------
interface Credentials {
  [key: string]: string | undefined;
  endpoint?: string;
  description?: string;
  provider_name?: string;
  service_type?: string;
  service_description?: string;
  credential_id?: string;
}

interface Service {
  id: string;
  name: string;
  serviceEndpoint: string;
  sandbox: Credentials[];
  live: Credentials[];
}

interface Environment {
  public_id: string;
  environment_name: string;
  services: Service[];
  apiKeys?: ApiKey[];
}

interface Project {
  public_id: string;
  project_name: string;
  environments: Environment[];
}

interface ApiKey {
  public_id: string;
  prefix: string;
  mode: "SANDBOX" | "LIVE";
  expires_in_days: number;
  created_at: string;
  last_used_at: string | null;
  expiry_date: string;
  remaining_days: number;
  token_status: string;
  is_expired: boolean;
}

interface EnvToken {
  isGenerated: boolean;
  expiresAt: string | null;
  remainingDays?: number;
}

interface ApiResponse {
  success: boolean;
  message: string;
  data: ApiProject[];
}

interface ApiProject {
  public_id: string;
  project_name: string;
  environments: ApiEnvironment[];
}

interface ApiEnvironment {
  public_id: string;
  environment_name: string;
  services: ApiService[];
  api_keys: ApiKey[];
}

interface ApiService {
  id: string;
  service_endpoint: string;
  service_name: string;
  sandbox: Credentials[];
  live: Credentials[];
}

interface UnlockEntry {
  plainCredential: Credentials;
  unlockedAt: number;
}

const UNLOCK_DURATION_SECONDS = 60;

// ---------- Helper ----------
const formatExpiry = (expiresAt: string | null) => {
  if (!expiresAt) return null;
  const daysLeft = Math.ceil(
    (new Date(expiresAt).getTime() - Date.now()) / 86400000,
  );
  if (daysLeft < 0) return "Expired";
  return `${daysLeft} day${daysLeft !== 1 ? "s" : ""}`;
};

const getServiceIcon = (
  serviceType?: string,
  fallbackName?: string,
  size: number = 20,
) => {
  const type = (serviceType || fallbackName || "").toLowerCase();
  switch (type) {
    case "sms":
      return <MessageSquareMore size={size} />;
    case "email":
      return <Mail size={size} />;
    case "whatsapp":
      return <MessageCircleMore size={size} />;
    case "credit score":
      return <GaugeIcon size={size} />;
    case "ibv":
      return <ShieldCheck size={size} />;
    case "ach":
      return <ArrowLeftRight size={size} />;
    case "payment gateway":
      return <CreditCard size={size} />;
    default:
      return <Server size={size} />;
  }
};

// ---------- Countdown Timer Hook ----------
const useCountdown = (
  unlockedAt: number | null,
  durationSec: number,
  onExpire: () => void,
): number => {
  const [remaining, setRemaining] = useState<number>(0);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  useEffect(() => {
    if (unlockedAt === null) {
      setRemaining(0);
      return;
    }

    const tick = () => {
      const elapsed = Math.floor((Date.now() - unlockedAt) / 1000);
      const left = durationSec - elapsed;
      if (left <= 0) {
        setRemaining(0);
        onExpireRef.current();
      } else {
        setRemaining(left);
      }
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [unlockedAt, durationSec]);

  return remaining;
};

// ---------- Lock Popup ----------
interface LockPopupProps {
  onClose: () => void;
  onVerify: (passkey: string) => Promise<void>;
}

const LockPopup = ({ onClose, onVerify }: LockPopupProps) => {
  const [passkey, setPasskey] = useState("");
  const [showPasskey, setShowPasskey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handlePasskeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ""); // remove non-digits
    if (value.length <= 6) {
      setPasskey(value);
      setError(""); // clear error when user types
    }
  };

  const handleSubmit = async () => {
    if (passkey.length !== 6) {
      setError("Please enter a valid 6-digit passkey");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await onVerify(passkey);
      onClose();
    } catch (err: any) {
      setError(err.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSubmit();
  };

  return (
    <div className={styles.popupOverlay} onClick={onClose}>
      <div className={styles.popupCard} onClick={(e) => e.stopPropagation()}>
        <div className={styles.popupHeader}>
          <LockKeyholeIcon size={18} />
          <span>Enter Your 6‑Digit Passkey</span>
          <button className={styles.popupClose} onClick={onClose}>
            ✕
          </button>
        </div>
        <div className={styles.popupBody}>
          {error && <div className={styles.popupError}>{error}</div>}
          <div className={styles.popupField}>
            <label>6‑Digit Passkey</label>
            <div className={styles.passwordWrapper}>
              <input
                type={showPasskey ? "text" : "password"}
                placeholder="••••••"
                value={passkey}
                onChange={handlePasskeyChange}
                onKeyDown={handleKeyDown}
                maxLength={6}
                inputMode="numeric"
                pattern="\d*"
                autoFocus
              />
              <button
                className={styles.eyeBtn}
                onClick={() => setShowPasskey((p) => !p)}
              >
                {showPasskey ? (
                  <LockKeyholeOpen size={15} />
                ) : (
                  <LockKeyholeIcon size={15} />
                )}
              </button>
            </div>
          </div>
          <button
            className={styles.popupSubmit}
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Verifying..." : "Unlock Credential"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ---------- Credential Accordion ----------
interface CredentialAccordionProps {
  credential: Credentials;
  index: number;
  isOpen: boolean;
  onToggle: () => void;
  credentialId: string;
  plainCredential: Credentials | null;
  unlockedAt: number | null;
  onUnlock: (credentialId: string) => void;
  onExpire: (credentialId: string) => void;
  serviceName?: string;
}

const CredentialAccordion = memo(
  ({
    credential,
    index,
    isOpen,
    onToggle,
    credentialId,
    plainCredential,
    unlockedAt,
    onUnlock,
    onExpire,
    serviceName,
  }: CredentialAccordionProps) => {
    const isUnlocked = plainCredential !== null && unlockedAt !== null;
    const [copiedField, setCopiedField] = useState<string | null>(null);

    const remaining = useCountdown(
      unlockedAt,
      UNLOCK_DURATION_SECONDS,
      useCallback(() => onExpire(credentialId), [credentialId, onExpire]),
    );

    const displayCred = isUnlocked ? plainCredential! : credential;

    const displayFields = Object.entries(displayCred).filter(
      ([key]) =>
        ![
          "mode",
          "service_type",
          "provider_name",
          "endpoint",
          "credential_id",
          "service_description",
        ].includes(key),
    );

    const provider = displayCred.provider_name || "";
    const description = displayCred.service_description || "";
    const icon = getServiceIcon(displayCred.service_type, serviceName, 20);
    const showArrow = provider && description;

    const handleUnlockClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      onUnlock(credentialId);
    };

    const formatTimer = (secs: number) => {
      const m = Math.floor(secs / 60);
      const s = secs % 60;
      return `${m}:${String(s).padStart(2, "0")}`;
    };

    const handleManualLock = (e: React.MouseEvent) => {
      e.stopPropagation();
      onExpire(credentialId);
    };

    const handleCopy = async (value: string, fieldKey: string) => {
      await navigator.clipboard.writeText(value);
      setCopiedField(fieldKey);
      setTimeout(() => setCopiedField(null), 1500);
    };

    const timerColorClass =
      remaining > 30
        ? styles.timerGreen
        : remaining > 10
          ? styles.timerAmber
          : styles.timerRed;

    return (
      <div className={styles.credentialAccordion}>
        <div className={styles.credentialAccordionHeader}>
          <div className={styles.accordionClickZone} onClick={onToggle}>
            <div className={styles.accordionHeaderLeft}>
              {icon}
              {provider && <span>{provider}</span>}
              {showArrow && <ArrowRightFromLine size={14} />}
              {!provider && !description && (
                <span>Credential #{index + 1}</span>
              )}
            </div>
          </div>

          <div className={styles.accordionHeaderRight}>
            {index === 0 &&
              displayCred.service_type &&
              ["SMS", "Email", "WhatsApp"].includes(
                displayCred.service_type,
              ) && (
                <div className={styles.primaryBadge}>
                  <Star size={14} className={styles.primaryIcon} />
                  <span>Primary</span>
                </div>
              )}

            {provider && (
              <div className={styles.configured}>
                <CircleCheckBigIcon size={14} /> Configured
              </div>
            )}

            <div className={styles.lockArea}>
              {!isUnlocked ? (
                <button
                  className={styles.lockButton}
                  onClick={handleUnlockClick}
                  title="Unlock with passkey"
                >
                  <LockKeyholeIcon size={18} />
                </button>
              ) : (
                <>
                  <button
                    className={styles.lockButton}
                    onClick={handleManualLock}
                    title="Lock immediately"
                  >
                    <LockKeyholeOpen size={18} />
                  </button>
                  {remaining > 0 && (
                    <span className={`${styles.timerBadge} ${timerColorClass}`}>
                      {formatTimer(remaining)}
                    </span>
                  )}
                </>
              )}
            </div>

            <button
              type="button"
              className={styles.accordionChevron}
              onClick={(e) => {
                e.stopPropagation();
                onToggle();
              }}
            >
              {isOpen ? <ChevronUp size={15} /> : <ChevronRight size={15} />}
            </button>
          </div>
        </div>

        <div
          className={`${styles.credentialAccordionContent} ${isOpen ? styles.open : ""}`}
        >
          {isOpen && displayFields.length > 0 && (
            <div className={styles.credentialFields}>
              {displayFields.map(([key, value]) => (
                <div key={key} className={styles.credentialRow}>
                  <span className={styles.credLabel}>
                    {key.replace(/_/g, " ").toUpperCase()}
                  </span>
                  <div className={styles.credValueBlock}>
                    <div className={styles.iconContainer}>
                      <FileLock size={18} />
                    </div>
                    <div className={styles.verticalDivider} />
                    <code className={styles.credValue}>
                      {String(value) || "-"}
                    </code>
                    {value && isUnlocked && (
                      <button
                        className={`${styles.copyFieldBtn} ${copiedField === key ? styles.copied : ""}`}
                        onClick={() => handleCopy(String(value), key)}
                        title="Copy to clipboard"
                      >
                        {copiedField === key ? (
                          <Check size={14} />
                        ) : (
                          <Copy size={14} />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          {isOpen && displayFields.length === 0 && (
            <div className={styles.noExtraFields}>No additional fields</div>
          )}
        </div>
      </div>
    );
  },
);

// ---------- Main Workspace Component ----------
interface WorkspaceProps {
  userId?: string;
}

const Workspace = ({ userId: propUserId }: WorkspaceProps) => {
  const { userId: paramUserId } = useParams<{ userId: string }>();
  const { showToast, ToastContainer } = useToast(); // 👈 toast hook for notifications

  const [projects, setProjects] = useState<Project[]>([]);
  const [expandedProjectId, setExpandedId] = useState<string | null>(null);
  const [selectedEnv, setSelectedEnv] = useState<{
    project: Project;
    environment: Environment;
  } | null>(null);
  const [selectedService, setSelectedSvc] = useState<Service | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [instanceType, setInstanceType] = useState<"sandbox" | "live">(
    "sandbox",
  );
  const [openAccordionIndex, setOpenAccordionIndex] = useState<number | null>(
    0,
  );

  const [lockPopupOpen, setLockPopupOpen] = useState(false);
  const [pendingUnlockCredId, setPendingUnlockCredId] = useState<string | null>(
    null,
  );

  const [unlockedMap, setUnlockedMap] = useState<Record<string, UnlockEntry>>(
    {},
  );

  const [tokensMap, setTokensMap] = useState<Record<string, EnvToken>>({});
  const [showEndpointInline, setShowEndpointInline] = useState(false);
  const [rotateIcon, setRotateIcon] = useState(false);
  const [copied, setCopied] = useState(false);

  const filteredProjects = projects.filter((p) =>
    p.project_name.toLowerCase().includes(search.toLowerCase()),
  );

  const getCredentialCompositeKey = (
    service: Service,
    type: "sandbox" | "live",
    idx: number,
  ): string => {
    const cred = type === "sandbox" ? service.sandbox[idx] : service.live[idx];
    if (cred?.credential_id) return cred.credential_id;
    return `${service.id}_${type}_${idx}`;
  };

  const handleExpire = useCallback((compositeKey: string) => {
    setUnlockedMap((prev) => {
      const next = { ...prev };
      delete next[compositeKey];
      return next;
    });
  }, []);

  useEffect(() => {
    setUnlockedMap({});
  }, [selectedService]);

  const getUserId = (): string => {
    if (propUserId) return propUserId;
    if (paramUserId) return paramUserId;
    const token = localStorage.getItem("accessToken");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        if (payload.id) return payload.id;
      } catch (e) {
        console.error("Failed to decode token", e);
      }
    }
    const storedId = localStorage.getItem("id");
    if (storedId) return storedId;
    return "";
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const id = getUserId();
        if (!id) throw new Error("User ID not found. Please log in.");
        const response: ApiResponse = await userAssignProjectEnv(id);

        if (response?.success && Array.isArray(response.data)) {
          const transformedProjects: Project[] = response.data.map(
            (apiProject: ApiProject) => ({
              public_id: apiProject.public_id,
              project_name: apiProject.project_name,
              environments: apiProject.environments.map(
                (apiEnv: ApiEnvironment) => {
                  const transformedServices: Service[] = apiEnv.services.map(
                    (apiService: ApiService) => ({
                      id: apiService.id,
                      name: apiService.service_name,
                      serviceEndpoint: apiService.service_endpoint || "",
                      sandbox: apiService.sandbox || [],
                      live: apiService.live || [],
                    }),
                  );
                  return {
                    public_id: apiEnv.public_id,
                    environment_name: apiEnv.environment_name,
                    services: transformedServices,
                    apiKeys: apiEnv.api_keys || [],
                  };
                },
              ),
            }),
          );
          setProjects(transformedProjects);

          const tokenMap: Record<string, EnvToken> = {};
          response.data.forEach((apiProject: ApiProject) => {
            apiProject.environments.forEach((apiEnv: ApiEnvironment) => {
              const envId = apiEnv.public_id;
              (apiEnv.api_keys || []).forEach((key: ApiKey) => {
                const mode = key.mode.toLowerCase() as "sandbox" | "live";
                const isGenerated =
                  key.token_status === "Generated" && !key.is_expired;
                tokenMap[`${envId}_${mode}`] = {
                  isGenerated,
                  expiresAt: key.expiry_date,
                  remainingDays: key.remaining_days,
                };
              });
              if (!tokenMap[`${envId}_sandbox`])
                tokenMap[`${envId}_sandbox`] = {
                  isGenerated: false,
                  expiresAt: null,
                };
              if (!tokenMap[`${envId}_live`])
                tokenMap[`${envId}_live`] = {
                  isGenerated: false,
                  expiresAt: null,
                };
            });
          });
          setTokensMap(tokenMap);

          if (transformedProjects.length > 0) {
            const firstProject = transformedProjects[0];
            const firstEnv = firstProject.environments[0];
            if (firstEnv) {
              setExpandedId(firstProject.public_id);
              setSelectedEnv({ project: firstProject, environment: firstEnv });
              const firstService = firstEnv.services[0] || null;
              setSelectedSvc(firstService);
              setOpenAccordionIndex(0);
            }
          }
        } else {
          setError(response?.message || "Invalid response format from server");
        }
      } catch (err: unknown) {
        console.error("API error:", err);
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to load projects. Please try again.";
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [propUserId, paramUserId]);

  const toggleProject = (id: string) =>
    setExpandedId((p) => (p === id ? null : id));

  const selectEnvironment = (project: Project, env: Environment) => {
    setSelectedEnv({ project, environment: env });
    const firstService = env.services[0] || null;
    setSelectedSvc(firstService);
    setInstanceType("sandbox");
    setOpenAccordionIndex(0);
    setShowEndpointInline(false);
    setCopied(false);
    setUnlockedMap({});
  };

  const selectService = (svc: Service) => {
    setSelectedSvc(svc);
    setInstanceType("sandbox");
    setOpenAccordionIndex(0);
    setShowEndpointInline(false);
    setCopied(false);
    setUnlockedMap({});
  };

  const handleInstanceChange = (type: "sandbox" | "live") => {
    setInstanceType(type);
    setOpenAccordionIndex(0);
    setShowEndpointInline(false);
    setCopied(false);
  };

  const toggleAccordion = (i: number) =>
    setOpenAccordionIndex((prev) => (prev === i ? null : i));

  const handleCableClick = () => {
    setRotateIcon(true);
    setShowEndpointInline((prev) => !prev);
    setCopied(false);
    setTimeout(() => setRotateIcon(false), 500);
  };

  const handleCopyEndpoint = async () => {
    if (selectedService?.serviceEndpoint) {
      await navigator.clipboard.writeText(selectedService.serviceEndpoint);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
        setShowEndpointInline(false);
      }, 1500);
    }
  };

  const handleUnlockRequest = (compositeKey: string) => {
    setPendingUnlockCredId(compositeKey);
    setLockPopupOpen(true);
  };

  // ✅ Corrected: two-step verification with toast
  const handleVerifyAndUnlock = async (passkey: string) => {
    if (!pendingUnlockCredId) {
      showToast("No credential selected", "error");
      throw new Error("No credential selected");
    }
    if (!selectedService) {
      showToast("No service selected", "error");
      throw new Error("No service selected");
    }

    const credList =
      instanceType === "sandbox"
        ? selectedService.sandbox
        : selectedService.live;

    const matchedIndex = credList.findIndex(
      (_, idx) =>
        getCredentialCompositeKey(selectedService, instanceType, idx) ===
        pendingUnlockCredId,
    );

    if (matchedIndex === -1) {
      showToast("Credential not found", "error");
      throw new Error("Credential not found");
    }

    const publicCredentialId = credList[matchedIndex]?.credential_id;
    if (!publicCredentialId) {
      showToast("Credential public ID is missing", "error");
      throw new Error("Credential public ID is missing");
    }

    try {
      // Step 1: Verify user passkey
      const verifyResponse = await verifyUser({ passKey: passkey });

      if (!verifyResponse?.data?.success) {
        showToast("Invalid passkey", "error");
        throw new Error("Verification failed");
      }
      showToast("Passkey verified successfully", "success");

      // Step 2: Reveal provider credentials
      const revealResponse = await revealProviderCredentials(
        publicCredentialId,
        passkey,
      );

      const originalCred = credList[matchedIndex];
      const plainCredential = { ...originalCred, ...revealResponse.data };

      setUnlockedMap((prev) => ({
        ...prev,
        [pendingUnlockCredId]: {
          plainCredential,
          unlockedAt: Date.now(),
        },
      }));

      showToast("Credential unlocked successfully", "success");
      setPendingUnlockCredId(null);
    } catch (err: any) {
      console.error("Unlock error:", err);
      showToast(err.message || "Failed to unlock credential", "error");
      throw err;
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSidebar}>
          <Skeleton height="44px" borderRadius="14px" />
          <div className={styles.loadingProjectsList}>
            <Skeleton height="80px" borderRadius="18px" />
            <Skeleton height="80px" borderRadius="18px" />
            <Skeleton height="80px" borderRadius="18px" />
          </div>
        </div>
        <div className={styles.loadingMain}>
          <div className={styles.loadingTopbar}>
            <Skeleton height="24px" width="300px" borderRadius="6px" />
            <div className={styles.loadingChips}>
              <Skeleton width="100px" height="40px" borderRadius="999px" />
              <Skeleton width="100px" height="40px" borderRadius="999px" />
            </div>
          </div>
          <div className={styles.loadingContent}>
            <Skeleton height="120px" borderRadius="26px" />
            <div className={styles.loadingSegments}>
              <Skeleton width="120px" height="40px" borderRadius="999px" />
              <Skeleton width="120px" height="40px" borderRadius="999px" />
            </div>
            <Skeleton height="100px" borderRadius="18px" />
            <Skeleton height="100px" borderRadius="18px" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.globalEmptyState}>
        <img src={workspaceIllustration} alt="Error" />
        <p>{error}</p>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className={styles.globalEmptyState}>
        <img src={workspaceIllustration} alt="No data" />
        <p>
          No projects have been assigned to you yet. Please contact your
          administrator for access.
        </p>
      </div>
    );
  }

  const envId = selectedEnv?.environment.public_id ?? "";
  const sandboxToken = tokensMap[`${envId}_sandbox`] ?? {
    isGenerated: false,
    expiresAt: null,
  };
  const liveToken = tokensMap[`${envId}_live`] ?? {
    isGenerated: false,
    expiresAt: null,
  };
  const sandboxCount = selectedService?.sandbox.length ?? 0;
  const liveCount = selectedService?.live.length ?? 0;
  const credentials = selectedService
    ? instanceType === "sandbox"
      ? selectedService.sandbox
      : selectedService.live
    : [];
  const currentToken = instanceType === "sandbox" ? sandboxToken : liveToken;

  return (
    <div className={styles.container}>
      <aside className={styles.sidebar}>
        <div className={styles.search}>
          <Search size={15} />
          <input
            type="text"
            placeholder="Search projects…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className={styles.projectList}>
          {filteredProjects.length === 0 ? (
            <div className={styles.sidebarEmptyState}>
              <img src={sidebarIllustration} alt="No projects found" />
              <p>No projects match</p>
            </div>
          ) : (
            filteredProjects.map((project) => {
              const isExpanded = expandedProjectId === project.public_id;
              return (
                <div key={project.public_id} className={styles.projectItem}>
                  <button
                    className={`${styles.projectTitle} ${isExpanded ? styles.expanded : ""}`}
                    onClick={() => toggleProject(project.public_id)}
                  >
                    {isExpanded ? (
                      <FolderOpen size={18} />
                    ) : (
                      <FolderClosedIcon size={18} />
                    )}
                    <span title={project.project_name}>
                      {project.project_name
                        ? project.project_name.charAt(0).toUpperCase() +
                          project.project_name.slice(1)
                        : "No project"}
                    </span>
                    {isExpanded ? (
                      <ChevronDown size={15} />
                    ) : (
                      <ChevronRight size={15} />
                    )}
                  </button>
                  <div
                    className={`${styles.environments} ${isExpanded ? styles.open : ""}`}
                  >
                    <div className={styles.environmentsInner}>
                      {project.environments.length === 0 ? (
                        <div className={styles.noEnvironmentsMessage}>
                          No environments
                        </div>
                      ) : (
                        project.environments.map((env) => (
                          <button
                            key={env.public_id}
                            className={`${styles.envButton} ${
                              selectedEnv?.environment.public_id ===
                              env.public_id
                                ? styles.activeEnv
                                : ""
                            }`}
                            data-env={env.environment_name.toLowerCase()}
                            onClick={() => selectEnvironment(project, env)}
                          >
                            <Layers size={14} />
                            <span>
                              {env.environment_name
                                ? env.environment_name.charAt(0).toUpperCase() +
                                  env.environment_name.slice(1)
                                : "No environment"}
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </aside>

      <div className={styles.mainArea}>
        <div className={styles.topbar}>
          <div className={styles.breadcrumb}>
            <span className={styles.activeBreadcrumb}>
              <FolderOpen size={15} style={{ marginRight: "7px" }} />
              {selectedEnv?.project?.project_name
                ? selectedEnv.project.project_name.charAt(0).toUpperCase() +
                  selectedEnv.project.project_name.slice(1)
                : "No project"}
            </span>{" "}
            <ChevronRight size={13} />
            <span className={styles.activeBreadcrumb}>
              <span>
                <Layers size={12} style={{ marginRight: "7px" }} />
                {selectedEnv?.environment?.environment_name
                  ? selectedEnv.environment.environment_name
                      .charAt(0)
                      .toUpperCase() +
                    selectedEnv.environment.environment_name.slice(1)
                  : "No environment"}
              </span>
            </span>
            <ChevronRight size={13} />
            <span className={styles.activeBreadcrumb}>
              <Wrench size={12} style={{ marginRight: "7px" }} />
              {selectedService?.name || "No service"}
            </span>
          </div>
          <div className={styles.divider} />
          <div className={styles.serviceScroll}>
            {selectedEnv?.environment.services.length === 0 ? (
              <div className={styles.noServicesMessage}>
                No services in this environment
              </div>
            ) : (
              selectedEnv?.environment.services.map((svc) => (
                <button
                  key={svc.id}
                  className={`${styles.serviceChip} ${
                    selectedService?.id === svc.id ? styles.activeService : ""
                  }`}
                  onClick={() => selectService(svc)}
                >
                  <span>{getServiceIcon(svc.name, undefined, 15)}</span>
                  <span>{svc.name}</span>
                </button>
              ))
            )}
          </div>
        </div>

        <div className={styles.content}>
          {!selectedService ? (
            <div className={styles.mainEmptyState}>
              <img src={workspaceIllustration} alt="No service selected" />
              <p>Select a service to view credentials</p>
            </div>
          ) : (
            <>
              <div className={styles.environmentBar}>
                <div className={styles.envLeftGroup}>
                  <div className={styles.instanceSegmentedControl}>
                    <button
                      data-env="sandbox"
                      className={`${styles.segmentedButton} ${
                        instanceType === "sandbox" ? styles.segmentedActive : ""
                      }`}
                      onClick={() => handleInstanceChange("sandbox")}
                    >
                      <FlaskConical size={15} />
                      <span>Sandbox</span>
                      <span className={styles.countBadge}>{sandboxCount}</span>
                    </button>
                    <button
                      data-env="live"
                      className={`${styles.segmentedButton} ${
                        instanceType === "live" ? styles.segmentedActive : ""
                      }`}
                      onClick={() => handleInstanceChange("live")}
                    >
                      <Rocket size={15} />
                      <span>Live</span>
                      <span className={styles.countBadge}>{liveCount}</span>
                    </button>
                  </div>

                  <div className={styles.tokenSummary}>
                    <div className={styles.tokenKey}>
                      <RotateCcwKeyIcon size={15} />
                    </div>
                    <span className={styles.tokenSummaryLabel}>
                      {instanceType === "sandbox" ? "Sandbox" : "Live"} Token
                    </span>
                    {currentToken.isGenerated ? (
                      <>
                        <div
                          className={`${styles.tokenStatusBadge} ${styles.generated}`}
                        >
                          <Shield size={10} />
                          <span>Generated</span>
                        </div>
                        {formatExpiry(currentToken.expiresAt) && (
                          <span className={styles.tokenExpiry}>
                            Expires {formatExpiry(currentToken.expiresAt)}
                          </span>
                        )}
                      </>
                    ) : (
                      <div
                        className={`${styles.tokenStatusBadge} ${styles.notGenerated}`}
                      >
                        Not generated
                      </div>
                    )}
                  </div>
                </div>

                <div className={styles.envRightGroup}>
                  <div
                    className={`${styles.cableIcon} ${rotateIcon ? styles.rotateIcon : ""} ${
                      !showEndpointInline ? styles.blinkingIcon : ""
                    }`}
                    onClick={handleCableClick}
                    title="Endpoint"
                  >
                    <Link size={16} />
                  </div>
                </div>
              </div>

              {showEndpointInline && selectedService.serviceEndpoint && (
                <div className={styles.inlineEndpoint}>
                  <div className={styles.inlineEndpointValue}>
                    {selectedService.serviceEndpoint}
                  </div>
                  <button
                    className={`${styles.inlineCopyBtn} ${copied ? styles.copied : ""}`}
                    onClick={handleCopyEndpoint}
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    {copied ? "Copied" : "Copy"}
                  </button>
                </div>
              )}

              {credentials.length === 0 ? (
                <div className={styles.noCredentials}>
                  No credentials found for this instance
                </div>
              ) : (
                credentials.map((cred, idx) => {
                  const compositeKey = getCredentialCompositeKey(
                    selectedService,
                    instanceType,
                    idx,
                  );
                  const entry = unlockedMap[compositeKey] ?? null;
                  return (
                    <CredentialAccordion
                      key={compositeKey}
                      credential={cred}
                      index={idx}
                      isOpen={openAccordionIndex === idx}
                      onToggle={() => toggleAccordion(idx)}
                      credentialId={compositeKey}
                      plainCredential={entry?.plainCredential ?? null}
                      unlockedAt={entry?.unlockedAt ?? null}
                      onUnlock={handleUnlockRequest}
                      onExpire={handleExpire}
                      serviceName={selectedService.name}
                    />
                  );
                })
              )}
            </>
          )}
        </div>
      </div>

      {lockPopupOpen && (
        <LockPopup
          onClose={() => {
            setLockPopupOpen(false);
            setPendingUnlockCredId(null);
          }}
          onVerify={handleVerifyAndUnlock}
        />
      )}
      <ToastContainer />
    </div>
  );
};

export default Workspace;
