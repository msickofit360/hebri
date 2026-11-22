# Optional Synapsek registration from Hebri

The provider recommendation now explains the managed account benefit and directs new users to account creation. Settings → Billing shows a separate **Create a Synapsek account** action and the sequence: register and choose a plan on the website, return to Hebri, sign in, approve the device, and select Synapsek for new chats when ready.

The native `openSignup` operation opens only the configured Synapsek origin plus `/signup?next=%2Fpricing`. The renderer cannot supply a destination. Opening the website does not sign in, create a credential, switch providers, or mark model access ready. Existing frame/origin checks still guard the IPC operation. Copy covers all ten supported locales.

The screen explicitly states that a Synapsek plan is optional, own providers and compatible local models remain available, and connected services require separate Bit permissions. Existing provider choices are preserved. Account registration is not connector authorization.

This is an onboarding change, not a licence change. Preserve the existing MIT copyright/licence notices and THIRD_PARTY_NOTICES, including KEEL's separate AGPL terms and source information. The paid offering is optional managed account/model service; do not describe paying Synapsek as a condition of exercising the underlying open-source licence rights.

Validation covers the fixed signup destination, no credential-bearing URL, and the renderer invoking only `openSignup` while retaining sign-in and provider choice. Existing onboarding/account tests and both Desktop TypeScript projects are included. Production registration, payment and native device approval remain separate rollout checks; this patch does not claim those systems are deployed.
