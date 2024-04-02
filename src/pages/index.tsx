import BigLinkButton from "components/BigLinkButton";
import OnlyRoles from "components/OnlyRoles";

export default function Home() {
    return (
        <>
            <div className="flex h-full w-full items-center justify-center">
                <div className="m-3 inline-grid grid-cols-1 grid-rows-4 gap-4 text-white sm:grid-cols-2 sm:grid-rows-2">
                    <BigLinkButton title="Ebédrendelés" url="/lunch" />
                    <BigLinkButton title="Kreditek" url="/credits" disabled />
                    <BigLinkButton title="Órarend" url="/timetable" disabled />
                    <OnlyRoles roles={["administrator"]}>
                        <BigLinkButton title="Admin" url="/admin" />
                    </OnlyRoles>
                </div>
            </div>
        </>
    );
}
