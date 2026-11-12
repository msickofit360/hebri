# OpenRouter attribution

Hebri and the Synapsek account backend share one public identity:

| Header | Value |
| --- | --- |
| `HTTP-Referer` | `https://synapseklabs.org` |
| `X-OpenRouter-Title` | `Hebri` |
| `X-Title` (compatibility) | `Hebri` |
| `X-OpenRouter-Categories` | `cli-agent,personal-agent` |

The identity is defined in `hermes_cli/provider_identity.py`. Primary and rebuilt
clients, auxiliary clients (including named custom OpenRouter endpoints), and
image/video providers use it. Explicit user-supplied custom headers retain their
existing precedence. No user, profile, machine or session identifier is added.

## Issues corrected

- Image/video requests previously used the upstream Hermes repository URL.
- The primary header set lacked the preferred title header and included the
  unrecognised category `productivity`.
- Some custom auxiliary OpenRouter client paths omitted app attribution.

Requests funded by a Synapsek account go through the website repository's
`server/desktopInference.ts`; its outgoing OpenRouter attribution must be deployed
there too. Updating this client alone cannot fix that server path. These changes
are separate from the already-prepared 0.17.28 release.

## Verification

Run `scripts/run_tests.sh tests/agent/test_openrouter_attribution.py
tests/plugins/test_openrouter_attribution.py tests/agent/test_provider_identity.py`.
The tests capture real SDK/media request construction with synthetic credentials
and no external provider traffic, including client rebuild and route change.

After both repositories ship, check an approved, non-sensitive request from the
updated client and one through the account backend in OpenRouter Activity. Confirm
the linked app is Hebri at the canonical URL. Public listing and live analytics
are not verified by local tests. Existing hidden listings require OpenRouter
support to change visibility; rankings depend on usage.

Attribution does not establish zero data retention or change model-provider
privacy policies. Authentication, request content, cache options and explicit
custom-header configuration keep their existing behavior.

Reference: [OpenRouter app attribution](https://openrouter.ai/docs/app-attribution).
