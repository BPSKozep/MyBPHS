import { faFloppyDisk } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Card from "components/Card";
import IconSubmitButton from "components/IconSubmitButton";
import OnlyRoles from "components/OnlyRoles";
import PageWithHeader from "components/PageWithHeader";
import React, { useState } from "react";
import { trpc } from "utils/trpc";

function Users() {
    const [names, setNames] = useState<string[]>([]);
    const [emails, setEmails] = useState<string[]>([]);
    const [roles, setRoles] = useState<string[]>([]);
    const [nfcIds, setNfcIds] = useState<string[]>([]);

    const { mutateAsync: createMany } = trpc.user.createMany.useMutation();

    return (
        <OnlyRoles roles={["administrator"]}>
            <PageWithHeader title="Admin / Felhasználók" homeLocation="/admin">
                <div className="flex flex-col justify-center text-white md:flex-row">
                    <Card>
                        <div className="flex flex-col items-center">
                            <h2 className="text-lg font-bold">
                                Felhasználók létrehozása
                            </h2>
                            <p className="mt-3">Nevek</p>
                            <textarea
                                value={names.join("\n")}
                                onChange={(e) =>
                                    setNames(e.target.value.split("\n"))
                                }
                                className="h-60 w-96 resize-none rounded-md p-2 text-black"
                                placeholder={"Kovács Júdás\nBakos Gergely"}
                            ></textarea>
                            <p className="mt-3">Email címek</p>
                            <textarea
                                value={emails.join("\n")}
                                onChange={(e) =>
                                    setEmails(e.target.value.split("\n"))
                                }
                                className="h-60 w-96 resize-none rounded-md p-2 text-black"
                                placeholder={
                                    "kovacs.judas@budapest.school\ngergely.bakos@budapest.school"
                                }
                            ></textarea>
                            <p className="mt-3">NFCk</p>
                            <textarea
                                value={nfcIds.join("\n")}
                                onChange={(e) =>
                                    setNfcIds(e.target.value.split("\n"))
                                }
                                className="h-60 w-96 resize-none rounded-md p-2 text-black"
                                placeholder={"f72aeb82\n92fba9c8"}
                            ></textarea>
                            <p className="mt-3">Szerepkör</p>
                            <textarea
                                value={roles.join("\n")}
                                onChange={(e) =>
                                    setRoles(e.target.value.split("\n"))
                                }
                                className="h-32 w-96 resize-none rounded-md p-2 text-black"
                                placeholder={"student"}
                            ></textarea>
                            <div className="mt-3">
                                <IconSubmitButton
                                    icon={
                                        <FontAwesomeIcon icon={faFloppyDisk} />
                                    }
                                    onClick={async () => {
                                        try {
                                            console.log(
                                                new Array(emails.length).fill(
                                                    roles
                                                )
                                            );

                                            await createMany({
                                                emails: emails,
                                                names,
                                                roles: new Array(
                                                    emails.length
                                                ).fill(roles),
                                                nfcIds,
                                            });

                                            return true;
                                        } catch (err) {
                                            return false;
                                        }
                                    }}
                                />
                            </div>
                        </div>
                    </Card>
                </div>
            </PageWithHeader>
        </OnlyRoles>
    );
}

export default Users;
