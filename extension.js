import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';
import { LolService } from './dbusService.js';

export default class LolAnotherWindowExtension extends Extension {
    enable() {
        this._service = new LolService();
        this._service.enable();
    }

    disable() {
        this._service.disable();
        this._service = null;
    }
}
