import { SandboxBridge } from './bridge';
import { PluginController } from './pluginController';
import { PageStampService } from './pageStampService';

figma.showUI(__html__, { width: 320, height: 480 });

const bridge = new SandboxBridge();
const service = new PageStampService();
const controller = new PluginController(bridge, service);

controller.init();

try {
  bridge.send({ type: 'section-list', sections: service.getSections() });
  bridge.send({ type: 'component-list', components: service.getComponents() });
} catch {
  figma.notify('Failed to initialize plugin.', { error: true });
  figma.closePlugin();
}
