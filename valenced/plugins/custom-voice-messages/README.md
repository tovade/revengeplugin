# Custom Voice Messages (Valenced port)

Port of [`plugins/customVoiceMessages`](../../../plugins/customVoiceMessages) from the old Vendetta/Revenge API to the Valenced plugin API.

## Installing

Add this repository in Valenced (**Settings > Valenced > Plugins**, settings gear, add repository):

```
https://raw.githubusercontent.com/tovade/revengeplugin/valenced-pool/index.json
```

Then install **Custom Voice Messages** from **Browse Plugins**.

## Building and releasing

`valenced/` is a copy of the [Valenced plugin template](https://github.com/Valenced/valenced-plugin-template). From that folder:

- `bun install`, then `./gradlew packageCustomVoiceMessages` builds the ZIP into `build/dist/`.
- Bumping `version` in `manifest.json` and pushing makes the "Release Valenced plugins" workflow publish it to the `valenced-pool` branch and regenerate `index.json`.

## What changed in the port

| Original (Vendetta) | Valenced |
| --- | --- |
| `findByProps('uploadLocalFiles')` + `before('uploadLocalFiles', mod, ...)` | `getModules(withProps(...))` + `before(mod, 'uploadLocalFiles', ...)` (argument order flipped, hook must return `args`) |
| Patching `MessageStore`'s Flux action handlers | `onFluxEventDispatched` for `LOAD_MESSAGES_SUCCESS`, `MESSAGE_CREATE`, `MESSAGE_UPDATE` |
| Patching `ActionSheet.openLazy` and splicing into `ButtonRow`s | `instead` on `LongPressMessageActionSheet`'s default export, adding an `ActionSheetRow.Group` |
| `@vendetta/plugin` `storage` + `useProxy` | `jsonStorage` with defaults + `jsonStorage.use()` |
| `Forms.FormSwitchRow` settings | `Design.TableSwitchRow` inside a `TableRowGroup` |
| `onUnload` returning unpatches | Everything registered through `cleanup()` |
