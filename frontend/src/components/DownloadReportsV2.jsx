import React, { useState } from "react";
import { API_URL } from "config";

// Ícone de Download
const DownloadIcon = (props) => (
  <svg width={20} height={20} viewBox="0 0 24 24" stroke="currentColor" fill="none" {...props}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" strokeWidth="2" />
    <polyline points="7 10 12 15 17 10" strokeWidth="2" />
    <line x1="12" y1="15" x2="12" y2="3" strokeWidth="2" />
  </svg>
);

export default function DownloadReport({
  cols,
  filter = {},
  sort = [
    { column: "dts", direction: "DESC" },
    { column: "num", direction: "ASC" }
  ],
  filename = "picagens-export.xlsx",
  apiUrl = `${API_URL}/rponto/excel/`,
  pagination = {},
  label = "Exportar Excel",
  className = "",
  buttonClass = ""
}) {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filter,
          sort,
          pagination,
          parameters: {
            export: "excel",
            cols
          }
        })
      });

      if (!response.ok) throw new Error("Erro ao exportar ficheiro");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert("Falha ao exportar ficheiro.");
    }
    setLoading(false);
  };

  return (
    <button
      type="button"
      className={
        "flex items-center gap-2 px-4 py-2 rounded-xl bg-green-600 text-white font-bold text-sm shadow hover:bg-green-700 transition " +
        buttonClass
      }
      disabled={loading}
      onClick={handleDownload}
    >
      <DownloadIcon className="w-5 h-5" />
      <span>
        {loading ? "A exportar..." : label}
      </span>
    </button>
  );
}