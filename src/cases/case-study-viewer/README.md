# Case Study Viewer

Rebuild of two screens from the CDP case study viewer: the shared passcode gate, and the case study
page for The Eye, which is the 3D viewer itself.

## Demo passcode

`1234`. Its SHA-256 hash is baked into `passcode.ts` so the story needs no environment setup. The
hashing path is the real one, not a string comparison.

## The case study page

`viewer/` holds the 3D screen. It renders one Case Study with a Model View, a drawer listing the
views the Case Study carries, a dropdown of saved camera shots, a layer that can be ghosted, and a
hotspot marker anchored to a point on the model.

    viewer/content.ts        the-eye fixture, plus the model, size and preview lookups
    viewer/types.ts          the shape a Case Study, Model View, Camera View, Layer and Hotspot take
    viewer/ViewerCanvas.tsx  the R3F <Canvas>, its camera and the orbit controls
    viewer/ModelStage.tsx    loads the GLB and hangs the ghosting off it
    viewer/CameraRig.tsx     lerps the camera between saved views

Every Model View carries a hand-authored `defaultCamera`, so the Canvas is constructed at that
pose. It is constructed with clip planes scaled to that pose too: the stock 0.1 near plane sits
inside the authored shots of a model 0.19 units across and slices the front off it.

The model and its drawer previews are served as static files from `public/case-study-viewer/`
through Storybook's `staticDirs`, because three's loaders fetch them over HTTP at runtime.

## Token prefix

Tailwind v4 flattens every `@theme` block in the bundle into a single namespace, so tokens are not
scoped to a case. Every token in `tokens.css` carries a `cdp-` segment directly after its Tailwind
namespace, and every custom utility starts with `cdp-`:

    --color-cdp-surface-0        ->  bg-cdp-surface-0
    --spacing-cdp-touch-comfort  ->  h-cdp-touch-comfort
    --radius-cdp-2xl             ->  rounded-cdp-2xl
    --text-cdp-caption           ->  text-cdp-caption
    @utility cdp-root, cdp-pressable, cdp-safe

A later case picks its own segment and the two sets sit side by side.

`tokens.css` is pulled in by `src/styles/globals.css`, which is the Tailwind entry point. The values
stay here so the branch diff shows the design language moving.

## Fonts

The design uses Open Sans, self-hosted through @fontsource at weights 300, 400 and 600. The faces are
served from the same origin, so builds stay offline and deterministic. Arial stays in the stack as a
fallback.

## Deviations from the source

**The eye toggle is an inline component.** `EyeIcon` rather than an `<img>`: the source SVG hard
codes its fill, which an `<img>` cannot recolour, and the icon has to sit legibly on more than one
background.

**WebGL, not WebGPU.** The source builds a `THREE.WebGPURenderer` through a custom `gl` factory on
`<Canvas>` and probes the adapter's buffer limits to decide whether a model will fit, falling back
to a lower-detail GLB or an unsupported panel when it will not. Chromatic's cloud browsers have no
WebGPU, and a blank canvas in a snapshot is worse than a marginally different renderer, so this
rebuild takes R3F's default WebGL path. Everything that existed only to negotiate WebGPU capability
goes with it: the GPU limit probe, the source selection, the model gate and the unsupported panel.
The one model here is 0.6 MB, so nothing needs a capability decision.

**Frames are drawn on demand.** A canvas that renders continuously would diff on every Chromatic run
and turn the visual regression setup into noise. The Canvas uses `frameloop="demand"` and the code
invalidates when something actually changes: the model resolving, a layer being ghosted, a camera
view being chosen, and each step of a camera lerp. The drawer, the views menu
and the info panel are DOM overlays and never resize or repaint the canvas, so they schedule no
frame. `preserveDrawingBuffer` is on so the last frame survives compositing and stays readable to a
snapshot tool.

**The GLB is recompressed.** The source's cross-section model is 12.1 MB, and all but 220 KB of
that is four 4096px PNG textures. Carrying it would slow every Storybook build and Chromatic
snapshot, so the textures are halved to 2048px and re-encoded as WebP and the geometry is
meshopt-quantized, which is the treatment the source gave its other models. The result is 596 KB
over the same 5,523 vertices.

**One Model View, not two.** The source's Case Study also carries a Full Eye view over a second
GLB. It is not rebuilt here, so the drawer lists one tile and every Model View reaches the canvas
through the same hand-authored camera path.

**Previews are single frames.** The source drawer tiles are 360px 24-frame spinning APNGs of about
1 MB each. An animation cannot be paused for a snapshot, so each tile ships as one 260px frame,
about 37 KB.

**The data shape is plain TypeScript.** The source parses its content through zod at runtime because
the content set can be replaced by an external `content.json`. There is one baked fixture here and
nothing to validate, so `types.ts` carries the same shape as types alone.

**The back control is a button.** The source's is a Next `<Link>` back to the sector. There is no
router here, so it keeps the label and the artwork without the destination.

## Known rough edges

The loading progress panel is anchored at the scene's world origin, which for this model sits below
the eye, so the bar reads low in the frame rather than centred.
