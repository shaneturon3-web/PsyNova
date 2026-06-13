'use client';

import { useCallback, useEffect, useState } from 'react';
import { ZoomMeeting } from '../components/ZoomMeeting';
import { createMeeting, getSchedule, syncJane } from '../lib/api';

type Appt = {
  id: string;
  patientLabel: string;
  startAt: string;
  joinUrl?: string;
  mode?: string;
};

export default function JaneZoomDashboardPage() {
  const [appointments, setAppointments] = useState<Appt[]>([]);
  const [selected, setSelected] = useState<Appt | null>(null);
  const [joinUrl, setJoinUrl] = useState('');
  const [signature, setSignature] = useState<string>();
  const [mode, setMode] = useState<string>();
  const [banner, setBanner] = useState<string | null>(null);

  const load = useCallback(async () => {
    const s = await getSchedule();
    const list = (s.appointments ?? []) as Appt[];
    setAppointments(list);
    if (list[0] && !selected) setSelected(list[0]);
    setBanner(`Schedule loaded (${s.source})`);
  }, [selected]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onSync() {
    setBanner('Syncing…');
    const res = await syncJane();
    await load();
    setBanner(`Sync complete — imported ${res.imported ?? 0}`);
  }

  async function onStart() {
    if (!selected) return;
    setBanner('Starting session…');
    const res = await createMeeting(selected.patientLabel, selected.startAt);
    setJoinUrl(res.joinUrl);
    setSignature(res.signature);
    setMode(res.mode);
    setBanner('Session ready');
    window.open(res.joinUrl, '_blank', 'noopener,noreferrer');
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex">
      <aside className="w-64 border-r border-neutral-800 p-4">
        <h1 className="font-semibold text-lg">Jane + Zoom</h1>
        <p className="text-xs text-neutral-500 mt-1">Next.js wrapper · escaleta v1</p>
        <nav className="mt-6 flex flex-col gap-2 text-sm">
          <span className="text-neutral-400">Dashboard</span>
        </nav>
      </aside>
      <main className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section>
          <div className="flex gap-2 items-center mb-4">
            <button type="button" onClick={() => void onSync()} className="px-3 py-1.5 bg-emerald-700 rounded text-sm">
              Sync Jane
            </button>
            {banner && <span className="text-xs text-neutral-400">{banner}</span>}
          </div>
          <ul className="space-y-2">
            {appointments.map((a) => (
              <li key={a.id}>
                <button
                  type="button"
                  onClick={() => setSelected(a)}
                  className={`w-full text-left px-3 py-2 rounded border ${selected?.id === a.id ? 'border-emerald-500' : 'border-neutral-700'}`}
                >
                  <div className="text-xs text-neutral-500">{new Date(a.startAt).toLocaleString()}</div>
                  <div className="font-medium">{a.patientLabel}</div>
                </button>
              </li>
            ))}
          </ul>
        </section>
        <section>
          {selected && (
            <>
              <h2 className="text-xl font-medium mb-2">{selected.patientLabel}</h2>
              <button type="button" onClick={() => void onStart()} className="mb-4 px-4 py-2 bg-emerald-600 rounded">
                Start session
              </button>
              <ZoomMeeting joinUrl={joinUrl || selected.joinUrl || ''} signature={signature} mode={mode || selected.mode} />
            </>
          )}
        </section>
      </main>
    </div>
  );
}
