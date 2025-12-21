import React from "react";
import { autocompleteRiders } from "../services/api";
import { debugLog } from "../services/debug";

export default function RiderPicker({ value, onChange, disabled }) {
  const [query, setQuery] = React.useState(value?.rider_name ?? "");
  const [options, setOptions] = React.useState([]);
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    setQuery(value?.rider_name ?? "");
  }, [value?.rider_name]);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      const q = query.trim();
      if (q.length < 2) {
        setOptions([]);
        return;
      }
      try {
        const res = await autocompleteRiders(q);
        if (!mounted) return;
        setOptions(Array.isArray(res) ? res : []);
      } catch (e) {
        debugLog("RiderPicker autocomplete error", e?.message ?? e);
        if (mounted) setOptions([]);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [query]);

  return (
    <div className="relative">
      <input
        disabled={disabled}
        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none disabled:bg-slate-100"
        placeholder="Start typing a rider name…"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          // Give click events a chance to fire
          setTimeout(() => setOpen(false), 120);
        }}
      />

      {open && options.length > 0 ? (
        <div className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-md border border-slate-200 bg-white shadow">
          {options.map((r, idx) => {
            const price = r.price ?? r.points ?? 0;
            return (
              <button
                type="button"
                key={`${r.rider_name}-${idx}`}
                className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-slate-50"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onChange?.(r);
                  debugLog("Rider selected", r);
                  setOpen(false);
                }}
              >
                <span className="text-slate-900">{r.rider_name}</span>
                <span className="text-slate-500">{price} cost</span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}


