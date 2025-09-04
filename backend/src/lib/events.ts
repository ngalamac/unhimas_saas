import { Request, Response } from 'express';

type SSEClient = {
  id: number;
  res: Response;
};

const clients: SSEClient[] = [];
let nextId = 1;

export function eventsHandler(req: Request, res: Response) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders && res.flushHeaders();

  const client: SSEClient = { id: nextId++, res };
  clients.push(client);

  // keep the connection open
  req.on('close', () => {
    const idx = clients.findIndex(c => c.id === client.id);
    if (idx !== -1) clients.splice(idx, 1);
  });
}

export function emitEvent(eventType: string, payload: any) {
  const data = JSON.stringify(payload);
  const s = `event: ${eventType}\ndata: ${data}\n\n`;
  clients.forEach(c => {
    try { c.res.write(s); } catch (e) { /* ignore write errors */ }
  });
}

export default { eventsHandler, emitEvent };
