import BigLinkButton from "@/components/BigLinkButton";
import OnlyRolesComponent from "@/components/OnlyRolesComponent";

export default function Home() {
    return (
        <>
            <div className="flex h-full w-full items-center justify-center">
                <nav className="m-3 inline-grid grid-cols-1 grid-rows-4 gap-4 text-white sm:grid-cols-2 sm:grid-rows-2">
                    <BigLinkButton title="Ebédrendelés" url="/lunch" />
                    <BigLinkButton
                        title="Laptop jelszó"
                        url="/laptop-password"
                    />
                    <BigLinkButton title="Órarend" url="/timetable" disabled />
                    <BigLinkButton title="Chat ✨" url="/chat" />
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
