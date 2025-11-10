'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';

const WS_URL = 'ws://192.168.0.112:8000/ws/accesos';

interface AccessEvent {
  nombre?: string;
  apellido?: string;
  dni?: string;
  lector?: string;
  estado?: string;
  imagen?: string;
  fecha?: string;
}

const WebSocketContext = createContext<{ lastEvent?: AccessEvent }>({});

export const WebSocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [lastEvent, setLastEvent] = useState<AccessEvent | undefined>();

  useEffect(() => {
    const ws = new WebSocket(WS_URL);
    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.tipo === 'nuevo_evento') {
          setLastEvent(msg);
          // 🔔 Notificación visual y sonora
          if (Notification.permission === 'granted') {
            new Notification(`Acceso ${msg.estado}`, {
              body: `${msg.nombre} ${msg.apellido} (${msg.lector})`,
              icon:
                msg.estado?.toLowerCase() === 'permitido'
                  ? '/static/icon_ok.png'
                  : '/static/icon_alert.png',
            });
          }
          const audio = new Audio(
            msg.estado?.toLowerCase() === 'permitido'
              ? '/sounds/ok.wav'
              : '/sounds/denied.wav'
          );
          audio.play().catch(() => {});
        }
      } catch (err) {
        console.error('Error WS:', err);
      }
    };
    ws.onopen = () => console.log('✅ WS conectado');
    ws.onclose = () => console.warn('⚠️ WS cerrado');
    return () => ws.close();
  }, []);

  return <WebSocketContext.Provider value={{ lastEvent }}>{children}</WebSocketContext.Provider>;
};

export const useAccessWS = () => useContext(WebSocketContext);
