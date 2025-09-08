import { Request, Response } from 'express';

type SSEClient = {
  id: number;
  res: Response;
  channels: Set<string>;
};

const clients: SSEClient[] = [];
let nextId = 1;

export function eventsHandler(req: Request, res: Response) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders && res.flushHeaders();

  const channels = new Set<string>(
    (typeof req.query.channels === 'string' ? req.query.channels.split(',') : []).map(c => c.trim()).filter(Boolean)
  );
  // Everyone gets general notifications
  channels.add('general');

  const client: SSEClient = { id: nextId++, res, channels };
  clients.push(client);

  // keep the connection open
  req.on('close', () => {
    const idx = clients.findIndex(c => c.id === client.id);
    if (idx !== -1) clients.splice(idx, 1);
  });
}

export function emitEvent(channel: string, eventType: string, payload: any) {
  const data = JSON.stringify(payload);
  const s = `event: ${eventType}\ndata: ${data}\n\n`;

  clients.forEach(c => {
    if (c.channels.has(channel) || c.channels.has('*')) { // '*' for all channels
      try { c.res.write(s); } catch (e) { /* ignore write errors */ }
    }
  });
}

export default { eventsHandler, emitEvent };
