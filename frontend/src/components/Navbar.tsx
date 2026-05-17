"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { motion } from "framer-motion";
import { CrosshairIcon } from "./Icons";

const navLinks = [
  { href: "/lobby", label: "Lobby" },
  { href: "/profile", label: "Profile" },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="sticky top-4 z-40 mx-4 mb-4 rounded-2xl border border-surface-800/60 bg-surface-950/70 backdrop-blur-2xl sm:mx-6"
    >
      <div className="mx-auto flex h-14 items-center justify-between px-4 sm:px-5">
        <Link href="/" className="group flex items-center gap-2">
          <motion.div
            whileHover={{ rotate: 180, scale: 1.1 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-700/20"
          >
            <CrosshairIcon className="h-4 w-4 text-primary-400" />
          </motion.div>
          <span className="font-display text-lg font-bold tracking-tight text-white">
            PMBR
          </span>
        </Link>

        <div className="flex items-center gap-1 sm:gap-3">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "text-white"
                    : "text-surface-400 hover:text-surface-200"
                }`}
              >
                {link.label}
                {isActive && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute inset-0 rounded-lg bg-primary-700/20"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                  />
                )}
              </Link>
            );
          })}
          <div className="ml-1">
            <ConnectButton
              accountStatus={{
                smallScreen: "avatar",
                largeScreen: "full",
              }}
              showBalance={{ smallScreen: false, largeScreen: true }}
            />
          </div>
        </div>
      </div>
    </motion.nav>
  );
}
