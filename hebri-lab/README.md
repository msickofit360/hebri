# Hebri Lab desktop source preview

Hebri Lab is an experimental desktop interface based on Hebri 0.17.34. It adds Extensions, Help, a floating BitBot, Guided Mode and nine optional walkthroughs. The Skills catalogue groups 94 of the 208 bundled and official optional skills under **Advanced options**. Search reveals matching advanced entries.

## Reconstruct the source

From the root of a full Git checkout of this branch, run the following with Git and Python 3.11 or later. Choose a new sibling directory for the result.

```powershell
python hebri-lab/materialize.py . ../hebri-lab-preview
cd ../hebri-lab-preview
git write-tree
```

The command uses local Git objects from the pinned base, applies the file versions under `files/`, and verifies every entry and the complete Git tree. It creates a separate checkout with the changes in its index. Keep them staged when building because the desktop bundler selects indexed source files.

| Source identity | Git object |
|---|---|
| Upstream Hebri 0.17.34 commit | `0a1bb501a9b426e27baff1dccb33ea0870cb5b3b` |
| Expected source tree from `git write-tree` | `f08ecd0aacde6160f4db1618f27350aa285bb2bc` |

Two reference-document edits are recorded as forward replacements applied to the exact upstream files. This avoids republishing historical asset-access URLs in patch context. The reconstruction omits upstream release, signing-migration and announcement workflows and a developer QA note. Its manifest lists these paths.

## Build and open on Windows

The checkout expects Git, the project's Node.js/npm toolchain and a Python virtual environment named `.venv`. From the reconstructed directory, install the locked project dependencies and build the app.

```powershell
uv sync --frozen --python 3.11
npm ci
npm run build --workspace apps/desktop
& '.\Hebri Lab.cmd'
```

The launcher creates a sibling `Hebri-Lab-Data` directory for its local profile and workspace. Configure your provider in the Lab. The branch contains source and dependency notices. Published installers, signing credentials and user profiles are outside its scope.

## Validation and limits

The Windows development build passed desktop type checking. A real Electron test with a disposable profile and local model fixture verified Help, a BitBot answer and advanced-skill search in both Help and Extensions. The browser tests exercised all nine Help sections at 320, 768 and 1280 pixels. This Windows test used installed dependency caches. Fresh dependency installation and macOS and Linux operation require separate verification.

The local runtime can launch native processes under the developer's account. An OS-enforced separation between those processes and the installed core is still required for a production integrity guarantee. Installer signing, upgrade testing and the rights review for bundled commercial distribution remain open.

## Licence

The new Hebri Lab interface code is released under the [MIT License](UPSTREAM-LICENSE.txt) (SPDX identifier `MIT`). The [Bots component licence](BOTS-LICENSE.txt) and [third-party notices](files/THIRD_PARTY_NOTICES.md) identify additional notices and component-specific terms. The reconstructed checkout preserves those terms, including the existing licence on the Unbroker dataset.
