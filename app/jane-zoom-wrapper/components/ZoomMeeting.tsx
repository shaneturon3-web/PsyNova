'use client';

import { useEffect, useRef, useState } from 'react';

type Props = {
  joinUrl: string;
  signature?: string;
  mode?: string;
};

/**
 * Embedded session surface — iframe first; open-tab fallback if iframe blocked.
 * Full @zoom/meetingsdk can replace iframe when SDK credentials are provisioned.
 */
export function ZoomMeeting({ joinUrl, signature, mode }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    setBlocked(false);
  }, [joinUrl]);

  if (!joinUrl) {
    return <p className="text-sm text-neutral-400">No meeting URL — select an appointment.</p>;
  }

  if (blocked || joinUrl.includes('example.invalid')) {
    return (
      <div className="rounded border border-neutral-700 p-4">
        <p className="text-sm mb-2">Embed blocked — use external join ({mode ?? 'unknown'}).</p>
        <a className="text-emerald-400 underline" href={joinUrl} target="_blank" rel="noopener noreferrer">
          Open Zoom / backup room
        </a>
      </div>
    );
  }

  return (
    <div ref={ref} className="rounded overflow-hidden border border-neutral-700 bg-black min-h-[360px]">
      <iframe
        title="Zoom meeting"
        src={joinUrl}
        className="w-full min-h-[360px]"
        allow="camera; microphone; fullscreen"
        referrerPolicy="no-referrer"
        onError={() => setBlocked(true)}
      />
      <p className="text-xs text-neutral-500 p-2">
        {mode ?? 'live'} · sig {signature ? 'present' : 'n/a'} ·{' '}
        <button type="button" className="underline" onClick={() => setBlocked(true)}>
          Switch to tab fallback
        </button>
      </p>
    </div>
  );
}
