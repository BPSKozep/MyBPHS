"use client";

import OnlyRoles from "components/OnlyRoles";
import PageWithHeader from "components/PageWithHeader";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import { trpc } from "utils/trpc";
import OrderCounts from "components/OrderCounts";
import { io } from "socket.io-client";
import Loading from "components/Loading";

function Kiosk() {
    const [nfcId, setNfcId] = useState("");
    const [profileImageURL, setProfileImageURL] = useState(
        "https://cdn.bpskozep.hu/no_picture.png"
    );
    const [orderCounts, setOrderCounts] = useState<Record<string, number>>({});

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

    const loading = orderloading || userLoading;
    const error = !loading && (orderError || userError || socketFailure);

    const isValidNfc = nfcId.length === 8;

    useEffect(() => {
        if (user?.email)
            setProfileImageURL(`https://cdn.bpskozep.hu/${user?.email}`);
    }, [user]);

    useEffect(() => {
        if (order && !order.orderError) {
            setCompleted({ nfcId });
            setOrderCounts((prevOrderCounts) => {
                const newOrderCounts = { ...prevOrderCounts };

                if (!newOrderCounts[order.order])
                    newOrderCounts[order.order] = 0;

                newOrderCounts[order.order] += 1;

                return newOrderCounts;
            });
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [order]);

    return (
        <PageWithHeader title="Kiosk">
            <OnlyRoles roles={["administrator", "lunch-system"]}>
                <div className="flex h-full w-full flex-col items-center justify-center text-center text-white">
                    {isValidNfc && loading && <Loading />}
                    {isValidNfc && error && (
                        <h1 className="text-5xl font-bold">Hiba történt.</h1>
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
                            <Image
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
            </OnlyRoles>
        </PageWithHeader>
    );
}

export default Kiosk;
