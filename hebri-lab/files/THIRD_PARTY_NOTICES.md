# Bundled component notices

## Synapsek KEEL memory

`plugins/memory/keelindex` includes Synapsek KEEL 0.6.1, under the GNU Affero
General Public License version 3. Its license text and corresponding source
are included in that directory. See its `UPSTREAM.json` for the pinned source
commit and file checksums, and its README for the documented Hebri adaptation.
The root MIT license does not replace the KEEL license.

## Hermes Agent and Hebri

Hebri derives from Hermes Agent by Nous Research. The source checkout retains the original copyright and the full MIT permission and warranty notice in [LICENSE](LICENSE). Hebri and its downstream changes credit Synapsek Labs. Product and project names identify their respective owners. [Hermes Agent upstream license](https://github.com/NousResearch/hermes-agent/blob/main/LICENSE)

## Skills Hub and individual skills

The desktop Skills Hub is adapted from Synapsek-Labs/keel at commit `34ae66c7b8927d5c39be713567f20ffe22bb5d55`. The complete unminified page, local changes, source information and AGPL version 3 text accompany the Hub. Its catalog indexes third-party metadata. Each installed skill has its own terms. [Hub source notice](apps/desktop/public/skills-hub/source.txt) · [AGPL text](apps/desktop/public/skills-hub/LICENSE.txt)

The Unbroker optional skill credits **Yael Grauer** for the Big-Ass Data Broker Opt-Out List (BADBOOL), adapted into the broker reference data. The skill declares CC BY-NC-SA 4.0 for the data and MIT for its code. The dataset has been adapted. Preserve attribution, identify subsequent changes, and observe the noncommercial and share-alike conditions. [Unbroker credits](optional-skills/security/unbroker/README.md) · [Creator](https://yaelwrites.com/) · [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/)

Individual skill author credits are retained in their SKILL.md metadata. Bundled third-party license files, including MIT texts for the four Nous Research office-document skills, remain in their original directories. The checkout's local license files apply to these implementations. [Skill inventory](SBOM.cdx.json)

## Terminal renderer, fonts, icons and text indexing

- The terminal renderer includes a fork of Ink. Copyright Vadym Demedes and Sindre Sorhus. The full upstream MIT license accompanies this distribution. [Ink license and credits](third-party-licenses/Ink-LICENSE.txt)
- JetBrains Mono is used in the terminal interfaces. Copyright 2020 The JetBrains Mono Project Authors. The bundled regular, bold and italic files are supplied under the SIL Open Font License 1.1. [Full font license](third-party-licenses/JetBrainsMono-OFL.txt)
- The Visual Studio Code Codicons are by Microsoft Corporation. The icon art is licensed under CC BY 4.0, with the package's separate code license retained in the notice collection. Preserve attribution for displayed or redistributed icons and identify changes where applicable. [Codicons](https://github.com/microsoft/vscode-codicons) · [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)
- The SQLite 3.50.4 extension headers in `native/fts5_cjk/vendor` carry their original public-domain dedication and blessing. [SQLite copyright information](https://www.sqlite.org/copyright.html)

## Security guidance, Electron and bundled packages

The security-guidance plugin includes work by Anthropic, PBC., from its official Claude plugins repository. Its Apache 2.0 material and the Hermes integration retain their original notices. [Plugin NOTICE](plugins/security-guidance/NOTICE) · [Apache license](plugins/security-guidance/LICENSE)

Pillow-heif 1.5.0 carries a BSD-3-Clause source grant. Its inspected Windows CPython 3.11 wheel includes a separate binary notice declaring GPLv2 for the binary wheels, with libheif, libde265, x265 and libaom identified individually. The original package license and LICENSES_bundled.txt are in the notice collection. [Release metadata](https://pypi.org/project/pillow-heif/1.5.0/) · [Original notice files](third-party-licenses/dependency-notices.zip)

Electron includes Chromium and other separately licensed software. The available Electron and Chromium distribution notices are preserved in the dependency notice collection. Retain the native distribution's own license and Chromium notices with the executable.

The machine-readable component inventory records versions, package contexts and declared licenses. The accompanying source inventory contains 2,835 components. Its notice collection preserves 594 distinct original license and notice files verbatim, with 1,342 mappings for 1,294 component references including the root. Open `index.csv` inside the ZIP to map a component or original filename to its `texts/<sha256>` entry. Additional notices or source obligations can apply to specific platforms, binaries and optional components. [CycloneDX SBOM](SBOM.cdx.json) · [Dependency notices](third-party-licenses/dependency-notices.zip)
