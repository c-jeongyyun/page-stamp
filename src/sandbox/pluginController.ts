import type { PageStampMold } from '../types';
import { SandboxBridge } from './bridge';
import { PageStampService } from './pageStampService';

function validateMold(mold: unknown): asserts mold is PageStampMold {
  if (typeof mold !== 'object' || mold === null)
    throw new Error('Invalid message: mold is missing');
  const m = mold as Record<string, unknown>;
  if (typeof m.sectionId !== 'string' || !m.sectionId)
    throw new Error('Invalid mold: sectionId must be a non-empty string');
  if (typeof m.textLayerName !== 'string' || !m.textLayerName)
    throw new Error('Invalid mold: textLayerName must be a non-empty string');
  if (typeof m.useDefaultComponent !== 'boolean')
    throw new Error('Invalid mold: useDefaultComponent must be a boolean');
  if (!m.useDefaultComponent && (typeof m.componentId !== 'string' || !m.componentId))
    throw new Error(
      'Invalid mold: componentId must be a non-empty string when useDefaultComponent is false',
    );
  if (m.positioningMode !== 'ABSOLUTE' && m.positioningMode !== 'AUTO_LAYOUT')
    throw new Error('Invalid mold: positioningMode must be ABSOLUTE or AUTO_LAYOUT');
  if (m.positioningMode === 'ABSOLUTE') {
    const pos = m.position as Record<string, unknown> | undefined;
    if (!pos || typeof pos.x !== 'number' || typeof pos.y !== 'number')
      throw new Error('Invalid mold: position must have numeric x and y in ABSOLUTE mode');
  }
  if (typeof m.startNumber !== 'number' || m.startNumber < 1)
    throw new Error('Invalid mold: startNumber must be a positive number');
  if (m.pagingFormat !== 'simple') throw new Error('Invalid mold: pagingFormat must be "simple"');
}

export class PluginController {
  constructor(
    private bridge: SandboxBridge,
    private service: PageStampService,
  ) {}

  init(): void {
    this.bridge.on('apply', async (msg) => {
      validateMold(msg.mold);
      await this.service.applyPageNumbers(msg.mold);
      this.bridge.send({ type: 'done' });
    });

    this.bridge.on('refresh', async (msg) => {
      validateMold(msg.mold);
      await this.service.refreshPageNumbers(msg.mold);
      this.bridge.send({ type: 'done' });
    });

    this.bridge.on('remove-all', async (msg) => {
      validateMold(msg.mold);
      await this.service.removeAllPageNumbers(msg.mold);
      this.bridge.send({ type: 'done' });
    });

    this.bridge.on('get-components', () => {
      this.bridge.send({
        type: 'component-list',
        components: this.service.getComponents(),
      });
    });

    this.bridge.on('close', () => {
      figma.closePlugin();
    });

    this.bridge.listen();
  }
}
