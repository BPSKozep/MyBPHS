"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FaCheck, FaUser, FaWrench } from "react-icons/fa";
import { io } from "socket.io-client";
import KioskOrderCounts from "@/components/admin/KioskOrderCounts";
import OnlyRoles from "@/components/auth/OnlyRoles";
import IconButton from "@/components/IconButton";
import Loading from "@/components/Loading";
import PageWithHeader from "@/components/PageWithHeader";
import { api } from "@/trpc/react";
import { useKioskErrorLogger } from "@/utils/useKioskErrorLogger";

const DEFAULT_PROFILE_IMAGE = "https://cdn.bphs.hu/no_picture.png";

export default function KioskPage() {
  const [nfcId, setNfcId] = useState("");
  const [primarySocketFailed, setPrimarySocketFailed] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const devTags = ["8b2a1345", "4bf41145", "00000000"];
  const [profileImageURL, setProfileImageURL] = useState(DEFAULT_PROFILE_IMAGE);

  const { logError } = useKioskErrorLogger();

  const loggedErrors = useRef(new Set<string>());

  const logErrorOnce = useCallback(
    async (errorDetails: Parameters<typeof logError>[0], errorKey: string) => {
      if (!loggedErrors.current.has(errorKey)) {
        loggedErrors.current.add(errorKey);
        await logError(errorDetails).catch(console.error);
      }
    },
    [logError],
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

  // biome-ignore lint/correctness/useExhaustiveDependencies: socket connection todo review deps
  useEffect(() => {
    const socket = io("http://127.0.0.1:27471", {
      auth: { passphrase: process.env.NEXT_PUBLIC_SOCKETIO_PASSPHRASE },
    });

    const handleSocketFailure = async (reason?: string) => {
      if (primarySocketFailed) {
        setSocketFailure(true);
        // Log critical socket failure only once
        await logErrorOnce(
          {
            error: `Socket kapcsolódás sikertelen. Ok: ${reason ?? "Ismeretlen"}`,
            errorType: "socket_connection",
            context: {
              nfcId,
              socketStatus: {
                socketFailure: true,
                socketConnected: false,
              },
              componentState: {
                isValidNfc: nfcId.length === 8,
                loading: orderloading ?? userLoading,
                profileImageURL,
              },
            },
          },
          `socket_critical_failure_${reason ?? "unknown"}`,
        );
      } else {
        setPrimarySocketFailed(true);
        setSocketConnected(false);
        socket.close();
      }
    };

    if (!primarySocketFailed) {
      socket.on("connect", () => {
        setSocketConnected(true);
      });

      socket.on("disconnect", (reason) => {
        setSocketConnected(false);
        handleSocketFailure(reason).catch(console.error);
      });

      socket.on("connect_error", (error) => {
        setSocketConnected(false);
        handleSocketFailure(error?.message ?? "Connection error").catch(
          console.error,
        );
      });

      socket.on("tag", (uid: string) => {
        setNfcId(uid);
      });
    }

    return () => {
      setSocketConnected(false);
      socket.close();
    };
  }, []);

  const setCompleted = api.order.setCompleted.useMutation();

  const saveKiosk = api.kiosk.save.useMutation();
  const kioskCounts = api.kiosk.get.useQuery();

  const loading = orderloading ?? userLoading;
  const error = !loading && (orderError ?? userError ?? socketFailure);

  const isValidNfc = nfcId.length === 8;

  // Reset logged errors when NFC token changes
  useEffect(() => {
    if (nfcId) {
      loggedErrors.current.clear();
    }
  }, [nfcId]);

  // Log TRPC query errors
  useEffect(() => {
    if (orderError && nfcId) {
      logErrorOnce(
        {
          error: orderError,
          errorType: "order_lookup_error",
          context: {
            nfcId,
            user,
            socketStatus: {
              socketFailure,
              socketConnected,
            },
            componentState: {
              isValidNfc,
              loading,
              profileImageURL,
            },
          },
        },
        `order_error_${nfcId}_${orderError.message ?? "unknown"}`,
      ).catch(console.error);
    }
  }, [
    orderError,
    nfcId,
    logErrorOnce,
    user,
    socketFailure,
    socketConnected,
    isValidNfc,
    loading,
    profileImageURL,
  ]);

  useEffect(() => {
    if (userError && nfcId) {
      logErrorOnce(
        {
          error: userError,
          errorType: "user_lookup_error",
          context: {
            nfcId,
            order,
            socketStatus: {
              socketFailure,
              socketConnected,
            },
            componentState: {
              isValidNfc,
              loading,
              profileImageURL,
            },
          },
        },
        `user_error_${nfcId}_${userError.message ?? "unknown"}`,
      ).catch(console.error);
    }
  }, [
    userError,
    nfcId,
    logErrorOnce,
    order,
    socketFailure,
    socketConnected,
    isValidNfc,
    loading,
    profileImageURL,
  ]);

  // Fetch profile picture from S3 when user is loaded
  const { data: profilePictureData } = api.profilePicture.getUrl.useQuery(
    { email: user?.email ?? undefined },
    {
      enabled: !!user?.email,
      staleTime: Infinity,
      gcTime: 0,
    },
  );

  // Update profile image URL when data changes
  useEffect(() => {
    if (profilePictureData?.exists && profilePictureData.url) {
      setProfileImageURL(profilePictureData.url);
    } else {
      setProfileImageURL(DEFAULT_PROFILE_IMAGE);
    }
  }, [profilePictureData]);

  const orderCounts = useMemo(() => {
    if (!kioskCounts) return {};

    return Object.fromEntries(kioskCounts.data ?? []);
  }, [kioskCounts]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: order completion todo review deps
  useEffect(() => {
    if (order && !order.orderError) {
      // Mark order as completed
      setCompleted.mutate(
        { nfcId },
        {
          onError: (error) => {
            logErrorOnce(
              {
                error,
                errorType: "order_completion_error",
                context: {
                  nfcId,
                  user,
                  order,
                  socketStatus: {
                    socketFailure,
                    socketConnected,
                  },
                  componentState: {
                    isValidNfc,
                    loading,
                    profileImageURL,
                  },
                },
              },
              `order_completion_error_${nfcId}_${error.message ?? "unknown"}`,
            ).catch(console.error);
          },
        },
      );

      // Save kiosk data and refresh counts
      void (async () => {
        try {
          await saveKiosk.mutateAsync(order.order);
          await kioskCounts.refetch();
        } catch (error) {
          await logErrorOnce(
            {
              error,
              errorType: "kiosk_save_error",
              context: {
                nfcId,
                user,
                order,
                socketStatus: {
                  socketFailure,
                  socketConnected,
                },
                componentState: {
                  isValidNfc,
                  loading,
                  profileImageURL,
                },
              },
            },
            `kiosk_save_error_${nfcId}_${(error as Error)?.message ?? "unknown"}`,
          );
        }
      })();
    }
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
                  setNfcId((prevId: string) => {
                    if (!prevId) return devTags[0] ?? "";
                    const currentIndex = devTags.indexOf(prevId);
                    const nextIndex = (currentIndex + 1) % devTags.length;
                    return devTags[nextIndex] ?? devTags[0] ?? "";
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
              <h1 className="text-5xl font-bold">Hiba történt. Hétvége?</h1>
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
              {/** biome-ignore lint/performance/noImgElement: no img */}
              <img
                src={profileImageURL}
                alt=""
                className="m-10 aspect-square rounded-full object-cover object-[50%_20%]"
                height={200}
                width={200}
                onError={() => {
                  if (profileImageURL !== DEFAULT_PROFILE_IMAGE) {
                    setProfileImageURL(DEFAULT_PROFILE_IMAGE);
                  }
                }}
              />

              <h1 className="text-bold text-7xl">{user?.name}</h1>
              <h2
                className={`text-bold text-5xl ${
                  order?.orderError && "bg-red-800"
                }`}
              >
                {order?.order}
              </h2>
              <KioskOrderCounts data={orderCounts} />
            </div>
          )}
        </div>
      </OnlyRoles>
    </PageWithHeader>
  );
}
