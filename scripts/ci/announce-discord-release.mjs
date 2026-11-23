import { pathToFileURL } from 'node:url';

const repository = 'Synapsek-Labs/hebri';

export function releaseMessage(release, tag, expectedId) {
  const url = `https://github.com/${repository}/releases/tag/${tag}`;
  if (!/^v\d+\.\d+\.\d+$/.test(tag) || release.tag_name !== tag ||
      release.draft !== false || release.prerelease !== false ||
      !release.published_at || !Number.isFinite(Date.parse(release.published_at)) ||
      release.html_url !== url || !Number.isSafeInteger(release.id) ||
      (expectedId && String(release.id) !== String(expectedId))) {
    throw new Error('Refusing to announce an unverified or non-stable release.');
  }
  return {
    username: 'Hebri Releases',
    allowed_mentions: { parse: [] },
    embeds: [{
      title: `Hebri ${tag} is available`,
      url,
      color: 0x2855ff,
      description: 'A new stable Hebri Desktop release is available. Read the release notes before updating.',
      fields: [
        { name: 'What changed', value: `[Read the release notes](${url})` },
        { name: 'Download and install', value: '[Get Hebri for your computer](https://synapseklabs.org/product/hebri)\n[Installation and getting started](https://synapseklabs.org/guide)' },
        { name: 'After updating', value: 'Start a new chat to pick up updated tools. Need help? Use <#1574306833940881468> and include your Hebri version and operating system, with private details removed.' },
      ],
      footer: { text: 'Synapsek Labs • Official GitHub release' },
      timestamp: release.published_at,
    }],
  };
}

export async function announce({ tag, expectedId, webhookUrl, githubToken, fetchImpl = fetch }) {
  if (!/^v\d+\.\d+\.\d+$/.test(tag || '')) throw new Error('A stable vMAJOR.MINOR.PATCH tag is required.');
  // The credential must never be sent to an arbitrary host or through a redirect.
  if (!/^https:\/\/discord\.com\/api\/webhooks\/\d+\/[A-Za-z0-9_-]+$/.test(webhookUrl || '')) {
    throw new Error('Configure the channel-only DISCORD_RELEASE_WEBHOOK_URL secret.');
  }
  const response = await fetchImpl(`https://api.github.com/repos/${repository}/releases/tags/${tag}`, {
    headers: {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'Hebri-Release-Announcements',
      ...(githubToken ? { Authorization: `Bearer ${githubToken}` } : {}),
    },
    redirect: 'error', signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) throw new Error('Could not verify the published GitHub release.');
  const payload = releaseMessage(await response.json(), tag, expectedId);
  // No automatic POST retry: a timeout can happen after Discord accepted the message.
  const sent = await fetchImpl(`${webhookUrl}?wait=true`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    redirect: 'error', signal: AbortSignal.timeout(20_000),
  });
  if (!sent.ok) throw new Error('Discord did not confirm the announcement. Check the channel before retrying.');
  const message = await sent.json();
  if (!/^\d+$/.test(message.id || '') || message.channel_id !== '1574306603803344926') {
    throw new Error('Discord response did not confirm the intended announcements channel.');
  }
  return message.id;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const messageId = await announce({
      tag: process.env.RELEASE_TAG,
      expectedId: process.env.EXPECTED_RELEASE_ID,
      webhookUrl: process.env.DISCORD_RELEASE_WEBHOOK_URL,
      githubToken: process.env.GH_TOKEN,
    });
    console.log(`Announcement confirmed: https://discord.com/channels/1574302710608568464/1574306603803344926/${messageId}`);
  } catch {
    // Network errors may contain the credential-bearing webhook URL. Never log them.
    console.error('Announcement not confirmed. Check the release, webhook secret and Discord channel before retrying; a retry may duplicate a delivered message.');
    process.exitCode = 1;
  }
}
