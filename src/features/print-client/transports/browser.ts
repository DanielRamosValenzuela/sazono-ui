import { Capacitor } from "@capacitor/core";
import type { PrintJob, PrintResult, PrintTransportClient } from "./types";

const PRINT_TIMEOUT_MS = 300_000;
const FRAME_STYLE =
  "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden";

export const browserTransport: PrintTransportClient = {
  id: "browser",
  canPrint() {
    return (
      typeof window !== "undefined" &&
      typeof window.print === "function" &&
      !Capacitor.isNativePlatform()
    );
  },
  print(job: PrintJob): Promise<PrintResult> {
    const html = job.html;

    if (!html) {
      return Promise.resolve({
        ok: false,
        retryable: false,
        error: "NO_HTML",
      });
    }

    return new Promise((resolve) => {
      const frame = document.createElement("iframe");
      frame.setAttribute("aria-hidden", "true");
      frame.setAttribute("style", FRAME_STYLE);
      let settled = false;

      const finish = (result: PrintResult) => {
        if (settled) {
          return;
        }
        settled = true;
        window.clearTimeout(timer);
        frame.remove();
        resolve(result);
      };

      const timer = window.setTimeout(
        () => finish({ ok: false, retryable: true, error: "PRINT_TIMEOUT" }),
        PRINT_TIMEOUT_MS,
      );

      frame.addEventListener("load", () => {
        if (settled) {
          return;
        }
        const target = frame.contentWindow;

        if (!target) {
          finish({ ok: false, retryable: true, error: "NO_FRAME" });
          return;
        }
        target.addEventListener("afterprint", () => finish({ ok: true }));
        try {
          target.focus();
          target.print();
          window.setTimeout(() => finish({ ok: true }), 1500);
        } catch (error) {
          finish({
            ok: false,
            retryable: true,
            error: error instanceof Error ? error.message : "PRINT_ERROR",
          });
        }
      });

      frame.srcdoc = html;
      document.body.appendChild(frame);
    });
  },
};
