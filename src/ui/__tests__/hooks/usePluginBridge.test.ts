import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/preact';
import { usePluginBridge } from '../../hooks/usePluginBridge';

function dispatchSandboxMessage(msg: object) {
  window.dispatchEvent(
    new MessageEvent('message', {
      data: { pluginMessage: msg },
    }),
  );
}

describe('usePluginBridge', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  describe('initial state', () => {
    it('returns default state values', () => {
      const { result } = renderHook(() => usePluginBridge());
      expect(result.current.sections).toEqual([]);
      expect(result.current.components).toEqual([]);
      expect(result.current.sectionId).toBe('');
      expect(result.current.useDefaultComponent).toBe(true);
      expect(result.current.componentId).toBe('');
      expect(result.current.textLayerName).toBe('{page_number}');
      expect(result.current.positioningMode).toBe('ABSOLUTE');
      expect(result.current.position).toEqual({ x: 40, y: 40 });
      expect(result.current.startNumber).toBe(1);
      expect(result.current.status).toBe('idle');
      expect(result.current.errorMessage).toBe('');
    });
  });

  describe('message handling', () => {
    it('updates sections when section-list is received', () => {
      const { result } = renderHook(() => usePluginBridge());
      const sections = [{ id: 's1', name: 'Section 1' }];
      act(() => {
        dispatchSandboxMessage({ type: 'section-list', sections });
      });
      expect(result.current.sections).toEqual(sections);
    });

    it('updates components when component-list is received', () => {
      const { result } = renderHook(() => usePluginBridge());
      const components = [{ id: 'c1', name: 'Component 1' }];
      act(() => {
        dispatchSandboxMessage({ type: 'component-list', components });
      });
      expect(result.current.components).toEqual(components);
    });

    it('sets status to done then idle after timeout when done is received', () => {
      vi.useFakeTimers();
      const { result } = renderHook(() => usePluginBridge());
      act(() => {
        dispatchSandboxMessage({ type: 'done' });
      });
      expect(result.current.status).toBe('done');
      act(() => {
        vi.advanceTimersByTime(3000);
      });
      expect(result.current.status).toBe('idle');
    });

    it('sets status to error and updates errorMessage when error is received', () => {
      const { result } = renderHook(() => usePluginBridge());
      act(() => {
        dispatchSandboxMessage({ type: 'error', message: 'Something went wrong' });
      });
      expect(result.current.status).toBe('error');
      expect(result.current.errorMessage).toBe('Something went wrong');
    });
  });

  describe('isValid', () => {
    it('is false when sectionId is empty', () => {
      const { result } = renderHook(() => usePluginBridge());
      expect(result.current.isValid).toBe(false);
    });

    it('is true when sectionId is set and useDefaultComponent is true', () => {
      const { result } = renderHook(() => usePluginBridge());
      act(() => {
        result.current.selectSection('s1');
      });
      expect(result.current.isValid).toBe(true);
    });

    it('is false when useDefaultComponent is false and componentId is empty', () => {
      const { result } = renderHook(() => usePluginBridge());
      act(() => {
        result.current.selectSection('s1');
        result.current.selectDefaultComponent(false);
      });
      expect(result.current.isValid).toBe(false);
    });

    it('is true when useDefaultComponent is false and both componentId and textLayerName are set', () => {
      const { result } = renderHook(() => usePluginBridge());
      act(() => {
        result.current.selectSection('s1');
        result.current.selectDefaultComponent(false);
        result.current.selectComponent('c1');
        // textLayerName defaults to '{page_number}'
      });
      expect(result.current.isValid).toBe(true);
    });

    it('is false when useDefaultComponent is false and textLayerName is empty', () => {
      const { result } = renderHook(() => usePluginBridge());
      act(() => {
        result.current.selectSection('s1');
        result.current.selectDefaultComponent(false);
        result.current.selectComponent('c1');
        result.current.setTextLayerName('');
      });
      expect(result.current.isValid).toBe(false);
    });

    it('is false when startNumber is less than 1', () => {
      const { result } = renderHook(() => usePluginBridge());
      act(() => {
        result.current.selectSection('s1');
        result.current.setStartNumber(0);
      });
      expect(result.current.isValid).toBe(false);
    });
  });

  describe('actions', () => {
    it('onApply sends apply message with mold and sets status to loading', () => {
      const { result } = renderHook(() => usePluginBridge());
      act(() => {
        result.current.selectSection('s1');
      });
      act(() => {
        result.current.onApply();
      });
      expect(parent.postMessage).toHaveBeenCalledWith(
        {
          pluginMessage: {
            type: 'apply',
            mold: expect.objectContaining({ sectionId: 's1' }),
          },
        },
        '*',
      );
      expect(result.current.status).toBe('loading');
    });

    it('onRefresh sends refresh message with mold and sets status to loading', () => {
      const { result } = renderHook(() => usePluginBridge());
      act(() => {
        result.current.selectSection('s1');
      });
      act(() => {
        result.current.onRefresh();
      });
      expect(parent.postMessage).toHaveBeenCalledWith(
        {
          pluginMessage: {
            type: 'refresh',
            mold: expect.objectContaining({ sectionId: 's1' }),
          },
        },
        '*',
      );
      expect(result.current.status).toBe('loading');
    });

    it('onRemove sends remove-all message with mold and sets status to loading', () => {
      const { result } = renderHook(() => usePluginBridge());
      act(() => {
        result.current.selectSection('s1');
      });
      act(() => {
        result.current.onRemove();
      });
      expect(parent.postMessage).toHaveBeenCalledWith(
        {
          pluginMessage: {
            type: 'remove-all',
            mold: expect.objectContaining({ sectionId: 's1' }),
          },
        },
        '*',
      );
      expect(result.current.status).toBe('loading');
    });

    it('buildMold includes all current state values', () => {
      const { result } = renderHook(() => usePluginBridge());
      act(() => {
        result.current.selectSection('s1');
        result.current.selectDefaultComponent(false);
        result.current.selectComponent('c1');
        result.current.setTextLayerName('pageNum');
        result.current.setPositioningMode('AUTO_LAYOUT');
        result.current.setStartNumber(5);
      });
      act(() => {
        result.current.onApply();
      });
      expect(parent.postMessage).toHaveBeenCalledWith(
        {
          pluginMessage: {
            type: 'apply',
            mold: {
              sectionId: 's1',
              useDefaultComponent: false,
              componentId: 'c1',
              textLayerName: 'pageNum',
              positioningMode: 'AUTO_LAYOUT',
              position: { x: 40, y: 40 },
              pagingFormat: 'simple',
              startNumber: 5,
            },
          },
        },
        '*',
      );
    });
  });
});
