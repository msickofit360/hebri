import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, expect, it } from 'vitest'

import { ExtensionAdvanced } from './extension-advanced'

afterEach(cleanup)

it('starts folded, loads controls on demand, preserves edits when folded and resets on changing section', async () => {
  const contents = (section: string) => (
    <ExtensionAdvanced key={section}>
      <input aria-label="Configuration" defaultValue="" />
    </ExtensionAdvanced>
  )

  const view = render(contents('connectors'))
  let summary = screen.getByText('Advanced settings')
  expect(summary.parentElement?.hasAttribute('open')).toBe(false)
  expect(screen.queryByLabelText('Configuration')).toBeNull()
  fireEvent.click(summary)
  const input = await screen.findByLabelText<HTMLInputElement>('Configuration')
  fireEvent.change(input, { target: { value: 'draft' } })
  fireEvent.click(summary)
  await waitFor(() => expect(summary.parentElement?.hasAttribute('open')).toBe(false))
  fireEvent.click(summary)
  expect(input.value).toBe('draft')
  view.rerender(contents('skills'))
  summary = screen.getByText('Advanced settings')
  expect(summary.parentElement?.hasAttribute('open')).toBe(false)
  expect(screen.queryByLabelText('Configuration')).toBeNull()
})
