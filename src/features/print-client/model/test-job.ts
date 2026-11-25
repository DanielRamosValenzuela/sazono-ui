import type { PrinterTarget, PrintJob } from "../transports/types";

const SAMPLE = "aeiou ñ Ñ ¿? ¡! áéíóú ü";
const CP858: Record<string, number> = {
  á: 0xa0,
  é: 0x82,
  í: 0xa1,
  ó: 0xa2,
  ú: 0xa3,
  ñ: 0xa4,
  Ñ: 0xa5,
  "¿": 0xa8,
  "¡": 0xad,
  ü: 0x81,
};

function encode(text: string): number[] {
  return [...text].map((char) => {
    const mapped = CP858[char];

    if (mapped !== undefined) {
      return mapped;
    }
    const code = char.charCodeAt(0);

    return code < 0x80 ? code : 0x3f;
  });
}

function toBase64(bytes: number[]): string {
  return btoa(String.fromCharCode(...bytes));
}

function ruler(columns: number): string {
  return Array.from({ length: columns }, (_, index) =>
    index % 10 === 9 ? String(((index + 1) / 10) % 10) : "-",
  ).join("");
}

export function buildTestJob(printer: PrinterTarget, title: string): PrintJob {
  const columns = printer.columns;
  const lines = [title, ruler(columns), SAMPLE, ruler(columns)];
  const html = [
    '<!doctype html><html><head><meta charset="utf-8">',
    `<style>@page{size:${printer.paperWidthMm}mm auto;margin:0}`,
    `body{margin:0;font-family:ui-monospace,Menlo,Consolas,monospace;font-size:14px}`,
    `pre{width:${columns}ch;margin:0;white-space:pre-wrap}</style></head>`,
    `<body><pre>${lines.join("\n").replace(/&/g, "&amp;").replace(/</g, "&lt;")}</pre></body></html>`,
  ].join("");
  const bytes = [
    0x1b,
    0x40,
    0x1b,
    0x74,
    0x13,
    ...encode(lines.join("\n")),
    0x0a,
    0x0a,
    0x0a,
    ...(printer.autoCut ? [0x1d, 0x56, 0x42, 0x00] : []),
  ];

  return {
    id: `local-test-${Date.now()}`,
    bytesBase64: toBase64(bytes),
    html,
    widthMm: printer.paperWidthMm,
    copies: 1,
    cut: printer.autoCut,
    drawer: false,
    printerId: printer.id,
    printerName: printer.name,
    connection: printer.connection,
  };
}
