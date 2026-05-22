import { useState, useEffect, useCallback } from "react";

interface ServerMaintenanceProps {
  onRetry?: () => void;
  statusCode?: number;
}

export default function ServerMaintenance({ onRetry, statusCode }: ServerMaintenanceProps) {
  const [countdown, setCountdown] = useState(30);
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = useCallback(() => {
    setIsRetrying(true);
    setCountdown(30);

    if (onRetry) {
      onRetry();
    } else {
      // Default: reload the page
      setTimeout(() => window.location.reload(), 600);
    }

    setTimeout(() => setIsRetrying(false), 2000);
  }, [onRetry]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          handleRetry();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [handleRetry]);

  return (
    <div className="server-maintenance-overlay" id="server-maintenance-page">
      {/* Animated background particles */}
      <div className="maintenance-bg-effects">
        <div className="maintenance-orb maintenance-orb-1" />
        <div className="maintenance-orb maintenance-orb-2" />
        <div className="maintenance-orb maintenance-orb-3" />
        <div className="maintenance-grid-bg" />
      </div>

      <div className="maintenance-content">
        {/* Animated gear icon */}
        <div className="maintenance-icon-wrapper">
          <svg
            className="maintenance-gear maintenance-gear-outer"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z" />
            <path d="M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
            <path d="M12 2v2" />
            <path d="M12 20v2" />
            <path d="m4.93 4.93 1.41 1.41" />
            <path d="m17.66 17.66 1.41 1.41" />
            <path d="M2 12h2" />
            <path d="M20 12h2" />
            <path d="m6.34 17.66-1.41 1.41" />
            <path d="m19.07 4.93-1.41 1.41" />
          </svg>
          <div className="maintenance-pulse-ring" />
          <div className="maintenance-pulse-ring maintenance-pulse-ring-delayed" />
        </div>

        {/* Status badge */}
        <div className="maintenance-status-badge">
          <span className="maintenance-status-dot" />
          <span>Server Maintenance</span>
        </div>

        {/* Main heading */}
        <h1 className="maintenance-heading">
          We'll Be Right Back
        </h1>

        {/* Description */}
        <p className="maintenance-description">
          Our servers are currently undergoing scheduled maintenance to improve
          your experience. We apologize for the inconvenience and appreciate
          your patience.
        </p>

        {/* Info cards */}
        <div className="maintenance-info-row">
          <div className="maintenance-info-card">
            <div className="maintenance-info-icon">🔧</div>
            <div className="maintenance-info-label">Status</div>
            <div className="maintenance-info-value">Maintenance</div>
          </div>
          <div className="maintenance-info-card">
            <div className="maintenance-info-icon">⏱️</div>
            <div className="maintenance-info-label">Auto Retry</div>
            <div className="maintenance-info-value">{countdown}s</div>
          </div>
          {statusCode && (
            <div className="maintenance-info-card">
              <div className="maintenance-info-icon">📡</div>
              <div className="maintenance-info-label">Code</div>
              <div className="maintenance-info-value">{statusCode}</div>
            </div>
          )}
        </div>

        {/* Retry button */}
        <button
          onClick={handleRetry}
          disabled={isRetrying}
          className="maintenance-retry-btn"
          id="maintenance-retry-button"
        >
          {isRetrying ? (
            <>
              <svg className="maintenance-spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
              Retrying…
            </>
          ) : (
            <>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }}>
                <polyline points="23 4 23 10 17 10" />
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
              </svg>
              Try Again
            </>
          )}
        </button>

        {/* Progress bar for auto-retry */}
        <div className="maintenance-progress-track">
          <div
            className="maintenance-progress-bar"
            style={{ width: `${((30 - countdown) / 30) * 100}%` }}
          />
        </div>
        <p className="maintenance-progress-label">
          Auto-retrying in {countdown} seconds
        </p>
      </div>

      <style>{`
        .server-maintenance-overlay {
          position: fixed;
          inset: 0;
          z-index: 99999;
          display: flex;
          align-items: center;
          justify-content: center;
          background: oklch(0.08 0.02 25);
          font-family: "Outfit", "Inter", system-ui, sans-serif;
          overflow: hidden;
        }

        .maintenance-bg-effects {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }

        .maintenance-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.3;
        }

        .maintenance-orb-1 {
          width: 400px;
          height: 400px;
          background: oklch(0.50 0.24 27 / 0.4);
          top: -10%;
          right: -5%;
          animation: maintenance-float 12s ease-in-out infinite;
        }

        .maintenance-orb-2 {
          width: 300px;
          height: 300px;
          background: oklch(0.78 0.16 80 / 0.3);
          bottom: -5%;
          left: -5%;
          animation: maintenance-float 16s ease-in-out infinite reverse;
        }

        .maintenance-orb-3 {
          width: 200px;
          height: 200px;
          background: oklch(0.55 0.22 27 / 0.25);
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          animation: maintenance-float 10s ease-in-out infinite;
        }

        .maintenance-grid-bg {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(oklch(0.78 0.16 80 / 0.04) 1px, transparent 1px),
            linear-gradient(90deg, oklch(0.78 0.16 80 / 0.04) 1px, transparent 1px);
          background-size: 60px 60px;
          mask-image: radial-gradient(ellipse at center, black 20%, transparent 70%);
        }

        .maintenance-content {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          max-width: 540px;
          padding: 2rem;
          animation: maintenance-rise 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) both;
        }

        .maintenance-icon-wrapper {
          position: relative;
          width: 100px;
          height: 100px;
          margin-bottom: 2rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .maintenance-gear {
          width: 56px;
          height: 56px;
          color: oklch(0.78 0.16 80);
          filter: drop-shadow(0 0 12px oklch(0.78 0.16 80 / 0.5));
        }

        .maintenance-gear-outer {
          animation: maintenance-spin 8s linear infinite;
        }

        .maintenance-pulse-ring {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          border: 2px solid oklch(0.78 0.16 80 / 0.3);
          animation: maintenance-pulse 3s ease-out infinite;
        }

        .maintenance-pulse-ring-delayed {
          animation-delay: 1.5s;
        }

        .maintenance-status-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 16px;
          border-radius: 999px;
          background: oklch(0.50 0.24 27 / 0.15);
          border: 1px solid oklch(0.50 0.24 27 / 0.3);
          color: oklch(0.75 0.20 27);
          font-size: 0.8rem;
          font-weight: 600;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          margin-bottom: 1.5rem;
        }

        .maintenance-status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: oklch(0.65 0.22 27);
          animation: maintenance-blink 2s ease-in-out infinite;
        }

        .maintenance-heading {
          font-family: "Cinzel", "Playfair Display", serif;
          font-size: 2.5rem;
          font-weight: 700;
          letter-spacing: 0.02em;
          margin: 0 0 1rem 0;
          background: linear-gradient(135deg, oklch(0.95 0.10 90), oklch(0.78 0.18 80) 50%, oklch(0.55 0.15 60));
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          line-height: 1.2;
        }

        .maintenance-description {
          font-size: 1rem;
          line-height: 1.7;
          color: oklch(0.65 0.03 80);
          margin: 0 0 2rem 0;
          max-width: 440px;
        }

        .maintenance-info-row {
          display: flex;
          gap: 1rem;
          margin-bottom: 2rem;
          flex-wrap: wrap;
          justify-content: center;
        }

        .maintenance-info-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          padding: 1rem 1.25rem;
          border-radius: 16px;
          background: oklch(0.14 0.03 20 / 0.6);
          backdrop-filter: blur(16px);
          border: 1px solid oklch(0.78 0.16 80 / 0.15);
          min-width: 100px;
        }

        .maintenance-info-icon {
          font-size: 1.3rem;
          margin-bottom: 2px;
        }

        .maintenance-info-label {
          font-size: 0.7rem;
          color: oklch(0.55 0.03 80);
          text-transform: uppercase;
          letter-spacing: 0.08em;
          font-weight: 500;
        }

        .maintenance-info-value {
          font-size: 1.1rem;
          font-weight: 700;
          color: oklch(0.92 0.05 90);
        }

        .maintenance-retry-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 28px;
          border-radius: 12px;
          border: 1px solid oklch(0.78 0.16 80 / 0.3);
          background: linear-gradient(135deg, oklch(0.50 0.24 27 / 0.3), oklch(0.30 0.18 25 / 0.4));
          color: oklch(0.92 0.08 85);
          font-family: "Outfit", "Inter", system-ui, sans-serif;
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
          margin-bottom: 1.5rem;
        }

        .maintenance-retry-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 30px oklch(0.78 0.16 80 / 0.2), 0 0 0 1px oklch(0.78 0.16 80 / 0.3);
          background: linear-gradient(135deg, oklch(0.55 0.24 27 / 0.4), oklch(0.35 0.18 25 / 0.5));
        }

        .maintenance-retry-btn:active:not(:disabled) {
          transform: translateY(0);
        }

        .maintenance-retry-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .maintenance-spinner {
          width: 18px;
          height: 18px;
          animation: maintenance-spin 1s linear infinite;
        }

        .maintenance-progress-track {
          width: 200px;
          height: 4px;
          border-radius: 999px;
          background: oklch(0.20 0.03 25);
          overflow: hidden;
          margin-bottom: 0.5rem;
        }

        .maintenance-progress-bar {
          height: 100%;
          border-radius: 999px;
          background: linear-gradient(90deg, oklch(0.50 0.24 27), oklch(0.78 0.16 80));
          transition: width 1s linear;
        }

        .maintenance-progress-label {
          font-size: 0.75rem;
          color: oklch(0.50 0.03 80);
          margin: 0;
        }

        @keyframes maintenance-spin {
          to { transform: rotate(360deg); }
        }

        @keyframes maintenance-pulse {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(2.2); opacity: 0; }
        }

        @keyframes maintenance-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }

        @keyframes maintenance-float {
          0%, 100% { transform: translateY(0) translateX(0); }
          33% { transform: translateY(-20px) translateX(10px); }
          66% { transform: translateY(10px) translateX(-15px); }
        }

        @keyframes maintenance-rise {
          from { opacity: 0; transform: translateY(30px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        @media (max-width: 640px) {
          .maintenance-heading {
            font-size: 1.8rem;
          }
          .maintenance-description {
            font-size: 0.9rem;
          }
          .maintenance-info-row {
            gap: 0.5rem;
          }
          .maintenance-info-card {
            padding: 0.75rem 1rem;
            min-width: 80px;
          }
        }
      `}</style>
    </div>
  );
}
