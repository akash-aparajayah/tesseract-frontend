import React from "react";

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string;
  className?: string;
  style?: React.CSSProperties;
  count?: number;
  gap?: number;
  direction?: "row" | "column";
  inline?: boolean;
}

// Individual skeleton block
const Skeleton: React.FC<SkeletonProps> = ({
  width = "100%",
  height = "20px",
  borderRadius = "8px",
  className = "",
  style = {},
  inline = false,
}) => {
  const baseStyle: React.CSSProperties = {
    width,
    height,
    borderRadius,
    background: "linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%)",
    backgroundSize: "200% 100%",
    animation: "skeletonShimmer 1.5s ease-in-out infinite",
    display: inline ? "inline-block" : "block",
    ...style,
  };

  return <div className={className} style={baseStyle} />;
};

// Preset layouts for common patterns
interface SkeletonLoaderProps {
  variant?: "stats" | "table" | "card" | "detail" | "text" | "avatar" | "button" | "list" | "custom";
  count?: number;
  rows?: number;
  columns?: number;
  gap?: number;
  className?: string;
  style?: React.CSSProperties;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  variant = "custom",
  count = 3,
  rows = 3,
  columns = 2,
  gap = 16,
  className = "",
  style = {},
}) => {
  // Add shimmer animation to the document if not already present
  React.useEffect(() => {
    if (!document.getElementById("skeleton-keyframes")) {
      const style = document.createElement("style");
      style.id = "skeleton-keyframes";
      style.textContent = `
        @keyframes skeletonShimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  const containerStyle: React.CSSProperties = {
    display: "grid",
    gap: `${gap}px`,
    ...style,
  };

  if (variant === "stats") {
    return (
      <div
        className={className}
        style={{
          ...containerStyle,
          gridTemplateColumns: `repeat(auto-fit, minmax(200px, 1fr))`,
        }}
      >
        {Array.from({ length: count }).map((_, i) => (
          <Skeleton key={i} height={100} borderRadius="12px" />
        ))}
      </div>
    );
  }

  if (variant === "table") {
    return (
      <div className={className} style={{ ...style }}>
        {/* Table Header */}
        <div style={{ display: "flex", gap: "12px", marginBottom: "16px", padding: "0 16px" }}>
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} width={`${100 / columns}%`} height="14px" borderRadius="4px" />
          ))}
        </div>
        {/* Table Rows */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} style={{ display: "flex", gap: "12px", padding: "12px 16px", alignItems: "center" }}>
              <Skeleton width="30px" height="30px" borderRadius="50%" />
              <Skeleton width="150px" height="16px" />
              <Skeleton width="200px" height="16px" />
              <Skeleton width="80px" height="24px" borderRadius="12px" />
              <Skeleton width="32px" height="32px" borderRadius="50%" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (variant === "card") {
    return (
      <div
        className={className}
        style={{
          ...containerStyle,
          gridTemplateColumns: `repeat(auto-fill, minmax(280px, 1fr))`,
        }}
      >
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} style={{ padding: "20px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
            <Skeleton height="24px" width="60%" borderRadius="6px" style={{ marginBottom: "12px" }} />
            <Skeleton height="16px" width="80%" borderRadius="4px" style={{ marginBottom: "8px" }} />
            <Skeleton height="16px" width="40%" borderRadius="4px" style={{ marginBottom: "16px" }} />
            <Skeleton height="40px" width="100%" borderRadius="8px" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === "detail") {
    return (
      <div className={className} style={{ padding: "24px", ...style }}>
        <Skeleton height="32px" width="250px" borderRadius="8px" style={{ marginBottom: "20px" }} />
        <Skeleton height="18px" width="300px" borderRadius="4px" style={{ marginBottom: "12px" }} />
        <Skeleton height="18px" width="200px" borderRadius="4px" style={{ marginBottom: "24px" }} />
        <div style={{ display: "flex", gap: "16px", marginBottom: "24px" }}>
          <Skeleton height="80px" width="200px" borderRadius="12px" />
          <Skeleton height="80px" width="200px" borderRadius="12px" />
          <Skeleton height="80px" width="200px" borderRadius="12px" />
        </div>
        <Skeleton height="120px" width="100%" borderRadius="8px" />
      </div>
    );
  }

  if (variant === "text") {
    return (
      <div className={className} style={{ ...style }}>
        {Array.from({ length: count }).map((_, i) => (
          <Skeleton
            key={i}
            height="16px"
            width={i === count - 1 ? "60%" : "100%"}
            borderRadius="4px"
            style={{ marginBottom: "8px" }}
          />
        ))}
      </div>
    );
  }

  if (variant === "avatar") {
    return <Skeleton width={count} height={count} borderRadius="50%" className={className} style={style} />;
  }

  if (variant === "button") {
    return <Skeleton width={count || 120} height={40} borderRadius="8px" className={className} style={style} />;
  }

  if (variant === "list") {
    return (
      <div className={className} style={{ display: "flex", flexDirection: "column", gap: "12px", ...style }}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: "16px", padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
            <Skeleton width="40px" height="40px" borderRadius="50%" />
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
              <Skeleton height="16px" width="60%" borderRadius="4px" />
              <Skeleton height="12px" width="40%" borderRadius="4px" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Custom: just renders simple blocks
  return (
    <div className={className} style={{ ...containerStyle, gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
      {Array.from({ length: rows * columns }).map((_, i) => (
        <Skeleton key={i} height={count} borderRadius="8px" />
      ))}
    </div>
  );
};

// Export both the loader and individual skeleton
export { Skeleton };
export default SkeletonLoader;