/**
 * Client-side CSV export utility.
 * Generates a CSV string and triggers browser download.
 */

function escapeCsvField(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function downloadCSV(
  filename: string,
  headers: string[],
  rows: Array<Array<string | number | boolean | null | undefined>>
) {
  const headerLine = headers.map(escapeCsvField).join(",");
  const bodyLines = rows.map((row) => row.map(escapeCsvField).join(","));
  const csv = "\uFEFF" + [headerLine, ...bodyLines].join("\n"); // BOM for Excel UTF-8

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
