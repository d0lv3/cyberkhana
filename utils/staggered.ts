/**
 * Wraps a refetch that a broadcast triggers.
 *
 * A socket broadcast reaches every open page in the same instant, and if each
 * one refetched straight away the server would take the whole room's requests
 * in one spike. Each page instead waits a random moment within `spreadMs`, so
 * the same requests arrive spread out. Broadcasts that land while a refetch is
 * already waiting are folded into it rather than queued behind it.
 *
 * Keep `spreadMs` below the server's broadcast interval (3s for events), so one
 * wave has finished before the next can start.
 */
export function staggered(run: () => void, spreadMs = 2000) {
  let timer: ReturnType<typeof setTimeout> | null = null;
  const trigger = () => {
    if (timer) return;
    timer = setTimeout(() => { timer = null; run(); }, Math.random() * spreadMs);
  };
  trigger.cancel = () => {
    if (timer) clearTimeout(timer);
    timer = null;
  };
  return trigger;
}
