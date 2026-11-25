import { browserTransport } from "./browser";
import {
  capacitorEscposTransport,
  handlesEscposPrinter,
} from "./capacitor-escpos";
import { previewTransport } from "./preview";
import { registerPrintTransport } from "./registry";

export function registerBuiltinPrintTransports() {
  registerPrintTransport({
    transport: previewTransport,
    priority: 100,
    handles: () => true,
  });
  registerPrintTransport({
    transport: browserTransport,
    priority: 10,
    handles: (printer) => printer.transport === "BROWSER",
  });
  registerPrintTransport({
    transport: capacitorEscposTransport,
    priority: 50,
    handles: handlesEscposPrinter,
  });
}
