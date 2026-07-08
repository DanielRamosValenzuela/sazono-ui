import { SplitPayment } from "@/widgets/split-payment";

type SplitPaymentPageProps = {
  participantToken?: string;
};

export function SplitPaymentPage({ participantToken }: SplitPaymentPageProps) {
  return <SplitPayment participantToken={participantToken} />;
}
