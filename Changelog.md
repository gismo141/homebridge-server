## 2.0.0
- Refactoring
- Config option for path of node_modules; if not set, '/usr/local/lib/node_modules/' is assumed.
- Extended JSON-API
- Main view
    - Show info about homebridge instance:
        - version (installed and last release)
        - uptime
        - memory usage
        - host OS
    - Indicate if platform is active (or just configured)
- Plugins view
    - Plugin update, remove and install:
        - Check access rights before
        - Show progress during plugin update, remove and install
    - Installed plugins
        - Show version info
        - Show if plugin is currently used by any platform or accessory
        - Update plugins
    - Search plugins
        - Live search
        - Indicate compatibility
        - Mark plugins that are already installed


## TODO:
### Main view
    - [x] Provide link to plugin homepage in platforms and accessories list
    - [ ] Use icons for platform/accessory status (running, warning, stopped)
    - [ ] Add 'description' to bridgeInfo
    - [ ] Plugins can provide an example config in their package; use it for a ConfigWizard
### Plugins
    - [ ] Installed plugins
        - [x] Show release date info for installed plugins with update
        - [ ] Show link if plugin is not configured
    - [ ] Operation
        - [ ] Highlight if error occured.
### API
    - [ ] Convert backend error codes to helpful text (e.g. 'EACCES')
    - [ ] restartHomebridge: rework GUI; current approach doesn't work since the server is terminated...
### PluginManager
    - [x] getInstalledPlugins: derive modulePath from config.modulePath
