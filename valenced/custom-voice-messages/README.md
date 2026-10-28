# Custom Voice Messages (Valenced port)

Port of [shipwr3ckd/revengeplugin `customVoiceMessages`](https://github.com/shipwr3ckd/revengeplugin/tree/master/plugins/customVoiceMessages) from the old Vendetta/Revenge API to the Valenced plugin API.

## Building

1. Clone the [Valenced plugin template](https://github.com/Valenced/valenced-plugin-template) and run `bun install` (or `npm install`).
2. Copy this folder into the template's `plugins/` directory.
3. Package it: `./gradlew packageCustomVoiceMessages`. The ZIP lands in `build/dist/`.

## What changed in the port

| Original (Vendetta) | Valenced |
| --- | --- |
| `findByProps('uploadLocalFiles')` + `before('uploadLocalFiles', mod, ...)` | `getModules(withProps(...))` + `before(mod, 'uploadLocalFiles', ...)` (argument order flipped, hook must return `args`) |
| Patching `MessageStore`'s Flux action handlers | `onFluxEventDispatched` for `LOAD_MESSAGES_SUCCESS`, `MESSAGE_CREATE`, `MESSAGE_UPDATE` |
| Patching `ActionSheet.openLazy` and splicing into `ButtonRow`s | `instead` on `LongPressMessageActionSheet`'s default export, adding an `ActionSheetRow.Group` |
| `@vendetta/plugin` `storage` + `useProxy` | `jsonStorage` with defaults + `jsonStorage.use()` |
| `Forms.FormSwitchRow` settings | `Design.TableSwitchRow` inside a `TableRowGroup` |
| `onUnload` returning unpatches | Everything registered through `cleanup()` |
