"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import OnlyBlocked from "@/components/auth/OnlyBlocked";
import Loading from "@/components/Loading";
import PageWithHeader from "@/components/PageWithHeader";
import { api } from "@/trpc/react";

export default function Pay() {
  const [loading, setLoading] = useState(false);
  const createPayment = api.payments.create.useMutation();
  const router = useRouter();

  return (
    <PageWithHeader title="Elveszett token">
      <OnlyBlocked>
        <div className="flex h-full w-full flex-col items-center justify-center align-middle">
          {!loading && (
            <div className="flex flex-col items-center text-white">
              <h1 className="m-3 text-xl font-bold">Fiók letiltva</h1>
              <div className="max-w-96 text-center">
                <p className="mb-2 text-lg">
                  Az ebédrendelés csak érvényes NFC tokennel érhető el, ezért a
                  fiókod tiltásra került.
                </p>
                <p className="mb-2 text-lg">
                  Az elveszett token cseréjének díja <strong>2000 Ft</strong>,
                  amit itt bankkártyával, vagy személyesen készpénzzel lehet
                  kifizetni. A kártyás fizetés után a tiltás automatikusan
                  feloldásra kerül.
                </p>
                <p className="mb-2 text-lg">
                  Ha van tokened, a tiltás automatikusan feloldásra kerül
                  legközelebb, amikor az NFC olvasóhoz érinted, vagy írj emailt
                  a{" "}
                  <a
                    href="mailto:support@bphs.hu"
                    className="font-bold text-blue-500"
                  >
                    support@bphs.hu
                  </a>{" "}
                  email címre.
                </p>
              </div>
              <button
                type="button"
                className="mt-5 rounded-lg bg-blue-500 p-5 text-lg transition-all hover:scale-105"
                onClick={async () => {
                  setLoading(true);

                  try {
                    const url = await createPayment.mutateAsync();
                    router.push(url);
                  } catch (error) {
                    console.error(error);
                    setLoading(false);
                  }
                }}
              >
                Fizetés bankkártyával
              </button>
            </div>
          )}
          {loading && <Loading />}
        </div>
      </OnlyBlocked>
    </PageWithHeader>
  );
}
