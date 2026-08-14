# Icon source

The SVG files in this directory are vendored from [Tabler Icons](https://github.com/tabler/tabler-icons)
(outline and filled styles), fetched from the `main` branch on 2026-08-14.

They are the single source of truth for icons used by both `packages/app` (web) and `android/`.
Run `npm run gen:icons` from the repo root after adding, removing, or updating a file here to
regenerate the React components (`packages/app/src/modules/icons/generated/`) and Android vector
drawables (`android/app/src/main/res/drawable/`).

Filled-style icons are suffixed `-filled` in this directory (Tabler itself stores them in a
separate `icons/filled/` directory under the same base name) to keep everything in one flat folder.

## License

Tabler Icons is licensed under the MIT License.

```
MIT License

Copyright (c) 2020-2026 Paweł Kuna

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
