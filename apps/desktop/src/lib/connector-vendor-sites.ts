/** Vendor-owned sites for brands absent from the bundled icon library.
 * Resolve their own published icon through the existing favicon bridge, never
 * send connector identities, endpoint paths or queries to a logo aggregator. */
const sites: Record<string, string> = {
  monday: 'https://monday.com',
  mondaycom: 'https://monday.com',
  outlookmail: 'https://outlook.live.com',
  microsoft365mail: 'https://outlook.live.com',
  outlookcalendar: 'https://outlook.live.com',
  microsoftteams: 'https://teams.microsoft.com',
  teams: 'https://teams.microsoft.com',
  canva: 'https://www.canva.com',
  salesforce: 'https://www.salesforce.com',
  apollo: 'https://www.apollo.io',
  linkedin: 'https://www.linkedin.com',
  klaviyo: 'https://www.klaviyo.com',
  amplitude: 'https://amplitude.com',
  metaads: 'https://www.facebook.com',
  slack: 'https://slack.com',
  alltrails: 'https://www.alltrails.com',
  attio: 'https://attio.com',
  awsknowledge: 'https://aws.amazon.com',
  betterstack: 'https://betterstack.com',
  close: 'https://www.close.com',
  comfycloud: 'https://www.comfy.org',
  context7: 'https://context7.com',
  craft: 'https://www.craft.do',
  deepwiki: 'https://deepwiki.com',
  fireflies: 'https://fireflies.ai',
  gamma: 'https://gamma.app',
  globalping: 'https://globalping.io',
  indeed: 'https://www.indeed.com',
  kiwi: 'https://www.kiwi.com',
  microsoftlearn: 'https://learn.microsoft.com',
  motherduck: 'https://motherduck.com',
  neon: 'https://neon.com',
  plaid: 'https://plaid.com',
  robinhood: 'https://robinhood.com',
  semgrep: 'https://semgrep.dev',
  trivago: 'https://www.trivago.com',
  twelvedata: 'https://twelvedata.com',
  twiliodocs: 'https://www.twilio.com',
  wolfram: 'https://www.wolfram.com'
}

export function connectorVendorSite(name: string): string {
  return sites[name.toLowerCase().replace(/[^a-z0-9]/g, '')] ?? ''
}
