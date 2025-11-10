"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { FaChevronDown, FaSearch } from "react-icons/fa";
import { api } from "@/trpc/react";

interface User {
  email: string;
  name: string;
  blocked?: boolean;
}

interface UserInputProps {
  onSelect?: (user: User) => void;
  showAllOption?: boolean;
}

export default function UserInput({
  onSelect,
  showAllOption = false,
}: UserInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(
    showAllOption ? { email: "all", name: "Összes felhasználó" } : null,
  );
  const userInputRef = useRef<HTMLDivElement>(null);

  const usersData = api.user.list.useQuery("all");

  const filteredUsers = (usersData.data ?? []).filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        userInputRef.current &&
        !userInputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen) {
      const searchInput = document.getElementById("user-search");
      searchInput?.focus();
    }
  }, [isOpen]);

  const handleSelectUser = (user: User) => {
    setSelectedUser({
      email: user.email,
      name: user.name,
      blocked: user.blocked,
    });
    setIsOpen(false);
    setSearchQuery("");
    if (onSelect) {
      onSelect({
        email: user.email,
        name: user.name,
        blocked: user.blocked,
      });
    }
  };

  return (
    <div ref={userInputRef} className="relative w-72">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between rounded-md bg-white px-3 py-2 text-sm font-bold text-black"
      >
        <span>
          {selectedUser ? selectedUser.name : "Válassz felhasználót..."}
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <FaChevronDown className="h-3 w-3" />
        </motion.div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 mt-1 w-full rounded-md bg-white py-1 shadow-lg"
          >
            <div className="relative px-3 pb-2">
              <FaSearch className="absolute top-3 left-5 h-3 w-3 text-neutral-400" />
              <input
                id="user-search"
                type="text"
                className="w-full rounded-md bg-white py-2 pr-3 pl-8 text-sm font-medium text-black focus:outline-hidden"
                placeholder="Felhasználók keresése..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <motion.ul
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="max-h-[300px] overflow-auto px-3"
            >
              {showAllOption && (
                <motion.li
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <button
                    type="button"
                    onClick={() =>
                      handleSelectUser({
                        email: "all",
                        name: "Összes felhasználó",
                      })
                    }
                    className="flex w-full items-center justify-between rounded-md px-3 py-2 text-sm text-black hover:bg-neutral-100"
                  >
                    <div className="flex flex-col items-start">
                      <span className="text-left font-extrabold">
                        Összes felhasználó
                      </span>
                    </div>
                  </button>
                </motion.li>
              )}
              {filteredUsers.map((user) => (
                <motion.li
                  key={user.email}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <button
                    type="button"
                    onClick={() => handleSelectUser(user)}
                    className="flex w-full items-center justify-between rounded-md px-3 py-2 text-sm text-black hover:bg-neutral-100"
                  >
                    <div className="flex flex-col items-start">
                      <span className="text-left font-extrabold break-all">
                        {user.name} {user.blocked && "🚫"}
                      </span>

                      <span className="text-left text-xs font-semibold break-all text-neutral-700">
                        {user.email}
                      </span>
                    </div>
                  </button>
                </motion.li>
              ))}
              {filteredUsers.length === 0 && (
                <motion.li
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="px-3 py-2 text-sm text-neutral-400"
                >
                  Nem található felhasználó.
                </motion.li>
              )}
            </motion.ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
