"use client";

import React, { useState } from "react";
import {
  Breadcrumbs,
  StatusBadge,
  ConfirmDialog,
  RelativeTime,
} from "../../ui/components";
import { formatTimestamp } from "../../ui/utils";
import { toast } from "sonner";

export interface JobAttempt {
  attemptNumber: number;
  timestamp: string;
  outcome: "completed" | "failed";
  error?: string;
}

export interface JobDetailData {
  id: string;
  type: string;
  status: "active" | "completed" | "failed" | "waiting";
  createdAt: string;
  processedAt?: string;
  completedAt?: string;
  failedAt?: string;
  data?: Record<string, unknown>;
  errorMessage?: string;
  stackTrace?: string;
  attempts: JobAttempt[];
  maxAttempts: number;
}

export interface JobDetailProps {
  job: JobDetailData;
  onRetry: (jobId: string) => Promise<void>;
  onCancel: (jobId: string) => Promise<void>;
  onBack: () => void;
  breadcrumbs?: { label: string; onClick?: () => void }[];
}

export function JobDetail({
  job,
  onRetry,
  onCancel,
  onBack,
  breadcrumbs,
}: JobDetailProps) {
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const handleRetry = async () => {
    setRetrying(true);
    try {
      await onRetry(job.id);
      toast.success("Job retry queued");
    } catch {
      toast.error("Failed to retry job");
    } finally {
      setRetrying(false);
    }
  };

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await onCancel(job.id);
      toast.success("Job cancelled");
    } catch {
      toast.error("Failed to cancel job");
    } finally {
      setCancelling(false);
      setConfirmCancel(false);
    }
  };

  const defaultBreadcrumbs = breadcrumbs || [
    { label: "Admin" },
    { label: "Jobs", onClick: onBack },
    { label: `Job ${job.id}` },
  ];

  return (
    <div className="space-y-6">
      <Breadcrumbs items={defaultBreadcrumbs} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Job Detail</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-mono mt-1">{job.id}</p>
        </div>
        <div className="flex items-center gap-3">
          {job.status === "failed" && (
            <button
              onClick={handleRetry}
              disabled={retrying}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {retrying ? "Retrying..." : "Retry Job"}
            </button>
          )}
          {(job.status === "waiting" || job.status === "active") && (
            <button
              onClick={() => setConfirmCancel(true)}
              disabled={cancelling}
              className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 dark:bg-red-900/20 rounded-md hover:bg-red-100 dark:hover:bg-red-900/40 disabled:opacity-50 transition-colors"
            >
              Cancel Job
            </button>
          )}
          <button
            onClick={onBack}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Back
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Information</h2>
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <dt className="text-sm text-gray-500 dark:text-gray-400">Job ID</dt>
            <dd className="text-sm font-mono text-gray-900 dark:text-white">{job.id}</dd>
          </div>
          <div>
            <dt className="text-sm text-gray-500 dark:text-gray-400">Type</dt>
            <dd className="text-sm font-medium text-gray-900 dark:text-white">{job.type}</dd>
          </div>
          <div>
            <dt className="text-sm text-gray-500 dark:text-gray-400">Status</dt>
            <dd><StatusBadge status={job.status} /></dd>
          </div>
          <div>
            <dt className="text-sm text-gray-500 dark:text-gray-400">Created</dt>
            <dd className="text-sm text-gray-900 dark:text-white" title={formatTimestamp(job.createdAt)}>
              <RelativeTime date={job.createdAt} />
            </dd>
          </div>
          {job.processedAt && (
            <div>
              <dt className="text-sm text-gray-500 dark:text-gray-400">Processed</dt>
              <dd className="text-sm text-gray-900 dark:text-white" title={formatTimestamp(job.processedAt)}>
                <RelativeTime date={job.processedAt} />
              </dd>
            </div>
          )}
          {job.completedAt && (
            <div>
              <dt className="text-sm text-gray-500 dark:text-gray-400">Completed</dt>
              <dd className="text-sm text-gray-900 dark:text-white" title={formatTimestamp(job.completedAt)}>
                <RelativeTime date={job.completedAt} />
              </dd>
            </div>
          )}
          {job.failedAt && (
            <div>
              <dt className="text-sm text-gray-500 dark:text-gray-400">Failed</dt>
              <dd className="text-sm text-gray-900 dark:text-white" title={formatTimestamp(job.failedAt)}>
                <RelativeTime date={job.failedAt} />
              </dd>
            </div>
          )}
          <div>
            <dt className="text-sm text-gray-500 dark:text-gray-400">Attempts</dt>
            <dd className="text-sm text-gray-900 dark:text-white">{job.attempts.length}/{job.maxAttempts}</dd>
          </div>
        </dl>
      </div>

      {job.data && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Job Data</h2>
          <pre className="text-sm bg-gray-50 dark:bg-gray-900 p-4 rounded-lg overflow-auto max-h-64 text-gray-800 dark:text-gray-200">
            {JSON.stringify(job.data, null, 2)}
          </pre>
        </div>
      )}

      {(job.errorMessage || job.stackTrace) && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-red-700 dark:text-red-400 mb-4">Error Details</h2>
          {job.errorMessage && (
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Message</h3>
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{job.errorMessage}</p>
            </div>
          )}
          {job.stackTrace && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Stack Trace</h3>
              <pre className="mt-1 text-xs bg-gray-50 dark:bg-gray-900 p-4 rounded-lg overflow-auto max-h-64 whitespace-pre-wrap text-gray-800 dark:text-gray-200">
                {job.stackTrace}
              </pre>
            </div>
          )}
        </div>
      )}

      {job.attempts.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Attempt History</h2>
          <div className="space-y-3">
            {job.attempts.map((attempt) => (
              <div
                key={attempt.attemptNumber}
                className="flex items-start gap-4 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg"
              >
                <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300">
                  {attempt.attemptNumber}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={attempt.outcome === "completed" ? "success" : "failed"} />
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      <RelativeTime date={attempt.timestamp} />
                    </span>
                  </div>
                  {attempt.error && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400 truncate">{attempt.error}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmCancel}
        title="Cancel Job"
        message="Are you sure you want to cancel this job? This action cannot be undone."
        confirmLabel="Cancel Job"
        variant="warning"
        onConfirm={handleCancel}
        onCancel={() => setConfirmCancel(false)}
      />
    </div>
  );
}
