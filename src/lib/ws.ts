import { useEffect, useRef } from "react";

export const useWebSocket = (onMessage: (msg: any) => void) => {
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000/ws";
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => console.log("✅ WS conectado");
    ws.onclose = () => console.log("❌ WS cerrado");
    ws.onerror = (err) => console.error("⚠️ WS error", err);
    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        onMessage(data);
      } catch (err) {
        console.error("WS parse error", err);
      }
    };

    wsRef.current = ws;
    return () => ws.close();
  }, [onMessage]);
};
