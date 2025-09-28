import BigLinkButton from "@/components/BigLinkButton";
import OnlyRolesComponent from "@/components/auth/OnlyRolesComponent";

export default function Home() {
    return (
        <>
            <div className="flex h-full w-full items-center justify-center">
                <nav className="m-3 inline-grid grid-cols-1 grid-rows-4 gap-4 text-white sm:grid-cols-2 sm:grid-rows-2">
                    <BigLinkButton title="Ebédrendelés" url="/lunch" />
                    <BigLinkButton
                        title="Iskolai jelszó"
                        url="/school-password"
                        // statuswebsites={["/api/laptop/ping"]}
                    />
                    <BigLinkButton title="Órarend" url="/timetable" disabled />
                    <BigLinkButton
                        title="Chat ✨"
                        url="/chat"
                        disabled
                        // statuswebsites={["/api/chat/ping"]}
                    />
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
