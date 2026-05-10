import type { UiMessage, SandboxMessage } from '../types';

type Handler = (msg: unknown) => void | Promise<void>;

const VALID_TYPES = new Set<string>(['section-list', 'component-list', 'done', 'error']);

export class UIBridge {
  private handlers = new Map<string, Handler>();

  send(msg: UiMessage): void {
    parent.postMessage({ pluginMessage: msg }, '*');
  }

  on<T extends SandboxMessage['type']>(
    type: T,
    handler: (msg: Extract<SandboxMessage, { type: T }>) => void | Promise<void>,
  ): void {
    if (this.handlers.has(type)) {
      throw new Error(`Handler for '${type}' is already registered`);
    }
    this.handlers.set(type, handler as Handler);
  }

  listen(): () => void {
    const handler = (event: MessageEvent) => {
      const pluginMessage = event.data?.pluginMessage as SandboxMessage | undefined;
      if (
        typeof pluginMessage !== 'object' ||
        pluginMessage === null ||
        typeof pluginMessage.type !== 'string'
      )
        return;
      if (!VALID_TYPES.has(pluginMessage.type)) return;
      const msgHandler = this.handlers.get(pluginMessage.type);
      if (!msgHandler) return;
      Promise.resolve(msgHandler(pluginMessage)).catch((e) => {
        const message = e instanceof Error ? e.message : 'Unknown error';
        if (pluginMessage.type !== 'error') {
          const errHandler = this.handlers.get('error');
          if (errHandler) errHandler({ type: 'error', message } as SandboxMessage);
        }
      });
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }
}
