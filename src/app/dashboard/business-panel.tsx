"use client";

import { useState } from "react";
import Link from "next/link";
import { EditBusinessForm } from "./edit-business-form";
import type { Business } from "@/types/database";

export function BusinessPanel({ business }: { business: Business }) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <EditBusinessForm business={business} onCancel={() => setEditing(false)} />
    );
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <h1 className="text-2xl font-bold">{business.name}</h1>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="shrink-0 text-sm font-medium text-neutral-600 underline"
        >
          Editar
        </button>
      </div>
      <p className="mt-1 text-sm text-neutral-500">
        Tu página pública: <code>/{business.slug}</code>
      </p>

      {business.description && (
        <p className="mt-3 text-sm">{business.description}</p>
      )}
      {business.address && <p className="mt-4 text-sm">{business.address}</p>}
      {business.phone && <p className="text-sm">{business.phone}</p>}

      <div className="mt-8 flex flex-col gap-3">
        <Link
          href="/dashboard/servicios"
          className="rounded-md border border-neutral-300 px-4 py-3 text-sm font-medium hover:bg-neutral-50"
        >
          Servicios →
        </Link>
        <Link
          href="/dashboard/staff"
          className="rounded-md border border-neutral-300 px-4 py-3 text-sm font-medium hover:bg-neutral-50"
        >
          Staff →
        </Link>
      </div>
    </div>
  );
}
