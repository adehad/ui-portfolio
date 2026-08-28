# Case Study Viewer

Rebuild of two screens from the CDP case study viewer: the shared passcode gate, and the case study
page for The Eye, which is the 3D viewer itself.

## Demo passcode

`1234`. Its SHA-256 hash is baked into `passcode.ts` so the story needs no environment setup. The
hashing path is the real one, not a string comparison.

## The case study page

`viewer/` holds the 3D screen. It renders one Case Study with two Media Views, a drawer to switch
between them, a rail of saved camera shots down the right edge, a layer that can be ghosted, and a
hotspot marker anchored to a point on the model.

    viewer/content.ts          the-eye fixture, plus the model, size and preview lookups
    viewer/types.ts            the shape a Case Study, Media View, Camera View, Layer and Chapter take
    viewer/MediaStage.tsx      picks the canvas or the player for the active Media View
    viewer/ViewerCanvas.tsx    the R3F <Canvas>, its camera and its lights
    viewer/ModelScene.tsx      everything inside the Canvas that belongs to one Model View
    viewer/ModelStage.tsx      loads the GLB and hangs the ghosting off it
    viewer/CameraRig.tsx       lerps the camera between saved views
    viewer/CameraViewRail.tsx  the carousel that steps through the saved shots
    viewer/video/              the player, its controls and the chapter track builder

A Media View is a discriminated union on `kind`. Camera views, layers and hotspots hang off the
`model` kind and chapters off the `video` kind, so no component can reach for a field the active
kind cannot honour.

The Model View carries a hand-authored `defaultCamera`, which `ModelScene` applies on mount, along
with clip planes scaled to that pose: the stock 0.1 near plane sits inside the authored shots of a
model 0.19 units across and slices the front off it.

The model, the clip and the drawer previews are served as static files from
`public/case-study-viewer/` through Storybook's `staticDirs`, because three's loaders and the video
element fetch them over HTTP at runtime.

## The chaptered video

The third Media View is an mp4 with three chapters. No `.vtt` file ships: `chaptersToVtt` turns the
authored chapters into a WebVTT document at runtime, and `VideoStage` hands it to Vidstack's
`<Track kind="chapters">` as a Blob URL. It cannot be built any earlier than the player reporting a
duration, because the last chapter runs to the end of the clip. Those cues are what splits the
scrub bar into segments.

**The Canvas outlives the video.** Switching to the video unmounts `ModelScene`, not `ViewerCanvas`.
Tearing the Canvas down would cost a fresh WebGL context and a full re-upload of the GLB on the way
back, and would free nothing: R3F does not dispose the object a `<primitive>` carries, and the GLB
stays in drei's module cache either way. Under `frameloop="demand"` a Canvas with no scene draws
nothing, so the cost of leaving it mounted is the context alone. The video is DOM painted over it on
an opaque surface, so a playing `<video>` never reaches the render loop the demand frameloop exists
to keep quiet.

**The control styling is new work.** In the source the redesign and the video landed on two branches
that never met: the branch carrying this design language has no video support at all, and the branch
carrying the video never received the redesign. Its control bar is the pre-redesign flat slate, so
the bar here is rebuilt from the tokens this case already establishes rather than carried across.
The control set itself is the source's: play, a chaptered time slider with a preview and chapter
title, elapsed time, mute, and a fullscreen button that targets the provider.

## Token prefix

Tailwind v4 flattens every `@theme` block in the bundle into a single namespace, so tokens are not
scoped to a case. Every token in `tokens.css` carries a `cdp-` segment directly after its Tailwind
namespace, and every custom utility starts with `cdp-`:

    --color-cdp-surface-0        ->  bg-cdp-surface-0
    --spacing-cdp-touch-comfort  ->  h-cdp-touch-comfort
    --radius-cdp-2xl             ->  rounded-cdp-2xl
    --text-cdp-caption           ->  text-cdp-caption
    @utility cdp-root, cdp-pressable, cdp-glass, cdp-safe

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
view being chosen, and each step of a camera lerp. The drawer, the camera
view rail and the info panel are DOM overlays and never resize or repaint the canvas, so they
schedule no frame. `preserveDrawingBuffer` is on so the last frame survives compositing and stays readable to a
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

**The video is seed content.** In the source the clip belongs to a different case study entirely.
It hangs off The Eye here so one page can show both stage kinds, and the chapter names are
fictionalised along with the rest of the fixture.

**The back control is a button.** The source's is a Next `<Link>` back to the sector. There is no
router here, so it keeps the label and the shape without the destination.
