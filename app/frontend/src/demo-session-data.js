function envValue(name) {
  return String(import.meta.env[name] || '').trim();
}

function hasAll(values) {
  return values.every((v) => !!String(v || '').trim());
}

function makeDemoLink(provider, sessionId) {
  const id = encodeURIComponent(sessionId);
  if (provider === 'zoom') return `https://example.invalid/demo/zoom/${id}`;
  if (provider === 'daily') return `https://example.invalid/demo/daily/${id}`;
  if (provider === 'whereby') return `https://example.invalid/demo/whereby/${id}`;
  if (provider === 'jitsi') return `https://example.invalid/demo/jitsi/${id}`;
  if (provider === 'twilio') return `https://example.invalid/demo/twilio/${id}`;
  if (provider === 'telnyx') return `https://example.invalid/demo/telnyx/${id}`;
  if (provider === 'vonage') return `https://example.invalid/demo/vonage/${id}`;
  return `https://example.invalid/demo/session/${id}`;
}

export function providerConfigSummary() {
  const zoom = {
    clientId: envValue('VITE_ZOOM_CLIENT_ID'),
    clientSecret: envValue('VITE_ZOOM_CLIENT_SECRET'),
    accountId: envValue('VITE_ZOOM_ACCOUNT_ID'),
    webhookSecret: envValue('VITE_ZOOM_WEBHOOK_SECRET'),
  };
  const daily = { apiKey: envValue('VITE_DAILY_API_KEY') };
  const whereby = { apiKey: envValue('VITE_WHEREBY_API_KEY') };
  const twilio = {
    accountSid: envValue('VITE_TWILIO_ACCOUNT_SID'),
    authToken: envValue('VITE_TWILIO_AUTH_TOKEN'),
    phoneNumber: envValue('VITE_TWILIO_PHONE_NUMBER'),
  };
  const telnyx = { apiKey: envValue('VITE_TELNYX_API_KEY') };
  const vonage = { apiKey: envValue('VITE_VONAGE_API_KEY') };
  const jitsiDemoAllowed = envValue('VITE_ALLOW_JITSI_DEMO_ROOM') === 'true';
  return {
    zoomConfigured: hasAll([zoom.clientId, zoom.clientSecret, zoom.accountId, zoom.webhookSecret]),
    dailyConfigured: hasAll([daily.apiKey]),
    wherebyConfigured: hasAll([whereby.apiKey]),
    twilioConfigured: hasAll([twilio.accountSid, twilio.authToken, twilio.phoneNumber]),
    telnyxConfigured: hasAll([telnyx.apiKey]),
    vonageConfigured: hasAll([vonage.apiKey]),
    jitsiDemoAllowed,
  };
}

export function buildDemoVirtualSessions() {
  return [
    {
      id: 'vs-301',
      patient: 'Avery Cole',
      therapist: 'Dr. Mira Rowan',
      date: '2026-04-29',
      time: '09:00',
      sessionType: 'Zoom video session',
      provider: 'Zoom',
      providerKey: 'zoom',
      status: 'Not configured',
      patientEmail: 'avery.cole@demo.mail',
      patientPhone: '+1 438-555-1001',
    },
    {
      id: 'vs-302',
      patient: 'Jordan Price',
      therapist: 'Noah Vale, LCSW',
      date: '2026-04-30',
      time: '10:30',
      sessionType: 'Backup video session',
      provider: 'Daily.co',
      providerKey: 'daily',
      status: 'Ready',
      patientEmail: 'jordan.price@demo.mail',
      patientPhone: '+1 438-555-1002',
    },
    {
      id: 'vs-303',
      patient: 'Mina Patel',
      therapist: 'Eli Park',
      date: '2026-04-28',
      time: '14:00',
      sessionType: 'Group video session',
      provider: 'Jitsi',
      providerKey: 'jitsi',
      status: 'Waiting',
      patientEmail: 'mina.patel@demo.mail',
      patientPhone: '+1 438-555-1003',
      participantCount: 4,
      participantRole: 'host',
      anonymousMode: true,
      participants: ['Mina Patel', 'Anon B', 'Anon C', 'Anon D'],
    },
    {
      id: 'vs-304',
      patient: 'Leo Martin',
      therapist: 'Ari Bennett',
      date: '2026-05-01',
      time: '13:00',
      sessionType: 'VoIP call',
      provider: 'Twilio',
      providerKey: 'twilio',
      status: 'Completed',
      patientEmail: 'leo.martin@demo.mail',
      patientPhone: '+1 438-555-1004',
      participantCount: 1,
      participantRole: 'participant',
      anonymousMode: false,
      participants: ['Leo Martin'],
    },
    {
      id: 'vs-305',
      patient: 'Nina Flores',
      therapist: 'Dr. Lina Ortega',
      date: '2026-05-02',
      time: '11:00',
      sessionType: 'Group video session',
      provider: 'Whereby',
      providerKey: 'whereby',
      status: 'Ready',
      patientEmail: 'nina.flores@demo.mail',
      patientPhone: '+1 438-555-1005',
      participantCount: 3,
      participantRole: 'co_host',
      anonymousMode: false,
      participants: ['Nina Flores', 'Avery Cole', 'Jordan Price'],
    },
  ].map((s) => ({
    ...s,
    participantCount: s.participantCount || 1,
    participantRole: s.participantRole || 'participant',
    anonymousMode: !!s.anonymousMode,
    participants: s.participants || [s.patient],
    demoJoinUrl: makeDemoLink(s.providerKey, s.id),
    demoBackupUrl: makeDemoLink('jitsi', `${s.id}-backup`),
  }));
}
