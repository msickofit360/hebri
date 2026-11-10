/**
 * Curated brand glyphs for MCP server names — extracted from the mcp-tab's
 * avatar (its `MCP_BRAND_ICONS`) the moment a second surface (the composer
 * suggestion pills / inline setup card) needed the same identity ladder.
 *
 * This is the first rung only. Everything below it — the endpoint's own
 * favicon, then the initial — lives in `components/ui/connector-logo`, which
 * is what a surface should render when it wants a mark rather than a glyph.
 * Either way we never ask a third-party favicon service: an MCP URL can be a
 * private host, and that lookup would leak the hostname off-box.
 */
import {
  SiAlgolia,
  SiAlgoliaHex,
  SiBox,
  SiBoxHex,
  SiBuildkite,
  SiBuildkiteHex,
  SiCalendly,
  SiCalendlyHex,
  SiCircleci,
  SiCircleciHex,
  SiClickup,
  SiClickupHex,
  SiCloudflare,
  SiCloudflareHex,
  SiCloudinary,
  SiCloudinaryHex,
  SiDropbox,
  SiDropboxHex,
  SiFacebook,
  SiFacebookHex,
  SiGoogleads,
  SiGoogleadsHex,
  SiGrafana,
  SiGrafanaHex,
  SiHubspot,
  SiHubspotHex,
  SiInstagram,
  SiInstagramHex,
  SiMailchimp,
  SiMailchimpHex,
  SiMake,
  SiMakeHex,
  SiMetabase,
  SiMetabaseHex,
  SiMiro,
  SiMiroHex,
  SiMixpanel,
  SiMixpanelHex,
  SiPosthog,
  SiPosthogHex,
  SiPostman,
  SiPostmanHex,
  SiPrisma,
  SiPrismaHex,
  SiQuickbooks,
  SiQuickbooksHex,
  SiRailway,
  SiRailwayHex,
  SiShopify,
  SiShopifyHex,
  SiSnowflake,
  SiSnowflakeHex,
  SiStrava,
  SiStravaHex,
  SiTrello,
  SiTrelloHex,
  SiWhatsapp,
  SiWhatsappHex,
  SiWordpress,
  SiWordpressHex,
  SiX,
  SiXHex,
  SiXero,
  SiXeroHex,
  SiZendesk,
  SiZendeskHex,
  SiAirtable,
  SiAsana,
  SiAtlassian,
  SiDatadog,
  SiDiscord,
  SiFigma,
  SiGithub,
  SiGitlab,
  SiGmail,
  SiGooglecalendar,
  SiGoogledrive,
  SiGooglesheets,
  SiHuggingface,
  SiIntercom,
  SiJira,
  SiLinear,
  SiN8n,
  SiNetlify,
  SiNotion,
  SiPaypal,
  SiPostgresql,
  SiSentry,
  SiSpotify,
  SiSquare,
  SiStripe,
  SiSupabase,
  SiTelegram,
  SiTodoist,
  SiUnrealengine,
  SiVercel,
  SiWebflow,
  SiYoutube,
  SiZapier
} from '@icons-pack/react-simple-icons'
import type { ComponentType, SVGProps } from 'react'
import slackLogo from '@/assets/connectors/slack.png'

function SlackLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 256 256">
      <image href={slackLogo} width="256" height="256" />
    </svg>
  )
}

export interface McpBrand {
  Icon: ComponentType<SVGProps<SVGSVGElement>>
  color: string
  /** The official mark is black/white (GitHub, Vercel, Notion): render it in
   *  `currentColor` so it follows the theme instead of vanishing on dark. The
   *  `color` stays for tint backgrounds (the avatar chip), never the glyph. */
  monochrome?: boolean
}

export const MCP_BRAND_ICONS: Record<string, McpBrand> = {
  algolia: { Icon: SiAlgolia, color: SiAlgoliaHex },
  box: { Icon: SiBox, color: SiBoxHex },
  buildkite: { Icon: SiBuildkite, color: SiBuildkiteHex },
  calendly: { Icon: SiCalendly, color: SiCalendlyHex },
  circleci: { Icon: SiCircleci, color: SiCircleciHex },
  clickup: { Icon: SiClickup, color: SiClickupHex },
  cloudflare: { Icon: SiCloudflare, color: SiCloudflareHex },
  cloudinary: { Icon: SiCloudinary, color: SiCloudinaryHex },
  dropbox: { Icon: SiDropbox, color: SiDropboxHex },
  'facebook-pages': { Icon: SiFacebook, color: SiFacebookHex },
  'google-ads': { Icon: SiGoogleads, color: SiGoogleadsHex },
  grafana: { Icon: SiGrafana, color: SiGrafanaHex },
  hubspot: { Icon: SiHubspot, color: SiHubspotHex },
  'instagram-business': { Icon: SiInstagram, color: SiInstagramHex },
  mailchimp: { Icon: SiMailchimp, color: SiMailchimpHex },
  make: { Icon: SiMake, color: SiMakeHex },
  metabase: { Icon: SiMetabase, color: SiMetabaseHex },
  miro: { Icon: SiMiro, color: SiMiroHex },
  mixpanel: { Icon: SiMixpanel, color: SiMixpanelHex },
  posthog: { Icon: SiPosthog, color: SiPosthogHex, monochrome: true },
  postman: { Icon: SiPostman, color: SiPostmanHex },
  quickbooks: { Icon: SiQuickbooks, color: SiQuickbooksHex },
  railway: { Icon: SiRailway, color: SiRailwayHex, monochrome: true },
  shopify: { Icon: SiShopify, color: SiShopifyHex },
  snowflake: { Icon: SiSnowflake, color: SiSnowflakeHex },
  strava: { Icon: SiStrava, color: SiStravaHex },
  trello: { Icon: SiTrello, color: SiTrelloHex },
  'whatsapp-business': { Icon: SiWhatsapp, color: SiWhatsappHex },
  'wordpress-com': { Icon: SiWordpress, color: SiWordpressHex },
  x: { Icon: SiX, color: SiXHex, monochrome: true },
  xero: { Icon: SiXero, color: SiXeroHex },
  zendesk: { Icon: SiZendesk, color: SiZendeskHex },
  'prisma-postgres': { Icon: SiPrisma, color: SiPrismaHex, monochrome: true },
  airtable: { Icon: SiAirtable, color: '#18BFFF' },
  asana: { Icon: SiAsana, color: '#F06A6A' },
  atlassian: { Icon: SiAtlassian, color: '#0052CC' },
  datadog: { Icon: SiDatadog, color: '#632CA6' },
  discord: { Icon: SiDiscord, color: '#5865F2' },
  figma: { Icon: SiFigma, color: '#F24E1E' },
  github: { Icon: SiGithub, color: '#181717', monochrome: true },
  gitlab: { Icon: SiGitlab, color: '#FC6D26' },
  gmail: { Icon: SiGmail, color: '#EA4335' },
  // Gateway spelling (connector slugs), plus the hyphenated form MCP server
  // names tend to use.
  googlecalendar: { Icon: SiGooglecalendar, color: '#4285F4' },
  'google-calendar': { Icon: SiGooglecalendar, color: '#4285F4' },
  googledrive: { Icon: SiGoogledrive, color: '#4285F4' },
  'google-drive': { Icon: SiGoogledrive, color: '#4285F4' },
  googlesheets: { Icon: SiGooglesheets, color: '#34A853' },
  hugging_face: { Icon: SiHuggingface, color: '#FFD21E' },
  huggingface: { Icon: SiHuggingface, color: '#FFD21E' },
  intercom: { Icon: SiIntercom, color: '#6AFDEF' },
  jira: { Icon: SiJira, color: '#0052CC' },
  linear: { Icon: SiLinear, color: '#5E6AD2' },
  n8n: { Icon: SiN8n, color: '#EA4B71' },
  netlify: { Icon: SiNetlify, color: '#00C7B7' },
  notion: { Icon: SiNotion, color: '#000000', monochrome: true },
  paypal: { Icon: SiPaypal, color: '#003087' },
  postgres: { Icon: SiPostgresql, color: '#4169E1' },
  postgresql: { Icon: SiPostgresql, color: '#4169E1' },
  sentry: { Icon: SiSentry, color: '#362D59' },
  // Slack's published full-colour mark is bundled; see assets/connectors/README.md.
  slack: { Icon: SlackLogo, color: '#4A154B' },
  spotify: { Icon: SiSpotify, color: '#1DB954' },
  square: { Icon: SiSquare, color: '#3E4348', monochrome: true },
  stripe: { Icon: SiStripe, color: '#635BFF' },
  supabase: { Icon: SiSupabase, color: '#3FCF8E' },
  telegram: { Icon: SiTelegram, color: '#26A5E4' },
  todoist: { Icon: SiTodoist, color: '#E44332' },
  'unreal-engine': { Icon: SiUnrealengine, color: '#0E1128', monochrome: true },
  vercel: { Icon: SiVercel, color: '#000000', monochrome: true },
  webflow: { Icon: SiWebflow, color: '#146EF5' },
  youtube: { Icon: SiYoutube, color: '#FF0000' },
  zapier: { Icon: SiZapier, color: '#FF4A00' }
}

/** Inline-glyph color for a brand: monochrome marks inherit the surrounding
 *  text color; branded marks use the brand color. */
export const brandGlyphStyle = (brand: McpBrand): { color: string } | undefined =>
  brand.monochrome ? undefined : { color: brand.color }

/** The same brand under every spelling a connector arrives with: catalog slug
 *  (`unreal-engine`), registry id (`unreal_engine`), display name (`Unreal
 *  Engine`). Compare on letters and digits alone so none of them miss. */
const squash = (value: string): string => value.toLowerCase().replace(/[^a-z0-9]/g, '')

export const brandFor = (name: string): McpBrand | null => {
  const target = squash(name)

  if (!target) {
    return null
  }

  const aliases: Record<string, string> = {
    facebook: 'facebookpages',
    instagram: 'instagrambusiness',
    instagramprofessional: 'instagrambusiness',
    whatsapp: 'whatsappbusiness',
    wordpress: 'wordpresscom',
    twitter: 'x',
    googlespreadsheets: 'googlesheets'
  }
  const entries = Object.entries(MCP_BRAND_ICONS)
  const exact = (key: string) => entries.find(([name]) => squash(name) === key)?.[1]
  // Only known transport decorations may be stripped. Substring matching labels
  // "Dropbox" as Box and nearly everything containing x as X.
  const normalized = target.replace(/^mcp/, '').replace(/(?:mcpserver|mcp|official|connector|server)$/, '')
  return exact(aliases[target] ?? target) ?? exact(aliases[normalized] ?? normalized) ?? null
}
