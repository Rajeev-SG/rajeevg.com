"use client"

import * as React from "react"
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type ColumnDef,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table"
import { ArrowUpDown, Columns3 } from "lucide-react"

import { ContentRowSheet } from "@/components/content-ops/content-row-sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { ContentOpsCapabilities, ContentOpsRow } from "@/lib/content-ops/types"

type ProviderOption = {
  provider: "fallback" | "brave" | "openrouter" | "minimax"
  label: string
  configured: boolean
}

type ContentDataTableProps = {
  rows: ContentOpsRow[]
  providerOptions: ProviderOption[]
  capabilities: ContentOpsCapabilities
}

const DEFAULT_COLUMN_VISIBILITY = {
  notes: false,
  sourceType: false,
}

export function ContentDataTable({ rows, providerOptions, capabilities }: ContentDataTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = React.useState("")
  const [columnVisibility, setColumnVisibility] =
    React.useState<Record<string, boolean>>(DEFAULT_COLUMN_VISIBILITY)

  const columns = React.useMemo<ColumnDef<ContentOpsRow>[]>(
    () => [
      {
        accessorKey: "title",
        header: "Title",
        cell: ({ row }) => (
          <ContentRowSheet row={row.original} providerOptions={providerOptions} capabilities={capabilities} />
        ),
      },
      {
        accessorKey: "workflowStatus",
        header: "Workflow",
      },
      {
        accessorKey: "status",
        header: "Status",
      },
      {
        accessorKey: "pageClass",
        header: "Class",
      },
      {
        accessorKey: "pillar",
        header: "Pillar",
      },
      {
        accessorKey: "cluster",
        header: "Cluster",
      },
      {
        accessorKey: "format",
        header: "Format",
      },
      {
        accessorKey: "priority",
        header: "Priority",
      },
      {
        accessorKey: "impact",
        header: "Impact",
      },
      {
        accessorKey: "sourceType",
        header: "Source",
      },
    ],
    [capabilities, providerOptions]
  )

  const table = useReactTable({
    data: rows,
    columns,
    state: {
      sorting,
      globalFilter,
      columnVisibility,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: (row, columnId, filterValue) => {
      const haystack = [
        row.original.title,
        row.original.pillar,
        row.original.cluster,
        row.original.pageClass,
        row.original.notes,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()

      return haystack.includes(String(filterValue).toLowerCase())
    },
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <Input
          value={globalFilter}
          onChange={(event) => setGlobalFilter(event.target.value)}
          placeholder="Search title, pillar, cluster, or notes"
          className="md:max-w-sm"
        />
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <Columns3 className="mr-2 size-4" />
                Columns
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56">
              <div className="space-y-2">
                {table
                  .getAllLeafColumns()
                  .filter((column) => column.getCanHide())
                  .map((column) => (
                    <Button
                      key={column.id}
                      variant={column.getIsVisible() ? "default" : "outline"}
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => column.toggleVisibility(!column.getIsVisible())}
                    >
                      {column.columnDef.header as string}
                    </Button>
                  ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="-ml-3 h-8 px-3 text-left"
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        <ArrowUpDown className="ml-2 size-4" />
                      </Button>
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                  No rows match this view.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {table.getRowModel().rows.length} of {rows.length} rows
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
