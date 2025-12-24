import React from "react";

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-12 border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
        <div>
          © {year} Megabike Fantasy · Season {year}
        </div>
        <div className="flex gap-4">
          <span className="text-slate-400"> Website by <a className="underline" href="https://www.instagram.com/charles.vanz/">Charles van Zeebroeck</a></span>
        </div>
      </div>
    </footer>
  );
}


