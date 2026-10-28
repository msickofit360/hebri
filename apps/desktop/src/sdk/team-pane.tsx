import { lazy, Suspense } from 'react'

const TeamView = lazy(() => import('@/app/right-sidebar/team').then(module => ({ default: module.TeamPane })))

/** Render the host's collaboration UI without exposing account credentials or storage. */
export function TeamPane() {
  return <Suspense fallback={null}><TeamView /></Suspense>
}
