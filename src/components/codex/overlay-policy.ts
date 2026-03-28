export type OverlayDismissalPolicyInput = {
  approvalOpen: boolean;
  inputOpen: boolean;
  settingsOpen: boolean;
};

export type OverlayDismissalPolicy = {
  closeInput: boolean;
  closeSettings: boolean;
};

export function resolveOverlayDismissals({
  approvalOpen,
  inputOpen,
  settingsOpen,
}: OverlayDismissalPolicyInput): OverlayDismissalPolicy {
  return {
    closeInput: approvalOpen && inputOpen,
    closeSettings: settingsOpen && (approvalOpen || inputOpen),
  };
}
