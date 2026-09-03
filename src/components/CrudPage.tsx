import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from "react";
import { api } from "../api";
import { useAuth } from "../auth";
import { Banner, Button, DataTable, Field, FreshnessBadge, Input, Loading, Modal, PageHeader, Select, Textarea, formValues } from "./ui";

export type FieldDef = {
  name: string;
  label: string;
  type?: "text" | "number" | "select" | "textarea" | "checkbox";
  options?: Array<string | { value: string; label: string }>;
  required?: boolean;
  placeholder?: string;
};

type ListResponse = {
  items?: Array<Record<string, unknown>>;
  nodes?: Array<Record<string, unknown>>;
  freshness?: string;
  source?: string;
  reason?: string;
};

export function CrudPage({
  title,
  description,
  path,
  managePermission,
  columns,
  fields,
  createDefaults,
  empty,
  allowCreate = true,
}: {
  title: string;
  description: string;
  path: string;
  managePermission?: string;
  columns: Array<{ key: string; label: string; render?: (row: Record<string, unknown>) => ReactNode }>;
  fields?: FieldDef[];
  createDefaults?: Record<string, unknown>;
  empty?: string;
  allowCreate?: boolean;
}) {
  const { can } = useAuth();
  const [data, setData] = useState<ListResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
  const writable = Boolean(managePermission && can(managePermission) && fields?.length);

  const load = useCallback(() => {
    setError(null);
    api<ListResponse>(path)
      .then(setData)
      .catch((err: Error) => setError(err.message));
  }, [path]);

  useEffect(() => {
    load();
  }, [load]);

  const rows = data?.items ?? data?.nodes ?? [];

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const values = { ...createDefaults, ...formValues(event) };
    for (const field of fields ?? []) {
      if (field.type === "number" && values[field.name] != null && values[field.name] !== "") {
        values[field.name] = Number(values[field.name]);
      }
    }
    try {
      if (editing?.id) {
        await api(`${path}/${editing.id}`, { method: "PATCH", body: JSON.stringify(values) });
      } else {
        await api(path, { method: "POST", body: JSON.stringify(values) });
      }
      setOpen(false);
      setEditing(null);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(row: Record<string, unknown>) {
    if (!row.id || !confirm(`Delete this ${title.toLowerCase()} record?`)) return;
    try {
      await api(`${path}/${row.id}`, { method: "DELETE" });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  }

  const tableColumns = [
    ...columns,
    ...(writable
      ? [
          {
            key: "actions",
            label: "",
            render: (row: Record<string, unknown>) => (
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setEditing(row);
                    setOpen(true);
                  }}
                >
                  Edit
                </Button>
                <Button variant="danger" onClick={() => onDelete(row)}>
                  Delete
                </Button>
              </div>
            ),
          },
        ]
      : []),
  ];

  return (
    <div>
      <PageHeader
        title={title}
        description={description}
        actions={
          <>
            {data?.freshness ? <FreshnessBadge freshness={data.freshness} /> : null}
            {writable && allowCreate ? (
              <Button
                onClick={() => {
                  setEditing(null);
                  setOpen(true);
                }}
              >
                Add
              </Button>
            ) : null}
          </>
        }
      />
      {data?.reason ? <div className="mb-4"><Banner kind="info">{data.reason}</Banner></div> : null}
      {data?.source ? <p className="mb-4 text-xs text-slate-500">Source: {data.source}</p> : null}
      {error ? <div className="mb-4"><Banner kind="error">{error}</Banner></div> : null}
      {!data && !error ? <Loading /> : <DataTable columns={tableColumns} rows={rows} empty={empty ?? data?.reason ?? "No records yet."} />}
      {open && fields ? (
        <Modal
          title={editing ? `Edit ${title}` : `Add ${title}`}
          onClose={() => {
            setOpen(false);
            setEditing(null);
          }}
        >
          <form className="space-y-3" onSubmit={onSubmit}>
            {fields.map((field) => (
              <Field key={field.name} label={field.label}>
                {field.type === "textarea" ? (
                  <Textarea name={field.name} defaultValue={String(editing?.[field.name] ?? "")} required={field.required} />
                ) : field.type === "select" ? (
                  <Select name={field.name} defaultValue={String(editing?.[field.name] ?? field.options?.[0] ?? "")} required={field.required}>
                    {(field.options ?? []).map((option) => {
                      const value = typeof option === "string" ? option : option.value;
                      const label = typeof option === "string" ? option : option.label;
                      return (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      );
                    })}
                  </Select>
                ) : field.type === "checkbox" ? (
                  <input name={field.name} type="checkbox" defaultChecked={Boolean(editing?.[field.name])} />
                ) : (
                  <Input
                    name={field.name}
                    type={field.type === "number" ? "number" : "text"}
                    defaultValue={editing?.[field.name] == null ? "" : String(editing[field.name])}
                    required={field.required}
                    placeholder={field.placeholder}
                  />
                )}
              </Field>
            ))}
            <Button disabled={busy} type="submit">
              {busy ? "Saving…" : "Save"}
            </Button>
          </form>
        </Modal>
      ) : null}
    </div>
  );
}
