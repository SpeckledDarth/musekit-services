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
          <h1 className="text-2xl font-bold text-foreground">Job Detail</h1>
          <p className="text-sm text-muted-foreground font-mono mt-1">{job.id}</p>
        </div>
        <div className="flex items-center gap-3">
          {job.status === "failed" && (
            <button
              onClick={handleRetry}
              disabled={retrying}
              className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {retrying ? "Retrying..." : "Retry Job"}
            </button>
          )}
          {(job.status === "waiting" || job.status === "active") && (
            <button
              onClick={() => setConfirmCancel(true)}
              disabled={cancelling}
              className="px-4 py-2 text-sm font-medium text-danger bg-danger/10 rounded-md hover:bg-danger/20 disabled:opacity-50 transition-colors"
            >
              Cancel Job
            </button>
          )}
          <button
            onClick={onBack}
            className="px-4 py-2 text-sm font-medium text-muted-foreground bg-muted rounded-md hover:bg-accent transition-colors"
          >
            Back
          </button>
        </div>
      </div>

      <div className="bg-card rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Information</h2>
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <dt className="text-sm text-muted-foreground">Job ID</dt>
            <dd className="text-sm font-mono text-foreground">{job.id}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">Type</dt>
            <dd className="text-sm font-medium text-foreground">{job.type}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">Status</dt>
            <dd><StatusBadge status={job.status} /></dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">Created</dt>
            <dd className="text-sm text-foreground" title={formatTimestamp(job.createdAt)}>
              <RelativeTime date={job.createdAt} />
            </dd>
          </div>
          {job.processedAt && (
            <div>
              <dt className="text-sm text-muted-foreground">Processed</dt>
              <dd className="text-sm text-foreground" title={formatTimestamp(job.processedAt)}>
                <RelativeTime date={job.processedAt} />
              </dd>
            </div>
          )}
          {job.completedAt && (
            <div>
              <dt className="text-sm text-muted-foreground">Completed</dt>
              <dd className="text-sm text-foreground" title={formatTimestamp(job.completedAt)}>
                <RelativeTime date={job.completedAt} />
              </dd>
            </div>
          )}
          {job.failedAt && (
            <div>
              <dt className="text-sm text-muted-foreground">Failed</dt>
              <dd className="text-sm text-foreground" title={formatTimestamp(job.failedAt)}>
                <RelativeTime date={job.failedAt} />
              </dd>
            </div>
          )}
          <div>
            <dt className="text-sm text-muted-foreground">Attempts</dt>
            <dd className="text-sm text-foreground">{job.attempts.length}/{job.maxAttempts}</dd>
          </div>
        </dl>
      </div>

      {job.data && (
        <div className="bg-card rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Job Data</h2>
          <pre className="text-sm bg-muted p-4 rounded-lg overflow-auto max-h-64 text-foreground">
            {JSON.stringify(job.data, null, 2)}
          </pre>
        </div>
      )}

      {(job.errorMessage || job.stackTrace) && (
        <div className="bg-card rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-danger mb-4">Error Details</h2>
          {job.errorMessage && (
            <div className="mb-4">
              <h3 className="text-sm font-medium text-foreground">Message</h3>
              <p className="mt-1 text-sm text-danger">{job.errorMessage}</p>
            </div>
          )}
          {job.stackTrace && (
            <div>
              <h3 className="text-sm font-medium text-foreground">Stack Trace</h3>
              <pre className="mt-1 text-xs bg-muted p-4 rounded-lg overflow-auto max-h-64 whitespace-pre-wrap text-foreground">
                {job.stackTrace}
              </pre>
            </div>
          )}
        </div>
      )}

      {job.attempts.length > 0 && (
        <div className="bg-card rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Attempt History</h2>
          <div className="space-y-3">
            {job.attempts.map((attempt) => (
              <div
                key={attempt.attemptNumber}
                className="flex items-start gap-4 p-3 bg-muted rounded-lg"
              >
                <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-muted text-sm font-medium text-muted-foreground border border-border">
                  {attempt.attemptNumber}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={attempt.outcome === "completed" ? "success" : "failed"} />
                    <span className="text-sm text-muted-foreground">
                      <RelativeTime date={attempt.timestamp} />
                    </span>
                  </div>
                  {attempt.error && (
                    <p className="mt-1 text-sm text-danger truncate">{attempt.error}</p>
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
