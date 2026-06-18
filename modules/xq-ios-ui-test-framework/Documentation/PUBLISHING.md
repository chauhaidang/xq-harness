# Publishing

The module is developed in `xq-harness` and distributed from the private
`chauhaidang/xq-ios-ui-test-framework` repository because SwiftPM requires
`Package.swift` at the root of a source-control package.

1. Update `VERSION` and `CHANGELOG.md`.
2. Merge the validated change to `main`.
3. Push `ios-ui-test-framework-vX.Y.Z` in the monorepo.
4. The release workflow validates the package, subtree-splits this directory,
   pushes the split commit, creates immutable `X.Y.Z`, and creates a release.

## Publishing Credential

The release workflow runs in `chauhaidang/xq-harness` but pushes commits, tags,
and releases to `chauhaidang/xq-ios-ui-test-framework`. The automatic
`GITHUB_TOKEN` is scoped to the repository running the workflow, so it cannot
perform this cross-repository publication. This differs from the `xq-scripts`
release, which creates its release inside `xq-harness` and can therefore use
`GITHUB_TOKEN`.

For the initial setup, create a fine-grained personal access token:

1. Create the private `chauhaidang/xq-ios-ui-test-framework` repository first.
2. Open GitHub **Settings > Developer settings > Personal access tokens >
   Fine-grained tokens** and select **Generate new token**.
3. Select `chauhaidang` as the resource owner.
4. Under repository access, select only `xq-ios-ui-test-framework`.
5. Grant repository permission **Contents: Read and write**. Metadata read
   access is added automatically.
6. Choose the shortest practical expiration and generate the token. GitHub
   displays its value once.
7. Add it to the source repository as the Actions secret
   `SWIFT_PACKAGE_PUBLISH_TOKEN`.

Set the secret through the GitHub UI at **xq-harness > Settings > Secrets and
variables > Actions > New repository secret**, or with GitHub CLI:

```bash
gh secret set SWIFT_PACKAGE_PUBLISH_TOKEN \
  --repo chauhaidang/xq-harness
```

The CLI prompts for the token value. Do not place the token in a command-line
argument, repository file, shell history, workflow log, or SwiftPM URL.

Confirm only that the secret name exists:

```bash
gh secret list --repo chauhaidang/xq-harness
```

The workflow uses the same secret for authenticated Git pushes and for
`gh release create`. A failed or expired credential can be replaced by running
`gh secret set` again with the same name.

GitHub documents fine-grained token creation and permissions at:

- <https://docs.github.com/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens>
- <https://docs.github.com/rest/authentication/permissions-required-for-fine-grained-personal-access-tokens>

For longer-lived team automation, prefer a GitHub App installed only on the
distribution repository. Its workflow can mint a short-lived installation
token instead of storing a personal token. See:
<https://docs.github.com/apps/creating-github-apps/guides/making-authenticated-api-requests-with-a-github-app-in-a-github-actions-workflow>.

## Consumer Credentials

Do not reuse `SWIFT_PACKAGE_PUBLISH_TOKEN` for SwiftPM consumers. Developers can
use their normal GitHub SSH access. CI consumers should use a separate
fine-grained token with **Contents: Read-only** or a read-only deploy key scoped
to `xq-ios-ui-test-framework`.

Read-only deploy key setup is documented at:
<https://docs.github.com/authentication/connecting-to-github-with-ssh/managing-deploy-keys>.

## Rotation And Revocation

1. Generate a replacement credential with the same repository scope and
   permissions.
2. Replace `SWIFT_PACKAGE_PUBLISH_TOKEN` in `xq-harness`.
3. Run a patch release and confirm the subtree push, semantic tag, and GitHub
   release all succeed.
4. Revoke the old token from GitHub.

Immediately revoke and replace the token if it appears in logs, shell history,
source control, or an issue or pull request.

Never move a published tag. Correct a faulty release with a new patch version.
