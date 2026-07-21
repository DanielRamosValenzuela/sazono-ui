import { Preferences } from "@capacitor/preferences";

const PIN_CANDIDATE_KEY = "sazono-pin-login-candidate";

export type PinLoginCandidate = {
  staffUserId: string;
  restaurantSlug: string;
  firstName: string;
  hasPin: boolean;
};

export async function getPinLoginCandidate(): Promise<PinLoginCandidate | null> {
  const { value } = await Preferences.get({ key: PIN_CANDIDATE_KEY });

  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as PinLoginCandidate;
  } catch {
    return null;
  }
}

export async function savePinLoginCandidate(
  candidate: PinLoginCandidate
): Promise<void> {
  await Preferences.set({
    key: PIN_CANDIDATE_KEY,
    value: JSON.stringify(candidate),
  });
}

export async function clearPinLoginCandidate(): Promise<void> {
  await Preferences.remove({ key: PIN_CANDIDATE_KEY });
}
