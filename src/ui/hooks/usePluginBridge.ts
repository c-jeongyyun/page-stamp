import { useState, useEffect, useRef } from 'react';
import { UIBridge } from '../bridge';
import type { FigmaSectionInfo, FigmaComponentInfo, PageStampMold } from '../../types';

const DONE_RESET_DELAY_MS = 3000;

export function usePluginBridge() {
  const bridgeRef = useRef<UIBridge | null>(null);

  const [sections, setSections] = useState<FigmaSectionInfo[]>([]);
  const [components, setComponents] = useState<FigmaComponentInfo[]>([]);

  const [sectionId, setSectionId] = useState('');

  const [useDefaultComponent, setUseDefaultComponent] = useState(true);
  const [componentId, setComponentId] = useState('');
  const [textLayerName, setTextLayerName] = useState('{page_number}');

  const [positioningMode, setPositioningMode] = useState<'ABSOLUTE' | 'AUTO_LAYOUT'>('ABSOLUTE');
  const [position, setPosition] = useState({ x: 40, y: 40 });

  const [startNumber, setStartNumber] = useState(1);

  const [status, setStatus] = useState<'idle' | 'loading' | 'error' | 'done'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const bridge = new UIBridge();
    bridgeRef.current = bridge;

    bridge.on('section-list', ({ sections: s }) => setSections(s));
    bridge.on('component-list', ({ components: c }) => setComponents(c));
    bridge.on('done', () => {
      setStatus('done');
      setTimeout(() => setStatus('idle'), DONE_RESET_DELAY_MS);
    });
    bridge.on('error', ({ message }) => {
      setStatus('error');
      setErrorMessage(message);
    });

    return bridge.listen();
  }, []);

  const isValid = (() => {
    if (!sectionId) return false;
    if (!useDefaultComponent && (!componentId || !textLayerName)) return false;
    if (startNumber < 1) return false;
    return true;
  })();

  function buildMold(): PageStampMold {
    return {
      sectionId,
      componentId,
      useDefaultComponent,
      textLayerName,
      positioningMode,
      position,
      pagingFormat: 'simple',
      startNumber,
    };
  }

  function onApply() {
    if (!bridgeRef.current) return;
    setStatus('loading');
    bridgeRef.current.send({ type: 'apply', mold: buildMold() });
  }

  function onRefresh() {
    if (!bridgeRef.current) return;
    setStatus('loading');
    bridgeRef.current.send({ type: 'refresh', mold: buildMold() });
  }

  function onRemove() {
    if (!bridgeRef.current) return;
    setStatus('loading');
    bridgeRef.current.send({ type: 'remove-all', mold: buildMold() });
  }

  return {
    sections,
    components,
    sectionId,
    selectSection: setSectionId,
    useDefaultComponent,
    selectDefaultComponent: setUseDefaultComponent,
    componentId,
    selectComponent: setComponentId,
    textLayerName,
    setTextLayerName,
    positioningMode,
    setPositioningMode,
    position,
    setStampPosition: setPosition,
    startNumber,
    setStartNumber,
    status,
    errorMessage,
    isValid,
    onApply,
    onRefresh,
    onRemove,
  };
}
