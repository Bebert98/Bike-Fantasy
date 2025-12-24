import React from "react";
import { NavLink } from "react-router-dom";

const navLinkBase =
    "px-3 py-2 rounded-md text-sm font-medium transition-colors";

export default function Navbar() {
    return (
        <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
                <NavLink to="/" className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-slate-900" />
                    <div className="leading-tight">
                        <div className="text-sm font-semibold text-slate-900">
                            Megabike Fantasy
                        </div>
                        <div className="text-xs text-slate-500">Cycling • simplified</div>
                    </div>
                </NavLink>

                <nav className="flex items-center gap-2">
                    <NavLink
                        to="/"
                        end
                        className={({ isActive }) =>
                            `${navLinkBase} ${isActive
                                ? "bg-slate-900 text-white"
                                : "text-slate-700 hover:bg-slate-100"
                            }`
                        }
                    >
                        Home
                    </NavLink>
                    <NavLink
                        to="/my-team"
                        className={({ isActive }) =>
                            `${navLinkBase} ${isActive
                                ? "bg-slate-900 text-white"
                                : "text-slate-700 hover:bg-slate-100"
                            }`
                        }
                    >
                        My Team
                    </NavLink>
                    <NavLink
                        to="/history"
                        className={({ isActive }) =>
                            `${navLinkBase} ${isActive
                                ? "bg-slate-900 text-white"
                                : "text-slate-700 hover:bg-slate-100"
                            }`
                        }
                    >
                        History
                    </NavLink>
                    <NavLink
                        to="/leaderboard"
                        className={({ isActive }) =>
                            `${navLinkBase} ${isActive
                                ? "bg-slate-900 text-white"
                                : "text-slate-700 hover:bg-slate-100"
                            }`
                        }
                    >
                        Leaderboard
                    </NavLink>
                    <NavLink
                        to="/profile"
                        className={({ isActive }) =>
                            `${navLinkBase} ${isActive
                                ? "bg-slate-900 text-white"
                                : "text-slate-700 hover:bg-slate-100"
                            }`
                        }
                    >
                        Profile
                    </NavLink>
                </nav>
            </div>
        </header>
    );
}


