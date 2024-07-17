"use client";

import React, { useEffect, useMemo, useState } from "react";
import { trpc } from "utils/trpc";
import OrderCounts from "components/OrderCounts";
import { io } from "socket.io-client";
import Loading from "components/Loading";

function KioskComponent() {
    const [nfcId, setNfcId] = useState("");
    const [profileImageURL, setProfileImageURL] = useState(
        "https://cdn.bpskozep.hu/no_picture.png"
    );

    const {
        data: order,
        isLoading: orderloading,
        error: orderError,
    } = trpc.order.getOrCreateOrderByNfc.useQuery(nfcId, {
        staleTime: Infinity,
        cacheTime: 0,
    });
    const {
        data: user,
        isLoading: userLoading,
        error: userError,
    } = trpc.user.getUserByNfcId.useQuery(nfcId, {
        staleTime: Infinity,
        cacheTime: 0,
    });

    const [socketFailure, setSocketFailure] = useState<boolean>(false);

    useEffect(() => {
        const socket = io("http://127.0.0.1:27471", {
            auth: { passphrase: process.env.NEXT_PUBLIC_SOCKETIO_PASSPHRASE },
        });

        socket.on("disconnect", () => {
            setSocketFailure(true);
            socket.close();
        });

        socket.on("connect_error", () => {
            setSocketFailure(true);
            socket.close();
        });

        socket.on("tag", (uid: string) => {
            setNfcId(uid);
        });

        return () => {
            socket.close();
        };
    }, []);

    const { mutate: setCompleted } = trpc.order.setCompleted.useMutation();

    const { mutateAsync: saveKiosk } = trpc.kiosk.save.useMutation();
    const { data: kioskCounts, refetch: kioskCountsRefetch } =
        trpc.kiosk.get.useQuery();

    const loading = orderloading || userLoading;
    const error = !loading && (orderError || userError || socketFailure);

    const isValidNfc = nfcId.length === 8;

    useEffect(() => {
        if (user?.email)
            setProfileImageURL(`https://cdn.bpskozep.hu/${user?.email}`);
    }, [user]);

    const orderCounts = useMemo(() => {
        if (!kioskCounts) return {};

        return Object.fromEntries(kioskCounts);
    }, [kioskCounts]);

    useEffect(() => {
        if (order && !order.orderError) {
            setCompleted({ nfcId });
            (async () => {
                await saveKiosk(order.order);
                kioskCountsRefetch();
            })();
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [order]);

    return (
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
                                "https://cdn.bpskozep.hu/no_picture.png"
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
    );
}

export default KioskComponent;
