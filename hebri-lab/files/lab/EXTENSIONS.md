# Extensions in Hebri Lab

The Lab workspace opens at `/extensions`. Select Extensions in the tab strip to open Marketplace. The sidebar and the section picker both reach the same five destinations. The picker remains available at narrow widths. Within a section, Advanced settings starts folded and retains in-progress input when folded again.

| Section | Everyday tasks | Advanced controls and limits |
| --- | --- | --- |
| Connectors | Discover services, connect accounts, check status and review access for the selected Bit. | Open the existing MCP server and endpoint configuration and tool permissions. Database connections depend on an available connector or custom MCP server. |
| Plugins | Discover bundled catalog entries, open the review dialog, install, enable, disable and update through the existing plugin manager. | Inspect package/runtime controls and the capabilities declared by the plugin. Dependency resolution belongs to the installer. |
| Skills | Discover, preview, create and enable skills for a selected Bit. | Inspect definitions and configure the Bit’s available toolsets. Execution parameters follow each skill's supported definition. |
| Automations | Create and manage recurring jobs and see their state. | Configure execution settings, signed webhook subscriptions and scoped shell hooks. Hooks support event selection, tool matching and a timeout. There is no visual general-purpose branching engine. |
| Knowledge | Open catalog-backed document, repository and knowledge-base providers and see their enabled state. | Inspect provider-specific access and the shipped guide to local indexing and retrieval. External providers own synchronization. There is no general ingestion or sync-job API. |

## Integration and verification

The desktop renderer implements the route and sidebar under `apps/desktop/src/app/extensions/`, registered in `app/contrib/` and `app/routes.ts`. Marketplace combines the bundled plugin catalog and existing MCP and official-skills reads. Choosing a search result opens the owning manager. Registry, authentication, grant and execution operations stay in the existing services. New plugin-install reviews are tied to their gateway. Existing `/capabilities`, scheduling and webhook routes remain available.

The rendered Edge fixture exercised 33 states at 320, 375 and 1280 CSS pixels, including all five sections with their disclosures closed and open. It found no horizontal overflow or clipped visible controls. A defect where closing a provider dialog lost keyboard focus was corrected and independently retested at all three widths. Marketplace search, history and provider review used synthetic data with external traffic blocked. The combined renderer regression sweep passed 262 tests in 42 files. Additional gateway checks exercised the real hooks API on two temporary gateway homes, including identically named Bits, with no script execution. No live account operations or external distribution formed part of this check.
