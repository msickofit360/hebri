// @vitest-environment jsdom
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, expect, it, vi } from 'vitest';
import { SynapsekAccount } from './SynapsekAccount';
import { fetchJSON } from '@/lib/api';
vi.mock('@/lib/api', () => ({ fetchJSON: vi.fn() }));
vi.mock('@/contexts/useProfileScope', () => ({ useProfileScope: () => ({ profile: 'audit', currentProfile: 'audit' }) }));
const owner = '11111111-1111-4111-8111-111111111111';
let root: ReturnType<typeof createRoot>;
let node: HTMLDivElement;
afterEach(async () => { await act(async () => root?.unmount()); node?.remove(); vi.clearAllMocks(); });
it('offers owner-bound logout after a reload whose remote status is unavailable', async () => {
  vi.mocked(fetchJSON).mockImplementation(async (url, init) => {
    if (String(url).includes('/logout')) {
      expect(JSON.parse(String(init?.body))).toEqual({ expected_user_id: owner });
      return { state: 'signed_out' };
    }
    return { state: 'unavailable', error: 'reauthentication_required', recoveryUserId: owner };
  });
  node = document.createElement('div'); document.body.append(node); root = createRoot(node);
  await act(async () => root.render(<SynapsekAccount onChanged={() => {}} />));
  const logout = [...node.querySelectorAll('button')].find(b => b.textContent === 'Sign out of Synapsek');
  expect(logout).toBeTruthy();
  await act(async () => logout!.click());
  expect([...node.querySelectorAll('button')].some(b => b.textContent === 'Sign out of Synapsek')).toBe(false);
});
