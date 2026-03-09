"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Breadcrumbs,
  LoadingSkeleton,
  EmptyState,
  Pagination,
  StatusBadge,
  FilterDropdown,
  ConfirmDialog,
  RelativeTime,
} from "../../ui/components";
import { getTotalPages } from "../../ui/utils";
import { toast } from "sonner";

export interface WebhookDetailData {
  id: string;
  url: string;
  description?: string;
  events: string[];
  secret: string;
  enabled: boolean;
  createdAt?: string;
}

export interface WebhookDelivery {
  id: string;
  event: string;
  timestamp: string;
  httpStatus: number | null;
  responseTimeMs: number | null;
  success: boolean;
  requestHeaders?: Record<string, string>;
  requestBody?: string;
  responseBody?: string;
  error?: string;
}

export interface WebhookTestResult {
  success: boolean;
  httpStatus?: number;
  responseTimeMs?: number;
  error?: string;
  responseHeaders?: Record<string, string>;
  responseBody?: string;
}

export interface WebhookDetailProps {
  webhook: WebhookDetailData;
  fetchDeliveries: (webhookId: string) => Promise<WebhookDelivery[]>;
  onTestWebhook: (webhookId: string) => Promise<WebhookTestResult>;
  onRetryDelivery: (deliveryId: string) => Promise<void>;
  onEdit: (webhookId: string) => void;
  onDelete: (webhookId: string) => Promise<void>;
  onBack: () => void;
  breadcrumbs?: { label: string; onClick?: () => void }[];
}

type DeliverySortField = "event" | "timestamp" | "httpStatus" | "responseTimeMs" | "success";
type SortDir = "asc" | "desc";

export function WebhookDetail({
  webhook,
  fetchDeliveries,
  onTestWebhook,
  onRetryDelivery,
  onEdit,
  onDelete,
  onBack,
  breadcrumbs,
}: WebhookDetailProps) {
  const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [secretVisible, setSecretVisible] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortField, setSortField] = useState<DeliverySortField>("timestamp");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<WebhookTestResult | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [retrying, setRetrying] = useState<string | null>(null);
  const pageSize = 25;

  const loadDeliveries = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchDeliveries(webhook.id);
      setDeliveries(data);
    } catch {
      toast.error("Failed to load delivery history");
    } finally {
      setLoading(false);
    }
  }, [fetchDeliveries, webhook.id]);

  useEffect(() => {
    loadDeliveries();
  }, [loadDeliveries]);

  const filtered = deliveries
    .filter((d) => {
      if (statusFilter === "success" && !d.success) return false;
      if (statusFilter === "failed" && d.success) return false;
      return true;
    })
    .sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "event":
          cmp = a.event.localeCompare(b.event);
          break;
        case "timestamp":
          cmp = a.timestamp.localeCompare(b.timestamp);
          break;
        case "httpStatus":
          cmp = (a.httpStatus ?? 0) - (b.httpStatus ?? 0);
          break;
        case "responseTimeMs":
          cmp = (a.responseTimeMs ?? 0) - (b.responseTimeMs ?? 0);
          break;
        case "success":
          cmp = (a.success ? 1 : 0) - (b.success ? 1 : 0);
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

  const totalPages = getTotalPages({ page, pageSize, total: filtered.length });
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);

  const handleSort = (field: DeliverySortField) => {
    if (sortField === field) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const result = await onTestWebhook(webhook.id);
      setTestResult(result);
      if (result.success) toast.success("Test webhook delivered successfully");
      else toast.error(`Test webhook failed: ${result.error || `HTTP ${result.httpStatus}`}`);
      loadDeliveries();
    } catch {
      toast.error("Failed to send test webhook");
    } finally {
      setTesting(false);
    }
  };

  const handleRetry = async (deliveryId: string) => {
    setRetrying(deliveryId);
    try {
      await onRetryDelivery(deliveryId);
      toast.success("Delivery retry queued");
      loadDeliveries();
    } catch {
      toast.error("Failed to retry delivery");
    } finally {
      setRetrying(null);
    }
  };

  const handleDelete = async () => {
    try {
      await onDelete(webhook.id);
      toast.success("Webhook deleted");
    } catch {
      toast.error("Failed to delete webhook");
    }
    setConfirmDeleteOpen(false);
  };

  const SortHeader = ({ field, label }: { field: DeliverySortField; label: string }) => (
    <th
      onClick={() => handleSort(field)}
      className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground select-none"
    >
      {label} {sortField === field && (sortDir === "asc" ? "\u2191" : "\u2193")}
    </th>
  );

  const defaultBreadcrumbs = breadcrumbs || [
    { label: "Admin" },
    { label: "Webhooks", onClick: onBack },
    { label: webhook.url },
  ];

  return (
    <div className="space-y-6">
      <Breadcrumbs items={defaultBreadcrumbs} />

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground truncate max-w-lg">
          {webhook.url}
        </h1>
        <div className="flex items-center gap-3">
          <button
            onClick={handleTest}
            disabled={testing}
            className="px-4 py-2 text-sm font-medium bg-success text-success-foreground rounded-md hover:bg-success/90 disabled:opacity-50 transition-colors"
          >
            {testing ? "Testing..." : "Test Webhook"}
          </button>
          <button
            onClick={() => onEdit(webhook.id)}
            className="px-4 py-2 text-sm font-medium text-muted-foreground bg-muted rounded-md hover:bg-accent transition-colors"
          >
            Edit
          </button>
          <button
            onClick={() => setConfirmDeleteOpen(true)}
            className="px-4 py-2 text-sm font-medium text-danger bg-danger/10 rounded-md hover:bg-danger/20 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="bg-card rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Configuration</h2>
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <dt className="text-sm text-muted-foreground">URL</dt>
            <dd className="text-sm font-mono text-foreground break-all">{webhook.url}</dd>
          </div>
          {webhook.description && (
            <div>
              <dt className="text-sm text-muted-foreground">Description</dt>
              <dd className="text-sm text-foreground">{webhook.description}</dd>
            </div>
          )}
          <div>
            <dt className="text-sm text-muted-foreground">Status</dt>
            <dd><StatusBadge status={webhook.enabled ? "active" : "inactive"} /></dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">Events</dt>
            <dd className="flex flex-wrap gap-1">
              {webhook.events.map((e) => (
                <span key={e} className="inline-flex px-2 py-0.5 text-xs bg-muted text-muted-foreground rounded">
                  {e}
                </span>
              ))}
            </dd>
          </div>
          <div className="md:col-span-2">
            <dt className="text-sm text-muted-foreground">Signing Secret</dt>
            <dd className="flex items-center gap-2 mt-1">
              <code className="text-sm font-mono text-foreground bg-muted px-2 py-1 rounded">
                {secretVisible ? webhook.secret : "\u2022".repeat(24)}
              </code>
              <button
                onClick={() => setSecretVisible(!secretVisible)}
                className="text-xs text-primary hover:text-primary/80"
              >
                {secretVisible ? "Hide" : "Reveal"}
              </button>
            </dd>
          </div>
        </dl>
      </div>

      {testResult && (
        <div className={`rounded-lg p-4 ${testResult.success ? "bg-success/10 border border-success/20" : "bg-danger/10 border border-danger/20"}`}>
          <h3 className={`text-sm font-semibold ${testResult.success ? "text-success" : "text-danger"}`}>
            Test Result: {testResult.success ? "Success" : "Failed"}
          </h3>
          <div className="mt-2 text-sm space-y-1">
            {testResult.httpStatus && (
              <p className="text-muted-foreground">HTTP Status: {testResult.httpStatus}</p>
            )}
            {testResult.responseTimeMs != null && (
              <p className="text-muted-foreground">Response Time: {testResult.responseTimeMs}ms</p>
            )}
            {testResult.error && (
              <div>
                <p className="text-danger">Error: {testResult.error}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Common causes: SSL certificate issues, DNS resolution failure, endpoint timeout, or invalid URL.
                </p>
              </div>
            )}
            {testResult.responseBody && (
              <details className="mt-2">
                <summary className="text-xs text-muted-foreground cursor-pointer">Response Body</summary>
                <pre className="mt-1 text-xs bg-muted p-2 rounded overflow-auto max-h-40">
                  {testResult.responseBody}
                </pre>
              </details>
            )}
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">
            Delivery History {!loading && <span className="text-sm font-normal text-muted-foreground">({filtered.length})</span>}
          </h2>
          <FilterDropdown
            label="Status"
            value={statusFilter}
            options={[
              { value: "all", label: "All" },
              { value: "success", label: "Success" },
              { value: "failed", label: "Failed" },
            ]}
            onChange={setStatusFilter}
          />
        </div>

        {loading ? (
          <LoadingSkeleton rows={5} columns={5} type="table" />
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No deliveries yet"
            description="Send a test webhook to see delivery results here."
          />
        ) : (
          <div className="bg-card rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted">
                <tr>
                  <SortHeader field="event" label="Event" />
                  <SortHeader field="timestamp" label="Timestamp" />
                  <SortHeader field="httpStatus" label="HTTP Status" />
                  <SortHeader field="responseTimeMs" label="Response Time" />
                  <SortHeader field="success" label="Status" />
                  <th className="px-4 py-3 w-20" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {pageItems.map((d) => (
                  <React.Fragment key={d.id}>
                    <tr
                      onClick={() => setExpandedId(expandedId === d.id ? null : d.id)}
                      className="hover:bg-accent cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3 text-sm text-foreground">{d.event}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        <RelativeTime date={d.timestamp} />
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {d.httpStatus ?? "N/A"}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {d.responseTimeMs != null ? `${d.responseTimeMs}ms` : "N/A"}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={d.success ? "success" : "failed"} />
                      </td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        {!d.success && (
                          <button
                            onClick={() => handleRetry(d.id)}
                            disabled={retrying === d.id}
                            className="text-xs text-primary hover:text-primary/80 disabled:opacity-50"
                          >
                            {retrying === d.id ? "Retrying..." : "Retry"}
                          </button>
                        )}
                      </td>
                    </tr>
                    {expandedId === d.id && (
                      <tr>
                        <td colSpan={6} className="px-4 py-4 bg-muted">
                          <div className="space-y-3 text-sm">
                            {d.error && (
                              <div>
                                <h4 className="font-medium text-danger">Error</h4>
                                <p className="text-muted-foreground">{d.error}</p>
                              </div>
                            )}
                            {d.requestHeaders && (
                              <div>
                                <h4 className="font-medium text-foreground">Request Headers</h4>
                                <pre className="mt-1 text-xs bg-muted p-2 rounded overflow-auto max-h-32">
                                  {JSON.stringify(d.requestHeaders, null, 2)}
                                </pre>
                              </div>
                            )}
                            {d.requestBody && (
                              <div>
                                <h4 className="font-medium text-foreground">Request Body</h4>
                                <pre className="mt-1 text-xs bg-muted p-2 rounded overflow-auto max-h-32">
                                  {(() => { try { return JSON.stringify(JSON.parse(d.requestBody), null, 2); } catch { return d.requestBody; } })()}
                                </pre>
                              </div>
                            )}
                            {d.responseBody && (
                              <div>
                                <h4 className="font-medium text-foreground">Response Body</h4>
                                <pre className="mt-1 text-xs bg-muted p-2 rounded overflow-auto max-h-32">
                                  {(() => { try { return JSON.stringify(JSON.parse(d.responseBody), null, 2); } catch { return d.responseBody; } })()}
                                </pre>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>

      <ConfirmDialog
        open={confirmDeleteOpen}
        title="Delete Webhook"
        message="Are you sure you want to delete this webhook? All delivery history will be lost."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDeleteOpen(false)}
      />
    </div>
  );
}
