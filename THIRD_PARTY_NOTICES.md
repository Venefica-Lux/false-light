# Third-party notices

What other people's work is in this game, under which license, and what each license asks. Nothing here is legal advice.

## Code ported into the service worker: Workbox (MIT)

`sw.js` contains `createPartialResponse`, ported from Workbox's `workbox-range-requests` package at tag v7.4.1
(https://github.com/GoogleChrome/workbox/tree/v7.4.1/packages/workbox-range-requests/src: `createPartialResponse.ts`,
`utils/parseRangeHeader.ts` and `utils/calculateEffectiveBoundaries.ts`, folded into one function). The upstream
license was read at https://github.com/GoogleChrome/workbox/blob/v7.4.1/LICENSE and is reproduced below, as the
license asks. The changes made in the port are listed in the comment above the function in `sw.js`.

```text
Copyright 2018 Google LLC

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
```

## Informed by, with no code copied

- **Workbox, `workbox-window`** (MIT, Copyright 2018 Google LLC): the pattern of a waiting service worker, an "update ready" prompt, and a `SKIP_WAITING` message followed by a reload once the new worker controls the page. The code in `app.js` is written for this game.
- **@use-gesture, `DragEngine`** (MIT, Copyright (c) 2018-present Paul Henschel; https://github.com/pmndrs/use-gesture, license read at tag `@use-gesture/vanilla@10.3.1`): the ideas of a release velocity taken from recent movement, a distance-plus-velocity swipe test, and an axis lock once a drag has travelled past a threshold. `swipe.js` is written for this game and copies none of it. Credited here because the idea is theirs, not because any of their code is in this game.

## Fonts: SIL Open Font License 1.1

The three typefaces are served from this game's own files. Each license text travels beside its font in `fonts/`.

| Font | Copyright | License text |
|---|---|---|
| Cinzel | Copyright 2020 The Cinzel Project Authors (https://github.com/NDISCOVER/Cinzel) | `fonts/cinzel-OFL.txt` |
| Cormorant Garamond | Copyright 2015 the Cormorant Project Authors (github.com/CatharsisFonts/Cormorant) | `fonts/cormorantgaramond-OFL.txt` |
| Inter | Copyright 2020 The Inter Project Authors (https://github.com/rsms/inter) | `fonts/inter-OFL.txt` |

The font files are the subsets as served by Google Fonts, unmodified apart from format. The fonts may be bundled and redistributed, but not sold on their own.

## The Linux build: Electron (MIT) and Chromium's components

The Linux download runs the game in Electron v45.4.1 (https://github.com/electron/electron, MIT, Copyright (c) Electron
contributors, Copyright (c) 2013-2020 GitHub Inc.), unmodified. Its license travels in the download as
`LICENSE.electron.txt`, and the notices of the Chromium components it carries as `LICENSES.chromium.html`. One of those
is FFmpeg (https://ffmpeg.org), under the GNU LGPL version 2.1 or later, as a separate shared library (`libffmpeg.so`).

## Not shipped

Playwright (Apache-2.0) drives the browser tests in the source repository and is not part of this game.
