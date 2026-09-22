"use client"

import * as React from "react"
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table"
import { useVirtualizer } from "@tanstack/react-virtual"
import { ArrowUpDown, ChevronDown, ChevronRight } from "lucide-react"

import { Input } from "@/components/ui/input"
import type { CapabilityRecord } from "@/lib/adpi/types"
import {
  AVAILABILITY_CLASS,
  AVAILABILITY_LABEL,
  CONTROL_MODE_CLASS,
  CONTROL_MODE_LABEL,
  EVIDENCE_BASIS_LABEL,
  MATURITY_LABEL,
} from "@/lib/adpi/labels"
import { Badge } from "@/components/ui/badge"

const ROW_HEIGHT = 44

/**
 * The ~4 summary columns shown in the dense row (#173). Everything else
 * (type, basis, maturity, UI/API/Bulk) is secondary metadata that lives in
 * the expanded detail, so the summary stays readable instead of a wall of
 * nine cramped columns.
 */
const SUMMARY_COLUMNS = ["name", "platform", "control_mode", "availability"] as const
const SUMMARY_GRID = "grid grid-cols-1 gap-1 px-3 py-2 text-sm "
  + "sm:grid-cols-[2.2fr_1.2fr_1fr_1fr] sm:items-center sm:gap-2"

const SUMMARY_LABEL: Record<(typeof SUMMARY_COLUMNS)[number], string> = {
  name: "Capability",
  platform: "Surface",
  control_mode: "Control",
  availability: "Availability",
}

function Flag({ value }: { value: boolean | undefined }) {
  if (value === undefined) return <span className="text-muted-foreground">?</span>
  return <span>{value ? "Yes" : "No"}</span>
}

/**
 * The master capability explorer (#11): a dense, searchable, filterable table
 * over the real published dataset, virtualised with TanStack Virtual so the
 * full corpus renders. Row expansion shows the capability detail and its safe
 * provenance metadata (source id, evidence pointer, verification date).
 */
export function CapabilityTable({ records }: { records: CapabilityRecord[] }) {
  const [sorting, setSorting] = React.useState<SortingState>([{ id: "vendor", desc: false }])
  const [filter, setFilter] = React.useState("")
  const [vendor, setVendor] = React.useState("all")
  const [availability, setAvailability] = React.useState("all")
  const [expanded, setExpanded] = React.useState<Record<string, boolean>>({})
  const scrollRef = React.useRef<HTMLDivElement>(null)

  const vendors = React.useMemo(
    () => Array.from(new Set(records.map((r) => r.vendor))).sort(),
    [records],
  )

  const rows = React.useMemo(() => {
    const needle = filter.trim().toLowerCase()
    return records.filter((record) => {
      if (vendor !== "all" && record.vendor !== vendor) return false
      if (availability !== "all" && record.availability !== availability) return false
      if (!needle) return true
      return [record.name, record.vendor_term ?? "", record.platform, record.id]
        .join(" ")
        .toLowerCase()
        .includes(needle)
    })
  }, [records, filter, vendor, availability])

  const columns = React.useMemo<ColumnDef<CapabilityRecord>[]>(
    () => [
      {
        id: "name",
        accessorKey: "name",
        header: "Capability",
        cell: ({ row }) => (
          <div className="flex items-start gap-1">
            <button
              type="button"
              aria-label={expanded[row.original.id] ? "Collapse row" : "Expand row"}
              onClick={() =>
                setExpanded((prev) => ({ ...prev, [row.original.id]: !prev[row.original.id] }))
              }
              className="text-muted-foreground"
            >
              {expanded[row.original.id] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
            <span className="font-medium">{row.original.name}</span>
          </div>
        ),
      },
      { id: "vendor", accessorKey: "vendor", header: "Vendor" },
      { id: "platform", accessorKey: "platform", header: "Surface" },
      { id: "capability_type", accessorKey: "capability_type", header: "Type" },
      {
        id: "control_mode",
        accessorKey: "control_mode",
        header: "Control",
        cell: ({ row }) => (
          <Badge variant="outline" className={CONTROL_MODE_CLASS[row.original.control_mode]}>
            {CONTROL_MODE_LABEL[row.original.control_mode]}
          </Badge>
        ),
      },
      {
        id: "availability",
        accessorKey: "availability",
        header: "Availability",
        cell: ({ row }) => (
          <Badge variant="outline" className={AVAILABILITY_CLASS[row.original.availability]}>
            {AVAILABILITY_LABEL[row.original.availability]}
          </Badge>
        ),
      },
      {
        id: "evidence_basis",
        accessorKey: "evidence_basis",
        header: "Basis",
        cell: ({ row }) => EVIDENCE_BASIS_LABEL[row.original.evidence_basis],
      },
      {
        id: "maturity",
        accessorKey: "maturity",
        header: "Maturity",
        cell: ({ row }) => MATURITY_LABEL[row.original.maturity],
      },
      {
        id: "ui_api",
        header: "UI / API / Bulk",
        enableSorting: false,
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            <Flag value={row.original.ui_available} /> / <Flag value={row.original.api_available} />{" "}
            / <Flag value={row.original.bulk_available} />
          </span>
        ),
      },
    ],
    [expanded],
  )

  const table = useReactTable({
    data: rows,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })

  const modelRows = table.getRowModel().rows
  const virtualizer = useVirtualizer({
    count: modelRows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 12,
    // Rows are variable height (an expanded row shows a detail panel), so the
    // virtualizer must measure each rendered row rather than trust the 44px
    // estimate — otherwise an expanded panel overflows its slot and following
    // rows overlap it.
    measureElement: (element) => element.getBoundingClientRect().height,
  })

  return (
    <section aria-label="Capability explorer" className="min-w-0 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <label className="sr-only" htmlFor="adpi-filter">
          Search capabilities
        </label>
        <Input
          id="adpi-filter"
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          placeholder="Search by name, vendor term, platform or id…"
          className="h-9 w-full min-w-0 sm:w-80"
          data-testid="adpi-search"
        />
        <label className="sr-only" htmlFor="adpi-vendor">
          Vendor
        </label>
        <select
          id="adpi-vendor"
          value={vendor}
          onChange={(event) => setVendor(event.target.value)}
          className="h-9 rounded-md border bg-background px-2 text-sm"
        >
          <option value="all">All vendors</option>
          {vendors.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
        <label className="sr-only" htmlFor="adpi-availability">
          Availability
        </label>
        <select
          id="adpi-availability"
          value={availability}
          onChange={(event) => setAvailability(event.target.value)}
          className="h-9 rounded-md border bg-background px-2 text-sm"
        >
          <option value="all">Any availability</option>
          <option value="supported">Supported</option>
          <option value="conditional">Conditional</option>
          <option value="unknown">Unknown</option>
        </select>
        <span className="text-sm text-muted-foreground" data-testid="adpi-row-count">
          {rows.length} of {records.length} capabilities
        </span>
      </div>

      <div className="min-w-0 overflow-hidden rounded-xl border">
        <div className="hidden border-b bg-muted/40 px-3 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground sm:grid sm:grid-cols-[2.2fr_1.2fr_1fr_1fr] sm:gap-2">
          {table
            .getHeaderGroups()[0]
            .headers.filter((header) => SUMMARY_COLUMNS.includes(header.column.id as never))
            .map((header) => (
              <button
                key={header.id}
                type="button"
                className="flex items-center gap-1 text-left"
                onClick={header.column.getToggleSortingHandler()}
              >
                {flexRender(header.column.columnDef.header, header.getContext())}
                {header.column.getCanSort() ? <ArrowUpDown size={12} /> : null}
              </button>
            ))}
        </div>
        <div ref={scrollRef} data-testid="adpi-table-scroll" className="max-h-[560px] overflow-auto">
          <div style={{ height: virtualizer.getTotalSize(), position: "relative" }}>
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const row = modelRows[virtualRow.index]
              const isExpanded = expanded[row.original.id]
              return (
                <div
                  key={row.id}
                  data-index={virtualRow.index}
                  ref={virtualizer.measureElement}
                  className="absolute left-0 top-0 w-full border-b"
                  style={{ transform: `translateY(${virtualRow.start}px)` }}
                >
                  <div className={SUMMARY_GRID}>
                    {row
                      .getVisibleCells()
                      .filter((cell) =>
                        SUMMARY_COLUMNS.includes(cell.column.id as never),
                      )
                      .map((cell) => (
                        <div key={cell.id} className="min-w-0 break-words">
                          <span className="mr-1 text-xs text-muted-foreground sm:hidden">
                            {SUMMARY_LABEL[cell.column.id as (typeof SUMMARY_COLUMNS)[number]]}:
                          </span>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </div>
                      ))}
                  </div>
                  {isExpanded ? (
                    <div className="border-t bg-muted/20 px-6 py-3 text-xs">
                      <p className="font-medium">Capability detail</p>
                      {row.original.description ? (
                        <p className="mt-1 text-muted-foreground">{row.original.description}</p>
                      ) : null}
                      <p className="mt-2 break-all text-muted-foreground">
                        id: <code>{row.original.id}</code>
                      </p>
                      <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-0.5 text-muted-foreground sm:grid-cols-4">
                        <div>
                          <dt className="font-medium text-foreground">Type</dt>
                          <dd>{row.original.capability_type}</dd>
                        </div>
                        <div>
                          <dt className="font-medium text-foreground">Basis</dt>
                          <dd>{EVIDENCE_BASIS_LABEL[row.original.evidence_basis]}</dd>
                        </div>
                        <div>
                          <dt className="font-medium text-foreground">Maturity</dt>
                          <dd>{MATURITY_LABEL[row.original.maturity]}</dd>
                        </div>
                        <div>
                          <dt className="font-medium text-foreground">UI / API / Bulk</dt>
                          <dd>
                            <Flag value={row.original.ui_available} /> /{" "}
                            <Flag value={row.original.api_available} /> /{" "}
                            <Flag value={row.original.bulk_available} />
                          </dd>
                        </div>
                      </dl>
                      <p className="mt-2">
                        Verified: {row.original.last_verified_at ?? "unknown"}
                      </p>
                      <div className="mt-1 space-y-0.5">
                        {row.original.evidence.map((pointer) => (
                          <p key={pointer.source_id} className="break-all">
                            <a
                              className="underline underline-offset-4"
                              href={pointer.source_url}
                              target="_blank"
                              rel="noreferrer noopener"
                            >
                              {pointer.source_id}
                            </a>
                          </p>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
