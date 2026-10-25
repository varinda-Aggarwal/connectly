import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export default function AuthInput({ label, icon: Icon, type = "text", error, registerProps, ...rest }) {
  const [show, setShow] = useState(false);
  const isPassword = type === "password";

  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-ink">{label}</label>
      <div
        className={`flex items-center gap-3 rounded-xl border bg-white/70 px-3.5 py-2.5 transition focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 ${
          error ? "border-red-400" : "border-line"
        }`}
      >
        <Icon size={18} className="text-muted" />
        <input
          type={isPassword && show ? "text" : type}
          className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-muted/70"
          {...registerProps}
          {...rest}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow(!show)}
            className="text-muted hover:text-ink"
            aria-label="Toggle password visibility"
          >
            {show ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}