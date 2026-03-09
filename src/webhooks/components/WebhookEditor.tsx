"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Breadcrumbs,
  ConfirmDialog,
  LoadingSkeleton,
} from "../../ui/components";
import { generateSecret, isValidUrl } from "../../ui/utils";
import { toast } from "sonner";

export interface WebhookEditorData {
  id?: string;
  url: string;
  description?: string;
  events: string[];
  secret: string;
  enabled: boolean;
}

export interface WebhookEditorProps {
  webhook?: WebhookEditorData;
  availableEvents: string[];
  onSave: (data: WebhookEditorData) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  onCancel: () => void;
  breadcrumbs?: { label: string; onClick?: () => void }[];
}

export function WebhookEditor({
  webhook,
  availableEvents,
  onSave,
  onDelete,
  onCancel,
  breadcrumbs,
}: WebhookEditorProps) {
  const isEdit = !!webhook?.id;
  const [url, setUrl] = useState(webhook?.url || "");
  const [description, setDescription] = useState(webhook?.description || "");
  const [events, setEvents] = useState<Set<string>>(new Set(webhook?.events || []));
  const [secret, setSecret] = useState(webhook?.secret || generateSecret());
  const [enabled, setEnabled] = useState(webhook?.enabled ?? true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [secretVisible, setSecretVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const isDirtyRef = useRef(false);

  useEffect(() => {
    isDirtyRef.current = true;
  }, [url, description, events, secret, enabled]);

  useEffect(() => {
    isDirtyRef.current = false;
  }, []);

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirtyRef.current) {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!url.trim()) {
      errs.url = "URL is required";
    } else if (!isValidUrl(url)) {
      errs.url = "Must be a valid HTTP or HTTPS URL";
    }
    if (events.size === 0) {
      errs.events = "Select at least one event";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await onSave({
        id: webhook?.id,
        url: url.trim(),
        description: description.trim() || undefined,
        events: Array.from(events),
        secret,
        enabled,
      });
      isDirtyRef.current = false;
      toast.success(isEdit ? "Webhook updated" : "Webhook created");
    } catch {
      toast.error("Failed to save webhook");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!webhook?.id || !onDelete) return;
    try {
      await onDelete(webhook.id);
      isDirtyRef.current = false;
      toast.success("Webhook deleted");
    } catch {
      toast.error("Failed to delete webhook");
    }
    setConfirmDeleteOpen(false);
  };

  const handleCancel = () => {
    if (isDirtyRef.current) {
      if (!window.confirm("You have unsaved changes. Are you sure you want to leave?")) return;
    }
    onCancel();
  };

  const toggleEvent = (event: string) => {
    setEvents((prev) => {
      const next = new Set(prev);
      if (next.has(event)) next.delete(event);
      else next.add(event);
      return next;
    });
  };

  const handleCopySecret = async () => {
    try {
      await navigator.clipboard.writeText(secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  };

  const regenerateSecret = () => {
    setSecret(generateSecret());
    toast.success("New signing secret generated");
  };

  const defaultBreadcrumbs = breadcrumbs || [
    { label: "Admin" },
    { label: "Webhooks", onClick: onCancel },
    { label: isEdit ? "Edit" : "Add" },
  ];

  return (
    <div className="max-w-2xl space-y-6">
      <Breadcrumbs items={defaultBreadcrumbs} />

      <h1 className="text-2xl font-bold text-foreground">
        {isEdit ? "Edit Webhook" : "Add Webhook"}
      </h1>

      <div className="bg-card rounded-lg shadow p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Endpoint URL <span className="text-danger">*</span>
          </label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/webhooks"
            className={`w-full px-3 py-2 text-sm border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring ${
              errors.url ? "border-danger" : "border-input"
            }`}
          />
          {errors.url && <p className="mt-1 text-xs text-danger">{errors.url}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Description
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional description"
            className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Event Types <span className="text-danger">*</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            {availableEvents.map((event) => (
              <label
                key={event}
                className="flex items-center gap-2 p-2 rounded-md hover:bg-accent cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={events.has(event)}
                  onChange={() => toggleEvent(event)}
                  className="rounded border-input text-primary"
                />
                <span className="text-sm text-foreground">{event}</span>
              </label>
            ))}
          </div>
          {errors.events && <p className="mt-1 text-xs text-danger">{errors.events}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Signing Secret
          </label>
          <div className="flex items-center gap-2">
            <input
              type={secretVisible ? "text" : "password"}
              value={secret}
              readOnly
              className="flex-1 px-3 py-2 text-sm font-mono border border-input rounded-md bg-muted text-foreground"
            />
            <button
              type="button"
              onClick={() => setSecretVisible(!secretVisible)}
              className="px-3 py-2 text-sm text-muted-foreground bg-muted rounded-md hover:bg-accent transition-colors"
            >
              {secretVisible ? "Hide" : "Show"}
            </button>
            <button
              type="button"
              onClick={handleCopySecret}
              className="px-3 py-2 text-sm text-muted-foreground bg-muted rounded-md hover:bg-accent transition-colors"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
            <button
              type="button"
              onClick={regenerateSecret}
              className="px-3 py-2 text-sm text-muted-foreground bg-muted rounded-md hover:bg-accent transition-colors"
            >
              Regenerate
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-foreground">
            Active
          </label>
          <button
            type="button"
            onClick={() => setEnabled(!enabled)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              enabled ? "bg-primary" : "bg-muted"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-background transition-transform ${
                enabled ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div>
          {isEdit && onDelete && (
            <button
              onClick={() => setConfirmDeleteOpen(true)}
              className="px-4 py-2 text-sm font-medium text-danger hover:text-danger/80 transition-colors"
            >
              Delete Webhook
            </button>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-sm font-medium text-muted-foreground bg-muted rounded-md hover:bg-accent transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? "Saving..." : isEdit ? "Update Webhook" : "Create Webhook"}
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDeleteOpen}
        title="Delete Webhook"
        message="Are you sure you want to delete this webhook? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDeleteOpen(false)}
      />
    </div>
  );
}
