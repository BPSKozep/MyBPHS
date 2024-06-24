import BigLinkButton from "components/BigLinkButton";
import OnlyRolesComponent from "components/OnlyRolesComponent";
import Head from "next/head";
import { useTranslation } from "next-i18next";

export default function Home() {
    const { t } = useTranslation();
    return (
        <>
            <Head>
                <title>MyBPHS</title>
            </Head>
            <div className="flex h-full w-full items-center justify-center">
                <nav className="m-3 inline-grid grid-cols-1 grid-rows-4 gap-4 text-white sm:grid-cols-2 sm:grid-rows-2">
                    <BigLinkButton title={t("lunch")} url="/lunch" />
                    <BigLinkButton
                        title="Laptop jelszó"
                        url="/laptop-password"
                    />
                    <BigLinkButton title="Kreditek" url="/credits" disabled />
                    <BigLinkButton title="Órarend" url="/timetable" disabled />
                    <OnlyRolesComponent roles={["administrator"]}>
                        <BigLinkButton title="Admin" url="/admin" />
                    </OnlyRolesComponent>
                    <OnlyRolesComponent
                        roles={["lunch-system", "administrator"]}
                    >
                        <BigLinkButton title="Kiosk" url="/lunch/kiosk" />
                    </OnlyRolesComponent>
                </nav>
            </div>
        </>
    );
}
