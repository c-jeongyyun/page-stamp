import type { UiMessage, SandboxMessage } from '../types';

type Handler = (msg: unknown) => void | Promise<void>;

const VALID_TYPES = new Set<string>(['apply', 'refresh', 'remove-all', 'get-components', 'close']);

export class SandboxBridge {
  private handlers = new Map<string, Handler>();

  on<T extends UiMessage['type']>(
    type: T,
    handler: (msg: Extract<UiMessage, { type: T }>) => void | Promise<void>,
  ): void {
    if (this.handlers.has(type)) {
      throw new Error(`Handler for '${type}' is already registered`);
    }
    this.handlers.set(type, handler as Handler);
  }

  send(msg: SandboxMessage): void {
    figma.ui.postMessage(msg);
  }

  listen(): void {
    figma.ui.onmessage = (rawMsg) => {
      if (
        typeof rawMsg !== 'object' ||
        rawMsg === null ||
        typeof (rawMsg as Record<string, unknown>).type !== 'string'
      )
        return;
      const msg = rawMsg as UiMessage;
      if (!VALID_TYPES.has(msg.type)) return;
      const handler = this.handlers.get(msg.type);
      if (!handler) return;
      Promise.resolve(handler(msg)).catch((e) => {
        const message = e instanceof Error ? e.message : 'Unknown error';
        figma.notify(message, { error: true });
        this.send({ type: 'error', message });
      });
    };
  }
}
