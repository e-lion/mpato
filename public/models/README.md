# World models (optional)

Drop CC0 `.glb` files here (Kenney, Quaternius, ...). Anything missing falls back
to the procedural model, so you can add them one at a time.

| File        | Used for                         | Notes |
|-------------|----------------------------------|-------|
| `truck.glb` | Supplier delivery truck          | Wheels on the ground, any scale. Auto-fitted to ~3.4 units long; if its long axis is along Z it is turned to face +X. Uncompressed or meshopt only (no Draco yet). |

| `character.glb` | Customers, driver, shopkeeper | Rigged, ~1.8 m tall, facing +Z, with clips named `idle` and `walk` (case-insensitive). Tinted per person. |

Planned next: `shelf.glb`, `counter.glb`.

Keep the total under ~5 MB. Record each pack's author and license in `LICENSES.md`.
