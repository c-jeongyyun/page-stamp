import { describe, it, expect, vi } from 'vitest';
import { SandboxBridge } from '../bridge';
import { getFigma } from './setup';

describe('SandboxBridge', () => {
  describe('send', () => {
    it('calls figma.ui.postMessage with the given message', () => {
      const bridge = new SandboxBridge();
      bridge.send({ type: 'done' });
      expect(getFigma().ui.postMessage).toHaveBeenCalledWith({ type: 'done' });
    });
  });

  describe('on', () => {
    it('throws if the same type is registered twice', () => {
      const bridge = new SandboxBridge();
      bridge.on('close', vi.fn());
      expect(() => bridge.on('close', vi.fn())).toThrow(
        "Handler for 'close' is already registered",
      );
    });
  });

  describe('listen', () => {
    it('ignores messages with unknown type', () => {
      const bridge = new SandboxBridge();
      const handler = vi.fn();
      bridge.on('close', handler);
      bridge.listen();
      getFigma().ui.onmessage?.({ type: 'unknown-type' });
      expect(handler).not.toHaveBeenCalled();
    });

    it('ignores non-object messages', () => {
      const bridge = new SandboxBridge();
      const handler = vi.fn();
      bridge.on('close', handler);
      bridge.listen();
      getFigma().ui.onmessage?.('not an object');
      getFigma().ui.onmessage?.(null);
      getFigma().ui.onmessage?.(42);
      expect(handler).not.toHaveBeenCalled();
    });

    it('ignores messages with no registered handler', () => {
      const bridge = new SandboxBridge();
      bridge.listen();
      // 'get-components' registered but no handler — should not throw
      getFigma().ui.onmessage?.({ type: 'get-components' });
      expect(getFigma().ui.postMessage).not.toHaveBeenCalled();
    });

    it('dispatches message to the registered handler', () => {
      const bridge = new SandboxBridge();
      const handler = vi.fn();
      bridge.on('close', handler);
      bridge.listen();
      getFigma().ui.onmessage?.({ type: 'close' });
      expect(handler).toHaveBeenCalledWith({ type: 'close' });
    });

    it('catches async handler errors and sends error message + notify', async () => {
      const bridge = new SandboxBridge();
      bridge.on('close', async () => {
        throw new Error('handler failed');
      });
      bridge.listen();
      getFigma().ui.onmessage?.({ type: 'close' });
      // let the promise settle
      await new Promise((r) => setTimeout(r, 0));
      expect(getFigma().notify).toHaveBeenCalledWith('handler failed', { error: true });
      expect(getFigma().ui.postMessage).toHaveBeenCalledWith({
        type: 'error',
        message: 'handler failed',
      });
    });

    it('uses "Unknown error" message when thrown value is not an Error', async () => {
      const bridge = new SandboxBridge();
      bridge.on('close', async () => {
        throw 'string error';
      });
      bridge.listen();
      getFigma().ui.onmessage?.({ type: 'close' });
      await new Promise((r) => setTimeout(r, 0));
      expect(getFigma().ui.postMessage).toHaveBeenCalledWith({
        type: 'error',
        message: 'Unknown error',
      });
    });
  });
});
