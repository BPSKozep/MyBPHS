"use client";

import PageWithHeader from "components/PageWithHeader";
import React, { useEffect, useRef, useState } from "react";
import { useChat } from "ai/react";
import { FaPaperPlane } from "react-icons/fa";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Loading from "components/Loading";
import { motion } from "framer-motion";
import ChatLoading from "components/ChatLoading";

export default function Chat() {
    const {
        messages,
        input,
        handleInputChange,
        handleSubmit,
        isLoading,
        append,
    } = useChat({
        initialMessages: [
            {
                role: "user",
                content: "Szia!",
                id: "init",
            },
        ],
    });

    const [chatShown, setChatShown] = useState(false);
    const [chatAvailable, setChatAvailable] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setTimeout(() => {
            setChatShown(true);
        }, 3000);

        fetch("/api/chat/ping").then((response) => {
            if (response.status === 200) {
                setChatAvailable(true);
            }
        });
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    useEffect(() => {
        append({
            role: "assistant",
            content: "",
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <PageWithHeader
            title={
                <span>
                    <span className="hidden sm:inline">MyBPHS</span>{" "}
                    Intelligence ✨
                </span>
            }
        >
            <div className="flex h-full items-start justify-center">
                {!chatShown && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 1, delay: 1 }}
                        className="flex h-full w-full max-w-md flex-col content-center items-center justify-center"
                    >
                        <Loading />
                        <h2 className="mt-5 font-bold text-white">
                            Csatlakozás a szolgáltatáshoz...
                        </h2>
                    </motion.div>
                )}

                {!chatAvailable && chatShown && (
                    <div className="flex h-full w-full flex-col content-center items-center justify-center text-center text-xl font-bold text-white">
                        <p>A MyBPHS Intelligence</p>
                        <p>jelenleg nem elérhető.</p>
                    </div>
                )}
                {chatAvailable && chatShown && (
                    <div className="flex h-full w-full max-w-md flex-col">
                        <div className="flex-1 overflow-y-auto">
                            {messages.slice(2).map((message) => (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5 }}
                                    className={`flex ${
                                        message.role === "user"
                                            ? "justify-end"
                                            : "justify-start"
                                    }`}
                                    key={message.id}
                                >
                                    <div
                                        className={`space-pre-wrap prose prose-invert m-2 max-w-96 break-words rounded-lg text-white ${
                                            message.role === "user"
                                                ? "bg-slate-500 text-right"
                                                : "bg-slate-700 text-left"
                                        } p-3 text-white`}
                                    >
                                        <Markdown remarkPlugins={[remarkGfm]}>
                                            {message.content.trim()}
                                        </Markdown>
                                    </div>
                                </motion.div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>
                        {isLoading && (
                            <div className="m-2 flex justify-start">
                                <div className="rounded-lg bg-slate-700 p-3">
                                    <ChatLoading />
                                </div>
                            </div>
                        )}
                        <form
                            onSubmit={handleSubmit}
                            className="bottom-0 mx-auto mb-10 mt-4 flex h-10 w-full max-w-[90vw] overflow-auto rounded-lg bg-slate-300 shadow-lg"
                        >
                            <input
                                className="h-full w-full bg-slate-300 p-2 text-black placeholder-gray-700"
                                value={input}
                                placeholder="Üzenet"
                                onChange={handleInputChange}
                            />
                            <button
                                className="flex w-10 items-center justify-center bg-[#565e85] text-gray-200 disabled:opacity-50"
                                disabled={isLoading}
                            >
                                <FaPaperPlane />
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </PageWithHeader>
    );
}
