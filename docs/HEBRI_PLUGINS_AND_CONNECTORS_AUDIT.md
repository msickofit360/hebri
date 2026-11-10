# Hebri plugins, connectors and Team Chat

Audit: 9 November 2026. Source: this Hebri candidate and Synapsek website PR #249.
This is implementation evidence, not a claim that every provider was connected live.

## Plugins

The website `/docs/plugins` is introductory only. Desktop browsing and deep-link
lookup now share a bundled snapshot of `plugin-catalog/*.yaml`: 292 entries at
this audit. It needs no website iframe or public catalog endpoint. Existing
installed plugins, enable/disable, update, and uninstall paths remain in place.

Generate after reviewed manifest changes with
`python scripts/build_desktop_plugin_catalog.py`; `--check` verifies parity.
The parity test also includes the removal list. Snapshot generation validates
HTTPS repository URLs, names, full commit pins and safe subdirectories.

The picker searches name, author, description and category, shows the upstream
runtime requirement and platforms, and opens the existing install dialog for the
selected Bit. It does not install automatically. Backend catalog resolution,
removal checks, scanning and dependency handling remain authoritative. Desktop
and a remote runtime may have different catalog versions; installation must
still be reviewed against the backend's resolved entry. Offline browsing does
not imply offline installation or compatibility of every inherited plugin.

Upstream `official` tiers are omitted from the browser cards: Nous-maintained
is not the same as Synapsek-maintained or Synapsek-audited. Existing manifests
and authorship are preserved. No plugin packages were installed during this work.

## Team Chat access

Cloud Team Chat is **not currently restricted to a paid Teams subscription**.
The website `api/teams.ts` checks the Teams feature flag, native-account allowlist,
verified account, active device session/binding and Teams consent. Browser calls
also require same-origin protection and MFA when the account has a verified factor.
`server/hostedTeams.ts` binds the expected account; `scripts/sql/hosted_teams.sql`
enforces current membership, roles, capacity and rate limits inside transactions.
None of those paths checks a paid subscription or purchased seat.

This does not mean public/unrestricted access: the rollout allowlist and those
authorization gates still apply. It is separate from local Bit conversations and
the website's private Omnia/business-agent workspace. No entitlement policy was
changed. Paid-only Team Chat would require a defined team-owner/seat entitlement
policy and server enforcement, including invited members and subscription expiry;
a UI badge or disabled button would not enforce it.

## Connector parity

Synapsek has 56 catalog entries, including three generic connection types (Email,
Custom API, Custom MCP). Hebri has 65 optional MCP presets. These catalogs are
different integration paths; matching names do not prove equal operations.

21 Synapsek services have matching Hebri presets: Monday, Notion, Airtable, Asana,
ClickUp, Linear, Dropbox, Intercom, Stripe, PayPal, Klaviyo, Canva, Mixpanel,
Amplitude, GitLab, Vercel, Cloudflare, Supabase, Figma, Sentry and n8n.

No matching optional MCP preset exists for: Gmail, Microsoft 365 Mail, Slack,
Microsoft Teams, Discord, Telegram, WhatsApp Business, Google Calendar, Outlook
Calendar, Trello, Google Drive, Box, HubSpot, Salesforce, Zendesk, Apollo, Shopify,
Xero, QuickBooks, Google Ads, Meta Ads, Facebook Pages, Instagram Professional, X,
LinkedIn, Mailchimp, PostHog, Snowflake, Metabase, GitHub, Zapier and Make.
Messaging adapters, plugins and custom MCP configuration can cover some of these;
absence of a preset is not absence of every possible integration.

### The main functional gap

`tools/connectors/gateway/config.py` still derives managed-connector availability
from `hermes_cli.nous_account` and inherited managed-tool credentials. The Synapsek
native account is a separate store. Signing into Synapsek does not automatically
authorize this inherited connector service. No credentials were copied between
them and no entitlement gate was bypassed.

Recommended order:

1. Build the Synapsek native connector bridge with account/Bit isolation, explicit
   connection consent, secure token handling, disconnect/revoke, operation-level
   availability and the existing approval controls for writes.
2. Microsoft 365 Mail/Calendar and Google Workspace for Nano office workflows.
   Do not label the current Synapsek Gmail profile-only action as mailbox reading;
   Calendar is currently calendar listing and Drive is metadata listing.
3. Slack and GitHub for developers. Synapsek Slack already has bounded reads and
   approval-gated posts. GitHub provides an official remote MCP with PAT support
   and read-only URLs; Hebri OAuth support needs a registered client, not a guessed
   endpoint or reuse of another product's OAuth client.
4. HubSpot, Xero/QuickBooks, Shopify and Trello based on the business workflows.
   Preserve the current limited operations until deeper operations are implemented
   and tested. Bank/payment/accounting writes must not be inferred from a logo.

Official GitHub MCP reference:
https://github.com/github/github-mcp-server/blob/main/docs/remote-server.md

No new live connections or provider permissions were created in this audit.

## Connector logos

Added 33 brand glyphs using the existing Simple Icons package and a bundled,
unmodified Slack mark from Slack's media kit. Known brands missing from that
package use their vendor-owned website's published icon through Hebri's existing
favicon bridge. Known-vendor sites take precedence over the inherited logo service.
Unknown third-party connectors retain the supplied icon/fallback flow.

Name resolution now accepts explicit aliases and transport suffixes instead of
arbitrary substrings (Box must not match Dropbox; X must not match every name
containing x). Failed provider images fall back. Favicon candidates exclude local,
private, credential-bearing, non-HTTPS and repository-host URLs. Provider icons
can still be unavailable; the UI keeps a monogram rather than a broken image.

This is not a guarantee that every future/custom connector has an official logo.
The catalog remains dynamic. Brand marks identify services, not endorsement.

## Current security candidate

Direct MCP and Synapsek managed connectors remain separate paths. New MCP grants
use Hebri client identity and the Synapsek-owned client metadata document; they
must not impersonate Nous, Claude Code or another product to pass an allowlist.
Existing cached registrations remain intact until the user reauthorizes.

MCP defaults to per-call confirmation. A server's readOnlyHint cannot suppress
approval or permit replay unless the calling Bit explicitly configures full trust.
Approval displays server, operation and frozen arguments. Missing, denied or failed
consent blocks transport acquisition. Authentication/transport errors after a
potentially effectful dispatch do not automatically replay that operation.
Explicit local trust: full remains an owner opt-in and disables these per-call
prompts. This is application policy, not an OS sandbox: a local MCP executable
still runs code with its process privileges and must be trusted before installation.

OAuth tokens and client secrets now use OS-keyring-backed encryption, keyed by
Bit home and server filename. Public discovery metadata stays readable. Legacy
plaintext migrates atomically; unavailable secure storage fails without deleting
the old credential. MCP credentials are excluded from profile cloning/export.
Linux without an unlocked Secret Service is not qualified for encrypted OAuth.

Managed connectors use the independent Synapsek account broker, encrypted per-Bit
capabilities and the signed AWS backend path. Native callers can request actions;
only an MFA browser can approve an exact pending write. Reconnect invalidates old
grants; uncertain writes are never replayed. Initial supported operations are
Slack channel listing and approved posts, allowed GitHub repository listing,
Drive file metadata listing and Google Calendar listing. Other Nango integrations
are not implied to be supported. Provider tokens never enter the model context.

Nango branding and plan remain unchanged by user preference. The connection UI
uses its documented SDK; no paid branding feature or callback was changed. Existing
31 connections across 17 integrations were inspected read-only and remain intact.

## Verification and release gates

Desktop full TypeScript checks, renderer build and 62 focused native/UI tests pass
after installing the existing lockfile. New Python security tests use real imports,
real SDK token models, temporary A-B-A homes and an in-memory keyring seam; they
prove application encryption and isolation, not every operating-system keychain.
The real stdio MCP fixture starts, lists tools, calls and shuts down successfully.
Earlier standalone Windows account sign-in/restore/logout verification also passed.

Website full suite: 2,293 passed, 7 skipped before the two added AWS routing tests;
those routing tests and 16 related transport/account tests subsequently passed.
Website type-check, production build and AWS runtime bundle pass. Database tests
exercise migration idempotence, RLS/role grants, encrypted state and CAS using
PostgreSQL WASM locally, with independent PostgreSQL writers wired into CI.

Production remains disabled pending reviewed deployment, staging migration,
provider consent/read/write/revoke tests and matching client release. The website
follow-up includes docs/hebri-connectors-rollout.md with exact prerequisites.
Installed Hebri 0.17.25, production profiles, payments and existing connections
were not modified. This is not a claim that every connector works live.
