import Gio from 'gi://Gio';
import GLib from 'gi://GLib';

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

// Parse XML once at module scope — fixes GNOME 51 where wrapJSObject with a
// raw string on every enable() breaks the method-lookup cache in GDBus and
// GjsPrivate.DBusImplementation became a final type (no more subclassing).
// Passing the pre-parsed GDBusInterfaceInfo object works on GNOME 45–51+.
const IFACE_INFO = Gio.DBusNodeInfo.new_for_xml(IFACE_XML).interfaces[0];

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
        this._dbus = Gio.DBusExportedObject.wrapJSObject(IFACE_INFO, this);
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

    // DBus methods — names must match the XML exactly
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
            this._appId   = String(win.get_pid() ?? 0);

            this._titleId = win.connect('notify::title', () => this._onTitle());
        } else {
            this._wmClass = '';
            this._title   = '';
            this._appId   = '0';
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
