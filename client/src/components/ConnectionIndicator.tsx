import { useState, useEffect } from "react";
import { socket } from "@/lib/socket";

export function ConnectionIndicator({
  dark = false,
  local = false,
  peerSynced = false,
}: {
  dark?: boolean;
  local?: boolean;
  /** Same-browser controller/viewer is live over BroadcastChannel. */
  peerSynced?: boolean;
}) {
  const [socketConnected, setSocketConnected] = useState(socket.connected);

  useEffect(() => {
    if (local) return;
    const onConnect = () => setSocketConnected(true);
    const onDisconnect = () => setSocketConnected(false);
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
    };
  }, [local]);

  // Local presentations have no server connection — they're "connected" via the
  // same-browser BroadcastChannel. A hosted session that still has a peer in
  // this browser (offline copy / other window) is the same situation when the
  // socket is down. Show amber to distinguish them from a live server
  // connection (green); a dropped server connection with no local peer is red.
  const channelOnly = local || (peerSynced && !socketConnected);
  const connected = channelOnly || socketConnected;
  const pingColor = channelOnly ? "bg-amber-400" : "bg-green-400";
  const dotColor = channelOnly
    ? "bg-amber-500"
    : socketConnected
      ? "bg-green-500"
      : dark ? "bg-red-400" : "bg-red-500";
  const title = channelOnly
    ? "Local — synced to other windows in this browser only"
    : socketConnected
      ? "Connected"
      : "Disconnected";

  return (
    <span
      className="relative flex h-2.5 w-2.5"
      title={title}
    >
      {connected && (
        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${pingColor}`} />
      )}
      <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${dotColor}`} />
    </span>
  );
}
