"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import { Icon } from "@/components/app/Icon";
import { Btn } from "@/components/app/primitives";
import { saveMessage, getChatHistory } from "@/app/actions/messages";
import { sendWhatsAppMessage, getWhatsAppStatus } from "@/app/actions/whatsapp";
import type { Customer } from "@/lib/data/types";
import { relativeTime } from "@/lib/data/format";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Keep track of the currently selected customer without triggering socket reconnects
  const selectedCustomerRef = useRef<Customer | null>(null);
  useEffect(() => {
    selectedCustomerRef.current = selectedCustomer;
  }, [selectedCustomer]);

  const sessionId = storeId;

  // Poll WhatsApp connection status
  useEffect(() => {
    let mounted = true;
    const poll = async () => {
      if (!mounted) return;
      const res = await getWhatsAppStatus(sessionId);
      if (res.success && res.data) {
        setStatus(res.data.status);
      } else {
        setStatus("disconnected");
      }
      setTimeout(poll, 5000);
    };
    poll();
    return () => { mounted = false; };
  }, [sessionId]);

  // Subscribe to new incoming messages via Supabase Realtime
  useEffect(() => {
    const channel = supabase.channel('realtime_messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'mpato_whatsapp_messages',
        filter: `store_id=eq.${sessionId}`
      }, (payload) => {
        const newMsg = payload.new as any;
        // If we are currently viewing the customer who sent/received this message
        const currentCustomer = selectedCustomerRef.current;
        if (currentCustomer && currentCustomer.phone && newMsg.phone_number) {
          if (currentCustomer.phone.endsWith(newMsg.phone_number.slice(-9)) || newMsg.phone_number.endsWith(currentCustomer.phone.slice(-9))) {
            // Check if it's already in our state to prevent duplicates (since we add outbound optimistically)
            setMessages((prev) => {
              if (prev.some(m => m.id === newMsg.id)) return prev;
              return [...prev, newMsg];
            });
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
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

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !selectedCustomer) return;

    let to = selectedCustomer.phone?.replace(/\D/g, "") || "";
    if (to.startsWith("0")) {
      to = "254" + to.slice(1);
    } else if (to.startsWith("+")) {
      to = to.slice(1);
    }

    if (!to.startsWith("254") || to.length !== 12) {
      alert("Invalid customer phone number format. Cannot send message.");
      return;
    }

    const textToSend = inputValue;
    setInputValue("");
    
    // Optimistic UI update
    const optimisticMsg = { direction: "outbound", content: textToSend, created_at: new Date().toISOString(), id: "temp-" + Date.now() };
    setMessages((prev) => [...prev, optimisticMsg]);

    const res = await sendWhatsAppMessage(sessionId, to, textToSend);
    if (!res.success) {
      alert("Failed to send message: " + res.error);
      // Revert optimistic update on failure
      setMessages((prev) => prev.filter(m => m.id !== optimisticMsg.id));
    }
  };

  const initial = (n: string) => n.charAt(0).toUpperCase();

  return (
    <div className={"msg-shell" + (selectedCustomer ? " has-chat" : "")}>
      {/* Customer list */}
      <section className="card msg-list" aria-label="Conversations">
        <div className="msg-list-h">
          <h2>Messages</h2>
          <div className="msg-status">
            <span>{status.replace("_", " ")}</span>
            <i className={status === "connected" ? "on" : ""} title={status} />
          </div>
        </div>
        <div className="msg-list-body">
          {customers.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelectedCustomer(c)}
              className={"msg-row" + (selectedCustomer?.id === c.id ? " active" : "")}
            >
              <div className="msg-av">{initial(c.name)}</div>
              <div className="msg-row-t">
                <div className="nm">{c.name}</div>
                <div className="ph">{c.phone || "No phone"}</div>
              </div>
            </button>
          ))}
          {customers.length === 0 && <div className="msg-empty">No customers found.</div>}
        </div>
      </section>

      {/* Conversation */}
      <section className="card msg-chat" aria-label="Conversation">
        {selectedCustomer ? (
          <>
            <div className="msg-chat-h">
              <button
                type="button"
                className="msg-back"
                aria-label="Back to conversations"
                onClick={() => setSelectedCustomer(null)}
              >
                <Icon name="arrow-left" size={18} />
              </button>
              <div className="msg-av">{initial(selectedCustomer.name)}</div>
              <div className="msg-row-t">
                <h3>{selectedCustomer.name}</h3>
                <div className="ph">{selectedCustomer.phone}</div>
              </div>
            </div>

            <div className="msg-thread">
              {messages.length === 0 ? (
                <div className="msg-empty-thread">
                  No messages yet. Send a message to start the conversation!
                </div>
              ) : (
                messages.map((m, i) => (
                  <div key={m.id ?? i} className={"msg-line" + (m.direction === "outbound" ? " out" : "")}>
                    <div className="msg-bubble">
                      {m.content}
                      <div className="msg-time">{relativeTime(m.created_at)}</div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="msg-form">
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
              />
              <Btn variant="primary" type="submit" disabled={status !== "connected" || !inputValue.trim() || !selectedCustomer.phone}>
                Send
              </Btn>
            </form>
          </>
        ) : (
          <div className="msg-empty-thread big">Select a customer to start chatting</div>
        )}
      </section>
    </div>
  );
}
