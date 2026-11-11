# Connect a team or another computer

Team Chat connects people. Devices connects approved computers for local-model
assistance. Pairing computers does not join a room, synchronise personal chats,
copy files, or give another computer remote desktop access.

These guided hosting controls are a Desktop update under development. They are
not part of the published 0.17.26 package. Live Windows, macOS and Linux VPN
qualification is required before release.

## Host a room from Desktop

The same flow is intended for Windows, macOS and Linux:

1. Install Tailscale from its official download page on both computers. Sign in
   to the same private network, or have its administrator grant access between
   the computers. Network membership alone does not grant a Hebri room invitation.
2. In Hebri's Advanced mode, open **Team Chat → Self-hosted → Host a team room**.
   Follow **Tailscale HTTPS setup** if your network has not enabled HTTPS or your
   operating system needs permission to use Tailscale Serve.
3. Click **Start private room host**. Hebri checks the connection and reserves
   private HTTPS port 8443 only if it is unused. It does not replace an existing
   Tailscale service, enable public Funnel, open router ports, or elevate itself.
4. Select or create a room, then click **Share** and copy its invitation. Send it
   privately to the intended teammate. Anyone with the invitation and network
   access can exchange it for access to that room and the shared human work board.
5. Keep Hebri open and the host computer awake. Closing Hebri, stopping hosting,
   disconnecting the private network, or losing the local backend stops access.

The desktop host exposes only the Team Chat relay routes, including team presence
and the shared work board. Agent control, configuration, room administration and
local files are not forwarded. The HTTPS address alone is not a room credential.

**Stop room hosting** stops Hebri's own foreground Serve process and its relay
proxy. It does not reset unrelated Tailscale services or log out of Tailscale.

## Join a room

1. Connect to the host's permitted private network.
2. Open **Team Chat → Self-hosted → Join a team room**.
3. Paste the complete invitation, click **Use invitation**, check the host
   address, enter your display name and click **Join**. Pasting never joins by itself.

Manual HTTPS address and invitation-code entry remains available. A successful
join verifies that the other computer can reach the host; a local host check
cannot prove that a teammate's firewall or VPN policy permits it.

Sharing a room again rotates the invitation code. Existing peer grants can remain
valid until their expiry; rotating an invitation is not immediate peer revocation.

## Connect computers on the same network

Open **Connect my computers** or **Devices** on both computers. Enable device
assistance explicitly and choose **LAN**. Nearby discovery is opt-in and limited
to the local IPv4 multicast network. Guest Wi-Fi, VLANs and firewalls can prevent
discovery; use the reachable private IPv4 address when needed.

Discovery is not trust. Exchange the short-lived pairing invitation, compare the
verification code and approve pairing. Separately allow the assistance the peer
may request. Existing certificate checks, identity isolation and task approvals
remain in force. Supported assistance uses local models; this is not a way to
share paid cloud-account credentials.

## Connect computers remotely

Choose **Tailscale** for guided installation/status help, or **Existing VPN** for
WireGuard or another VPN you already administer. Both computers need a reachable
private IPv4 route and appropriate firewall rules. Pair and approve them in Hebri
as above. LAN multicast discovery is not promised across VPN links.

A VPN carries traffic; it does not replace Hebri authentication or approval. An
existing VPN also does not automatically provide HTTPS for Team Chat.

## Existing always-on server

An administrator can run the installed Hebri backend on Windows, macOS or Linux
with `hebri serve --host 127.0.0.1 --port 9119`, using a dedicated service account
and the intended Hebri data directory. That command runs in the foreground; it
does not install a Windows service, launchd job or systemd unit.

Use a supervised service and an authenticated administration connection for
unattended operation. Configure a private HTTPS reverse proxy that permits only
the required `/api/team/relay/` methods and paths, with request limits and no
redirect forwarding. Do not forward the entire backend or expose port 9119 on
the public internet. The desktop wizard's restricted proxy is tied to Desktop's
lifetime and is not an unattended server installer.

Connect the hosting Hebri UI to the backend that owns the rooms. Use **Share**
with that server's externally reachable HTTPS address. A joining teammate can
then use the same invitation flow. An automatically installed cross-platform
always-on service is separate work and is not implemented by this update.

Official setup references:
- [Tailscale downloads](https://tailscale.com/download)
- [Private HTTPS with Tailscale Serve](https://tailscale.com/docs/features/tailscale-serve)
- [WireGuard setup for administrators](https://www.wireguard.com/quickstart/)
