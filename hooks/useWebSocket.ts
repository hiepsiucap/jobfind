'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { getWebSocketURL } from '@/lib/api';

export type WSMessageType = 'job_status' | 'error' | 'ping' | 'pong';

export interface JobStatusPayload {
  job_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error_message?: string;
  resume_id?: string;
  cv_data?: {
    name: string;
    email: string;
    phone: string;
    summary: string;
    skills: string[];
    education: { degree: string; institution: string; graduation_year: string }[];
    experience: { title: string; company: string; duration: string; responsibilities: string[]; achievements: string[] }[];
    certifications: string[];
    languages: string[];
  };
}

export interface WSMessage {
  type: WSMessageType;
  payload: JobStatusPayload | { message: string };
}

interface UseWebSocketOptions {
  onJobStatus?: (payload: JobStatusPayload) => void;
  onError?: (message: string) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  autoReconnect?: boolean;
  reconnectInterval?: number;
}

export function useWebSocket(token: string | null, options: UseWebSocketOptions = {}) {
  const {
    onJobStatus,
    onError,
    onConnect,
    onDisconnect,
    autoReconnect = true,
    reconnectInterval = 5000,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WSMessage | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const cleanup = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  const connect = useCallback(() => {
    if (!token) {
      console.log('🔌 [WebSocket] No token provided, skipping connection');
      return;
    }

    cleanup();

    try {
      const wsUrl = getWebSocketURL(token);
      console.log('🔌 [WebSocket] Connecting...');
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('✅ [WebSocket] Connected');
        setIsConnected(true);
        onConnect?.();

        // Set up ping interval to keep connection alive
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, 30000); // Ping every 30 seconds
      };

      ws.onmessage = (event) => {
        try {
          const message: WSMessage = JSON.parse(event.data);
          console.log('📩 [WebSocket] Message received:', message.type);
          setLastMessage(message);

          if (message.type === 'job_status') {
            onJobStatus?.(message.payload as JobStatusPayload);
          } else if (message.type === 'error') {
            const errorPayload = message.payload as { message: string };
            onError?.(errorPayload.message);
          }
        } catch (e) {
          console.error('❌ [WebSocket] Failed to parse message:', e);
        }
      };

      ws.onerror = () => {
        // WebSocket errors are common (e.g., when backend is down or token expired)
        // The onclose handler will handle reconnection
        console.warn('⚠️ [WebSocket] Connection error - will attempt to reconnect');
      };

      ws.onclose = (event) => {
        console.log('🔌 [WebSocket] Disconnected:', event.code);
        setIsConnected(false);
        onDisconnect?.();

        // Clear ping interval
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = null;
        }

        // Don't auto reconnect on auth errors (1008) or normal close (1000)
        const shouldReconnect = autoReconnect && 
          event.code !== 1000 && 
          event.code !== 1008 && // Policy violation (auth error)
          event.code !== 1006;   // Abnormal closure (often auth related)
          
        if (shouldReconnect) {
          console.log(`🔄 [WebSocket] Reconnecting in ${reconnectInterval / 1000}s...`);
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
        }
      };
    } catch (error) {
      console.error('❌ [WebSocket] Failed to connect:', error);
    }
  }, [token, cleanup, onJobStatus, onError, onConnect, onDisconnect, autoReconnect, reconnectInterval]);

  const disconnect = useCallback(() => {
    cleanup();
    setIsConnected(false);
  }, [cleanup]);

  const sendMessage = useCallback((message: object) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  // Connect when token is available
  useEffect(() => {
    if (token) {
      connect();
    } else {
      cleanup();
    }

    return () => {
      cleanup();
    };
  }, [token, connect, cleanup]);

  return {
    isConnected,
    lastMessage,
    connect,
    disconnect,
    sendMessage,
  };
}

// Hook specifically for tracking resume upload status
export function useResumeUploadStatus(
  token: string | null,
  jobId: string | null,
  onComplete?: (resumeId: string, cvData: JobStatusPayload['cv_data']) => void,
  onFailed?: (error: string) => void
) {
  const [status, setStatus] = useState<'idle' | 'pending' | 'processing' | 'completed' | 'failed'>('idle');
  const [progress, setProgress] = useState<string>('');
  const [resumeId, setResumeId] = useState<string | null>(null);
  const [cvData, setCvData] = useState<JobStatusPayload['cv_data'] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleJobStatus = useCallback((payload: JobStatusPayload) => {
    if (!jobId || payload.job_id !== jobId) return;

    console.log('📊 [ResumeUpload] Status update:', payload.status);
    setStatus(payload.status);

    switch (payload.status) {
      case 'pending':
        setProgress('Đang chờ xử lý...');
        break;
      case 'processing':
        setProgress('Đang phân tích CV với AI...');
        break;
      case 'completed':
        setProgress('Hoàn thành!');
        if (payload.resume_id) setResumeId(payload.resume_id);
        if (payload.cv_data) setCvData(payload.cv_data);
        onComplete?.(payload.resume_id || '', payload.cv_data);
        break;
      case 'failed':
        setProgress('');
        setError(payload.error_message || 'Có lỗi xảy ra');
        onFailed?.(payload.error_message || 'Có lỗi xảy ra');
        break;
    }
  }, [jobId, onComplete, onFailed]);

  const { isConnected } = useWebSocket(jobId ? token : null, {
    onJobStatus: handleJobStatus,
  });

  // Reset when jobId changes
  useEffect(() => {
    if (jobId) {
      setStatus('pending');
      setProgress('Đang chờ xử lý...');
      setResumeId(null);
      setCvData(null);
      setError(null);
    } else {
      setStatus('idle');
      setProgress('');
    }
  }, [jobId]);

  return {
    isConnected,
    status,
    progress,
    resumeId,
    cvData,
    error,
  };
}


