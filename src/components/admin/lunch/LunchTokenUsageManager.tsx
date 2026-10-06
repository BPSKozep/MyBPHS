"use client";

import {
  ArrowUpDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import Card from "@/components/Card";
import Loading from "@/components/Loading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { UserLunchState } from "@/lib/lunchTokenUsage";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/react";
import { compareHungarianIgnoreCase } from "@/utils/hungarianCollator";

type SortField = "name" | "email" | "state" | "tokenUsagePercentage";
type SortDirection = "asc" | "desc";

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

export default function LunchTokenUsageManager() {
  const { data, isLoading, isError, refetch } =
    api.order.getLunchTokenUsageStats.useQuery(undefined, {
      staleTime: 60 * 1000,
    });

  // Search and filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [stateFilter, setStateFilter] = useState<UserLunchState | "ALL">("ALL");

  // Sorting state
  const [sortField, setSortField] = useState<SortField>("state");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Summary counts for the top buttons
  const kpiStats = useMemo(() => {
    if (!data) {
      return {
        total: 0,
        ruleBreakers: 0,
        compliant: 0,
        insufficientData: 0,
      };
    }

    return {
      total: data.length,
      ruleBreakers: data.filter((u) => u.state === "RULE_BREAKER").length,
      compliant: data.filter((u) => u.state === "COMPLIANT").length,
      insufficientData: data.filter((u) => u.state === "INSUFFICIENT_DATA")
        .length,
    };
  }, [data]);

  // Handle sort toggle
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection(field === "name" || field === "email" ? "asc" : "desc");
    }
    setCurrentPage(1);
  };

  // Filtered and sorted users
  const filteredData = useMemo(() => {
    if (!data) return [];

    const normalizedSearch = searchTerm.trim().toLowerCase();

    return data
      .filter((user) => {
        // Search filter
        if (normalizedSearch) {
          const matchName = user.userName
            .toLowerCase()
            .includes(normalizedSearch);
          const matchEmail = user.userEmail
            .toLowerCase()
            .includes(normalizedSearch);
          if (!matchName && !matchEmail) {
            return false;
          }
        }

        // Summary button filter
        if (stateFilter !== "ALL" && user.state !== stateFilter) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        const factor = sortDirection === "asc" ? 1 : -1;

        switch (sortField) {
          case "name":
            return factor * compareHungarianIgnoreCase(a.userName, b.userName);
          case "email":
            return factor * a.userEmail.localeCompare(b.userEmail);
          case "state": {
            const stateWeight: Record<UserLunchState, number> = {
              RULE_BREAKER: 3,
              COMPLIANT: 2,
              INSUFFICIENT_DATA: 1,
            };
            const diff = stateWeight[a.state] - stateWeight[b.state];
            if (diff !== 0) return factor * diff;
            return factor * (a.tokenUsagePercentage - b.tokenUsagePercentage);
          }
          case "tokenUsagePercentage":
            return factor * (a.tokenUsagePercentage - b.tokenUsagePercentage);
          default:
            return 0;
        }
      });
  }, [data, searchTerm, stateFilter, sortField, sortDirection]);

  // Paginated data
  const totalPages = Math.max(1, Math.ceil(filteredData.length / pageSize));
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  return (
    <Card>
      <div className="space-y-6">
        {/* Summary Filter Buttons */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <button
            type="button"
            onClick={() => {
              setStateFilter("ALL");
              setCurrentPage(1);
            }}
            className={cn(
              "cursor-pointer rounded-lg border p-3 text-left transition-colors",
              stateFilter === "ALL"
                ? "border-gray-400 bg-[#3a3a3a] ring-2 ring-gray-400/40"
                : "border-gray-600 bg-[#242424] hover:bg-[#2e2e2e]",
            )}
          >
            <div className="text-xs text-gray-400">Összes felhasználó</div>
            <div className="mt-1 text-2xl font-bold text-white">
              {kpiStats.total}
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              setStateFilter(
                stateFilter === "RULE_BREAKER" ? "ALL" : "RULE_BREAKER",
              );
              setCurrentPage(1);
            }}
            className={cn(
              "cursor-pointer rounded-lg border p-3 text-left transition-colors",
              stateFilter === "RULE_BREAKER"
                ? "border-red-500 bg-red-950/50 ring-2 ring-red-500/40"
                : "border-red-900/60 bg-[#242424] hover:bg-red-950/30",
            )}
          >
            <div className="text-xs text-red-400">Szabályszegők</div>
            <div className="mt-1 text-2xl font-bold text-red-400">
              {kpiStats.ruleBreakers}
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              setStateFilter(stateFilter === "COMPLIANT" ? "ALL" : "COMPLIANT");
              setCurrentPage(1);
            }}
            className={cn(
              "cursor-pointer rounded-lg border p-3 text-left transition-colors",
              stateFilter === "COMPLIANT"
                ? "border-green-500 bg-green-950/50 ring-2 ring-green-500/40"
                : "border-green-900/60 bg-[#242424] hover:bg-green-950/30",
            )}
          >
            <div className="text-xs text-green-400">Megfelelő</div>
            <div className="mt-1 text-2xl font-bold text-green-400">
              {kpiStats.compliant}
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              setStateFilter(
                stateFilter === "INSUFFICIENT_DATA"
                  ? "ALL"
                  : "INSUFFICIENT_DATA",
              );
              setCurrentPage(1);
            }}
            className={cn(
              "cursor-pointer rounded-lg border p-3 text-left transition-colors",
              stateFilter === "INSUFFICIENT_DATA"
                ? "border-gray-400 bg-[#3a3a3a] ring-2 ring-gray-400/40"
                : "border-gray-600 bg-[#242424] hover:bg-[#2e2e2e]",
            )}
          >
            <div className="text-xs text-gray-400">Kevés adat</div>
            <div className="mt-1 text-2xl font-bold text-gray-300">
              {kpiStats.insufficientData}
            </div>
          </button>
        </div>

        {/* Search Controls */}
        <div className="flex flex-col items-start justify-between gap-4 py-1 sm:flex-row sm:items-center">
          <Input
            placeholder="Felhasználók keresése..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full border-gray-600 bg-[#565656] font-bold text-white placeholder:text-gray-300 focus:border-gray-400 sm:w-64"
          />
        </div>

        {/* Table View */}
        <div className="overflow-hidden rounded-lg">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-gray-600 bg-gray-900 hover:bg-slate-900">
                <TableHead className="font-semibold text-white">
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("name")}
                    className="flex h-auto items-center p-0 font-semibold text-white hover:bg-transparent hover:text-white"
                  >
                    Név
                    <ArrowUpDownIcon className="ml-1 size-3 text-gray-400" />
                  </Button>
                </TableHead>

                <TableHead className="font-semibold text-white">
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("email")}
                    className="flex h-auto items-center p-0 font-semibold text-white hover:bg-transparent hover:text-white"
                  >
                    Email
                    <ArrowUpDownIcon className="ml-1 size-3 text-gray-400" />
                  </Button>
                </TableHead>

                <TableHead className="font-semibold text-white">
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("state")}
                    className="flex h-auto items-center p-0 font-semibold text-white hover:bg-transparent hover:text-white"
                  >
                    Állapot
                    <ArrowUpDownIcon className="ml-1 size-3 text-gray-400" />
                  </Button>
                </TableHead>

                <TableHead className="text-right font-semibold text-white pr-6">
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("tokenUsagePercentage")}
                    className="ml-auto flex h-auto items-center p-0 font-semibold text-white hover:bg-transparent hover:text-white"
                  >
                    Token használat
                    <ArrowUpDownIcon className="ml-1 size-3 text-gray-400" />
                  </Button>
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {isLoading ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={4} className="py-12 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <Loading />
                      <p className="text-white">Felhasználók betöltése...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : isError ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell
                    colSpan={4}
                    className="py-12 text-center text-red-400"
                  >
                    <p className="font-semibold">
                      Hiba történt a statisztikák betöltésekor.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => refetch()}
                      className="mt-2 border-red-800 bg-red-950/40 text-red-300 hover:bg-red-900/50"
                    >
                      Újrapróbálás
                    </Button>
                  </TableCell>
                </TableRow>
              ) : paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="py-12 text-center text-gray-300"
                  >
                    <p className="text-lg font-medium text-white">
                      Nincs találat
                    </p>
                    <p className="text-sm text-gray-400">
                      Próbáld módosítani a keresést vagy a szűrést
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((user, index) => (
                  <TableRow
                    key={user.userId}
                    className={cn(
                      "border-gray-600 text-white transition-colors",
                      index % 2 === 0
                        ? "bg-[#242424] hover:bg-[#2a2a2a]"
                        : "bg-[#2e2e2e] hover:bg-[#343434]",
                      user.isRuleBreaker && "border-l-4 border-l-red-500",
                    )}
                  >
                    <TableCell className="py-3 font-medium">
                      {user.userName}
                      {user.disabled && (
                        <Badge variant="destructive" className="ml-2 text-xs">
                          Inaktív
                        </Badge>
                      )}
                    </TableCell>

                    <TableCell className="py-3 text-gray-300">
                      {user.userEmail}
                    </TableCell>

                    <TableCell className="py-3">
                      {user.state === "RULE_BREAKER" && (
                        <Badge className="bg-red-600 text-white hover:bg-red-700">
                          Szabályszegő
                        </Badge>
                      )}
                      {user.state === "COMPLIANT" && (
                        <Badge className="bg-green-600 text-white hover:bg-green-700">
                          Megfelelő
                        </Badge>
                      )}
                      {user.state === "INSUFFICIENT_DATA" && (
                        <Badge
                          variant="secondary"
                          className="bg-gray-600 text-white hover:bg-gray-700"
                        >
                          Kevés adat
                        </Badge>
                      )}
                    </TableCell>

                    <TableCell className="py-3 text-right pr-6 font-semibold">
                      <span
                        className={
                          user.hasSufficientData
                            ? user.isRuleBreaker
                              ? "font-bold text-red-400"
                              : "font-bold text-green-400"
                            : "text-gray-400"
                        }
                      >
                        {user.tokenUsagePercentage}%
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Section */}
        {!isLoading && filteredData.length > 0 && (
          <div className="flex flex-col items-center justify-between gap-2 rounded-lg border border-gray-600 bg-[#2e2e2e] p-2 sm:gap-4 sm:p-4 lg:flex-row">
            <div className="flex flex-row items-center justify-between gap-10">
              <div className="flex items-center gap-2 text-xs text-gray-300 sm:gap-3 sm:text-sm">
                <span className="font-medium">Sorok/oldal:</span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="h-6 w-12 border-gray-600 bg-[#565656] text-xs text-white hover:bg-[#454545] hover:text-white sm:h-8 sm:w-16 sm:text-sm"
                    >
                      {pageSize}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="border-gray-600 bg-[#242424]">
                    {PAGE_SIZE_OPTIONS.map((size) => (
                      <DropdownMenuItem
                        key={size}
                        onClick={() => {
                          setPageSize(size);
                          setCurrentPage(1);
                        }}
                        className="font-medium text-white hover:bg-[#2e2e2e] hover:text-white focus:bg-[#2e2e2e] focus:text-white"
                      >
                        {size}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="flex items-center gap-1 text-xs font-medium text-gray-300 sm:gap-2 sm:text-sm">
                <span>
                  Megjelenítés:{" "}
                  <span className="text-white">
                    {filteredData.length === 0
                      ? 0
                      : (currentPage - 1) * pageSize + 1}
                  </span>{" "}
                  -{" "}
                  <span className="text-white">
                    {Math.min(currentPage * pageSize, filteredData.length)}
                  </span>{" "}
                  / <span className="text-white">{filteredData.length}</span>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage <= 1}
                className="h-8 w-8 border-gray-600 bg-[#565656] text-white hover:bg-[#454545] hover:text-white disabled:opacity-50"
              >
                <ChevronsLeftIcon className="size-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="h-8 w-8 border-gray-600 bg-[#565656] text-white hover:bg-[#454545] hover:text-white disabled:opacity-50"
              >
                <ChevronLeftIcon className="size-4" />
              </Button>
              <span className="px-2 text-xs text-gray-300 sm:text-sm">
                {currentPage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage >= totalPages}
                className="h-8 w-8 border-gray-600 bg-[#565656] text-white hover:bg-[#454545] hover:text-white disabled:opacity-50"
              >
                <ChevronRightIcon className="size-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage >= totalPages}
                className="h-8 w-8 border-gray-600 bg-[#565656] text-white hover:bg-[#454545] hover:text-white disabled:opacity-50"
              >
                <ChevronsRightIcon className="size-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
