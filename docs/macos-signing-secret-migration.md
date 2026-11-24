# One-time macOS signing secret migration

The existing five signing values are repository secrets, but PR82 intentionally
requires release signing through the protected `macos-signing` environment. The
original private-key files are not available locally. This migration preserves
those credentials without exposing plaintext to an operator or a local machine.

## Review and execution

1. Before dispatch, configure `macos-signing-migration` with required reviewers
   `satoshilove` or `msickofit360`, no administrator bypass, and a custom deployment
   branch policy allowing only the `main` branch. Store no secrets in that
   temporary environment. Verify these settings through the GitHub API.
2. Review and merge this workflow normally. Verify the exact merged commit and
   all applicable checks before dispatching it on `main`. Review the pending
   `macos-signing-migration` deployment before allowing it to execute.
3. The job installs pinned, hash-verified wheels before the secret-bearing step.
   Only that step receives the five existing repository secrets. It encrypts them
   with libsodium sealed boxes to the hard-coded public key fetched from
   `Synapsek-Labs/hebri` -> `macos-signing`. There is no caller-controlled recipient,
   arbitrary secret list, plaintext artifact, or elevated GitHub token. The job
   stops accepting runs on 28 November 2026 UTC.
4. Download the encrypted artifact from the reviewed run. Verify the repository,
   environment, merged commit, run ID, attempt, successful job and artifact digest.
   Re-fetch the destination public key and require BOTH its key ID and key bytes
   to match the artifact and reviewed script. Reject any missing or extra name.
5. PUT each sealed value through GitHub's `Create or update an environment secret`
   endpoint using the operator's existing authorized credentials. Do not print
   values. Verify all five destination names and update timestamps. GitHub does
   not provide a plaintext read-back endpoint; actual signing must still pass.
6. Remove the five repository copies only after successful destination writes
   and metadata verification. Check that repository copies are absent and the
   destination still has all five. Preserve `macos-signing`'s tag-only policy and
   required approval. Run the full signed release and notarization validation.
7. Disable this migration workflow immediately after successful import. Remove
   its temporary environment and workflow in a follow-up reviewed cleanup.

The migration itself does not delete secrets, issue Apple credentials, sign a
release, publish anything, or relax the release environment. If key IDs change,
encryption or import fails, stop; do not delete repository copies or publish.

GitHub's [encryption documentation](https://docs.github.com/en/rest/guides/encrypting-secrets-for-the-rest-api)
and [environment secret API](https://docs.github.com/en/rest/actions/secrets#create-or-update-an-environment-secret)
describe the sealed-box format used here.
