"use client"

import { useMemo, useState } from "react"
import {
  type ColumnDef,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"

import { Input } from "@/components/ui/input"
import { BasisBadge, ControlBadge, OutcomeBadge } from "./badges"
import { qualify } from "@/lib/adpi/qualify"
import type { Capability } from "@/lib/adpi/types"

const CAPABILITY_TYPES = [
  "all",
  "targeting",
  "audience",
  "placement",
  "optimisation",
  "bidding",
  "measurement",
  "reporting",
  "format",
] as const

const CONTROL_MODES = ["all", "control", "signal", "automatic", "recommendation", "reporting_only"] as const

export function MasterTable({ capabilities }: { capabilities: Capability[] }) {
  const [query, setQuery] = useState("")
  const [vendor, setVendor] = useState("all")
  const [type, setType] = useState<string>("all")
  const [control, setControl] = useState<string>("all")
  const [availability, setAvailability] = useState<string>("all")
  const [sorting, setSorting] = useState<SortingState>([])

  const vendors = useMemo(
    () => ["all", ...Array.from(new Set(capabilities.map((c) => c.vendor))).sort()],
    [capabilities],
  )

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return capabilities.filter((c) => {
      if (vendor !== "all" && c.vendor !== vendor) return false
      if (type !== "all" && c.capability_type !== type) return false
      if (control !== "all" && c.control_mode !== control) return false
      if (availability !== "all" && c.availability !== availability) return false
      if (!needle) return true
      return [c.name, c.vendor, c.platform, c.capability_type, c.vendor_term ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(needle)
    })
  }, [capabilities, query, vendor, type, control, availability])

  const columns = useMemo<ColumnDef<Capability>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Capability",
        cell: ({ row }) => (
          <div>
            <div className="font-medium">{row.original.name}</div>
            <div className="text-xs text-muted-foreground">{row.original.id}</div>
          </div>
        ),
      },
      { accessorKey: "vendor", header: "Vendor" },
      {
        accessorKey: "capability_type",
        header: "Type",
        cell: ({ getValue }) => <span className="text-sm">{String(getValue())}</span>,
      },
      {
        accessorKey: "control_mode",
        header: "Behaviour",
        cell: ({ getValue }) => <ControlBadge mode={String(getValue())} />,
        sortingFn: (a, b) =>
          String(a.original.control_mode).localeCompare(String(b.original.control_mode)),
      },
      {
        accessorKey: "evidence_basis",
        header: "Evidence basis",
        cell: ({ getValue }) => <BasisBadge basis={getValue() as Capability["evidence_basis"]} />,
      },
      {
        accessorKey: "availability",
        header: "Availability",
        cell: ({ row }) => <OutcomeBadge outcome={qualify(row.original).outcome} />,
      },
      {
        accessorKey: "last_verified_at",
        header: "Verified",
        cell: ({ getValue }) => <span className="text-sm">{String(getValue() ?? "—")}</span>,
      },
    ],
    [],
  )

  const table = useReactTable({
    data: filtered,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search capabilities, vendors, products…"
          aria-label="Search capabilities"
          className="max-w-sm"
        />
        <Select label="Vendor" value={vendor} onChange={setVendor} options={vendors} />
        <Select label="Type" value={type} onChange={setType} options={[...CAPABILITY_TYPES]} />
        <Select label="Behaviour" value={control} onChange={setControl} options={[...CONTROL_MODES]} />
        <Select
          label="Availability"
          value={availability}
          onChange={setAvailability}
          options={["all", "supported", "conditional", "unknown"]}
        />
        <span className="text-sm text-muted-foreground">
          {filtered.length} of {capabilities.length}
        </span>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-muted/50">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="cursor-pointer px-3 py-2 text-left font-medium"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    {header.column.getIsSorted() === "asc"
                      ? " ▲"
                      : header.column.getIsSorted() === "desc"
                        ? " ▼"
                        : null}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-3 py-6 text-center text-muted-foreground">
                  No capabilities match these filters.
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="border-t">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-3 py-2 align-top">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: string[]
}) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-9 rounded-md border bg-background px-2 text-sm"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  )
}
