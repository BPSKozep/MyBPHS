import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "MyBPHS",
  description:
    "App a BPS JPP tagjainak: ebédrendelés, iskolai jelszó és egyéb szolgáltatások.",
  openGraph: {
    title: "MyBPHS",
    description:
      "App a BPS JPP tagjainak: ebédrendelés, iskolai jelszó és egyéb szolgáltatások.",
    url: "https://my.bphs.hu/public",
  },
};

export default function PublicPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-12 text-center">
      <p className="mb-8 max-w-lg text-lg text-gray-300">
        App a BPS JPP tagjainak: ebédrendelés, iskolai jelszó és egyéb
        szolgáltatások.
      </p>
      <Link
        href="/auth/signin"
        className="rounded-lg bg-gray-700 px-6 py-3 font-medium text-white transition-colors hover:bg-gray-600"
      >
        Bejelentkezés
      </Link>
    </div>
  );
}
