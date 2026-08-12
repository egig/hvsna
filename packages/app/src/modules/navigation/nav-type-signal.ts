// Module-level signal for pending nav type.
// Used when navigate(-1) can't carry new location state (browser/hardware back).
let pendingNavType: string | null = null;

export function setPendingNavType(type: string) {
  pendingNavType = type;
}

export function consumePendingNavType(): string | null {
  const val = pendingNavType;
  pendingNavType = null;
  return val;
}
