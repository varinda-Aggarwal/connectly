
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { X, Upload, Loader2, FileText } from "lucide-react";
import api from "../api/axios"; // apni Axios file ka sahi path/naam yahan likho

const MAX_SIZE = 2 * 1024 * 1024;

const STATUS_STYLE = {
  skipped: "bg-amber-100 text-amber-800",
  failed: "bg-red-100 text-red-800",
};

const downloadSample = () => {
  const csv =
    "Name,Email,Phone,Company,Designation,Tags,Notes\r\n" +
    "Asha Verma,asha@example.com,9876543210,Acme,Manager,client; vip,Met at expo\r\n";
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = "contacts-sample.csv";
  a.click();
  URL.revokeObjectURL(url);
};

export default function ImportDialog({ open, onClose }) {
  const queryClient = useQueryClient();
  const [file, setFile] = useState(null);
  const [force, setForce] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [report, setReport] = useState(null);

  const close = () => {
    setFile(null);
    setForce(false);
    setError("");
    setReport(null);
    onClose();
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && !loading && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (!open) return null;

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    setError("");
    setReport(null);
    if (!f) return setFile(null);
    if (!/\.csv$/i.test(f.name)) return setError("Please choose a .csv file");
    if (f.size > MAX_SIZE) return setError("File must be 2 MB or smaller");
    setFile(f);
  };

  const handleImport = async () => {
    if (!file) return;
    setLoading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("force", String(force));
      // Content-Type khud mat lagao, Axios boundary ke saath set karta hai
      const { data } = await api.post("/contacts/import", formData);
      setReport(data);
      // list, tags aur dashboard ke counts naye data se refresh hon
queryClient.invalidateQueries({ queryKey: ["contacts"] });
queryClient.invalidateQueries({ queryKey: ["contactStats"] });
queryClient.invalidateQueries({ queryKey: ["tags"] });
queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    } catch (err) {
      setError(err.response?.data?.message || "Import failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
      onClick={() => !loading && close()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Import contacts"
        className="max-h-[90vh] w-full overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl sm:max-w-2xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Import contacts</h2>
          <button type="button" onClick={close} disabled={loading} aria-label="Close" className="rounded p-1 text-gray-500 hover:bg-gray-100">
            <X size={20} />
          </button>
        </div>

        {!report && (
          <>
            <p className="mb-3 text-sm text-gray-600">
              Upload a .csv file (max 2 MB, 500 rows). Required column: <b>Name</b>. Optional: Email, Phone, Company,
              Designation, Tags, Notes.{" "}
              <button type="button" onClick={downloadSample} className="text- primary underline">
                Download sample
              </button>
            </p>

            <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-gray-300 p-6 text-center hover:bg-gray-50">
              <FileText size={28} className="text-gray-400" />
              <span className="text-sm text-gray-700">{file ? file.name : "Choose a CSV file"}</span>
              <input type="file" accept=".csv,text/csv" onChange={handleFile} className="hidden" />
            </label>

            <label className="mt-3 flex items-start gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={force} onChange={(e) => setForce(e.target.checked)} className="mt-0.5" />
              <span>
                Import possible duplicates too (same name only, or same phone only). Same email, or same name and phone,
                is always skipped.
              </span>
            </label>

            {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={close} disabled={loading} className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                Cancel
              </button>
              <button
                type="button"
                onClick={handleImport}
                disabled={!file || loading}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-50"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                {loading ? "Importing..." : "Import"}
              </button>
            </div>
          </>
        )}

        {report && (
          <>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-xl bg-green-50 p-3">
                <div className="text-2xl font-semibold text-green-700">{report.imported}</div>
                <div className="text-xs text-green-700">Imported</div>
              </div>
              <div className="rounded-xl bg-amber-50 p-3">
                <div className="text-2xl font-semibold text-amber-700">{report.skipped}</div>
                <div className="text-xs text-amber-700">Skipped</div>
              </div>
              <div className="rounded-xl bg-red-50 p-3">
                <div className="text-2xl font-semibold text-red-700">{report.failed}</div>
                <div className="text-xs text-red-700">Failed</div>
              </div>
            </div>

            {report.errors.length > 0 && (
              <div className="mt-4 max-h-64 overflow-auto rounded-lg border border-gray-200">
                <table className="w-full text-left text-sm">
                  <thead className="sticky top-0 bg-gray-50 text-xs uppercase text-gray-500">
                    <tr>
                      <th className="px-3 py-2">Row</th>
                      <th className="px-3 py-2">Name</th>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2">Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.errors.map((e) => (
                      <tr key={`${e.row}-${e.status}`} className="border-t border-gray-100 align-top">
                        <td className="px-3 py-2">{e.row}</td>
                        <td className="px-3 py-2">{e.name || "-"}</td>
                        <td className="px-3 py-2">
                          <span className={`rounded-full px-2 py-0.5 text-xs ${STATUS_STYLE[e.status]}`}>{e.status}</span>
                        </td>
                        <td className="px-3 py-2 text-gray-700">{e.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="mt-5 flex justify-end">
              <button type="button" onClick={close} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark">
                Done
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}