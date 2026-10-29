# World models (optional)

Drop CC0 `.glb` files here (Kenney, Quaternius, ...). Anything missing falls back
to the procedural model, so you can add them one at a time.

| File        | Used for                         | Notes |
|-------------|----------------------------------|-------|
| `truck.glb` | Supplier delivery truck          | Wheels on the ground, any scale. Auto-fitted to ~3.4 units long; if its long axis is along Z it is turned to face +X. Uncompressed or meshopt only (no Draco yet). |

| `character.glb` | Customers, driver, shopkeeper | Rigged, ~1.8 m tall, facing +Z, with clips named `idle` and `walk` (case-insensitive). Tinted per person. |

Planned next: `shelf.glb`, `counter.glb`.

Keep the total under ~10 MB (the Kenney set in `kenney/` is about 7 MB). Record each pack's author and license in `LICENSES.md`.

## More realistic people

Any Mixamo-rigged `.glb` in `people/` is used instead of the mannequin: `michelle.glb`
is there now, and the loader also looks for `person-1.glb` ... `person-6.glb`. Export
characters from mixamo.com (free Adobe account) as FBX/GLB with the standard
`mixamorig` skeleton, in T-pose; walking and idling are posed in code, so no animation
clips are needed. With several files, each person picks one at random.


## Kenney set (`kenney/`)

Stylised CC0 models used for the town, vehicles and people (see `LICENSES.md`). Each GLB references
`Textures/colormap.png` next to it, so keep each folder's `Textures/` with its models. `characters/`
holds 11 rigged people (clips include `idle`, `walk`, `sit`, `emote-yes`, `interact-right`) plus a few accessories.
