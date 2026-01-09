import React, { useState } from "react";
import { API_URL } from "config";
import dayjs from "dayjs";
import { DATETIME_FORMAT } from "config";

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
      // Prepare filter with default wide date range if fdata is missing, and map to backend expected keys
      const exportFilter = { ...filter };
      if (!exportFilter.fdata) {
        exportFilter.fdata = {
          ">=": dayjs().subtract(10, 'years').startOf('day').format(DATETIME_FORMAT),
          "<=": dayjs().add(1, 'years').endOf('day').format(DATETIME_FORMAT)
        };
      }
      
      // Extract start and end dates from fdata (handles object or array formats)
      let startDate, endDate;
      if (typeof exportFilter.fdata === 'object' && !Array.isArray(exportFilter.fdata)) {
        // Object format: { ">=": ..., "<=": ... } or { formatted: { startValue, endValue } }
        startDate = exportFilter.fdata[">="] || exportFilter.fdata.formatted?.startValue;
        endDate = exportFilter.fdata["<="] || exportFilter.fdata.formatted?.endValue;
      } else if (Array.isArray(exportFilter.fdata)) {
        // Array format: [start, end]
        startDate = exportFilter.fdata[0];
        endDate = exportFilter.fdata[1];
      }
      
      // Fallback if not found
      if (!startDate || !endDate) {
        startDate = dayjs().subtract(10, 'years').startOf('day').format(DATETIME_FORMAT);
        endDate = dayjs().add(1, 'years').endOf('day').format(DATETIME_FORMAT);
      }
      
      // Map to backend expected keys
      const finalFilter = {
        fdateFrom: startDate,
        fdateTo: endDate,
        fnum: exportFilter.fnum || exportFilter.num || ''  // Handle both fnum and num
      };

      console.log("Final filter for export:", finalFilter); // Debug log

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filter: finalFilter,
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