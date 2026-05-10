import { vi, beforeEach } from 'vitest';

export type FigmaMock = ReturnType<typeof makeFigmaMock>;

export function makeMockTextNode(overrides: Partial<TextNode> = {}): TextNode {
  return {
    id: 'text-node',
    type: 'TEXT',
    name: '{page_number}',
    characters: '',
    fontSize: 14,
    fontName: { family: 'Inter', style: 'Regular' },
    fills: [],
    remove: vi.fn(),
    getPluginData: vi.fn(() => ''),
    setPluginData: vi.fn(),
    ...overrides,
  } as unknown as TextNode;
}

export function makeMockInstance(
  textNodeOverrides: Partial<TextNode> = {},
  overrides: Partial<InstanceNode> = {},
): InstanceNode {
  const textNode = makeMockTextNode(textNodeOverrides);
  return {
    id: `instance-${Math.random().toString(36).slice(2)}`,
    type: 'INSTANCE',
    name: 'PageNumber / Default',
    x: 0,
    y: 0,
    layoutPositioning: 'AUTO',
    remove: vi.fn(),
    appendChild: vi.fn(),
    findOne: vi.fn((pred: (n: SceneNode) => boolean) =>
      pred(textNode as unknown as SceneNode) ? textNode : null,
    ),
    findAll: vi.fn(() => []),
    getPluginData: vi.fn(() => ''),
    setPluginData: vi.fn(),
    ...overrides,
  } as unknown as InstanceNode;
}

export function makeMockComponent(overrides: Partial<ComponentNode> = {}): ComponentNode {
  const instance = makeMockInstance();
  return {
    id: 'component-node',
    type: 'COMPONENT',
    name: 'PageNumber / Default',
    x: 0,
    y: 0,
    layoutMode: 'NONE' as AutoLayoutMixin['layoutMode'],
    primaryAxisSizingMode: 'AUTO' as ComponentNode['primaryAxisSizingMode'],
    counterAxisSizingMode: 'AUTO' as ComponentNode['counterAxisSizingMode'],
    primaryAxisAlignItems: 'MIN' as ComponentNode['primaryAxisAlignItems'],
    counterAxisAlignItems: 'MIN' as ComponentNode['counterAxisAlignItems'],
    paddingLeft: 0,
    paddingRight: 0,
    paddingTop: 0,
    paddingBottom: 0,
    remove: vi.fn(),
    appendChild: vi.fn(),
    resize: vi.fn(),
    createInstance: vi.fn(() => instance),
    ...overrides,
  } as unknown as ComponentNode;
}

export function makeMockFrame(overrides: Partial<FrameNode> = {}): FrameNode {
  return {
    id: `frame-${Math.random().toString(36).slice(2)}`,
    type: 'FRAME',
    name: 'Frame',
    x: 0,
    y: 0,
    width: 100,
    height: 100,
    children: [],
    remove: vi.fn(),
    appendChild: vi.fn(),
    findOne: vi.fn(() => null),
    findAll: vi.fn(() => []),
    getPluginData: vi.fn(() => ''),
    setPluginData: vi.fn(),
    ...overrides,
  } as unknown as FrameNode;
}

export function makeMockSection(
  frames: FrameNode[],
  overrides: Partial<SectionNode> = {},
): SectionNode {
  return {
    id: 'section-node',
    type: 'SECTION',
    name: 'Section',
    children: frames as SceneNode[],
    ...overrides,
  } as unknown as SectionNode;
}

export function makeFigmaMock() {
  const uiState: { onmessage?: (msg: unknown) => void } = {};
  const mixed = Symbol('figma.mixed');

  return {
    ui: {
      postMessage: vi.fn(),
      get onmessage() {
        return uiState.onmessage;
      },
      set onmessage(fn: ((msg: unknown) => void) | undefined) {
        uiState.onmessage = fn;
      },
    },
    root: {
      findAllWithCriteria: vi.fn(),
    },
    currentPage: {
      appendChild: vi.fn(),
    },
    getNodeById: vi.fn((_id: string) => null as BaseNode | null),
    createComponent: vi.fn(() => makeMockComponent()),
    createRectangle: vi.fn(() => ({
      id: 'rect',
      type: 'RECTANGLE',
      fills: [] as Paint[],
      cornerRadius: 0,
      remove: vi.fn(),
    })),
    createText: vi.fn(() => makeMockTextNode()),
    loadFontAsync: vi.fn(() => Promise.resolve()),
    notify: vi.fn(),
    closePlugin: vi.fn(),
    mixed,
  };
}

export function getFigma(): FigmaMock {
  return (globalThis as Record<string, unknown>).figma as FigmaMock;
}

beforeEach(() => {
  (globalThis as Record<string, unknown>).figma = makeFigmaMock();
});
