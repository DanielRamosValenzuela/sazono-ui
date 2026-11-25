import { usePrintClientStore } from "../model/print-client.store";
import type { PrintJob, PrintResult, PrintTransportClient } from "./types";

export const previewTransport: PrintTransportClient = {
  id: "preview",
  canPrint() {
    return usePrintClientStore.getState().previewMode;
  },
  print(job: PrintJob): Promise<PrintResult> {
    usePrintClientStore.getState().setPreview(job);

    return Promise.resolve({ ok: true });
  },
};
