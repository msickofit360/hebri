# Discord release announcements

The `Announce published Hebri release` workflow posts a short release card in
Synapsek Labs `#announcements` (channel `1574306603803344926`). It links to the
specific GitHub release, the website download page and the getting-started guide.
It does not mention everyone or copy untrusted release-body text.

## Configuration

Create a webhook named **Hebri Releases** in that channel. Store its URL only in
the repository Actions secret **DISCORD_RELEASE_WEBHOOK_URL**. Anyone holding the
URL can post through it: never commit it, paste it into issues or print it in logs.
No bot, administrator permission, channel-reading permission or third-party
automation service is required. Repository maintainers can rotate/revoke it in
Discord channel Settings → Integrations if needed.

## Publication and recovery

Only `release.published` triggers an automatic post, and drafts/prereleases are
rejected. The script re-fetches the release from the GitHub API before delivery.
Creating a tag, building packages or assembling a draft does not announce it.
Keep the normal signed-package verification and publication process unchanged.

GitHub must have this workflow in the release's tagged commit. For a release
published before this workflow was installed, run it manually **from main** and
provide the existing stable tag. Events caused by a workflow's `GITHUB_TOKEN`
do not trigger another workflow; if publication is automated that way in future,
dispatch this workflow explicitly after the publication verification completes.

Check Discord before manually dispatching or rerunning: delivery is not exactly
once, and a network timeout may occur after Discord accepted the post. The script
does not retry POST requests. A confirmed delivery prints only the message link.
PR validation has no webhook secret and never sends announcements.

Posts are visible to channel members. Discord's separate **Publish** action sends
an announcement to other servers following the channel; a moderator performs
that action. This integration does not install a bot for automatic crossposting.

## Validation

Run `node --test scripts/tests/discord-release.test.mjs`. After normal PR review
and merge, dispatch once for the latest published stable release, inspect the
actual card and links in Discord, and record the confirmed message link.
