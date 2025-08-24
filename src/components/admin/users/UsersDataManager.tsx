"use client";

import React, { useState, useMemo } from "react";
import { api } from "@/trpc/react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuCheckboxItem,
    DropdownMenuTrigger,
    DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
    ChevronUpIcon,
    ChevronDownIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    ChevronsLeftIcon,
    ChevronsRightIcon,
    FilterIcon,
    RefreshCwIcon,
    EditIcon,
    SaveIcon,
    XIcon,
    TrashIcon,
} from "lucide-react";
import { FaColumns } from "react-icons/fa";
import { UserPlusIcon } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import Card from "@/components/Card";
import Loading from "@/components/Loading";
import rolesJson from "@/data/roles.json";
import { compareHungarianIgnoreCase } from "@/utils/hungarianCollator";
import { FaCheck, FaX } from "react-icons/fa6";

type SortDirection = "asc" | "desc";
type SortableColumn =
    | "name"
    | "email"
    | "nfcId"
    | "blocked"
    | "laptopPasswordChanged"
    | "hasADAccount";
type UserColumn =
    | "select"
    | "name"
    | "email"
    | "nfcId"
    | "roles"
    | "blocked"
    | "laptopPasswordChanged"
    | "hasADAccount"
    | "actions";
type RoleFilter =
    | "all"
    | "student"
    | "staff"
    | "administrator"
    | "lunch-system";

interface ColumnConfig {
    key: UserColumn;
    label: string;
    sortable: boolean;
    visible: boolean;
}

interface EditableFieldConfig {
    key: keyof UserData;
    editable: boolean;
    type: "text" | "email" | "select" | "checkbox";
    options?: string[];
}

interface UserData {
    _id: string;
    name: string;
    email: string;
    nfcId: string;
    laptopPasswordChanged: Date | null;
    roles: string[];
    blocked: boolean;
    hasADAccount: boolean;
}

interface EditingUser extends UserData {
    originalData: UserData;
}

const defaultColumns: ColumnConfig[] = [
    { key: "select", label: "", sortable: false, visible: true },
    { key: "name", label: "Név", sortable: true, visible: true },
    { key: "email", label: "Email", sortable: true, visible: true },
    { key: "nfcId", label: "NFC ID", sortable: true, visible: true },
    { key: "roles", label: "Szerepek", sortable: false, visible: true },
    { key: "blocked", label: "Blokkolva", sortable: true, visible: true },
    {
        key: "laptopPasswordChanged",
        label: "Iskolai jelszó módosítva",
        sortable: true,
        visible: true,
    },
    { key: "hasADAccount", label: "AD Fiók", sortable: true, visible: true },
    { key: "actions", label: "Műveletek", sortable: false, visible: true },
];

const editableFields: EditableFieldConfig[] = [
    { key: "name", editable: true, type: "text" },
    { key: "email", editable: true, type: "email" },
    { key: "nfcId", editable: true, type: "text" },
    { key: "laptopPasswordChanged", editable: false, type: "text" },
    {
        key: "roles",
        editable: true,
        type: "select",
        options: ["student", "staff", "administrator"],
    },
    { key: "blocked", editable: true, type: "checkbox" },
];

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

export default function UsersDataManager() {
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [search, setSearch] = useState("");
    const [sortBy, setSortBy] = useState<SortableColumn>("name");
    const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
    const [columns, setColumns] = useState<ColumnConfig[]>(defaultColumns);
    const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
    const [editingUserId, setEditingUserId] = useState<string | null>(null);
    const [editingUserData, setEditingUserData] = useState<EditingUser | null>(
        null,
    );
    const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
    const [alertDialog, setAlertDialog] = useState<{
        open: boolean;
        title: string;
        description: string;
        type: "error" | "confirm";
        onConfirm?: () => void;
    }>({ open: false, title: "", description: "", type: "error" });
    const [addUserDialog, setAddUserDialog] = useState(false);
    const [newUser, setNewUser] = useState({
        name: "",
        email: "",
        nfcId: "",
        roles: [] as string[],
        blocked: false,
        sendWelcomeEmail: true,
    });
    const [isRefreshLoading, setIsRefreshLoading] = useState(false);

    const visibleColumns = useMemo(
        () => columns.filter((col) => col.visible),
        [columns],
    );

    const {
        data: allUsers,
        isLoading,
        error,
        refetch: refetchUsers,
    } = api.user.getAll.useQuery();

    const updateUserMutation = api.user.update.useMutation({
        onSuccess: () => {
            void refetchUsers();
            setEditingUserId(null);
            setEditingUserData(null);
        },
        onError: (error) => {
            setAlertDialog({
                open: true,
                title: "Frissítési hiba",
                description: "Hiba történt a frissítés során: " + error.message,
                type: "error",
            });
        },
    });

    const deleteUsersMutation = api.user.delete.useMutation({
        onSuccess: () => {
            void refetchUsers();
            setSelectedRows(new Set());
        },
        onError: (error) => {
            setAlertDialog({
                open: true,
                title: "Törlési hiba",
                description: "Hiba történt a törlés során: " + error.message,
                type: "error",
            });
        },
    });

    const createUserMutation = api.user.create.useMutation({
        onSuccess: () => {
            void refetchUsers();
            setAddUserDialog(false);
            setNewUser({
                name: "",
                email: "",
                nfcId: "",
                roles: [],
                blocked: false,
                sendWelcomeEmail: true,
            });
        },
        onError: (error) => {
            setAlertDialog({
                open: true,
                title: "Létrehozási hiba",
                description:
                    "Hiba történt a felhasználó létrehozásakor: " +
                    error.message,
                type: "error",
            });
        },
    });

    // Client-side filtering and sorting
    const filteredAndSortedUsers = useMemo(() => {
        if (!allUsers) return [];

        let filtered = allUsers;

        // Apply role filter
        if (roleFilter !== "all") {
            filtered = filtered.filter((user) =>
                user.roles.some((role) => role === roleFilter),
            );
        }

        // Apply search filter
        if (search.trim()) {
            const searchLower = search.toLowerCase();
            filtered = filtered.filter(
                (user) =>
                    user.name.toLowerCase().includes(searchLower) ||
                    user.email.toLowerCase().includes(searchLower) ||
                    user.nfcId.toLowerCase().includes(searchLower),
            );
        }

        // Apply sorting (create a copy to avoid mutating)
        const sorted = [...filtered].sort((a, b) => {
            let compareResult = 0;

            switch (sortBy) {
                case "name":
                    // Use Hungarian collation for names
                    compareResult = compareHungarianIgnoreCase(a.name, b.name);
                    break;
                case "email":
                    // Use Hungarian collation for emails too (in case they contain Hungarian characters)
                    compareResult = compareHungarianIgnoreCase(
                        a.email,
                        b.email,
                    );
                    break;
                case "nfcId":
                    // NFC IDs are usually numeric/alphanumeric, but use Hungarian collation for consistency
                    compareResult = compareHungarianIgnoreCase(
                        a.nfcId,
                        b.nfcId,
                    );
                    break;
                case "blocked":
                    const aBlocked = a.blocked ? 1 : 0;
                    const bBlocked = b.blocked ? 1 : 0;
                    compareResult = aBlocked - bBlocked;
                    break;
                case "laptopPasswordChanged":
                    const aTime = a.laptopPasswordChanged
                        ? new Date(a.laptopPasswordChanged).getTime()
                        : 0;
                    const bTime = b.laptopPasswordChanged
                        ? new Date(b.laptopPasswordChanged).getTime()
                        : 0;
                    compareResult = aTime - bTime;
                    break;
                case "hasADAccount":
                    const aAD = a.hasADAccount ? 1 : 0;
                    const bAD = b.hasADAccount ? 1 : 0;
                    compareResult = aAD - bAD;
                    break;
                default:
                    return 0;
            }

            // Apply sort direction
            return sortDirection === "asc" ? compareResult : -compareResult;
        });

        return sorted;
    }, [allUsers, roleFilter, search, sortBy, sortDirection]);

    // Client-side pagination
    const paginatedUsers = useMemo(() => {
        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        return filteredAndSortedUsers.slice(startIndex, endIndex);
    }, [filteredAndSortedUsers, page, pageSize]);

    const totalPages = Math.ceil(filteredAndSortedUsers.length / pageSize);

    // Reset to first page when search, filter, or sorting changes
    React.useEffect(() => {
        setPage(1);
    }, [search, roleFilter, sortBy, sortDirection]);

    const handleSort = (column: UserColumn) => {
        // Only handle sorting for sortable columns
        if (column === "actions" || column === "select" || column === "roles")
            return;

        const sortableColumn = column as SortableColumn;
        if (sortBy === sortableColumn) {
            setSortDirection(sortDirection === "asc" ? "desc" : "asc");
        } else {
            setSortBy(sortableColumn);
            setSortDirection("asc");
        }
    };

    const toggleColumnVisibility = (columnKey: UserColumn) => {
        setColumns((prev) =>
            prev.map((col) =>
                col.key === columnKey ? { ...col, visible: !col.visible } : col,
            ),
        );
    };

    const formatDate = (date: Date | null) => {
        if (!date) return "Soha";
        return new Date(date).toLocaleDateString("hu-HU", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const getSortIcon = (column: UserColumn) => {
        if (
            column === "actions" ||
            column === "select" ||
            column === "roles" ||
            sortBy !== column
        )
            return null;
        return sortDirection === "asc" ? (
            <ChevronUpIcon className="ml-2 size-4" />
        ) : (
            <ChevronDownIcon className="ml-2 size-4" />
        );
    };

    const canGoPrevious = page > 1;
    const canGoNext = page < totalPages;

    // Editing functions
    const startEditing = (user: UserData) => {
        const editingUser: EditingUser = {
            ...user,
            originalData: { ...user },
        };
        setEditingUserId(user._id);
        setEditingUserData(editingUser);
    };

    const cancelEditing = () => {
        setEditingUserId(null);
        setEditingUserData(null);
    };

    const saveEditing = () => {
        if (!editingUserData) return;

        updateUserMutation.mutate({
            _id: editingUserData._id,
            name: editingUserData.name,
            email: editingUserData.email,
            nfcId: editingUserData.nfcId,
            roles: editingUserData.roles,
            blocked: editingUserData.blocked,
        });
    };

    const updateEditingField = <K extends keyof UserData>(
        field: K,
        value: UserData[K],
    ) => {
        if (!editingUserData) return;
        setEditingUserData({
            ...editingUserData,
            [field]: value,
        });
    };

    const getFieldConfig = (
        fieldKey: keyof UserData,
    ): EditableFieldConfig | undefined => {
        return editableFields.find((config) => config.key === fieldKey);
    };

    // Row selection functions
    const toggleRowSelection = (userId: string) => {
        const newSelected = new Set(selectedRows);
        if (newSelected.has(userId)) {
            newSelected.delete(userId);
        } else {
            newSelected.add(userId);
        }
        setSelectedRows(newSelected);
    };

    const toggleSelectAll = () => {
        if (
            selectedRows.size === paginatedUsers.length &&
            paginatedUsers.length > 0
        ) {
            setSelectedRows(new Set());
        } else {
            setSelectedRows(new Set(paginatedUsers.map((user) => user._id)));
        }
    };

    const handleDeleteSelected = () => {
        if (selectedRows.size === 0) return;

        const userNames = paginatedUsers
            .filter((user) => selectedRows.has(user._id))
            .map((user) => user.name)
            .join(", ");

        setAlertDialog({
            open: true,
            title: "Felhasználók törlése",
            description: `Biztosan törölni szeretnéd a következő ${selectedRows.size} felhasználót?\n\n${userNames}`,
            type: "confirm",
            onConfirm: () => {
                deleteUsersMutation.mutate(Array.from(selectedRows));
                setAlertDialog({
                    open: false,
                    title: "",
                    description: "",
                    type: "error",
                });
            },
        });
    };

    const isAllSelected =
        paginatedUsers.length > 0 &&
        selectedRows.size === paginatedUsers.length;

    // New user creation handlers
    const handleCreateUser = () => {
        if (
            !newUser.name ||
            !newUser.email ||
            !newUser.nfcId ||
            newUser.roles.length === 0
        ) {
            setAlertDialog({
                open: true,
                title: "Hiányzó adatok",
                description:
                    "Kérlek tölts ki minden kötelező mezőt és válassz legalább egy szerepet.",
                type: "error",
            });
            return;
        }

        createUserMutation.mutate(newUser);
    };

    const toggleNewUserRole = (role: string) => {
        setNewUser((prev) => ({
            ...prev,
            roles: prev.roles.includes(role)
                ? prev.roles.filter((r) => r !== role)
                : [...prev.roles, role],
        }));
    };

    const handleRefreshWithLoading = async () => {
        setIsRefreshLoading(true);
        try {
            await refetchUsers();
        } finally {
            setIsRefreshLoading(false);
        }
    };

    const roles: Record<string, string> = rolesJson;
    const roleKeys = Object.keys(roles);

    if (error) {
        return (
            <Card>
                <div className="rounded-lg border border-red-500/30 bg-red-900/20 p-4 text-center text-red-200">
                    <h3 className="mb-2 text-lg font-bold">
                        Hiba a felhasználók betöltésekor
                    </h3>
                    <p>{error.message}</p>
                </div>
            </Card>
        );
    }

    return (
        <Card>
            <div className="space-y-6">
                {/* Controls Section */}
                <div className="sticky top-0 z-20 flex flex-col items-start justify-between gap-4 bg-[#242424] py-3 lg:flex-row lg:items-center">
                    <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
                        {/* Search */}
                        <Input
                            placeholder="Felhasználók keresése..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full border-gray-600 bg-[#565656] font-bold text-white placeholder:text-gray-300 focus:border-gray-400 sm:w-64"
                        />

                        {/* Role Filter */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="flex items-center gap-2 border-gray-600 bg-[#565656] text-white hover:bg-[#454545] hover:text-white"
                                >
                                    <FilterIcon className="size-4" />
                                    Típus:{" "}
                                    {roleFilter === "all"
                                        ? "Összes"
                                        : roleFilter === "student"
                                          ? "Tanuló"
                                          : roleFilter === "staff"
                                            ? "Személyzet"
                                            : roleFilter === "lunch-system"
                                              ? "Ebédrendszer"
                                              : "Admin"}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="border-gray-600 bg-[#242424]">
                                <DropdownMenuItem
                                    onClick={() => setRoleFilter("all")}
                                    className="font-medium text-white hover:bg-[#2e2e2e] hover:text-white focus:bg-[#2e2e2e] focus:text-white"
                                >
                                    Összes
                                </DropdownMenuItem>
                                {roleKeys.map((role) => (
                                    <DropdownMenuItem
                                        key={role}
                                        onClick={() =>
                                            setRoleFilter(role as RoleFilter)
                                        }
                                        className="font-medium text-white hover:bg-[#2e2e2e] hover:text-white focus:bg-[#2e2e2e] focus:text-white"
                                    >
                                        {roles[role] ?? role}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:gap-2">
                        {/* Mobile: Full-width button row */}
                        <div className="flex w-full gap-2 sm:hidden">
                            {/* Add User Button */}
                            <Dialog
                                open={addUserDialog}
                                onOpenChange={setAddUserDialog}
                            >
                                <DialogTrigger asChild>
                                    <Button
                                        variant="default"
                                        className="flex flex-1 items-center justify-center bg-blue-600 text-white hover:bg-blue-700 hover:text-white"
                                        title="Új felhasználó"
                                    >
                                        <UserPlusIcon className="size-4" />
                                    </Button>
                                </DialogTrigger>
                            </Dialog>

                            {/* Delete Button */}
                            <Button
                                variant="outline"
                                onClick={handleDeleteSelected}
                                disabled={
                                    selectedRows.size === 0 ||
                                    deleteUsersMutation.isPending
                                }
                                className={`flex flex-1 items-center justify-center transition-colors ${
                                    selectedRows.size > 0
                                        ? "border-red-600 bg-red-700 text-white hover:bg-red-600 hover:text-white"
                                        : "border-gray-600 bg-[#565656] text-white hover:bg-[#454545] hover:text-white"
                                }`}
                                title={`${selectedRows.size} felhasználó törlése`}
                            >
                                <TrashIcon className="size-4" />
                            </Button>

                            {/* Column Visibility Button */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className="flex flex-1 items-center justify-center border-gray-600 bg-[#565656] text-white hover:bg-[#454545] hover:text-white"
                                        title="Oszlopok"
                                    >
                                        <FaColumns className="size-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="border-gray-600 bg-[#242424]">
                                    {columns
                                        .filter(
                                            (column) => column.key !== "select",
                                        )
                                        .map((column) => (
                                            <DropdownMenuCheckboxItem
                                                key={column.key}
                                                checked={column.visible}
                                                onCheckedChange={() =>
                                                    toggleColumnVisibility(
                                                        column.key,
                                                    )
                                                }
                                                className="font-medium text-white hover:bg-[#2e2e2e] hover:text-white focus:bg-[#2e2e2e] focus:text-white"
                                            >
                                                {column.label}
                                            </DropdownMenuCheckboxItem>
                                        ))}
                                </DropdownMenuContent>
                            </DropdownMenu>

                            {/* Refresh Button */}
                            <Button
                                variant="outline"
                                onClick={handleRefreshWithLoading}
                                disabled={isRefreshLoading}
                                className="flex flex-1 items-center justify-center border-gray-600 bg-[#565656] text-white hover:bg-[#454545] hover:text-white disabled:opacity-50"
                                title="Adatok frissítése"
                            >
                                <RefreshCwIcon
                                    className={`size-4 ${isRefreshLoading ? "animate-spin" : ""}`}
                                />
                            </Button>
                        </div>

                        {/* Desktop: Original layout with text */}
                        <div className="hidden items-center gap-2 sm:flex">
                            {/* Add User Button */}
                            <Dialog
                                open={addUserDialog}
                                onOpenChange={setAddUserDialog}
                            >
                                <DialogTrigger asChild>
                                    <Button
                                        variant="default"
                                        className="flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700 hover:text-white"
                                    >
                                        <UserPlusIcon className="size-4" />
                                        Új felhasználó
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-md border-gray-600 bg-[#2e2e2e]">
                                    <DialogHeader>
                                        <DialogTitle className="text-white">
                                            Új felhasználó hozzáadása
                                        </DialogTitle>
                                        <DialogDescription />
                                    </DialogHeader>
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label
                                                htmlFor="name"
                                                className="text-white"
                                            >
                                                Név*
                                            </Label>
                                            <Input
                                                id="name"
                                                value={newUser.name}
                                                onChange={(e) =>
                                                    setNewUser((prev) => ({
                                                        ...prev,
                                                        name: e.target.value,
                                                    }))
                                                }
                                                className="border-gray-600 bg-[#565656] text-white placeholder:text-gray-300"
                                                placeholder="Teljes név"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label
                                                htmlFor="email"
                                                className="text-white"
                                            >
                                                Email*
                                            </Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                value={newUser.email}
                                                onChange={(e) =>
                                                    setNewUser((prev) => ({
                                                        ...prev,
                                                        email: e.target.value,
                                                    }))
                                                }
                                                className="border-gray-600 bg-[#565656] text-white placeholder:text-gray-300"
                                                placeholder="pelda@example.com"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label
                                                htmlFor="nfcId"
                                                className="text-white"
                                            >
                                                NFC ID*
                                            </Label>
                                            <Input
                                                id="nfcId"
                                                value={newUser.nfcId}
                                                maxLength={8}
                                                onChange={(e) =>
                                                    setNewUser((prev) => ({
                                                        ...prev,
                                                        nfcId: e.target.value,
                                                    }))
                                                }
                                                className="border-gray-600 bg-[#565656] font-mono text-white placeholder:text-gray-300"
                                                placeholder="12345678"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-white">
                                                Szerepek*
                                            </Label>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        className="w-full justify-between border-gray-600 bg-[#565656] text-white hover:bg-[#454545] hover:text-white"
                                                    >
                                                        {newUser.roles
                                                            .length === 0
                                                            ? "Válassz szerepeket"
                                                            : newUser.roles
                                                                  .map(
                                                                      (role) =>
                                                                          roles[
                                                                              role
                                                                          ] ??
                                                                          role,
                                                                  )
                                                                  .join(", ")}
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent className="border-gray-600 bg-[#242424]">
                                                    {roleKeys.map((role) => (
                                                        <DropdownMenuCheckboxItem
                                                            key={role}
                                                            checked={newUser.roles.includes(
                                                                role,
                                                            )}
                                                            onCheckedChange={() =>
                                                                toggleNewUserRole(
                                                                    role,
                                                                )
                                                            }
                                                            className="font-medium text-white hover:bg-[#2e2e2e] hover:text-white focus:bg-[#2e2e2e] focus:text-white"
                                                        >
                                                            {roles[role] ??
                                                                role}
                                                        </DropdownMenuCheckboxItem>
                                                    ))}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Switch
                                                id="blocked"
                                                checked={newUser.blocked}
                                                onCheckedChange={(
                                                    checked: boolean,
                                                ) =>
                                                    setNewUser((prev) => ({
                                                        ...prev,
                                                        blocked: checked,
                                                    }))
                                                }
                                                className="data-[state=checked]:bg-red-600"
                                            />
                                            <Label
                                                htmlFor="blocked"
                                                className="text-white"
                                            >
                                                Blokkolva
                                            </Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Switch
                                                id="sendWelcomeEmail"
                                                checked={
                                                    newUser.sendWelcomeEmail
                                                }
                                                onCheckedChange={(
                                                    checked: boolean,
                                                ) =>
                                                    setNewUser((prev) => ({
                                                        ...prev,
                                                        sendWelcomeEmail:
                                                            checked,
                                                    }))
                                                }
                                                className="data-[state=checked]:bg-blue-600"
                                            />
                                            <Label
                                                htmlFor="sendWelcomeEmail"
                                                className="text-white"
                                            >
                                                Üdvözlő email küldése
                                            </Label>
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button
                                            variant="outline"
                                            onClick={() =>
                                                setAddUserDialog(false)
                                            }
                                            className="border-gray-600 bg-[#565656] text-white hover:bg-[#454545] hover:text-white"
                                        >
                                            Mégse
                                        </Button>
                                        <Button
                                            onClick={handleCreateUser}
                                            disabled={
                                                createUserMutation.isPending
                                            }
                                            className="border-blue-600 bg-blue-700 text-white hover:bg-blue-600 hover:text-white"
                                        >
                                            {createUserMutation.isPending
                                                ? "Létrehozás..."
                                                : "Létrehozás"}
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>

                            {/* Delete Button */}
                            <Button
                                variant="outline"
                                onClick={handleDeleteSelected}
                                disabled={
                                    selectedRows.size === 0 ||
                                    deleteUsersMutation.isPending
                                }
                                className={`flex items-center gap-2 transition-colors ${
                                    selectedRows.size > 0
                                        ? "border-red-600 bg-red-700 text-white hover:bg-red-600 hover:text-white"
                                        : "border-gray-600 bg-[#565656] text-white hover:bg-[#454545] hover:text-white"
                                }`}
                                title={`${selectedRows.size} felhasználó törlése`}
                            >
                                <TrashIcon className="size-4" />
                                Törlés{" "}
                                {selectedRows.size > 0 &&
                                    `(${selectedRows.size})`}
                            </Button>

                            {/* Column Visibility Button */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className="flex items-center gap-2 border-gray-600 bg-[#565656] text-white hover:bg-[#454545] hover:text-white"
                                    >
                                        <FaColumns className="size-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="border-gray-600 bg-[#242424]">
                                    {columns
                                        .filter(
                                            (column) => column.key !== "select",
                                        )
                                        .map((column) => (
                                            <DropdownMenuCheckboxItem
                                                key={column.key}
                                                checked={column.visible}
                                                onCheckedChange={() =>
                                                    toggleColumnVisibility(
                                                        column.key,
                                                    )
                                                }
                                                className="font-medium text-white hover:bg-[#2e2e2e] hover:text-white focus:bg-[#2e2e2e] focus:text-white"
                                            >
                                                {column.label}
                                            </DropdownMenuCheckboxItem>
                                        ))}
                                </DropdownMenuContent>
                            </DropdownMenu>

                            {/* Refresh Button */}
                            <Button
                                variant="outline"
                                onClick={handleRefreshWithLoading}
                                disabled={isRefreshLoading}
                                className="flex items-center gap-2 border-gray-600 bg-[#565656] text-white hover:bg-[#454545] hover:text-white disabled:opacity-50"
                                title="Adatok frissítése"
                            >
                                <RefreshCwIcon
                                    className={`size-4 ${isRefreshLoading ? "animate-spin" : ""}`}
                                />
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-hidden rounded-lg">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-b border-gray-600 bg-gray-900 hover:bg-slate-900">
                                {visibleColumns.map((column) => (
                                    <TableHead
                                        key={column.key}
                                        className="font-semibold text-white"
                                    >
                                        {column.key === "select" ? (
                                            <Checkbox
                                                checked={isAllSelected}
                                                onCheckedChange={
                                                    toggleSelectAll
                                                }
                                                aria-label="Összes kiválasztása"
                                                className="border-gray-400 data-[state=checked]:bg-white data-[state=checked]:text-gray-900"
                                            />
                                        ) : column.sortable ? (
                                            <Button
                                                variant="ghost"
                                                onClick={() =>
                                                    handleSort(column.key)
                                                }
                                                className="flex h-auto items-center p-0 font-semibold text-white hover:bg-transparent hover:text-white"
                                            >
                                                {column.label}
                                                {getSortIcon(column.key)}
                                            </Button>
                                        ) : (
                                            column.label
                                        )}
                                    </TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow className="hover:bg-transparent">
                                    <TableCell
                                        colSpan={visibleColumns.length}
                                        className="py-12 text-center"
                                    >
                                        <div className="flex flex-col items-center gap-4">
                                            <Loading />
                                            <p className="text-white">
                                                Felhasználók betöltése...
                                            </p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : paginatedUsers.length === 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={visibleColumns.length}
                                        className="py-12 text-center"
                                    >
                                        <div className="flex flex-col items-center gap-2">
                                            <p className="text-lg font-medium text-white">
                                                Nincs találat
                                            </p>
                                            <p className="text-sm text-gray-300">
                                                Próbáld módosítani a keresést
                                                vagy szűrőket
                                            </p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                paginatedUsers.map((user, index) => {
                                    const isEditing =
                                        editingUserId === user._id;
                                    const displayUser =
                                        isEditing && editingUserData
                                            ? editingUserData
                                            : user;

                                    return (
                                        <TableRow
                                            key={user._id}
                                            className={cn(
                                                "border-gray-600 text-white transition-colors",
                                                index % 2 === 0
                                                    ? "bg-[#242424] hover:bg-[#2a2a2a]"
                                                    : "bg-[#2e2e2e] hover:bg-[#343434]",
                                                user.blocked &&
                                                    "border-l-4 border-l-red-500 opacity-80",
                                                isEditing &&
                                                    "ring-2 ring-blue-500",
                                            )}
                                        >
                                            {visibleColumns.map((column) => (
                                                <TableCell
                                                    key={column.key}
                                                    className="text-white"
                                                >
                                                    {column.key ===
                                                        "select" && (
                                                        <Checkbox
                                                            checked={selectedRows.has(
                                                                user._id,
                                                            )}
                                                            onCheckedChange={() =>
                                                                toggleRowSelection(
                                                                    user._id,
                                                                )
                                                            }
                                                            aria-label={`${user.name} kiválasztása`}
                                                            className="border-gray-400 data-[state=checked]:bg-white data-[state=checked]:text-gray-900"
                                                        />
                                                    )}
                                                    {column.key === "name" && (
                                                        <div className="flex flex-col">
                                                            {isEditing &&
                                                            getFieldConfig(
                                                                "name",
                                                            )?.editable ? (
                                                                <Input
                                                                    value={
                                                                        displayUser.name
                                                                    }
                                                                    onChange={(
                                                                        e,
                                                                    ) =>
                                                                        updateEditingField(
                                                                            "name",
                                                                            e
                                                                                .target
                                                                                .value,
                                                                        )
                                                                    }
                                                                    className="h-8 border-gray-600 bg-[#565656] text-white"
                                                                />
                                                            ) : (
                                                                <span className="font-medium text-white">
                                                                    {
                                                                        displayUser.name
                                                                    }
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
                                                    {column.key === "email" && (
                                                        <>
                                                            {isEditing &&
                                                            getFieldConfig(
                                                                "email",
                                                            )?.editable ? (
                                                                <Input
                                                                    type="email"
                                                                    value={
                                                                        displayUser.email
                                                                    }
                                                                    onChange={(
                                                                        e,
                                                                    ) =>
                                                                        updateEditingField(
                                                                            "email",
                                                                            e
                                                                                .target
                                                                                .value,
                                                                        )
                                                                    }
                                                                    className="h-8 border-gray-600 bg-[#565656] text-white"
                                                                />
                                                            ) : (
                                                                <span className="text-gray-200">
                                                                    {
                                                                        displayUser.email
                                                                    }
                                                                </span>
                                                            )}
                                                        </>
                                                    )}
                                                    {column.key === "nfcId" && (
                                                        <>
                                                            {isEditing &&
                                                            getFieldConfig(
                                                                "nfcId",
                                                            )?.editable ? (
                                                                <Input
                                                                    value={
                                                                        displayUser.nfcId
                                                                    }
                                                                    onChange={(
                                                                        e,
                                                                    ) =>
                                                                        updateEditingField(
                                                                            "nfcId",
                                                                            e
                                                                                .target
                                                                                .value,
                                                                        )
                                                                    }
                                                                    className="h-8 border-gray-600 bg-[#565656] font-mono text-white"
                                                                />
                                                            ) : (
                                                                <code className="rounded border border-gray-500 bg-[#565656] px-2 py-1 font-mono text-sm text-white">
                                                                    {
                                                                        displayUser.nfcId
                                                                    }
                                                                </code>
                                                            )}
                                                        </>
                                                    )}
                                                    {column.key === "roles" && (
                                                        <div className="flex flex-wrap gap-1">
                                                            {isEditing &&
                                                            getFieldConfig(
                                                                "roles",
                                                            )?.editable ? (
                                                                <DropdownMenu>
                                                                    <DropdownMenuTrigger
                                                                        asChild
                                                                    >
                                                                        <Button
                                                                            variant="outline"
                                                                            className="w-full justify-between border-gray-600 bg-[#565656] text-white hover:bg-[#454545] hover:text-white"
                                                                        >
                                                                            {displayUser
                                                                                .roles
                                                                                .length ===
                                                                            0
                                                                                ? "Válassz szerepeket"
                                                                                : displayUser.roles
                                                                                      .map(
                                                                                          (
                                                                                              role,
                                                                                          ) =>
                                                                                              roles[
                                                                                                  role
                                                                                              ] ??
                                                                                              role,
                                                                                      )
                                                                                      .join(
                                                                                          ", ",
                                                                                      )}
                                                                        </Button>
                                                                    </DropdownMenuTrigger>
                                                                    <DropdownMenuContent className="border-gray-600 bg-[#242424]">
                                                                        {roleKeys.map(
                                                                            (
                                                                                role,
                                                                            ) => (
                                                                                <DropdownMenuCheckboxItem
                                                                                    key={
                                                                                        role
                                                                                    }
                                                                                    checked={displayUser.roles.includes(
                                                                                        role,
                                                                                    )}
                                                                                    onCheckedChange={() => {
                                                                                        const newRoles =
                                                                                            displayUser.roles.includes(
                                                                                                role,
                                                                                            )
                                                                                                ? displayUser.roles.filter(
                                                                                                      (
                                                                                                          r,
                                                                                                      ) =>
                                                                                                          r !==
                                                                                                          role,
                                                                                                  )
                                                                                                : [
                                                                                                      ...displayUser.roles,
                                                                                                      role,
                                                                                                  ];
                                                                                        updateEditingField(
                                                                                            "roles",
                                                                                            newRoles,
                                                                                        );
                                                                                    }}
                                                                                    className="font-medium text-white hover:bg-[#2e2e2e] hover:text-white focus:bg-[#2e2e2e] focus:text-white"
                                                                                >
                                                                                    {roles[
                                                                                        role
                                                                                    ] ??
                                                                                        role}
                                                                                </DropdownMenuCheckboxItem>
                                                                            ),
                                                                        )}
                                                                    </DropdownMenuContent>
                                                                </DropdownMenu>
                                                            ) : (
                                                                displayUser.roles.map(
                                                                    (role) => (
                                                                        <Badge
                                                                            key={
                                                                                role
                                                                            }
                                                                            variant={
                                                                                role ===
                                                                                "administrator"
                                                                                    ? "destructive"
                                                                                    : role ===
                                                                                        "staff"
                                                                                      ? "default"
                                                                                      : role ===
                                                                                          "student"
                                                                                        ? "outline"
                                                                                        : role ===
                                                                                            "lunch-system"
                                                                                          ? "outline"
                                                                                          : "default"
                                                                            }
                                                                            className={cn(
                                                                                "text-xs",
                                                                                role ===
                                                                                    "student" &&
                                                                                    "border border-gray-300 bg-white text-black",
                                                                                role ===
                                                                                    "lunch-system" &&
                                                                                    "border border-yellow-400 bg-yellow-300 text-black",
                                                                            )}
                                                                        >
                                                                            {
                                                                                roles[
                                                                                    role
                                                                                ]
                                                                            }
                                                                        </Badge>
                                                                    ),
                                                                )
                                                            )}
                                                        </div>
                                                    )}
                                                    {column.key ===
                                                        "blocked" && (
                                                        <div className="flex items-center justify-center">
                                                            {isEditing &&
                                                            getFieldConfig(
                                                                "blocked",
                                                            )?.editable ? (
                                                                <Switch
                                                                    checked={
                                                                        displayUser.blocked
                                                                    }
                                                                    onCheckedChange={(
                                                                        checked: boolean,
                                                                    ) =>
                                                                        updateEditingField(
                                                                            "blocked",
                                                                            checked,
                                                                        )
                                                                    }
                                                                    className="data-[state=checked]:bg-red-600"
                                                                />
                                                            ) : (
                                                                <Switch
                                                                    checked={
                                                                        displayUser.blocked
                                                                    }
                                                                    disabled
                                                                    className="data-[state=checked]:bg-red-600"
                                                                />
                                                            )}
                                                        </div>
                                                    )}
                                                    {column.key ===
                                                        "laptopPasswordChanged" && (
                                                        <span className="text-sm text-gray-200">
                                                            {formatDate(
                                                                displayUser.laptopPasswordChanged,
                                                            )}
                                                        </span>
                                                    )}
                                                    {column.key ===
                                                        "hasADAccount" && (
                                                        <div className="flex justify-center">
                                                            <Badge
                                                                variant="default"
                                                                className={
                                                                    displayUser.hasADAccount
                                                                        ? "bg-green-600 text-white hover:bg-green-700"
                                                                        : "bg-red-600 text-white hover:bg-red-700"
                                                                }
                                                            >
                                                                {displayUser.hasADAccount ? (
                                                                    <FaCheck />
                                                                ) : (
                                                                    <FaX />
                                                                )}
                                                            </Badge>
                                                        </div>
                                                    )}
                                                    {column.key ===
                                                        "actions" && (
                                                        <div className="flex items-center gap-1">
                                                            {isEditing ? (
                                                                <>
                                                                    <Button
                                                                        variant="outline"
                                                                        size="icon"
                                                                        onClick={
                                                                            saveEditing
                                                                        }
                                                                        disabled={
                                                                            updateUserMutation.isPending
                                                                        }
                                                                        className="h-8 w-8 border-green-600 bg-green-700 text-white hover:bg-green-600 hover:text-white"
                                                                        title="Mentés"
                                                                    >
                                                                        <SaveIcon className="size-4" />
                                                                    </Button>
                                                                    <Button
                                                                        variant="outline"
                                                                        size="icon"
                                                                        onClick={
                                                                            cancelEditing
                                                                        }
                                                                        disabled={
                                                                            updateUserMutation.isPending
                                                                        }
                                                                        className="h-8 w-8 border-red-600 bg-red-700 text-white hover:bg-red-600 hover:text-white"
                                                                        title="Mégse"
                                                                    >
                                                                        <XIcon className="size-4" />
                                                                    </Button>
                                                                </>
                                                            ) : (
                                                                <Button
                                                                    variant="outline"
                                                                    size="icon"
                                                                    onClick={() =>
                                                                        startEditing(
                                                                            user,
                                                                        )
                                                                    }
                                                                    className="h-8 w-8 border-gray-600 bg-[#565656] text-white hover:bg-[#454545] hover:text-white"
                                                                    title="Szerkesztés"
                                                                >
                                                                    <EditIcon className="size-4" />
                                                                </Button>
                                                            )}
                                                        </div>
                                                    )}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination */}
                <div className="flex flex-col items-center justify-between gap-2 rounded-lg border border-gray-600 bg-[#2e2e2e] p-2 sm:gap-4 sm:p-4 lg:flex-row">
                    <div className="flex flex-row items-center justify-between gap-10">
                        <div className="flex items-center gap-2 text-xs text-gray-300 sm:gap-3 sm:text-sm">
                            <span className="hidden font-medium sm:inline">
                                Sorok oldalanként:
                            </span>
                            <span className="font-medium sm:hidden">
                                Sorok/oldal:
                            </span>
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
                                                setPage(1);
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
                            <span className="hidden sm:inline">
                                Megjelenítés:{" "}
                                <span className="text-white">
                                    {Math.min(
                                        (page - 1) * pageSize + 1,
                                        filteredAndSortedUsers.length,
                                    )}
                                </span>{" "}
                                -{" "}
                                <span className="text-white">
                                    {Math.min(
                                        page * pageSize,
                                        filteredAndSortedUsers.length,
                                    )}
                                </span>{" "}
                                /{" "}
                                <span className="text-white">
                                    {filteredAndSortedUsers.length}
                                </span>{" "}
                                felhasználó
                            </span>
                            <span className="sm:hidden">
                                <span className="text-white">
                                    {Math.min(
                                        (page - 1) * pageSize + 1,
                                        filteredAndSortedUsers.length,
                                    )}
                                </span>
                                -
                                <span className="text-white">
                                    {Math.min(
                                        page * pageSize,
                                        filteredAndSortedUsers.length,
                                    )}
                                </span>
                                /
                                <span className="text-white">
                                    {filteredAndSortedUsers.length}
                                </span>
                            </span>
                        </div>
                    </div>

                    <div className="flex w-full items-center justify-between gap-1 sm:w-auto sm:gap-1">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setPage(1)}
                            disabled={!canGoPrevious}
                            className="h-6 flex-1 border-gray-600 bg-[#565656] text-white hover:bg-[#454545] disabled:opacity-50 sm:h-8 sm:w-8 sm:flex-none"
                        >
                            <ChevronsLeftIcon className="size-3 sm:size-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setPage(page - 1)}
                            disabled={!canGoPrevious}
                            className="h-6 flex-1 border-gray-600 bg-[#565656] text-white hover:bg-[#454545] disabled:opacity-50 sm:h-8 sm:w-8 sm:flex-none"
                        >
                            <ChevronLeftIcon className="size-3 sm:size-4" />
                        </Button>
                        <div className="mx-1 flex items-center gap-1 text-xs font-medium text-gray-300 sm:mx-3 sm:gap-2 sm:text-sm">
                            <span className="hidden sm:inline">Oldal</span>
                            <span className="min-w-[2rem] rounded border border-gray-600 bg-[#565656] px-1 py-0.5 text-center text-xs text-white sm:min-w-[3rem] sm:px-2 sm:py-1 sm:text-sm">
                                {page}
                            </span>
                            <span>/ {totalPages}</span>
                        </div>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setPage(page + 1)}
                            disabled={!canGoNext}
                            className="h-6 flex-1 border-gray-600 bg-[#565656] text-white hover:bg-[#454545] disabled:opacity-50 sm:h-8 sm:w-8 sm:flex-none"
                        >
                            <ChevronRightIcon className="size-3 sm:size-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setPage(totalPages)}
                            disabled={!canGoNext}
                            className="h-6 flex-1 border-gray-600 bg-[#565656] text-white hover:bg-[#454545] disabled:opacity-50 sm:h-8 sm:w-8 sm:flex-none"
                        >
                            <ChevronsRightIcon className="size-3 sm:size-4" />
                        </Button>
                    </div>
                </div>

                {/* Alert Dialog */}
                <AlertDialog
                    open={alertDialog.open}
                    onOpenChange={(open) =>
                        setAlertDialog((prev) => ({ ...prev, open }))
                    }
                >
                    <AlertDialogContent className="border-gray-600 bg-[#2e2e2e]">
                        <AlertDialogHeader>
                            <AlertDialogTitle className="text-white">
                                {alertDialog.title}
                            </AlertDialogTitle>
                            <AlertDialogDescription className="whitespace-pre-line text-gray-300">
                                {alertDialog.description}
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            {alertDialog.type === "confirm" ? (
                                <>
                                    <AlertDialogCancel className="border-gray-600 bg-[#565656] text-white hover:bg-[#454545] hover:text-white">
                                        Mégse
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={alertDialog.onConfirm}
                                        className="border-red-600 bg-red-700 text-white hover:bg-red-600 hover:text-white"
                                    >
                                        Törlés
                                    </AlertDialogAction>
                                </>
                            ) : (
                                <AlertDialogAction className="border-gray-600 bg-[#565656] text-white hover:bg-[#454545] hover:text-white">
                                    OK
                                </AlertDialogAction>
                            )}
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </Card>
    );
}
