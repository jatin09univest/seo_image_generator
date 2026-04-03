"use client";
import { useState, useEffect } from "react";
import {
  Zap,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  ExternalLink,
} from "lucide-react";
import type {
  ConfigStatus,
  AutomationRunResult,
  RowResult,
} from "@/lib/automation-types";

function extractSpreadsheetId(input: string): string {
  const match = input.match(/\/spreadsheets\/d\/([^/]+)/);
  return match ? match[1] : input;
}

export default function AutomationPanel() {
  const [config, setConfig] = useState<ConfigStatus | null>(null);
  const [spreadsheetInput, setSpreadsheetInput] = useState(
    "1w3MuuCkd1PV5DTMoDuYOvnfm8hiyqhSOldQvfIIxrrQ",
  );
  const [driveFolderInput, setDriveFolderInput] = useState("");
  const [batchSize, setBatchSize] = useState(3);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<AutomationRunResult | null>(null);
  const [runError, setRunError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${process.env.BASE_URL}automation/status`)
      .then((r) => r.json())
      .then(setConfig)
      .catch(() => setConfig(null));
  }, []);

  async function handleRun() {
    setRunning(true);
    setResult(null);
    setRunError(null);
    try {
      const res = await fetch(`${process.env.BASE_URL}automation/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          spreadsheetId: extractSpreadsheetId(spreadsheetInput.trim()),
          driveFolderId: driveFolderInput.trim() || undefined,
          batchSize,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setResult(data as AutomationRunResult);
      } else {
        setRunError(data.error || "Automation failed");
      }
    } catch (err) {
      setRunError(err instanceof Error ? err.message : "Network error");
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Config status banner */}
      {config && (
        <div
          className="rounded-xl px-4 py-3 flex items-start gap-3"
          style={{
            background: config.ok
              ? "rgba(34,197,94,0.08)"
              : "rgba(251,191,36,0.08)",
            border: `1px solid ${config.ok ? "rgba(34,197,94,0.25)" : "rgba(251,191,36,0.25)"}`,
          }}
        >
          {config.ok ? (
            <CheckCircle
              className="w-4 h-4 mt-0.5 shrink-0"
              style={{ color: "#22c55e" }}
            />
          ) : (
            <AlertCircle
              className="w-4 h-4 mt-0.5 shrink-0"
              style={{ color: "#fbbf24" }}
            />
          )}
          <div className="text-xs space-y-0.5">
            <p
              className="font-semibold"
              style={{ color: config.ok ? "#22c55e" : "#fbbf24" }}
            >
              {config.ok ? "All systems configured" : "Setup incomplete"}
            </p>
            {config.accountLabel && (
              <p style={{ color: "var(--text-muted)" }}>
                {config.authMode === "oauth_client"
                  ? "OAuth client"
                  : "Service account"}
                : {config.accountLabel}
              </p>
            )}
            <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1">
              <ConfigFlag
                label="Google Auth"
                ok={config.configured.googleAuth}
              />
              <ConfigFlag
                label="Drive Folder"
                ok={config.configured.defaultFolderId}
              />
              <ConfigFlag
                label="Univest API"
                ok={config.configured.univestApiToken}
              />
            </div>
          </div>
        </div>
      )}

      {/* Inputs */}
      <div
        className="rounded-2xl p-4 sm:p-5 space-y-4"
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
        }}
      >
        <p
          className="text-[11px] font-semibold uppercase tracking-widest"
          style={{ color: "var(--text-muted)" }}
        >
          Automation Settings
        </p>

        <div className="space-y-1">
          <label
            className="text-xs font-medium"
            style={{ color: "var(--text-secondary)" }}
          >
            Google Sheet URL or Spreadsheet ID
          </label>
          <input
            type="text"
            value={spreadsheetInput}
            onChange={(e) => setSpreadsheetInput(e.target.value)}
            placeholder="https://docs.google.com/spreadsheets/d/... or bare ID"
            className="w-full text-xs px-3 py-2 rounded-lg outline-none focus:ring-1 focus:ring-blue-500"
            style={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--border)",
              color: "var(--text-primary)",
            }}
          />
          <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
            Parsed ID:{" "}
            <code>{extractSpreadsheetId(spreadsheetInput.trim()) || "—"}</code>
          </p>
        </div>

        <div className="space-y-1">
          <label
            className="text-xs font-medium"
            style={{ color: "var(--text-secondary)" }}
          >
            Drive Folder ID (optional)
          </label>
          <input
            type="text"
            value={driveFolderInput}
            onChange={(e) => setDriveFolderInput(e.target.value)}
            placeholder={
              config?.configured.defaultFolderId
                ? "Using default from env"
                : "Enter folder ID"
            }
            className="w-full text-xs px-3 py-2 rounded-lg outline-none focus:ring-1 focus:ring-blue-500"
            style={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--border)",
              color: "var(--text-primary)",
            }}
          />
          {config?.configured.defaultFolderId && !driveFolderInput && (
            <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
              Using default folder from environment
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label
            className="text-xs font-medium"
            style={{ color: "var(--text-secondary)" }}
          >
            Batch Size (concurrent requests)
          </label>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setBatchSize(n)}
                className="w-8 h-8 rounded-lg text-xs font-semibold transition-all"
                style={{
                  background:
                    batchSize === n
                      ? "rgba(37,99,235,0.2)"
                      : "var(--bg-elevated)",
                  border:
                    batchSize === n
                      ? "1px solid rgba(37,99,235,0.5)"
                      : "1px solid var(--border)",
                  color: batchSize === n ? "#60a5fa" : "var(--text-secondary)",
                }}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleRun}
          disabled={running || !spreadsheetInput.trim()}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110"
          style={{ background: "var(--primary)", color: "#fff" }}
        >
          {running ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Zap className="w-4 h-4" />
          )}
          {running ? "Running automation..." : "Run Automation"}
        </button>
      </div>

      {/* Error */}
      {runError && (
        <div
          className="px-4 py-3 rounded-xl text-sm flex items-start gap-2"
          style={{
            background: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.2)",
            color: "#f87171",
          }}
        >
          <XCircle className="w-4 h-4 mt-0.5 shrink-0" />
          {runError}
        </div>
      )}

      {/* Results */}
      {result && (
        <div
          className="rounded-2xl p-4 sm:p-5 space-y-4"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
          }}
        >
          {/* Summary */}
          <div className="flex items-center gap-4 flex-wrap">
            <p
              className="text-[11px] font-semibold uppercase tracking-widest"
              style={{ color: "var(--text-muted)" }}
            >
              Results
            </p>
            <div className="flex items-center gap-3 text-xs">
              <span style={{ color: "var(--text-secondary)" }}>
                {result.processed} processed
              </span>
              <span style={{ color: "#22c55e" }}>
                {result.succeeded} succeeded
              </span>
              {result.failed > 0 && (
                <span style={{ color: "#ef4444" }}>{result.failed} failed</span>
              )}
              <span style={{ color: "var(--text-muted)" }}>
                {(result.durationMs / 1000).toFixed(1)}s
              </span>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table
              className="w-full text-xs"
              style={{ borderCollapse: "collapse" }}
            >
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  {["Row", "Company", "Template", "Status", "Image"].map(
                    (h) => (
                      <th
                        key={h}
                        className="text-left py-2 pr-4 font-semibold"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {result.results.map((r: RowResult) => (
                  <tr
                    key={r.rowIndex}
                    style={{ borderBottom: "1px solid var(--border)" }}
                  >
                    <td
                      className="py-2 pr-4"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {r.rowIndex}
                    </td>
                    <td
                      className="py-2 pr-4 font-medium"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {r.companyName}
                    </td>
                    <td
                      className="py-2 pr-4"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {r.templateType}
                    </td>
                    <td className="py-2 pr-4">
                      {r.status === "success" ? (
                        <span
                          className="px-2 py-0.5 rounded-full font-medium"
                          style={{
                            background: "rgba(34,197,94,0.12)",
                            color: "#22c55e",
                          }}
                        >
                          Done
                        </span>
                      ) : (
                        <span
                          className="px-2 py-0.5 rounded-full font-medium"
                          style={{
                            background: "rgba(239,68,68,0.12)",
                            color: "#ef4444",
                          }}
                        >
                          Error
                        </span>
                      )}
                    </td>
                    <td className="py-2 pr-4">
                      {r.imageUrl ? (
                        <a
                          href={r.imageUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 hover:opacity-70 transition-opacity"
                          style={{ color: "#60a5fa" }}
                        >
                          <ExternalLink className="w-3 h-3" /> View
                        </a>
                      ) : (
                        <span
                          className="text-[10px]"
                          style={{ color: "#f87171" }}
                        >
                          {r.error ?? "—"}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Setup guide */}
      {config && !config.ok && (
        <div
          className="rounded-2xl p-4 sm:p-5 space-y-3"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
          }}
        >
          <p
            className="text-[11px] font-semibold uppercase tracking-widest"
            style={{ color: "var(--text-muted)" }}
          >
            Setup Required
          </p>
          <ol
            className="text-xs space-y-2 list-decimal list-inside"
            style={{ color: "var(--text-secondary)" }}
          >
            <li>
              Create a Google Cloud project and enable{" "}
              <strong>Sheets API</strong> + <strong>Drive API</strong>
            </li>
            <li>
              Add either <code>GOOGLE_SERVICE_ACCOUNT_JSON</code> or{" "}
              <code>GOOGLE_OAUTH_CLIENT_JSON</code> to <code>.env.local</code>
            </li>
            <li>
              If using OAuth client JSON, add{" "}
              <code>GOOGLE_OAUTH_TOKEN_JSON</code> from your Python flow's{" "}
              <code>token.json</code>, or add{" "}
              <code>GOOGLE_OAUTH_REFRESH_TOKEN</code>
            </li>
            <li>
              Add <code>GOOGLE_DRIVE_FOLDER_ID</code> to <code>.env.local</code>
            </li>
            <li>
              If using a service account, share the Google Sheet and Drive
              folder with that service account email
            </li>
            <li>
              If using OAuth client credentials, ensure the token belongs to a
              user with Drive access
            </li>
          </ol>
        </div>
      )}
    </div>
  );
}

function ConfigFlag({ label, ok }: { label: string; ok: boolean }) {
  return (
    <span
      className="flex items-center gap-1"
      style={{ color: ok ? "#22c55e" : "#f87171" }}
    >
      {ok ? "✓" : "✗"} {label}
    </span>
  );
}
