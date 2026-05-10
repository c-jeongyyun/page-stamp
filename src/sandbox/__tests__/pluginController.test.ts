import { describe, it, expect, vi } from 'vitest';
import { SandboxBridge } from '../bridge';
import { PluginController } from '../pluginController';
import { PageStampService } from '../pageStampService';
import { getFigma } from './setup';
import type { PageStampMold } from '../../types';

function makeBridgeAndController() {
  const bridge = new SandboxBridge();
  const service = {
    getSections: vi.fn(() => []),
    getComponents: vi.fn(() => []),
    applyPageNumbers: vi.fn(() => Promise.resolve()),
    refreshPageNumbers: vi.fn(() => Promise.resolve()),
    removeAllPageNumbers: vi.fn(() => Promise.resolve()),
  } as unknown as PageStampService;
  const controller = new PluginController(bridge, service);
  controller.init();
  return { bridge, service, dispatch: getFigma().ui.onmessage! };
}

const validMold: PageStampMold = {
  sectionId: 'sec-1',
  componentId: 'comp-1',
  useDefaultComponent: false,
  textLayerName: '{page_number}',
  positioningMode: 'ABSOLUTE',
  position: { x: 10, y: 20 },
  pagingFormat: 'simple',
  startNumber: 1,
};

describe('PluginController', () => {
  describe('mold validation', () => {
    it('sends error when mold is missing', async () => {
      const { dispatch } = makeBridgeAndController();
      dispatch({ type: 'apply' });
      await new Promise((r) => setTimeout(r, 0));
      expect(getFigma().ui.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'error' }),
      );
    });

    it('sends error when sectionId is empty', async () => {
      const { dispatch } = makeBridgeAndController();
      dispatch({ type: 'apply', mold: { ...validMold, sectionId: '' } });
      await new Promise((r) => setTimeout(r, 0));
      expect(getFigma().ui.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'error', message: expect.stringContaining('sectionId') }),
      );
    });

    it('sends error when positioningMode is invalid', async () => {
      const { dispatch } = makeBridgeAndController();
      dispatch({ type: 'apply', mold: { ...validMold, positioningMode: 'INVALID' } });
      await new Promise((r) => setTimeout(r, 0));
      expect(getFigma().ui.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          message: expect.stringContaining('positioningMode'),
        }),
      );
    });

    it('sends error when startNumber is less than 1', async () => {
      const { dispatch } = makeBridgeAndController();
      dispatch({ type: 'apply', mold: { ...validMold, startNumber: 0 } });
      await new Promise((r) => setTimeout(r, 0));
      expect(getFigma().ui.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'error', message: expect.stringContaining('startNumber') }),
      );
    });
  });

  describe('apply handler', () => {
    it('calls service.applyPageNumbers and sends done', async () => {
      const { service, dispatch } = makeBridgeAndController();
      dispatch({ type: 'apply', mold: validMold });
      await new Promise((r) => setTimeout(r, 0));
      expect(service.applyPageNumbers).toHaveBeenCalledWith(validMold);
      expect(getFigma().ui.postMessage).toHaveBeenCalledWith({ type: 'done' });
    });
  });

  describe('refresh handler', () => {
    it('calls service.refreshPageNumbers and sends done', async () => {
      const { service, dispatch } = makeBridgeAndController();
      dispatch({ type: 'refresh', mold: validMold });
      await new Promise((r) => setTimeout(r, 0));
      expect(service.refreshPageNumbers).toHaveBeenCalledWith(validMold);
      expect(getFigma().ui.postMessage).toHaveBeenCalledWith({ type: 'done' });
    });
  });

  describe('remove-all handler', () => {
    it('calls service.removeAllPageNumbers and sends done', async () => {
      const { service, dispatch } = makeBridgeAndController();
      dispatch({ type: 'remove-all', mold: validMold });
      await new Promise((r) => setTimeout(r, 0));
      expect(service.removeAllPageNumbers).toHaveBeenCalledWith(validMold);
      expect(getFigma().ui.postMessage).toHaveBeenCalledWith({ type: 'done' });
    });
  });

  describe('get-components handler', () => {
    it('sends component-list with service.getComponents result', () => {
      const { service, dispatch } = makeBridgeAndController();
      vi.mocked(service.getComponents).mockReturnValue([{ id: 'c1', name: 'Comp' }]);
      dispatch({ type: 'get-components' });
      expect(getFigma().ui.postMessage).toHaveBeenCalledWith({
        type: 'component-list',
        components: [{ id: 'c1', name: 'Comp' }],
      });
    });
  });

  describe('close handler', () => {
    it('calls figma.closePlugin', () => {
      const { dispatch } = makeBridgeAndController();
      dispatch({ type: 'close' });
      expect(getFigma().closePlugin).toHaveBeenCalled();
    });
  });
});
