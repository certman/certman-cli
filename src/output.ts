export interface TableColumn {
  key: string;
  header: string;
  width?: number;
}

export function formatTable<T extends Record<string, unknown>>(
  data: T[],
  columns: TableColumn[]
): string {
  if (data.length === 0) {
    return "No results found.";
  }

  // Calculate column widths
  const widths = columns.map((col) => {
    const headerWidth = col.header.length;
    const maxDataWidth = Math.max(
      ...data.map((row) => String(row[col.key] ?? "").length)
    );
    return col.width ?? Math.max(headerWidth, maxDataWidth);
  });

  // Build header row
  const header = columns
    .map((col, i) => col.header.padEnd(widths[i]))
    .join("  ");

  // Build separator
  const separator = widths.map((w) => "-".repeat(w)).join("  ");

  // Build data rows
  const rows = data.map((row) =>
    columns
      .map((col, i) => String(row[col.key] ?? "").padEnd(widths[i]))
      .join("  ")
  );

  return [header, separator, ...rows].join("\n");
}

export function formatJson(data: unknown): string {
  return JSON.stringify(data, null, 2);
}

export function output(data: unknown, options: { json?: boolean }): void {
  if (options.json) {
    console.log(formatJson(data));
  } else if (Array.isArray(data)) {
    // Try to format as table if it's an array of objects
    if (data.length > 0 && typeof data[0] === "object" && data[0] !== null) {
      const keys = Object.keys(data[0]);
      const columns: TableColumn[] = keys.map((key) => ({
        key,
        header: key.toUpperCase(),
      }));
      console.log(formatTable(data as Record<string, unknown>[], columns));
    } else {
      console.log(data.join("\n"));
    }
  } else if (typeof data === "object" && data !== null) {
    // Format object as key-value pairs
    const entries = Object.entries(data as Record<string, unknown>);
    const maxKeyLength = Math.max(...entries.map(([k]) => k.length));
    for (const [key, value] of entries) {
      console.log(`${key.padEnd(maxKeyLength)}  ${value}`);
    }
  } else {
    console.log(data);
  }
}
