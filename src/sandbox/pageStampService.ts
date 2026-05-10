import type { FigmaSectionInfo, FigmaComponentInfo, PageStampMold } from '../types';

export class PageStampService {
  getSections(): FigmaSectionInfo[] {
    return figma.root
      .findAllWithCriteria({ types: ['SECTION'] })
      .map(({ id, name }) => ({ id, name }));
  }

  getComponents(): FigmaComponentInfo[] {
    return figma.root
      .findAllWithCriteria({ types: ['COMPONENT'] })
      .map(({ id, name }) => ({ id, name }));
  }

  private sortByTL(frames: FrameNode[]): FrameNode[] {
    const TL_THRESHOLD = 10;
    return [...frames].sort((a, b) => (Math.abs(a.y - b.y) < TL_THRESHOLD ? a.x - b.x : a.y - b.y));
  }

  private getFramesFromSection(sectionId: string): FrameNode[] {
    const node = figma.getNodeById(sectionId);
    if (!node || node.type !== 'SECTION') throw new Error('Section not found');
    const frames = node.children.filter((n): n is FrameNode => n.type === 'FRAME');
    if (frames.length === 0) throw new Error('No frames found in the section');
    return frames;
  }

  private async loadFont(textNode: TextNode): Promise<void> {
    const fontName = textNode.fontName;
    if (fontName === figma.mixed) {
      throw new Error('Mixed fonts are not supported. Use a text layer with a single font.');
    }
    await figma.loadFontAsync(fontName);
  }

  private async createDefaultPageNumberComponent(frames: FrameNode[]): Promise<ComponentNode> {
    await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });

    const component = figma.createComponent();
    component.name = 'PageNumber / Default';
    figma.currentPage.appendChild(component);

    const bg = figma.createRectangle();
    bg.fills = [{ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }];
    bg.cornerRadius = 4;

    const text = figma.createText();
    text.name = '{page_number}';
    text.characters = '1';
    text.fontSize = 14;
    text.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];

    component.appendChild(bg);
    component.appendChild(text);

    component.layoutMode = 'HORIZONTAL';
    component.primaryAxisSizingMode = 'FIXED';
    component.counterAxisSizingMode = 'FIXED';
    component.resize(60, 32);
    component.primaryAxisAlignItems = 'CENTER';
    component.counterAxisAlignItems = 'CENTER';
    component.paddingLeft = 12;
    component.paddingRight = 12;
    component.paddingTop = 8;
    component.paddingBottom = 8;

    const firstFrame = frames[0];
    component.x = firstFrame.x + firstFrame.width + 40;
    component.y = firstFrame.y;

    return component;
  }

  async applyPageNumbers(mold: PageStampMold): Promise<void> {
    const frames = this.getFramesFromSection(mold.sectionId);

    let component: ComponentNode;
    let createdComponent: ComponentNode | null = null;

    if (mold.useDefaultComponent) {
      component = await this.createDefaultPageNumberComponent(frames);
      createdComponent = component;
    } else {
      const node = figma.getNodeById(mold.componentId);
      if (!node || node.type !== 'COMPONENT') throw new Error('Component not found');
      component = node;
    }

    const sortedFrames = this.sortByTL(frames);
    const inserted: InstanceNode[] = [];

    try {
      for (let i = 0; i < sortedFrames.length; i++) {
        const frame = sortedFrames[i];
        const instance = component.createInstance();
        frame.appendChild(instance);
        inserted.push(instance);

        if (mold.positioningMode === 'ABSOLUTE') {
          instance.layoutPositioning = 'ABSOLUTE';
          instance.x = mold.position.x;
          instance.y = mold.position.y;
        }

        instance.setPluginData('isPageNumber', 'true');

        const textLayer = instance.findOne(
          (n) => n.type === 'TEXT' && n.name === mold.textLayerName,
        ) as TextNode | null;
        if (!textLayer) throw new Error(`Text layer '${mold.textLayerName}' not found`);

        await this.loadFont(textLayer);
        textLayer.characters = String(i + mold.startNumber);
      }
    } catch (e) {
      inserted.forEach((n) => n.remove());
      if (createdComponent) createdComponent.remove();
      throw e;
    }
  }

  async refreshPageNumbers(mold: PageStampMold): Promise<void> {
    const frames = this.getFramesFromSection(mold.sectionId);
    const sortedFrames = this.sortByTL(frames);
    const warnings: string[] = [];

    for (let i = 0; i < sortedFrames.length; i++) {
      const frame = sortedFrames[i];
      const instance = frame.findOne(
        (n) => n.getPluginData('isPageNumber') === 'true',
      ) as InstanceNode | null;

      if (!instance) continue;

      const textLayer = instance.findOne(
        (n) => n.type === 'TEXT' && n.name === mold.textLayerName,
      ) as TextNode | null;

      if (!textLayer) {
        warnings.push(`Frame "${frame.name}": text layer '${mold.textLayerName}' not found`);
        continue;
      }

      await this.loadFont(textLayer);
      textLayer.characters = String(i + mold.startNumber);
    }

    if (warnings.length > 0) {
      figma.notify(`Some page numbers could not be updated: ${warnings.join('; ')}`, {
        error: true,
      });
    }
  }

  async removeAllPageNumbers(mold: PageStampMold): Promise<void> {
    const frames = this.getFramesFromSection(mold.sectionId);

    try {
      for (const frame of frames) {
        const instances = frame.findAll((n) => n.getPluginData('isPageNumber') === 'true');
        instances.forEach((n) => n.remove());
      }
    } catch (e) {
      throw new Error(
        `Failed to remove page numbers: ${e instanceof Error ? e.message : 'Unknown error'}`,
      );
    }
  }
}
