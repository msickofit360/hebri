import assert from 'node:assert/strict';
import test from 'node:test';
import { announce, releaseMessage } from '../ci/announce-discord-release.mjs';

const tag = 'v1.2.3';
const release = {
  id: 123, tag_name: tag, draft: false, prerelease: false,
  published_at: '2026-11-23T05:35:02Z',
  html_url: `https://github.com/Synapsek-Labs/hebri/releases/tag/${tag}`,
  name: '@everyone', body: '<@123> untrusted release text',
};
const webhookUrl = 'https://discord.com/api/webhooks/123/test-secret';

test('only the verified stable release can become a mention-free announcement', () => {
  for (const override of [
    { draft: true }, { prerelease: true }, { published_at: null },
    { tag_name: 'v1.2.4' }, { html_url: 'https://example.com' }, { id: 124 },
  ]) assert.throws(() => releaseMessage({ ...release, ...override }, tag, 123));
  assert.throws(() => releaseMessage(release, 'v1.2.3-rc1', 123));
  const payload = releaseMessage(release, tag, 123);
  assert.deepEqual(payload.allowed_mentions, { parse: [] });
  assert.equal(payload.embeds[0].url, release.html_url);
  assert.ok(!JSON.stringify(payload).includes('@everyone'));
  assert.ok(!JSON.stringify(payload).includes('untrusted release text'));
});

test('verification precedes posting, credentials stay separate, and delivery is not blindly retried', async () => {
  let calls = [];
  const fetchImpl = async (url, options) => {
    calls.push({ url, options });
    if (calls.length === 1) return { ok: true, json: async () => release };
    return { ok: true, json: async () => ({ id: '456', channel_id: '1574306603803344926' }) };
  };
  assert.equal(await announce({ tag, expectedId: 123, webhookUrl, githubToken: 'github-test', fetchImpl }), '456');
  assert.equal(calls.length, 2);
  assert.match(calls[0].url, /^https:\/\/api.github.com\/repos\/Synapsek-Labs\/hebri\//);
  assert.equal(calls[0].options.headers.Authorization, 'Bearer github-test');
  assert.equal(calls[1].options.headers.Authorization, undefined);
  assert.equal(calls[1].url, `${webhookUrl}?wait=true`);
  assert.equal(calls[1].options.redirect, 'error');
  assert.deepEqual(JSON.parse(calls[1].options.body), releaseMessage(release, tag, 123));
  calls = [];
  await assert.rejects(announce({ tag, webhookUrl: 'https://example.com/secret', fetchImpl }));
  assert.equal(calls.length, 0);
  for (const badRelease of [{ ...release, draft: true }, { ...release, prerelease: true }]) {
    let requests = 0;
    await assert.rejects(announce({ tag, webhookUrl, fetchImpl: async () => {
      requests++; return { ok: true, json: async () => badRelease };
    } }));
    assert.equal(requests, 1);
  }
  let requests = 0;
  await assert.rejects(announce({ tag, webhookUrl, fetchImpl: async () => {
    requests++;
    if (requests === 1) return { ok: true, json: async () => release };
    throw new Error('Ambiguous network timeout');
  } }));
  assert.equal(requests, 2);
});
