"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  LoadingSkeleton,
  EmptyState,
  Breadcrumbs,
  Pagination,
  StatusBadge,
  SearchInput,
  FilterDropdown,
  BulkActionBar,
  ConfirmDialog,
  RelativeTime,
} from "../../ui/components";
import { getTotalPages, exportToCsv } from "../../ui/utils";
import { toast } from "sonner";

export interface WebhookListItem {
  id: string;
  url: string;
  description?: string;
  events: string[];
  enabled: boolean;
  lastDeliveryAt?: string | null;
  successRate?: number | null;
}

export interface WebhookListProps {
  fetchWebhooks: () => Promise<WebhookListItem[]>;
  onDelete: (ids: string[]) => Promise<void>;
  onNavigateToDetail: (id: string) => void;
  onNavigateToEditor: (id?: string) => void;
  breadcrumbs?: { label: string; onClick?: () => void }[];
  availableEvents?: string[];
}

type SortField = "url" | "events" | "enabled" | "lastDeliveryAt" | "successRate";
type SortDir = "asc" | "desc";

export function WebhookList({
  fetchWebhooks,
  onDelete,
  onNavigateToDetail,
  onNavigateToEditor,
  breadcrumbs,
  availableEvents = [],
}: WebhookListProps) {
  const [webhooks, setWebhooks] = useState<WebhookListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [eventFilter, setEventFilter] = useState("all");
  const [sortField, setSortField] = useState<SortField>("url");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmDelete, setConfirmDelete] = useState(false);
  const pageSize = 25;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchWebhooks();
      setWebhooks(data);
    } catch (e) {
      toast.error("Failed to load webhooks");
    } finally {
      setLoading(false);
    }
  }, [fetchWebhooks]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = webhooks
    .filter((w) => {
      if (search && !w.url.toLowerCase().includes(search.toLowerCase())) return false;
      if (statusFilter === "active" && !w.enabled) return false;
      if (statusFilter === "inactive" && w.enabled) return false;
      if (eventFilter !== "all" && !w.events.includes(eventFilter)) return false;
      return true;
    })
    .sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "url":
          cmp = a.url.localeCompare(b.url);
          break;
        case "events":
          cmp = a.events.length - b.events.length;
          break;
        case "enabled":
          cmp = (a.enabled ? 1 : 0) - (b.enabled ? 1 : 0);
          break;
        case "lastDeliveryAt":
          cmp = (a.lastDeliveryAt || "").localeCompare(b.lastDeliveryAt || "");
          break;
        case "successRate":
          cmp = (a.successRate ?? 0) - (b.successRate ?? 0);
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

  const totalPages = getTotalPages({ page, pageSize, total: filtered.length });
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === pageItems.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(pageItems.map((w) => w.id)));
    }
  };

  const handleBulkDelete = async () => {
    try {
      await onDelete(Array.from(selected));
      toast.success(`Deleted ${selected.size} webhook(s)`);
      setSelected(new Set());
      setConfirmDelete(false);
      load();
    } catch {
      toast.error("Failed to delete webhooks");
    }
  };

  const handleCsvExport = () => {
    exportToCsv(
      filtered.map((w) => ({
        url: w.url,
        events: w.events.join("; "),
        status: w.enabled ? "Active" : "Inactive",
        lastDelivery: w.lastDeliveryAt || "Never",
        successRate: w.successRate != null ? `${w.successRate}%` : "N/A",
      })),
      "webhooks"
    );
    toast.success("CSV exported");
  };

  const SortHeader = ({ field, label }: { field: SortField; label: string }) => (
    <th
      onClick={() => handleSort(field)}
      className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-gray-200 select-none"
    >
      {label} {sortField === field && (sortDir === "asc" ? "\u2191" : "\u2193")}
    </th>
  );

  const defaultBreadcrumbs = breadcrumbs || [{ label: "Admin" }, { label: "Webhooks" }];

  return (
    <div className="space-y-4">
      <Breadcrumbs items={defaultBreadcrumbs} />

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Webhooks {!loading && <span className="text-sm font-normal text-gray-500 dark:text-gray-400">({filtered.length})</span>}
        </h1>
        <div className="flex items-center gap-3">
          <button
            onClick={handleCsvExport}
            className="px-3 py-2 text-sm text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Export CSV
          </button>
          <button
            onClick={() => onNavigateToEditor()}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
          >
            Add Webhook
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Search by URL..." />
        <FilterDropdown
          label="Status"
          value={statusFilter}
          options={[
            { value: "all", label: "All" },
            { value: "active", label: "Active" },
            { value: "inactive", label: "Inactive" },
          ]}
          onChange={setStatusFilter}
        />
        {availableEvents.length > 0 && (
          <FilterDropdown
            label="Event"
            value={eventFilter}
            options={[
              { value: "all", label: "All Events" },
              ...availableEvents.map((e) => ({ value: e, label: e })),
            ]}
            onChange={setEventFilter}
          />
        )}
      </div>

      {loading ? (
        <LoadingSkeleton rows={5} columns={6} type="table" />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No webhooks found"
          description={search || statusFilter !== "all" ? "Try adjusting your filters." : "Create your first webhook endpoint to get started."}
          action={!search && statusFilter === "all" ? { label: "Add Webhook", onClick: () => onNavigateToEditor() } : undefined}
        />
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={pageItems.length > 0 && selected.size === pageItems.length}
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300 dark:border-gray-600"
                  />
                </th>
                <SortHeader field="url" label="URL" />
                <SortHeader field="events" label="Events" />
                <SortHeader field="enabled" label="Status" />
                <SortHeader field="lastDeliveryAt" label="Last Delivery" />
                <SortHeader field="successRate" label="Success Rate" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {pageItems.map((w) => (
                <tr
                  key={w.id}
                  onClick={() => onNavigateToDetail(w.id)}
                  className="hover:bg-gray-50 dark:hover:bg-gray-750 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selected.has(w.id)}
                      onChange={() => toggleSelect(w.id)}
                      className="rounded border-gray-300 dark:border-gray-600"
                    />
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white font-mono truncate max-w-xs">
                    {w.url}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                    {w.events.length} event{w.events.length !== 1 ? "s" : ""}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={w.enabled ? "active" : "inactive"} />
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                    {w.lastDeliveryAt ? <RelativeTime date={w.lastDeliveryAt} /> : "Never"}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                    {w.successRate != null ? `${w.successRate}%` : "N/A"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      <BulkActionBar
        selectedCount={selected.size}
        actions={[{ label: "Delete", onClick: () => setConfirmDelete(true), variant: "danger" }]}
        onClearSelection={() => setSelected(new Set())}
      />

      <ConfirmDialog
        open={confirmDelete}
        title="Delete Webhooks"
        message={`Are you sure you want to delete ${selected.size} webhook(s)? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleBulkDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}
