import BigLinkButton from "components/BigLinkButton";
import breakpoints from "utils/breakpoints";

export default function Home() {
    console.log(breakpoints);

    return (
        <>
            <div className="flex h-full w-full items-center justify-center">
                <div className="m-3 inline-grid grid-cols-1 grid-rows-4 gap-4 text-white sm:grid-cols-2 sm:grid-rows-2">
                    <BigLinkButton title="Kreditek" url="/credits" disabled />
                    <BigLinkButton title="Órarend" url="/timetable" disabled />
                    <BigLinkButton title="Ebédrendelés" url="/lunch" disabled />
                    <BigLinkButton title="Coming Soon™" url="/" disabled />
                </div>
            </div>
        </>
    );
}
