import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import Shell from 'gi://Shell';

const IFACE_XML = `
<node>
  <interface name="org.gnome.Shell.Extensions.LolAnotherWindowExtension">
    <method name="FocusClass">
      <arg type="s" direction="out" name="wmClass" />
    </method>
    <method name="FocusTitle">
      <arg type="s" direction="out" name="title" />
    </method>
    <method name="FocusAppId">
      <arg type="s" direction="out" name="appId" />
    </method>
    <signal name="WindowChanged">
      <arg type="s" name="wmClass" />
      <arg type="s" name="title" />
    </signal>
  </interface>
</node>`;

const OBJ_PATH = '/org/gnome/Shell/Extensions/LolAnotherWindowExtension';

export class LolService {
    constructor() {
        this._wmClass = '';
        this._title   = '';
        this._appId   = '';
        this._focusId = null;
        this._titleId = null;
        this._win     = null;
        this._dbus    = null;
    }

    enable() {
        this._dbus = Gio.DBusExportedObject.wrapJSObject(IFACE_XML, this);
        this._dbus.export(Gio.DBus.session, OBJ_PATH);

        this._focusId = global.display.connect('notify::focus-window', () => this._onFocus());

        this._onFocus();
    }

    disable() {
        if (this._focusId) {
            global.display.disconnect(this._focusId);
            this._focusId = null;
        }

        this._unhookTitle();

        if (this._dbus) {
            this._dbus.flush();
            this._dbus.unexport();
            this._dbus = null;
        }

        this._win = null;
    }

    // d-bus methods
    FocusClass() { return this._wmClass; }
    FocusTitle() { return this._title;   }
    FocusAppId() { return this._appId;   }

    _onFocus() {
        this._unhookTitle();

        const win = global.display.get_focus_window();
        this._win = win;

        if (win) {
            this._wmClass = win.get_wm_class() ?? '';
            this._title   = win.get_title()    ?? '';

            const app     = Shell.WindowTracker.get_default().get_window_app(win);
            this._appId   = app ? app.get_id() : '';

            this._titleId = win.connect('notify::title', () => this._onTitle());
        } else {
            this._wmClass = '';
            this._title   = '';
            this._appId   = '';
        }

        this._emit();
    }

    _onTitle() {
        this._title = this._win?.get_title() ?? '';
        this._emit();
    }

    _emit() {
        this._dbus?.emit_signal(
            'WindowChanged',
            new GLib.Variant('(ss)', [this._wmClass, this._title])
        );
    }

    _unhookTitle() {
        if (this._titleId !== null && this._win) {
            this._win.disconnect(this._titleId);
            this._titleId = null;
        }
    }
}