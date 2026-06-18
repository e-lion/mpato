'use client';

import { useEffect, useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Icon } from './Icon';
import { Btn } from './primitives';
import { startWhatsAppSession, getWhatsAppStatus, logoutWhatsAppSession, sendWhatsAppMessage } from '@/app/actions/whatsapp';

export function WhatsAppIntegration({ storeId }: { storeId?: string }) {
  const [status, setStatus] = useState<'initializing' | 'disconnected' | 'connecting' | 'qr_ready' | 'connected' | 'logged_out'>('initializing');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Fallback if no store ID is available
  const sessionId = storeId || 'test-session-123';

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      setStatus('connecting');
      const resStart = await startWhatsAppSession(sessionId);
      if (!resStart.success) {
        console.error("Failed to start session on init:", resStart.error);
      }
      
      const poll = async () => {
        if (!mounted) return;
        const res = await getWhatsAppStatus(sessionId);
        
        if (res.success && res.data) {
          const s = res.data.status;
          setStatus(s as any);
          if (s === 'connecting') {
            setQrCode(res.data.qr || null);
          } else if (s === 'connected' || s === 'disconnected' || s === 'logged_out') {
            setQrCode(null);
          }
        }
        
        // Always continue polling to keep status up to date
        pollingRef.current = setTimeout(poll, 3000);
      };
      
      poll();
    };

    init();

    return () => {
      mounted = false;
      if (pollingRef.current) clearTimeout(pollingRef.current);
    };
  }, [sessionId]);

  const handleTestMessage = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const rawTo = formData.get('to') as string;
    const text = formData.get('text') as string;

    if (!rawTo || !text) return;

    let to = rawTo.replace(/\D/g, "");
    if (to.startsWith("0")) {
      to = "254" + to.slice(1);
    } else if (to.startsWith("+")) {
      to = to.slice(1);
    }

    if (!to.startsWith("254") || to.length !== 12) {
      alert("Invalid phone number. Must be a valid 12-digit Kenyan number (e.g. 2547...).");
      return;
    }

    const res = await sendWhatsAppMessage(sessionId, to, text);
    if (res.success) {
      alert('Message sent successfully!');
      e.currentTarget.reset();
    } else {
      alert(`Failed to send message: ${res.error}`);
    }
  };

  const handleDisconnect = async () => {
    setStatus('disconnected'); // Optimistic update
    await logoutWhatsAppSession(sessionId);
    setQrCode(null);
  };

  return (
    <div className="card" style={{ padding: 22 }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 18 }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: "var(--r-md)",
            background: "var(--success-bg)",
            color: "var(--success-fg)",
            display: "grid",
            placeItems: "center",
            flex: "none",
          }}
        >
          <Icon name="message-circle" size={20} />
        </div>
        <div style={{ flex: 1 }}>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: 18,
              letterSpacing: "-.3px",
              margin: 0,
              color: "var(--fg1)",
            }}
          >
            WhatsApp Business
          </h2>
          <p style={{ fontSize: 13, color: "var(--fg3)", margin: "3px 0 0" }}>
            Connect your number to seamlessly handle customer conversations and auto-replies.
          </p>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
        <div style={{
          width: 12, height: 12, borderRadius: "50%",
          background: status === 'connected' ? "var(--success-fg)" : status === 'qr_ready' || status === 'connecting' ? "orange" : "var(--rose-600)"
        }} />
        <span style={{ fontWeight: 600, fontSize: 14, textTransform: "capitalize", color: "var(--fg1)" }}>
          {status.replace('_', ' ')}
        </span>
        
        {(status === 'disconnected' || status === 'logged_out') && (
          <Btn variant="secondary" onClick={async () => {
            setStatus('connecting');
            const res = await startWhatsAppSession(sessionId);
            if (!res.success) {
              alert("Failed to start session: " + res.error);
              setStatus('disconnected');
            }
          }}>
            Connect
          </Btn>
        )}
      </div>

      {qrCode && (status === 'qr_ready' || status === 'connecting') && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: 20, border: "2px dashed var(--border-strong)", borderRadius: "var(--r-md)", background: "var(--stone-50)", marginBottom: 20 }}>
          <div style={{ padding: 10, background: "#fff", borderRadius: 8, border: "1px solid var(--border)" }}>
            <QRCodeSVG value={qrCode} size={200} />
          </div>
          <p style={{ marginTop: 16, fontSize: 13, color: "var(--fg3)", textAlign: "center", lineHeight: 1.5 }}>
            Open WhatsApp on your phone<br/>
            Tap <strong>Menu</strong> or <strong>Settings</strong> and select <strong>Linked Devices</strong><br/>
            Point your phone to this screen to capture the code
          </p>
        </div>
      )}

      {status === 'connected' && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", background: "var(--success-bg)", borderRadius: "var(--r-md)", border: "1px solid var(--border)", marginBottom: 20 }}>
          <div style={{ color: "var(--success-fg)", fontSize: 14, fontWeight: 500, display: "flex", alignItems: "center", gap: 10 }}>
            <Icon name="check" size={18} />
            Successfully connected.
          </div>
          <Btn variant="secondary" onClick={handleDisconnect}>Disconnect</Btn>
        </div>
      )}

      {status === 'connected' && (
        <div style={{ marginTop: 24, paddingTop: 20, borderTop: "1px solid var(--border)" }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--fg1)", marginBottom: 12 }}>Test Connection</h3>
          <form onSubmit={handleTestMessage} className="m-grid">
            <div className="m-grid-2">
              <div className="m-field">
                <label>Phone Number</label>
                <input name="to" type="text" placeholder="e.g. 254712345678" required />
              </div>
              <div className="m-field">
                <label>Message</label>
                <input name="text" type="text" placeholder="Hello there!" required />
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <Btn variant="primary" type="submit">Send Test Message</Btn>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
