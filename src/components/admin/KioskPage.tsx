"use client";

import OnlyRoles from "@/components/OnlyRoles";
import PageWithHeader from "@/components/PageWithHeader";
import { FaCheck, FaUser, FaWrench } from "react-icons/fa";
import IconButton from "@/components/IconButton";
import React, { useEffect, useMemo, useState } from "react";
import { api } from "@/trpc/react";
import OrderCounts from "@/components/OrderCounts";
import { io } from "socket.io-client";
import Loading from "@/components/Loading";

export default function KioskPage() {
    const [nfcId, setNfcId] = useState("");
    const [primarySocketFailed, setPrimarySocketFailed] = useState(false);
    const devTags = ["8b2a1345", "4bf41145", "00000000"];
    const [profileImageURL, setProfileImageURL] = useState(
        "https://cdn.bpskozep.hu/no_picture.png",
    );

    const {
        data: order,
        isLoading: orderloading,
        error: orderError,
    } = api.order.getOrCreateOrderByNfc.useQuery(nfcId, {
        staleTime: Infinity,
        gcTime: 0,
        enabled: !!nfcId,
    });
    const {
        data: user,
        isLoading: userLoading,
        error: userError,
    } = api.user.getUserByNfcId.useQuery(nfcId, {
        staleTime: Infinity,
        gcTime: 0,
        enabled: !!nfcId,
    });

    const [socketFailure, setSocketFailure] = useState<boolean>(false);

    useEffect(() => {
        const socket = io("http://127.0.0.1:27471", {
            auth: { passphrase: process.env.NEXT_PUBLIC_SOCKETIO_PASSPHRASE },
        });

        const handleSocketFailure = () => {
            if (primarySocketFailed) {
                setSocketFailure(true);
            } else {
                setPrimarySocketFailed(true);
                socket.close();
            }
        };

        if (!primarySocketFailed) {
            socket.on("disconnect", handleSocketFailure);
            socket.on("connect_error", handleSocketFailure);
            socket.on("tag", (uid: string) => {
                setNfcId(uid);
            });
        }

        return () => {
            socket.close();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const setCompleted = api.order.setCompleted.useMutation();

    const saveKiosk = api.kiosk.save.useMutation();
    const kioskCounts = api.kiosk.get.useQuery();

    const loading = orderloading || userLoading;
    const error = !loading && (orderError ?? userError ?? socketFailure);

    const isValidNfc = nfcId.length === 8;

    useEffect(() => {
        if (user?.email)
            setProfileImageURL(`https://cdn.bpskozep.hu/${user?.email}`);
    }, [user]);

    const orderCounts = useMemo(() => {
        if (!kioskCounts) return {};

        return Object.fromEntries(kioskCounts.data ?? []);
    }, [kioskCounts]);

    useEffect(() => {
        if (order && !order.orderError) {
            setCompleted.mutate({ nfcId });
            (async () => {
                await saveKiosk.mutateAsync(order.order);
                await kioskCounts.refetch();
            })().catch((error) => {
                console.error(error);
            });
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [order]);

    return (
        <PageWithHeader
            title="Kiosk"
            rightContent={
                primarySocketFailed ? (
                    <>
                        <div className="inline pr-3">
                            <IconButton
                                icon={<FaUser />}
                                className="cursor-pointer"
                                onClick={() => {
                                    setNfcId((prevId) => {
                                        const currentIndex =
                                            devTags.indexOf(prevId);
                                        const nextIndex =
                                            (currentIndex + 1) % devTags.length;
                                        return (
                                            devTags[nextIndex] ?? devTags[0]!
                                        );
                                    });
                                }}
                            />
                        </div>

                        <div className="inline-flex items-center">
                            <FaWrench />
                        </div>
                    </>
                ) : (
                    <div className="inline-flex items-center">
                        <FaCheck />
                    </div>
                )
            }
        >
            <OnlyRoles roles={["administrator", "lunch-system"]}>
                <div className="flex h-full w-full flex-col items-center justify-center text-center text-white">
                    {isValidNfc && loading && <Loading />}

                    {isValidNfc && error && (
                        <h1 className="text-5xl font-bold">Hiba történt.</h1>
                    )}
                    {isValidNfc &&
                        error &&
                        process.env.MONGODB_DATABASE === "dev-mybphs" && (
                            <h1 className="text-5xl font-bold">
                                Hiba történt. Hétvége?
                            </h1>
                        )}

                    {!isValidNfc && !socketFailure && (
                        <h1 className="text-5xl font-bold">
                            Várakozás token olvasására...
                        </h1>
                    )}
                    {socketFailure && (
                        <h1 className="text-5xl font-bold">Socket hiba.</h1>
                    )}
                    {isValidNfc && user && order && (
                        <div className="flex flex-col items-center justify-center gap-y-6">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={profileImageURL}
                                alt=""
                                className="m-10 aspect-square rounded-full object-cover object-[50%_20%]"
                                height={200}
                                width={200}
                                onError={() =>
                                    setProfileImageURL(
                                        "https://cdn.bpskozep.hu/no_picture.png",
                                    )
                                }
                            />

                            <h1 className="text-bold text-7xl">{user?.name}</h1>
                            <h2
                                className={`text-bold text-5xl ${
                                    order?.orderError && "bg-red-800"
                                }`}
                            >
                                {order?.order}
                            </h2>
                            <OrderCounts data={orderCounts} />
                        </div>
                    )}
                </div>
            </OnlyRoles>
        </PageWithHeader>
    );
}
