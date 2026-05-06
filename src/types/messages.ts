import type { FigmaSectionInfo, FigmaComponentInfo, PageStampMold } from './domain';

// UI → Sandbox
export type UiMessage =
  | { type: 'apply'; mold: PageStampMold }
  | { type: 'refresh'; mold: PageStampMold }
  | { type: 'remove-all'; mold: PageStampMold }
  | { type: 'get-components' }
  | { type: 'close' };

// Sandbox → UI
export type SandboxMessage =
  | { type: 'section-list'; sections: FigmaSectionInfo[] }
  | { type: 'component-list'; components: FigmaComponentInfo[] }
  | { type: 'done' }
  | { type: 'error'; message: string };
