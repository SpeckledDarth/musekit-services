"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Breadcrumbs,
  LoadingSkeleton,
  EmptyState,
  Pagination,
  StatusBadge,
  RelativeTime,
  ConfirmDialog,
} from "../../ui/components";
import { getTotalPages, exportToCsv } from "../../ui/utils";
import { toast } from "sonner";

export interface JobStats {
  total24h: number;
  active: number;
  completed: number;
  failed: number;
  waiting: number;
}

export interface JobTypeBreakdown {
  type: string;
  total: number;
  completed: number;
  failed: number;
  successRate: number;
}

export interface FailedJob {
  id: string;
  type: string;
  createdAt: string;
  failedAt: string;
  errorMessage: string;
  attempts: number;
  maxAttempts: number;
  stackTrace?: string;
  data?: Record<string, unknown>;
}

export interface JobDashboardProps {
  fetchStats: () => Promise<JobStats>;
  fetchTypeBreakdown: () => Promise<JobTypeBreakdown[]>;
  fetchRecentFailures: (limit?: number) => Promise<FailedJob[]>;
  onRetryJob: (jobId: string) => Promise<void>;
  onNavigateToDetail?: (jobId: string) => void;
  onExportCsv?: () => void;
  breadcrumbs?: { label: string; onClick?: () => void }[];
}

export function JobDashboard({
  fetchStats,
  fetchTypeBreakdown,
  fetchRecentFailures,
  onRetryJob,
  onNavigateToDetail,
  breadcrumbs,
}: JobDashboardProps) {
  const [stats, setStats] = useState<JobStats | null>(null);
  const [typeBreakdown, setTypeBreakdown] = useState<JobTypeBreakdown[]>([]);
  const [failures, setFailures] = useState<FailedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [retrying, setRetrying] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pageSize = 25;

  const loadAll = useCallback(async () => {
    try {
      const [s, tb, f] = await Promise.all([
        fetchStats(),
        fetchTypeBreakdown(),
        fetchRecentFailures(100),
      ]);
      setStats(s);
      setTypeBreakdown(tb);
      setFailures(f);
    } catch {
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, [fetchStats, fetchTypeBreakdown, fetchRecentFailures]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(loadAll, 30000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [autoRefresh, loadAll]);

  const handleRetry = async (jobId: string) => {
    setRetrying(jobId);
    try {
      await onRetryJob(jobId);
      toast.success("Job retry queued");
      loadAll();
    } catch {
      toast.error("Failed to retry job");
    } finally {
      setRetrying(null);
    }
  };

  const handleExportFailures = () => {
    exportToCsv(
      failures.map((f) => ({
        id: f.id,
        type: f.type,
        createdAt: f.createdAt,
        failedAt: f.failedAt,
        error: f.errorMessage,
        attempts: `${f.attempts}/${f.maxAttempts}`,
      })),
      "failed-jobs"
    );
    toast.success("CSV exported");
  };

  const totalPages = getTotalPages({ page, pageSize, total: failures.length });
  const pageFailures = failures.slice((page - 1) * pageSize, page * pageSize);

  const defaultBreadcrumbs = breadcrumbs || [{ label: "Admin" }, { label: "Jobs" }];

  if (loading) {
    return (
      <div className="space-y-6">
        <Breadcrumbs items={defaultBreadcrumbs} />
        <LoadingSkeleton rows={5} columns={4} type="cards" />
        <LoadingSkeleton rows={5} columns={5} type="table" />
      </div>
    );
  }

  const statCards = [
    { label: "Total (24h)", value: stats?.total24h ?? 0, color: "text-gray-900 dark:text-white" },
    { label: "Active", value: stats?.active ?? 0, color: "text-blue-600 dark:text-blue-400" },
    { label: "Completed", value: stats?.completed ?? 0, color: "text-green-600 dark:text-green-400" },
    { label: "Failed", value: stats?.failed ?? 0, color: "text-red-600 dark:text-red-400" },
    { label: "Waiting", value: stats?.waiting ?? 0, color: "text-yellow-600 dark:text-yellow-400" },
  ];

  return (
    <div className="space-y-6">
      <Breadcrumbs items={defaultBreadcrumbs} />

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Background Jobs</h1>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 cursor-pointer">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded border-gray-300 dark:border-gray-600"
            />
            Auto-refresh (30s)
          </label>
          <button
            onClick={loadAll}
            className="px-3 py-2 text-sm text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {statCards.map((card) => (
          <div key={card.label} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">{card.label}</p>
            <p className={`text-2xl font-bold ${card.color}`}>{card.value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      {typeBreakdown.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Job Types</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {typeBreakdown.map((tb) => (
              <div key={tb.type} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">{tb.type}</h3>
                <div className="mt-2 grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">{tb.total}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Success</p>
                    <p className="text-lg font-semibold text-green-600 dark:text-green-400">{tb.completed}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Failed</p>
                    <p className="text-lg font-semibold text-red-600 dark:text-red-400">{tb.failed}</p>
                  </div>
                </div>
                <div className="mt-2">
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>Success Rate</span>
                    <span>{tb.successRate}%</span>
                  </div>
                  <div className="mt-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full transition-all"
                      style={{ width: `${tb.successRate}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Recent Failures <span className="text-sm font-normal text-gray-500 dark:text-gray-400">({failures.length})</span>
          </h2>
          <button
            onClick={handleExportFailures}
            className="px-3 py-2 text-sm text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Export CSV
          </button>
        </div>

        {failures.length === 0 ? (
          <EmptyState
            title="No failed jobs"
            description="All jobs are running smoothly."
          />
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Job Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Created</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Failed</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Error</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Attempts</th>
                  <th className="px-4 py-3 w-20" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {pageFailures.map((f) => (
                  <React.Fragment key={f.id}>
                    <tr
                      onClick={() => {
                        if (onNavigateToDetail) onNavigateToDetail(f.id);
                        else setExpandedId(expandedId === f.id ? null : f.id);
                      }}
                      className="hover:bg-gray-50 dark:hover:bg-gray-750 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white font-medium">{f.type}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                        <RelativeTime date={f.createdAt} />
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                        <RelativeTime date={f.failedAt} />
                      </td>
                      <td className="px-4 py-3 text-sm text-red-600 dark:text-red-400 truncate max-w-xs">
                        {f.errorMessage}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                        {f.attempts}/{f.maxAttempts}
                      </td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleRetry(f.id)}
                          disabled={retrying === f.id}
                          className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 disabled:opacity-50"
                        >
                          {retrying === f.id ? "Retrying..." : "Retry"}
                        </button>
                      </td>
                    </tr>
                    {expandedId === f.id && (
                      <tr>
                        <td colSpan={6} className="px-4 py-4 bg-gray-50 dark:bg-gray-900">
                          <div className="space-y-3 text-sm">
                            <div>
                              <h4 className="font-medium text-gray-700 dark:text-gray-300">Error Message</h4>
                              <p className="text-red-600 dark:text-red-400">{f.errorMessage}</p>
                            </div>
                            {f.stackTrace && (
                              <div>
                                <h4 className="font-medium text-gray-700 dark:text-gray-300">Stack Trace</h4>
                                <pre className="mt-1 text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-auto max-h-40 whitespace-pre-wrap">
                                  {f.stackTrace}
                                </pre>
                              </div>
                            )}
                            {f.data && (
                              <div>
                                <h4 className="font-medium text-gray-700 dark:text-gray-300">Job Data</h4>
                                <pre className="mt-1 text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-auto max-h-40">
                                  {JSON.stringify(f.data, null, 2)}
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
    </div>
  );
}
