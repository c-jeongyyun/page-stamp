import { describe, it, expect, vi } from 'vitest';
import { PageStampService } from '../pageStampService';
import {
  getFigma,
  makeMockFrame,
  makeMockSection,
  makeMockComponent,
  makeMockInstance,
  makeMockTextNode,
} from './setup';
import type { PageStampMold } from '../../types';

function makeService() {
  return new PageStampService();
}

const BASE_MOLD: PageStampMold = {
  sectionId: 'section-node',
  componentId: 'component-node',
  useDefaultComponent: false,
  textLayerName: '{page_number}',
  positioningMode: 'AUTO_LAYOUT',
  position: { x: 0, y: 0 },
  pagingFormat: 'simple',
  startNumber: 1,
};

describe('PageStampService', () => {
  describe('getSections', () => {
    it('returns mapped id/name from findAllWithCriteria SECTION', () => {
      getFigma().root.findAllWithCriteria.mockReturnValue([
        { id: 's1', name: 'Section A' },
        { id: 's2', name: 'Section B' },
      ]);
      const result = makeService().getSections();
      expect(result).toEqual([
        { id: 's1', name: 'Section A' },
        { id: 's2', name: 'Section B' },
      ]);
    });
  });

  describe('getComponents', () => {
    it('returns mapped id/name from findAllWithCriteria COMPONENT', () => {
      getFigma().root.findAllWithCriteria.mockReturnValue([{ id: 'c1', name: 'Comp A' }]);
      const result = makeService().getComponents();
      expect(result).toEqual([{ id: 'c1', name: 'Comp A' }]);
    });
  });

  describe('applyPageNumbers', () => {
    it('throws when section is not found', async () => {
      getFigma().getNodeById.mockReturnValue(null);
      await expect(makeService().applyPageNumbers(BASE_MOLD)).rejects.toThrow('Section not found');
    });

    it('throws when section has no frames', async () => {
      const section = makeMockSection([]);
      getFigma().getNodeById.mockReturnValue(section);
      await expect(makeService().applyPageNumbers(BASE_MOLD)).rejects.toThrow('No frames found');
    });

    it('throws when component is not found', async () => {
      const frame = makeMockFrame();
      const section = makeMockSection([frame]);
      getFigma().getNodeById.mockImplementation((id: string) =>
        id === 'section-node' ? section : null,
      );
      await expect(makeService().applyPageNumbers(BASE_MOLD)).rejects.toThrow(
        'Component not found',
      );
    });

    it('inserts one instance per frame with correct page number', async () => {
      const frame1 = makeMockFrame({ x: 0, y: 0 });
      const frame2 = makeMockFrame({ x: 200, y: 0 });
      const section = makeMockSection([frame1, frame2]);
      const textNode1 = makeMockTextNode({ name: '{page_number}' });
      const textNode2 = makeMockTextNode({ name: '{page_number}' });
      const instance1 = makeMockInstance(
        {},
        {
          findOne: vi.fn((pred: (n: SceneNode) => boolean) =>
            pred(textNode1 as unknown as SceneNode) ? textNode1 : null,
          ),
        },
      );
      const instance2 = makeMockInstance(
        {},
        {
          findOne: vi.fn((pred: (n: SceneNode) => boolean) =>
            pred(textNode2 as unknown as SceneNode) ? textNode2 : null,
          ),
        },
      );
      const component = makeMockComponent({
        createInstance: vi.fn().mockReturnValueOnce(instance1).mockReturnValueOnce(instance2),
      });

      getFigma().getNodeById.mockImplementation((id: string) =>
        id === 'section-node' ? section : id === 'component-node' ? component : null,
      );

      await makeService().applyPageNumbers(BASE_MOLD);

      expect(frame1.appendChild).toHaveBeenCalledWith(instance1);
      expect(frame2.appendChild).toHaveBeenCalledWith(instance2);
      expect(textNode1.characters).toBe('1');
      expect(textNode2.characters).toBe('2');
    });

    it('sets layoutPositioning=ABSOLUTE when positioningMode is ABSOLUTE', async () => {
      const frame = makeMockFrame();
      const section = makeMockSection([frame]);
      const textNode = makeMockTextNode({ name: '{page_number}' });
      const instance = makeMockInstance(
        {},
        {
          findOne: vi.fn(() => textNode),
        },
      );
      const component = makeMockComponent({ createInstance: vi.fn(() => instance) });

      getFigma().getNodeById.mockImplementation((id: string) =>
        id === 'section-node' ? section : component,
      );

      const mold: PageStampMold = {
        ...BASE_MOLD,
        positioningMode: 'ABSOLUTE',
        position: { x: 12, y: 34 },
      };
      await makeService().applyPageNumbers(mold);

      expect(instance.layoutPositioning).toBe('ABSOLUTE');
      expect(instance.x).toBe(12);
      expect(instance.y).toBe(34);
    });

    it('rollbacks all inserted instances when an error occurs mid-loop', async () => {
      const frame1 = makeMockFrame({ x: 0, y: 0 });
      const frame2 = makeMockFrame({ x: 200, y: 0 });
      const section = makeMockSection([frame1, frame2]);
      const instance1 = makeMockInstance();
      // instance2 has no matching text layer → will throw
      const instance2 = makeMockInstance({}, { findOne: vi.fn(() => null) });
      const component = makeMockComponent({
        createInstance: vi.fn().mockReturnValueOnce(instance1).mockReturnValueOnce(instance2),
      });

      getFigma().getNodeById.mockImplementation((id: string) =>
        id === 'section-node' ? section : component,
      );

      await expect(makeService().applyPageNumbers(BASE_MOLD)).rejects.toThrow();
      expect(vi.mocked(instance1.remove)).toHaveBeenCalled();
    });

    it('rollbacks auto-created component when an error occurs', async () => {
      const frame = makeMockFrame();
      const section = makeMockSection([frame]);
      // instance has no matching text layer
      const instance = makeMockInstance({}, { findOne: vi.fn(() => null) });
      const component = makeMockComponent({ createInstance: vi.fn(() => instance) });

      getFigma().getNodeById.mockImplementation((id: string) =>
        id === 'section-node' ? section : null,
      );
      getFigma().createComponent.mockReturnValue(component);

      const mold = { ...BASE_MOLD, useDefaultComponent: true };
      await expect(makeService().applyPageNumbers(mold)).rejects.toThrow();
      expect(vi.mocked(component.remove)).toHaveBeenCalled();
    });

    it('throws when fontName is figma.mixed', async () => {
      const frame = makeMockFrame();
      const section = makeMockSection([frame]);
      const textNode = makeMockTextNode({ fontName: getFigma().mixed as unknown as FontName });
      const instance = makeMockInstance({}, { findOne: vi.fn(() => textNode) });
      const component = makeMockComponent({ createInstance: vi.fn(() => instance) });

      getFigma().getNodeById.mockImplementation((id: string) =>
        id === 'section-node' ? section : component,
      );

      await expect(makeService().applyPageNumbers(BASE_MOLD)).rejects.toThrow('Mixed fonts');
    });

    it('creates and places default component when useDefaultComponent is true', async () => {
      const frame = makeMockFrame({ x: 50, y: 100, width: 200, height: 100 });
      const section = makeMockSection([frame]);
      const textNode = makeMockTextNode({ name: '{page_number}' });
      const instance = makeMockInstance({}, { findOne: vi.fn(() => textNode) });
      const component = makeMockComponent({ createInstance: vi.fn(() => instance) });

      getFigma().getNodeById.mockReturnValue(section);
      getFigma().createComponent.mockReturnValue(component);

      const mold = { ...BASE_MOLD, useDefaultComponent: true };
      await makeService().applyPageNumbers(mold);

      expect(getFigma().createComponent).toHaveBeenCalled();
      expect(getFigma().currentPage.appendChild).toHaveBeenCalledWith(component);
      expect(component.x).toBe(290); // 50 + 200 + 40
      expect(component.y).toBe(100);
    });
  });

  describe('refreshPageNumbers', () => {
    it('skips frames with no stamp instance', async () => {
      const frame = makeMockFrame({ findOne: vi.fn(() => null) });
      const section = makeMockSection([frame]);
      getFigma().getNodeById.mockReturnValue(section);

      await makeService().refreshPageNumbers(BASE_MOLD);
      expect(getFigma().loadFontAsync).not.toHaveBeenCalled();
    });

    it('updates characters of existing stamp instances in TL order', async () => {
      const textNode1 = makeMockTextNode({ name: '{page_number}' });
      const textNode2 = makeMockTextNode({ name: '{page_number}' });
      const instance1 = makeMockInstance(
        {},
        {
          getPluginData: vi.fn(() => 'true'),
          findOne: vi.fn(() => textNode1),
        },
      );
      const instance2 = makeMockInstance(
        {},
        {
          getPluginData: vi.fn(() => 'true'),
          findOne: vi.fn(() => textNode2),
        },
      );
      // frame2 is left of frame1 vertically (same row), so TL: frame2 then frame1
      const frame1 = makeMockFrame({ x: 200, y: 0, findOne: vi.fn(() => instance1) });
      const frame2 = makeMockFrame({ x: 0, y: 0, findOne: vi.fn(() => instance2) });
      const section = makeMockSection([frame1, frame2]);
      getFigma().getNodeById.mockReturnValue(section);

      await makeService().refreshPageNumbers(BASE_MOLD);

      expect(textNode2.characters).toBe('1'); // frame2 (x=0) is first in TL order
      expect(textNode1.characters).toBe('2');
    });

    it('calls figma.notify when text layer is missing from existing instance', async () => {
      const instance = makeMockInstance(
        {},
        {
          getPluginData: vi.fn(() => 'true'),
          findOne: vi.fn(() => null),
        },
      );
      const frame = makeMockFrame({ findOne: vi.fn(() => instance) });
      const section = makeMockSection([frame]);
      getFigma().getNodeById.mockReturnValue(section);

      await makeService().refreshPageNumbers(BASE_MOLD);
      expect(getFigma().notify).toHaveBeenCalledWith(
        expect.stringContaining('could not be updated'),
        { error: true },
      );
    });
  });

  describe('removeAllPageNumbers', () => {
    it('removes all stamp instances from every frame', async () => {
      const stampInstance = makeMockInstance({}, { getPluginData: vi.fn(() => 'true') });
      const frame = makeMockFrame({
        findAll: vi.fn(() => [stampInstance]),
      });
      const section = makeMockSection([frame]);
      getFigma().getNodeById.mockReturnValue(section);

      await makeService().removeAllPageNumbers(BASE_MOLD);
      expect(vi.mocked(stampInstance.remove)).toHaveBeenCalled();
    });

    it('does not remove nodes that are not stamps', async () => {
      const nonStamp = makeMockInstance({}, { getPluginData: vi.fn(() => '') });
      const frame = makeMockFrame({
        findAll: vi.fn(() => []),
      });
      const section = makeMockSection([frame]);
      getFigma().getNodeById.mockReturnValue(section);

      await makeService().removeAllPageNumbers(BASE_MOLD);
      expect(vi.mocked(nonStamp.remove)).not.toHaveBeenCalled();
    });

    it('throws wrapped error when remove fails', async () => {
      const stampInstance = makeMockInstance(
        {},
        {
          getPluginData: vi.fn(() => 'true'),
          remove: vi.fn(() => {
            throw new Error('remove failed');
          }),
        },
      );
      const frame = makeMockFrame({ findAll: vi.fn(() => [stampInstance]) });
      const section = makeMockSection([frame]);
      getFigma().getNodeById.mockReturnValue(section);

      await expect(makeService().removeAllPageNumbers(BASE_MOLD)).rejects.toThrow(
        'Failed to remove page numbers',
      );
    });
  });
});
