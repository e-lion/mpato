"use client";

import { useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { Icon } from "@/components/app/Icon";
import { Btn } from "@/components/app/primitives";
import { saveMessage, getChatHistory } from "@/app/actions/messages";
import type { Customer } from "@/lib/data/types";
import { relativeTime } from "@/lib/data/format";

export function Messages({ 
  storeId, 
  initialCustomers 
}: { 
  storeId: string;
  initialCustomers: Customer[];
}) {
  const [customers] = useState<Customer[]>(initialCustomers);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [status, setStatus] = useState("disconnected");
  
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Keep track of the currently selected customer without triggering socket reconnects
  const selectedCustomerRef = useRef<Customer | null>(null);
  useEffect(() => {
    selectedCustomerRef.current = selectedCustomer;
  }, [selectedCustomer]);

  const sessionId = storeId;

  // Connect to WebSocket
  useEffect(() => {
    const workerUrl = process.env.NEXT_PUBLIC_WHATSAPP_WORKER_URL || "http://localhost:4000";
    const socket = io(workerUrl);
    socketRef.current = socket;

    socket.on("connect", () => {
      setStatus("connecting");
      socket.emit("start_session", { sessionId });
    });

    socket.on("connection_status", (data: { sessionId: string; status: string }) => {
      if (data.sessionId === sessionId) {
        setStatus(data.status);
      }
    });

    socket.on("whatsapp_message", async (data: { sessionId: string; message: any }) => {
      if (data.sessionId === sessionId) {
        const msg = data.message;
        const rawJid = msg.key.remoteJid;
        const fromMe = msg.key.fromMe;
        
        if (!rawJid || rawJid.includes("@g.us")) return; // Skip groups
        
        const phoneNumber = rawJid.split("@")[0];
        const content = msg.message?.conversation || msg.message?.extendedTextMessage?.text;

        if (!content) return;

        // Save to Supabase (if not from me, because we save outbound directly)
        if (!fromMe) {
          await saveMessage(sessionId, phoneNumber, "inbound", content);
          
          // If currently viewing this customer, update state
          if (selectedCustomer && selectedCustomer.phone === phoneNumber) {
            setMessages((prev) => [...prev, { direction: "inbound", content, created_at: new Date().toISOString() }]);
          }
        }
      }
    });

    socket.on("message_sent", async (data: { sessionId: string; to: string; text: string; success: boolean, error?: string }) => {
      if (data.sessionId === sessionId) {
        if (!data.success) {
          alert("Failed to send message: " + data.error);
          return;
        }

        const phoneNumber = data.to.split("@")[0];
        
        await saveMessage(sessionId, phoneNumber, "outbound", data.text);
        
        const currentCustomer = selectedCustomerRef.current;
        if (currentCustomer && currentCustomer.phone === phoneNumber) {
          setMessages((prev) => [...prev, { direction: "outbound", content: data.text, created_at: new Date().toISOString() }]);
        }
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [sessionId]);

  // Load chat history when customer is selected
  useEffect(() => {
    if (selectedCustomer && selectedCustomer.phone) {
      getChatHistory(sessionId, selectedCustomer.phone).then((history) => {
        setMessages(history);
      });
    } else {
      setMessages([]);
    }
  }, [selectedCustomer, sessionId]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !selectedCustomer || !selectedCustomer.phone || !socketRef.current) return;
    
    socketRef.current.emit("send_message", { sessionId, to: selectedCustomer.phone, text: inputValue });
    setInputValue("");
  };

  return (
    <div className="page-w" style={{ display: "flex", gap: 20, height: "80vh" }}>
      {/* Sidebar: Customers List */}
      <div className="card" style={{ width: 320, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ padding: 16, borderBottom: "1px solid var(--border)", background: "var(--stone-50)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "var(--fg1)" }}>Messages</h2>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 13, color: "var(--fg3)", textTransform: "capitalize" }}>{status.replace("_", " ")}</span>
            <div style={{ 
              width: 10, height: 10, borderRadius: "50%", 
              background: status === "connected" ? "var(--success-fg)" : "var(--rose-600)"
            }} title={status} />
          </div>
        </div>
        <div style={{ flex: 1, overflowY: "auto" }}>
          {customers.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCustomer(c)}
              style={{
                width: "100%", textAlign: "left", padding: "14px 16px",
                borderBottom: "1px solid var(--border)",
                background: selectedCustomer?.id === c.id ? "var(--rose-50)" : "transparent",
                border: "none", cursor: "pointer", display: "flex", gap: 12, alignItems: "center"
              }}
            >
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--stone-200)", display: "grid", placeItems: "center", color: "var(--fg2)", fontWeight: 600 }}>
                {c.name.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1, overflow: "hidden" }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: "var(--fg1)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.name}</div>
                <div style={{ fontSize: 12, color: "var(--fg3)", marginTop: 2 }}>{c.phone || "No phone"}</div>
              </div>
            </button>
          ))}
          {customers.length === 0 && (
            <div style={{ padding: 20, textAlign: "center", color: "var(--fg3)", fontSize: 14 }}>
              No customers found.
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="card" style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {selectedCustomer ? (
          <>
            <div style={{ padding: 16, borderBottom: "1px solid var(--border)", background: "var(--stone-50)", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--stone-200)", display: "grid", placeItems: "center", color: "var(--fg2)", fontWeight: 600 }}>
                {selectedCustomer.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "var(--fg1)" }}>{selectedCustomer.name}</h3>
                <div style={{ fontSize: 13, color: "var(--fg3)", marginTop: 2 }}>{selectedCustomer.phone}</div>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: 20, display: "flex", flexDirection: "column", gap: 12, background: "#f0f2f5" }}>
              {messages.length === 0 ? (
                <div style={{ textAlign: "center", color: "var(--fg3)", margin: "auto", fontSize: 14 }}>
                  No messages yet. Send a message to start the conversation!
                </div>
              ) : (
                messages.map((m, i) => {
                  const isOutbound = m.direction === "outbound";
                  return (
                    <div key={i} style={{ display: "flex", justifyContent: isOutbound ? "flex-end" : "flex-start" }}>
                      <div style={{
                        maxWidth: "70%",
                        padding: "10px 14px",
                        borderRadius: 12,
                        background: isOutbound ? "#dcf8c6" : "#ffffff",
                        color: "#000",
                        fontSize: 14,
                        lineHeight: 1.4,
                        boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
                      }}>
                        {m.content}
                        <div style={{ fontSize: 10, color: "rgba(0,0,0,0.45)", textAlign: "right", marginTop: 4 }}>
                          {relativeTime(m.created_at)}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} style={{ padding: 16, borderTop: "1px solid var(--border)", display: "flex", gap: 10, background: "#fff" }}>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={
                  status !== "connected" ? "Waiting for WhatsApp connection..." :
                  !selectedCustomer.phone ? "Customer has no phone number" :
                  "Type a message..."
                }
                disabled={status !== "connected" || !selectedCustomer.phone}
                style={{ flex: 1, padding: "12px 16px", borderRadius: 24, border: "1px solid var(--border)", outline: "none", fontSize: 14 }}
              />
              <Btn variant="primary" type="submit" disabled={status !== "connected" || !inputValue.trim() || !selectedCustomer.phone}>
                Send
              </Btn>
            </form>
          </>
        ) : (
          <div style={{ flex: 1, display: "grid", placeItems: "center", color: "var(--fg3)", fontSize: 15 }}>
            Select a customer to start chatting
          </div>
        )}
      </div>
    </div>
  );
}
