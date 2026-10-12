import React, { useState, useEffect } from 'react';
import {
  Bell,
  Send,
  Smartphone,
  Mail,
  ShieldAlert,
  CheckCircle2,
  Clock,
  RotateCcw,
  Sparkles,
  Layers,
  AlertTriangle
} from 'lucide-react';
import { bankingApi } from '../services/api';

export const NotificationCenterView: React.FC = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [recipient, setRecipient] = useState<string>('CUST-8801');
  const [alertMessage, setAlertMessage] = useState<string>('Two-factor security challenge: verification code 942-810.');
  const [priority, setPriority] = useState<string>('HIGH');
  const [selectedChannels, setSelectedChannels] = useState<string[]>(['SMS', 'PUSH']);
  const [loading, setLoading] = useState<boolean>(false);
  const [fetching, setFetching] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchLiveNotifications = async () => {
    setFetching(true);
    try {
      const data = await bankingApi.getNotifications(50);
      if (Array.isArray(data) && data.length > 0) {
        setNotifications(data);
      } else {
        // Fallback default sample if database has no records yet
        setNotifications([
          {
            id: 'NOTIF-9821',
            recipient_id: 'CUST-8801',
            title: 'Security Alert: New Device Login',
            message: 'New login detected from IP 194.26.29.112 (Larnaca, Cyprus). If this was not you, lock your account immediately.',
            channels: ['SMS', 'PUSH', 'EMAIL'],
            priority: 'CRITICAL',
            severity: 'CRITICAL',
            status: 'DELIVERED',
            created_at: new Date().toISOString()
          }
        ]);
      }
    } catch (e) {
      console.warn('Failed to load notifications from backend', e);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchLiveNotifications();
  }, []);

  const toggleChannel = (ch: string) => {
    if (selectedChannels.includes(ch)) {
      if (selectedChannels.length > 1) {
        setSelectedChannels(selectedChannels.filter((c) => c !== ch));
      }
    } else {
      setSelectedChannels([...selectedChannels, ch]);
    }
  };

  const handleDispatchNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!alertMessage.trim()) return;
    setLoading(true);
    try {
      const res = await bankingApi.executeMCPTool('notification_tool', {
        customer_id: recipient,
        message: alertMessage,
        channels: selectedChannels,
        priority: priority
      }, 'NOTIFICATION_AGENT');

      const newEntry = {
        id: res.result?.dispatch_id || `NOTIF-${Date.now()}`,
        customer_id: recipient,
        title: priority === 'CRITICAL' ? 'Critical Security Notification' : 'Banking Notification',
        message: alertMessage,
        channels: selectedChannels,
        priority: priority,
        status: res.result?.status || 'DISPATCHED',
        dispatched_at: new Date().toISOString(),
        delivered_at: new Date().toISOString()
      };

      setNotifications([newEntry, ...notifications]);
      setSuccessMessage(`Alert successfully dispatched across [${selectedChannels.join(', ')}] with status DELIVERED.`);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      console.error('Dispatch failed', err);
      alert(`Notification dispatch failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-navy-900/80 border border-sky-950/80 rounded-2xl p-6 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
              <Bell className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-slate-100">Notification & Security Alert Center</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Notification Agent Dispatch &bull; Multi-Channel Routing (SMS, Push, Email) &bull; Event Triggers & Delivery Receipts
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
          <CheckCircle2 className="w-4 h-4" />
          <span>Notification Gateway: Operational</span>
        </div>
      </div>

      {successMessage && (
        <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{successMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Dispatch Console Form */}
        <div className="lg:col-span-5 bg-navy-900/70 border border-sky-950/80 rounded-2xl p-6 space-y-4">
          <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2 border-b border-sky-950 pb-3">
            <Send className="w-4 h-4 text-sky-400" />
            <span>Dispatch Simulated Notification</span>
          </h2>

          <form onSubmit={handleDispatchNotification} className="space-y-4 text-xs font-mono">
            <div>
              <label className="block text-slate-400 mb-1">Target Customer CIF</label>
              <input
                type="text"
                required
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className="w-full px-3 py-2 bg-navy-950 border border-sky-950 rounded-lg text-slate-100"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Alert Priority Level</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3 py-2 bg-navy-950 border border-sky-950 rounded-lg text-slate-100"
              >
                <option value="NORMAL">NORMAL (Informational / Statement)</option>
                <option value="HIGH">HIGH (Transaction Debit Confirmation)</option>
                <option value="CRITICAL">CRITICAL (Suspicious Velocity / Freeze)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1.5">Delivery Channels</label>
              <div className="grid grid-cols-3 gap-2">
                {['SMS', 'PUSH', 'EMAIL'].map((ch) => {
                  const isSelected = selectedChannels.includes(ch);
                  return (
                    <button
                      type="button"
                      key={ch}
                      onClick={() => toggleChannel(ch)}
                      className={`p-2 rounded-lg border text-center font-bold transition-all ${
                        isSelected
                          ? 'bg-sky-500/20 border-sky-500/40 text-sky-300'
                          : 'bg-navy-950 border-sky-950 text-slate-500'
                      }`}
                    >
                      {ch}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Alert Message Payload</label>
              <textarea
                rows={3}
                required
                value={alertMessage}
                onChange={(e) => setAlertMessage(e.target.value)}
                className="w-full px-3 py-2 bg-navy-950 border border-sky-950 rounded-lg text-slate-100"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 text-sky-300 font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {loading ? <RotateCcw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              <span>Dispatch via Notification Agent</span>
            </button>
          </form>
        </div>

        {/* Live Notification Feed & History */}
        <div className="lg:col-span-7 bg-navy-900/70 border border-sky-950/80 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-sky-950 pb-3">
            <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              <span>Notification Feed & Delivery Status ({notifications.length})</span>
            </h2>
            <span className="text-[10px] font-mono text-slate-400">Live Multi-Channel Delivery Receipts</span>
          </div>

          <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className="p-4 rounded-xl bg-navy-950/90 border border-sky-950 space-y-2 text-xs font-mono hover:border-sky-800 transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-100">{notif.title}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                      notif.priority === 'CRITICAL'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : notif.priority === 'HIGH'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                    }`}>
                      {notif.priority}
                    </span>
                    <span className="text-[10px] text-slate-400">{notif.customer_id || notif.recipient_id}</span>
                  </div>

                  <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded font-bold">
                    {notif.status || 'DELIVERED'}
                  </span>
                </div>

                <p className="text-slate-300 leading-relaxed">{notif.message}</p>

                <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-sky-950/60">
                  <div className="flex items-center gap-2">
                    <span>Delivered via:</span>
                    <span className="text-sky-400 font-bold">
                      {Array.isArray(notif.channels) ? notif.channels.join(', ') : 'SMS, PUSH'}
                    </span>
                  </div>
                  <span>
                    {notif.dispatched_at || notif.created_at
                      ? new Date(notif.dispatched_at || notif.created_at).toLocaleTimeString()
                      : 'Just now'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
