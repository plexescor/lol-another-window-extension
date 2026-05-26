# lol-another-window-extension

Tracks the currently focused window and exposes its WM class and title over D-Bus.

## Install

```bash
ln -s "$(pwd)" ~/.local/share/gnome-shell/extensions/lol-another-window-extension@plexescor
```

Then enable it:

```bash
gnome-extensions enable lol-another-window-extension@plexescor
```

Or toggle it in the Extensions app. On Wayland you need to log out and back in after the first symlink.

---

## D-Bus interface

| Field | Value |
|---|---|
| Destination | `org.gnome.Shell` |
| Object path | `/org/gnome/Shell/Extensions/LolAnotherWindowExtension` |
| Interface | `org.gnome.Shell.Extensions.LolAnotherWindowExtension` |

---

## Get the WM class of the focused window

```bash
gdbus call --session \
  --dest org.gnome.Shell \
  --object-path /org/gnome/Shell/Extensions/LolAnotherWindowExtension \
  --method org.gnome.Shell.Extensions.LolAnotherWindowExtension.FocusClass
```

Example output:

```
('firefox',)
```

## Get the title of the focused window

```bash
gdbus call --session \
  --dest org.gnome.Shell \
  --object-path /org/gnome/Shell/Extensions/LolAnotherWindowExtension \
  --method org.gnome.Shell.Extensions.LolAnotherWindowExtension.FocusTitle
```

Example output:

```
('GitHub — Mozilla Firefox',)
```

---

## Monitor live changes

Emits a `WindowChanged` signal with `(wmClass, title)` every time focus changes or the title updates.

```bash
gdbus monitor --session \
  --dest org.gnome.Shell \
  --object-path /org/gnome/Shell/Extensions/LolAnotherWindowExtension
```

Example output:

```
/org/gnome/Shell/Extensions/LolAnotherWindowExtension: org.gnome.Shell.Extensions.LolAnotherWindowExtension.WindowChanged ('code', 'dbusService.js — lol-another-window-extension')
/org/gnome/Shell/Extensions/LolAnotherWindowExtension: org.gnome.Shell.Extensions.LolAnotherWindowExtension.WindowChanged ('firefox', 'Stack Overflow — Mozilla Firefox')
```

---

## Logs

```bash
journalctl -f /usr/bin/gnome-shell
```

---

## Compatibility

GNOME 46, 47, 48, 49, 50.