import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { load } from 'js-yaml'

export function validateReleaseWorkflow(workflow) {
  const apple = /secrets\.(?:CSC_LINK|CSC_KEY_PASSWORD|APPLE_API_KEY|APPLE_API_KEY_ID|APPLE_API_ISSUER)\b/
  for (const [name, job] of Object.entries(workflow.jobs)) {
    if (!apple.test(JSON.stringify(job))) continue
    if (
      job.environment !== 'macos-signing' ||
      !job.if?.includes("github.event_name == 'push'") ||
      !job.if?.includes("startsWith(github.ref, 'refs/tags/v')") ||
      !job.if?.includes("github.repository == 'Synapsek-Labs/hebri'") ||
      /\|\|/.test(job.if) ||
      /CSC_FOR_PULL_REQUEST/.test(JSON.stringify(job))
    ) {
      throw new Error(`Apple credentials must be restricted to approved release tags: ${name}`)
    }
  }
  const unsigned = workflow.jobs.macos
  if (
    apple.test(JSON.stringify(unsigned)) ||
    unsigned.environment ||
    !unsigned.steps.some(
      step =>
        step.env?.CSC_IDENTITY_AUTO_DISCOVERY === 'false' &&
        step.run?.includes('-c.mac.identity=null') &&
        step.run?.includes('-c.mac.notarize=false')
    )
  ) {
    throw new Error('PR macOS packaging must be explicitly unsigned without a signing environment')
  }
  if (!workflow.jobs.release.needs.includes('macos-release')) {
    throw new Error('Release assembly must wait for signed macOS packages')
  }
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  validateReleaseWorkflow(load(readFileSync(new URL('../../.github/workflows/build.yml', import.meta.url), 'utf8')))
  console.log('Release signing policy verified')
}
