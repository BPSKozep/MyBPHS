"use client";

import { motion, AnimatePresence } from "motion/react";
import { api } from "@/trpc/react";
import { type AppRouter } from "@/server/root";
import { type inferProcedureOutput } from "@trpc/server";
import Loading from "@/components/Loading";
import Card from "@/components/Card";
import { useState, useEffect, useRef } from "react";

type DeploymentData = inferProcedureOutput<
    AppRouter["laptop"]["getDeployments"]
>[number];

function DeploymentCard({
    deployment,
}: {
    deployment: DeploymentData;
    index: number;
}) {
    const [elapsedTime, setElapsedTime] = useState(0);
    const utils = api.useUtils();
    const deleteDeployment = api.laptop.deleteDeployment.useMutation({
        onSuccess: () => {
            // Invalidate and refetch deployments after successful deletion
            utils.laptop.getDeployments.invalidate().catch(console.error);
        },
        onError: (error) => {
            console.error("Failed to delete deployment:", error);
        },
    });

    const handleDelete = () => {
        deleteDeployment.mutate({ id: deployment.ID.toString() });
    };

    useEffect(() => {
        if (deployment.DeploymentStatus === 3) return;

        const calculateElapsedTime = () => {
            const regex = /\/Date\((\d+)\)\//;
            const match = regex.exec(deployment.StartTime);
            if (match?.[1]) {
                const startTimestamp = parseInt(match[1], 10);
                const now = Date.now();
                const elapsed = Math.floor((now - startTimestamp) / 1000);
                setElapsedTime(elapsed);
            }
        };

        calculateElapsedTime();

        const interval = setInterval(calculateElapsedTime, 1000);

        return () => clearInterval(interval);
    }, [deployment.StartTime, deployment.DeploymentStatus]);

    const formatElapsedTime = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        if (hours > 0) {
            return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
        }
        return `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    const getStatusColor = (status: number) => {
        switch (status) {
            case 3:
                return "bg-green-500/20 text-green-400 border-green-500/30";
            case 2:
                return "bg-red-500/20 text-red-400 border-red-500/30";
            case 1:
                return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
            default:
                return "bg-gray-500/20 text-gray-400 border-gray-500/30";
        }
    };

    const getStatusText = (status: number) => {
        switch (status) {
            case 3:
                return "Befejezett";
            case 2:
                return "Hiba";
            case 1:
                return "Folyamatban";
            default:
                return "Ismeretlen";
        }
    };

    const getProgressColor = (status: number) => {
        switch (status) {
            case 3:
                return "bg-green-500";
            case 2:
                return "bg-red-500";
            case 1:
                return "bg-yellow-500";
            default:
                return "bg-gray-500";
        }
    };

    const formatDate = (dateString: string) => {
        const regex = /\/Date\((\d+)\)\//;
        const match = regex.exec(dateString);
        if (match?.[1]) {
            const timestamp = parseInt(match[1], 10);
            return new Date(timestamp).toLocaleString("hu-HU");
        }
        return dateString;
    };

    return (
        <motion.div
            whileHover={{
                scale: 1.01,
                transition: { type: "spring", stiffness: 400, damping: 25 },
            }}
            className="relative rounded-xl border border-gray-700 bg-[#242424] p-4 shadow-xl transition-shadow duration-200 hover:shadow-2xl"
        >
            {/* Header */}
            <div className="mb-3 flex items-center justify-between">
                <div className="flex max-w-[60%] flex-col gap-1">
                    <h3
                        className="truncate text-lg font-semibold text-white"
                        title={deployment.Name}
                    >
                        {deployment.Name}
                    </h3>
                    {deployment.DeploymentStatus !== 3 && (
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                            <svg
                                className="h-3 w-3"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <circle cx="12" cy="12" r="10" />
                                <polyline points="12,6 12,12 16,14" />
                            </svg>
                            <span className="font-mono">
                                {formatElapsedTime(elapsedTime)}
                            </span>
                        </div>
                    )}
                </div>
                <span
                    className={`rounded-full border px-3 py-1 text-xs font-medium ${getStatusColor(deployment.DeploymentStatus)}`}
                >
                    {getStatusText(deployment.DeploymentStatus)}
                </span>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
                <div className="mb-2 flex items-center justify-between">
                    <span className="font-mono text-sm text-white">
                        {deployment.PercentComplete}%
                    </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-gray-700">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${deployment.PercentComplete}%` }}
                        transition={{
                            type: "spring",
                            stiffness: 100,
                            damping: 25,
                        }}
                        className={`h-2 rounded-full ${getProgressColor(deployment.DeploymentStatus)}`}
                    />
                </div>
            </div>

            {/* Stats Grid */}
            <div className="mb-3 grid grid-cols-3 gap-3 text-xs">
                <div>
                    <p className="font-medium text-gray-400">Lépések</p>
                    <p className="font-mono text-white">
                        {deployment.CurrentStep}/{deployment.TotalSteps}
                    </p>
                </div>
                <div>
                    <p className="font-medium text-gray-400">
                        Figyelmeztetések
                    </p>
                    <p className="font-mono text-yellow-400">
                        {deployment.Warnings}
                    </p>
                </div>
                <div>
                    <p className="font-medium text-gray-400">Hibák</p>
                    <p className="font-mono text-red-400">
                        {deployment.Errors}
                    </p>
                </div>
            </div>

            {/* Current Step */}
            {deployment.StepName && (
                <div className="mb-3 rounded-lg bg-[#565e85]/20 p-2">
                    <p className="text-xs font-medium text-gray-400">
                        Jelenlegi lépés
                    </p>
                    <p
                        className="truncate text-sm text-white"
                        title={deployment.StepName}
                    >
                        {deployment.StepName}
                    </p>
                </div>
            )}

            {/* Expandable Details */}
            <details className="text-xs">
                <summary className="cursor-pointer text-gray-400 transition-colors select-none hover:text-white">
                    <span className="ml-2">További részletek</span>
                </summary>
                <div className="mt-2 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <p className="text-gray-400">Azonosító</p>
                            <p className="font-mono text-white">
                                {deployment.ID}
                            </p>
                        </div>
                        <div>
                            <p className="text-gray-400">Egyedi azonosító</p>
                            <p
                                className="truncate font-mono text-xs text-white"
                                title={deployment.UniqueID}
                            >
                                {deployment.UniqueID}
                            </p>
                        </div>
                    </div>

                    <div className="space-y-1 text-xs">
                        <div>
                            <span className="text-gray-400">Kezdés:</span>
                            <span className="ml-2 text-white">
                                {formatDate(deployment.StartTime)}
                            </span>
                        </div>
                        {deployment.EndTime && (
                            <div>
                                <span className="text-gray-400">
                                    Befejezés:
                                </span>
                                <span className="ml-2 text-white">
                                    {formatDate(deployment.EndTime)}
                                </span>
                            </div>
                        )}
                        <div>
                            <span className="text-gray-400">
                                Utolsó frissítés:
                            </span>
                            <span className="ml-2 text-white">
                                {formatDate(deployment.LastTime)}
                            </span>
                        </div>
                    </div>

                    {(deployment.VMHost ??
                        deployment.VMName ??
                        deployment.DartIP) && (
                        <div className="border-t border-gray-600 pt-2">
                            <p className="mb-1 text-gray-400">
                                VM/Hálózat részletek
                            </p>
                            <div className="space-y-1">
                                {deployment.VMHost && (
                                    <div>
                                        <span className="text-gray-400">
                                            VM Host:
                                        </span>
                                        <span className="ml-2 text-white">
                                            {deployment.VMHost}
                                        </span>
                                    </div>
                                )}
                                {deployment.VMName && (
                                    <div>
                                        <span className="text-gray-400">
                                            VM gép neve:
                                        </span>
                                        <span className="ml-2 text-white">
                                            {deployment.VMName}
                                        </span>
                                    </div>
                                )}
                                {deployment.DartIP && (
                                    <div>
                                        <span className="text-gray-400">
                                            DART IP:
                                        </span>
                                        <span className="ml-2 text-white">
                                            {deployment.DartIP}:
                                            {deployment.DartPort}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Delete Button */}
                    <div className="mt-3 border-t border-gray-600 pt-3">
                        <button
                            onClick={handleDelete}
                            disabled={deleteDeployment.isPending}
                            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm font-medium text-red-400 transition-all duration-200 hover:border-red-500/40 hover:bg-red-500/20 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {deleteDeployment.isPending ? (
                                <>
                                    <div className="h-4 w-4 animate-spin rounded-full border border-red-400 border-t-transparent"></div>
                                    <span>Törlés...</span>
                                </>
                            ) : (
                                <>
                                    <svg
                                        className="h-4 w-4"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                        />
                                    </svg>
                                    <span>Telepítés törlése</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </details>
        </motion.div>
    );
}

export default function LaptopDeploymentsClient() {
    const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
    const previousDeploymentsRef = useRef<DeploymentData[]>([]);

    const {
        data: deployments,
        isLoading,
        error,
        dataUpdatedAt,
    } = api.laptop.getDeployments.useQuery(undefined, {
        refetchInterval: autoRefreshEnabled ? 3000 : false,
        refetchIntervalInBackground: false,
        refetchOnWindowFocus: autoRefreshEnabled,
        staleTime: 0,
    });

    // Sound effect functions
    const playSuccessSound = () => {
        try {
            const audio = new Audio("/success.wav");
            audio.volume = 1;
            audio.play().catch(console.warn);
        } catch (error) {
            console.warn("Could not play success sound:", error);
        }
    };

    const playErrorSound = () => {
        try {
            const audio = new Audio("/error.wav");
            audio.volume = 1;
            audio.play().catch(console.warn);
        } catch (error) {
            console.warn("Could not play error sound:", error);
        }
    };

    // Monitor deployment changes for sound effects
    useEffect(() => {
        if (!deployments || deployments.length === 0) {
            return;
        }

        const previousDeployments = previousDeploymentsRef.current;

        // Skip on first load (no previous data to compare)
        if (previousDeployments.length === 0) {
            previousDeploymentsRef.current = [...deployments];
            return;
        }

        // Check for newly completed deployments
        const newlyCompleted = deployments.filter((current) => {
            const previous = previousDeployments.find(
                (prev) => prev.UniqueID === current.UniqueID,
            );
            return (
                previous &&
                previous.DeploymentStatus !== 3 &&
                current.DeploymentStatus === 3
            );
        });

        // Check for deployments with new errors
        const newErrors = deployments.filter((current) => {
            const previous = previousDeployments.find(
                (prev) => prev.UniqueID === current.UniqueID,
            );
            return previous && current.Errors > previous.Errors;
        });

        // Play sounds for changes
        if (newlyCompleted.length > 0) {
            playSuccessSound();
        }

        if (newErrors.length > 0) {
            playErrorSound();
        }

        // Update previous state
        previousDeploymentsRef.current = [...deployments];
    }, [deployments]);

    if (isLoading) {
        return (
            <div className="flex h-full w-full items-center justify-center">
                <Loading />
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6">
                <Card>
                    <div className="text-center">
                        <div className="mb-4 text-red-400">
                            <h3 className="mb-2 text-lg font-semibold">
                                Hiba a telepítések betöltésekor
                            </h3>
                            <p className="text-sm text-gray-300">
                                {error instanceof Error
                                    ? error.message
                                    : "Ismeretlen hiba történt"}
                            </p>
                        </div>
                    </div>
                </Card>
            </div>
        );
    }

    const activeDeployments =
        deployments?.filter((d) => d.DeploymentStatus !== 3) ?? [];
    const completedDeployments =
        deployments?.filter((d) => d.DeploymentStatus === 3) ?? [];

    return (
        <div className="space-y-6 p-4">
            {/* Refresh Indicator Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-sm text-gray-300">
                    <div className="flex items-center gap-3">
                        {/* Auto-refresh Toggle Switch */}
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() =>
                                    setAutoRefreshEnabled(!autoRefreshEnabled)
                                }
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800 focus:outline-none ${
                                    autoRefreshEnabled
                                        ? "bg-green-600"
                                        : "bg-gray-600"
                                }`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                        autoRefreshEnabled
                                            ? "translate-x-6"
                                            : "translate-x-1"
                                    }`}
                                />
                            </button>
                        </div>
                        <span>Automatikus frissítés</span>
                    </div>
                    {dataUpdatedAt && (
                        <span className="text-xs">
                            Frissítve:{" "}
                            {new Date(dataUpdatedAt).toLocaleTimeString(
                                "hu-HU",
                            )}
                        </span>
                    )}
                </div>
            </div>

            {/* Stats Header */}
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <Card padding="3">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-white">
                            {deployments?.length ?? 0}
                        </div>
                        <div className="text-sm text-gray-400">Összesen</div>
                    </div>
                </Card>
                <Card padding="3">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-400">
                            {activeDeployments.length}
                        </div>
                        <div className="text-sm text-gray-400">Aktív</div>
                    </div>
                </Card>
                <Card padding="3">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-green-400">
                            {completedDeployments.length}
                        </div>
                        <div className="text-sm text-gray-400">Befejezett</div>
                    </div>
                </Card>
                <Card padding="3">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-red-400">
                            {deployments?.reduce(
                                (sum, d) => sum + d.Errors,
                                0,
                            ) ?? 0}
                        </div>
                        <div className="text-sm text-gray-400">Összes hiba</div>
                    </div>
                </Card>
            </div>

            {/* Active Deployments */}
            {activeDeployments.length > 0 && (
                <div>
                    <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold text-white">
                        <span className="h-3 w-3 animate-pulse rounded-full bg-yellow-500"></span>
                        Aktív telepítések ({activeDeployments.length})
                    </h2>
                    <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                        <AnimatePresence mode="popLayout">
                            {activeDeployments.map((deployment, index) => (
                                <DeploymentCard
                                    key={deployment.UniqueID}
                                    deployment={deployment}
                                    index={index}
                                />
                            ))}
                        </AnimatePresence>
                    </div>
                </div>
            )}

            {/* Completed Deployments */}
            {completedDeployments.length > 0 && (
                <div>
                    <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold text-white">
                        <span className="h-3 w-3 rounded-full bg-green-500"></span>
                        Befejezett telepítések ({completedDeployments.length})
                    </h2>
                    <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                        <AnimatePresence mode="popLayout">
                            {completedDeployments.map((deployment, index) => (
                                <DeploymentCard
                                    key={deployment.UniqueID}
                                    deployment={deployment}
                                    index={index}
                                />
                            ))}
                        </AnimatePresence>
                    </div>
                </div>
            )}

            {/* Empty State */}
            {(!deployments || deployments.length === 0) && (
                <div className="py-12 text-center">
                    <Card>
                        <div className="text-center">
                            <motion.div
                                animate={{
                                    rotate: [0, 8, -8, 0],
                                    scale: [1, 1.05, 1],
                                }}
                                transition={{
                                    duration: 3,
                                    repeat: Infinity,
                                    repeatDelay: 1,
                                }}
                                className="mb-4 text-6xl"
                            >
                                💻
                            </motion.div>
                            <h3 className="mb-2 text-lg font-semibold text-white">
                                Nem található telepítés
                            </h3>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
}
