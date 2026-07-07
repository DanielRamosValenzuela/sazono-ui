import { QrExperience } from "@/widgets/qr-experience";

type QrEntryPageProps = {
  qrToken?: string;
};

export function QrEntryPage({ qrToken }: QrEntryPageProps) {
  return <QrExperience qrToken={qrToken} />;
}
