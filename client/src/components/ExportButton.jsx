
import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import api from "../api/axios"; // apni Axios file ka sahi path/naam yahan likho

const getFilename = (header) => {
  const match = /filename="?([^";]+)"?/i.exec(header || "");
  return match ? match[1] : "contacts.csv";
};

// params: { search, tag, favourite, recent } - wahi filters jo list mein lage hain
export default function ExportButton({ params = {} }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleExport = async () => {
    setLoading(true);
    setError("");
    try {
      const cleanParams = Object.fromEntries(
        Object.entries(params).filter(([, v]) => v !== "" && v !== false && v != null)
      );
      const res = await api.get("/contacts/export", {
        params: cleanParams,
        responseType: "blob", // normal link token nahi bhejta, isliye Axios se blob
      });

      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = getFilename(res.headers["content-disposition"]);
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      setError("Export failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        type="button"
        onClick={handleExport}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
        Export
      </button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}