import {
    useReactTable,
    getCoreRowModel,
    getSortedRowModel,
    getPaginationRowModel,
    getFilteredRowModel,
    flexRender,
} from "@tanstack/react-table";
import PropTypes from "prop-types";
import {
    ChevronLeft,
    ChevronRight,
    ChevronUp,
    ChevronDown,
    Pencil,
    Trash2,
    Search,
    Eye,
} from "lucide-react";

import { useState } from "react";
import TextInput from "./TextInput";

export default function DataTable({
    columns,
    data,
    onView,
    onEdit,
    onDelete,
    filters = [],
}) {
    const [globalFilter, setGlobalFilter] = useState("");

    const table = useReactTable({
        data,
        columns,
        state: {
            globalFilter,
        },
        onGlobalFilterChange: setGlobalFilter,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
    });

    return (
        <div className="bg-white rounded shadow space-y-4 p-4">

            {/* TOP BAR */}
            <div className="flex flex-col lg:flex-row gap-3 ">

                {/* SEARCH */}
                <div className="relative w-full lg:w-1/3">
                    <TextInput
                        value={globalFilter ?? ""}
                        onChange={(e) => setGlobalFilter(e.target.value)}
                        iconLeft={Search}
                        placeholder="Rechercher..."
                        className="pl-9 w-full"
                    />
                </div>

                {/* FILTERS */}
                <div className="ml-auto w-full">
                    <div className="grid grid-cols-1 sm:grid-cols-2 w-full lg:grid-cols-4 gap-4">
                        {filters.map((filter, i) => (
                            <select
                                key={i}
                                className="input w-full"
                                onChange={(e) =>
                                    table.getColumn(filter.key)?.setFilterValue(e.target.value)
                                }
                            >
                                <option value="">{filter.label}</option>
                                {filter.options.map((opt, idx) => (
                                    <option key={idx} value={opt}>
                                        {opt}
                                    </option>
                                ))}
                            </select>
                        ))}
                    </div>
                </div>
            </div>

            {/* TABLE */}
            <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[700px]">

                    <thead className="bg-gray-100">
                        {table.getHeaderGroups().map((headerGroup) => (
                            <tr key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <th
                                        key={header.id}
                                        onClick={header.column.getToggleSortingHandler()}
                                        className="p-2 text-left cursor-pointer"
                                    >
                                        <div className="flex items-center gap-1">
                                            {flexRender(header.column.columnDef.header, header.getContext())}
                                            {header.column.getIsSorted() === "asc" && <ChevronUp size={14} />}
                                            {header.column.getIsSorted() === "desc" && <ChevronDown size={14} />}
                                        </div>
                                    </th>
                                ))}

                                {(onEdit || onDelete) && <th className="p-2 text-right">Actions</th>}
                            </tr>
                        ))}
                    </thead>

                    <tbody>
                        {table.getRowModel().rows.map((row) => (
                            <tr key={row.id} className="border-t border-t-[var(--color-gray-light)] hover:bg-gray-50">

                                {row.getVisibleCells().map((cell) => (
                                    <td key={cell.id} className="p-2">
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </td>
                                ))}

                                {(onEdit || onDelete) && (
                                    <td className="p-2 flex justify-end gap-2">
                                        {onView && (
                                            <button
                                                onClick={() => onView(row.original)}
                                                className="text-green-500 hover:bg-green-50 p-2 rounded"
                                            >
                                                <Eye size={16} />
                                            </button>
                                        )}
                                        {onEdit && (
                                            <button
                                                onClick={() => onEdit(row.original)}
                                                className="text-blue-500 hover:bg-blue-50 p-2 rounded"
                                            >
                                                <Pencil size={16} />
                                            </button>
                                        )}

                                        {onDelete && (
                                            <button
                                                onClick={() => onDelete(row.original)}
                                                className="text-red-500 hover:bg-red-50 p-2 rounded"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </td>
                                )}

                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* PAGINATION */}
            <div className="flex justify-between items-center text-sm">

                <span>
                    Page {table.getState().pagination.pageIndex + 1} /{" "}
                    {table.getPageCount()}
                </span>

                <div className="flex gap-2">
                    <button
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                        className="p-2 px-3 py-1 border border-[var(--color-primary)] rounded"
                    >
                        <ChevronLeft />
                    </button>
                    <button className="px-3 py-1  bg-[var(--color-primary)] text-[var(--color-white)] rounded">{table.getState().pagination.pageIndex + 1} /{" "}
                        {table.getPageCount()}</button>
                    <button
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                        className="p-2 px-3 py-1 border border-[var(--color-primary)] rounded"
                    >
                        <ChevronRight />
                    </button>
                </div>

            </div>
        </div>
    );
}

DataTable.propTypes = {
    columns: PropTypes.array.isRequired,
    data: PropTypes.array.isRequired,
    onView: PropTypes.func,
    onEdit: PropTypes.func,
    onDelete: PropTypes.func,
    filters: PropTypes.array,
};