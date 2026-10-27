"""Opt-in, profile-scoped Hebri device collaboration.

Desktop owns the OS-encrypted wrapping key. The authenticated loopback dashboard
owns configuration, invitation creation and local approval. The separate TLS peer
listener exposes only pairing, status and bounded local-model assistance. It never
mounts the dashboard, agent tool dispatcher, filesystem or private session APIs.

Discovery is untrusted IPv4 multicast; only names and identity fingerprints are
announced. A single-use five-minute invitation carries the host certificate, then
the host must approve a verification code. Each direction has a separate random
bearer capability, encrypted at rest on the caller and hashed on the receiving host.
Certificate pinning authenticates the server; this is not mutual TLS. Model output
and discovered hardware remain untrusted data.

Pilot scope: Hebri-managed local models, one incoming task at a time, 120-second
deadline, 2,048 output tokens, no recursive delegation or arbitrary tools. Local
model servers may take additional time to stop GPU work after cancellation closes
the request. No Synapsek account, cloud relay, or funded provider request is used.
Real macOS-to-Windows firewall/discovery and GPU tests remain release gates.
"""
