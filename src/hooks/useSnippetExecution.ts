import { useEffect, useRef, useState } from 'react';

type WebSocketMessage =
  | { type: 'start'; code: string; version: string }
  | { type: 'input'; data: string }
  | { type: 'output'; data: string }
  | { type: 'error'; data: string }
  | { type: 'done' };

export const useSnippetExecution = () => {
  const [output, setOutput] = useState<string[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const pendingStartRef = useRef<{ code: string; version: string } | null>(null);

  const connect = () => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/api/snippet-service/snippets/execute`;

    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
      const pending = pendingStartRef.current;
      if (pending) {
        const message: WebSocketMessage = { type: 'start', ...pending };
        ws.send(JSON.stringify(message));
        setIsExecuting(true);
        pendingStartRef.current = null;
      }
    };

    ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);

        switch (message.type) {
          case 'output':
            setOutput((prev) => [...prev, message.data]);
            break;
          case 'error':
            setOutput((prev) => [...prev, `ERROR: ${message.data}`]);
            break;
          case 'done':
            setIsExecuting(false);
            setOutput((prev) => [...prev, '\n--- Execution completed ---']);
            break;
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setOutput((prev) => [...prev, 'ERROR: WebSocket connection error']);
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
      setIsExecuting(false);
    };

    wsRef.current = ws;
  };

  const disconnect = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  };

  const startExecution = (code: string, version: string) => {
    setOutput([]);
    pendingStartRef.current = { code, version };

    if (!wsRef.current) {
      connect();
      return;
    }

    if (wsRef.current.readyState === WebSocket.CONNECTING) {
      return; // will be sent on open
    }

    if (wsRef.current.readyState === WebSocket.OPEN) {
      const message: WebSocketMessage = { type: 'start', code, version };
      wsRef.current.send(JSON.stringify(message));
      setIsExecuting(true);
      pendingStartRef.current = null;
      return;
    }

    console.error('WebSocket is not connected');
  };

  const sendInput = (input: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.error('WebSocket is not connected');
      return;
    }

    const message: WebSocketMessage = {
      type: 'input',
      data: input,
    };

    wsRef.current.send(JSON.stringify(message));
  };

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  return {
    output,
    isConnected,
    isExecuting,
    connect,
    disconnect,
    startExecution,
    sendInput,
  };
};
