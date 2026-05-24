# School Settings — Sprint 1 Issues

Generated from `.claude/docs/oksis-mobile-okul-ayarlari.docx`.

Repository: `farukkaya/oksis-mobile`

GitHub CLI was not available locally — issues were generated as markdown files only.
Run the `gh issue create` commands below after authenticating (`gh auth login`).

## Summary

- **Total issues:** 10
- **Total story points:** 105
- **Distribution:** 5 × 8 SP, 5 × 13 SP, 0 × 21 SP, 0 × 34 SP

No 21 SP or 34 SP issues exist in this batch — every feature was reviewable at 13 SP or less.

## Labels (create first if missing)

```bash
gh label create "module:school-settings" --color "1d4ed8" --description "Okul Ayarları modülü"
gh label create "sprint:1"               --color "0e7490" --description "Sprint 1"
gh label create "type:feature"           --color "16a34a"
gh label create "type:test"              --color "fbbf24"
gh label create "type:i18n"              --color "a78bfa"
gh label create "type:infra"             --color "9ca3af"
gh label create "type:refactor"          --color "f97316"
gh label create "sp:8"                   --color "bef264"
gh label create "sp:13"                  --color "65a30d"
gh label create "sp:21"                  --color "365314"
gh label create "sp:34"                  --color "14532d"
```

## Create issues

```bash
REPO=farukkaya/oksis-mobile

gh issue create --repo $REPO \
  --title "[School Settings] Define SchoolBranding / SchoolInfo DTOs and query key factories" \
  --label "module:school-settings,sprint:1,type:feature,sp:8" \
  --body-file ".claude/generated-issues/school-settings/ISSUE-01-types-and-query-keys.md"

gh issue create --repo $REPO \
  --title "[School Settings] Public branding React Query hook and Zustand branding store" \
  --label "module:school-settings,sprint:1,type:feature,sp:13" \
  --body-file ".claude/generated-issues/school-settings/ISSUE-02-public-branding-hook-and-store.md"

gh issue create --repo $REPO \
  --title "[School Settings] LoginScreen branding integration (logo, school name, primary color)" \
  --label "module:school-settings,sprint:1,type:feature,sp:13" \
  --body-file ".claude/generated-issues/school-settings/ISSUE-03-loginscreen-branding-integration.md"

gh issue create --repo $REPO \
  --title "[School Settings] Authenticated school info API and useSchoolInfo hook" \
  --label "module:school-settings,sprint:1,type:feature,sp:8" \
  --body-file ".claude/generated-issues/school-settings/ISSUE-04-school-info-hook-and-api.md"

gh issue create --repo $REPO \
  --title "[School Settings] SchoolBrandingHeader and SchoolContactCard components" \
  --label "module:school-settings,sprint:1,type:feature,sp:13" \
  --body-file ".claude/generated-issues/school-settings/ISSUE-05-branding-header-and-contact-card-components.md"

gh issue create --repo $REPO \
  --title "[School Settings] SchoolInfoScreen read-only screen with loading and error states" \
  --label "module:school-settings,sprint:1,type:feature,sp:13" \
  --body-file ".claude/generated-issues/school-settings/ISSUE-06-school-info-screen.md"

gh issue create --repo $REPO \
  --title "[School Settings] SettingsStack navigation integration for Teacher / Parent / Student" \
  --label "module:school-settings,sprint:1,type:feature,sp:13" \
  --body-file ".claude/generated-issues/school-settings/ISSUE-07-settings-stack-navigation.md"

gh issue create --repo $REPO \
  --title "[School Settings] i18n keys and resources for school-info namespace" \
  --label "module:school-settings,sprint:1,type:i18n,sp:8" \
  --body-file ".claude/generated-issues/school-settings/ISSUE-08-i18n-keys-school-info.md"

gh issue create --repo $REPO \
  --title "[School Settings] Security and scope guard tests" \
  --label "module:school-settings,sprint:1,type:test,sp:8" \
  --body-file ".claude/generated-issues/school-settings/ISSUE-09-security-and-scope-guard-tests.md"

gh issue create --repo $REPO \
  --title "[School Settings] Final integration test and QA hardening" \
  --label "module:school-settings,sprint:1,type:test,sp:8" \
  --body-file ".claude/generated-issues/school-settings/ISSUE-10-integration-and-qa-hardening.md"
```

## Missing labels / repository access

- The `gh` CLI is not installed on this workstation; no labels were created and no issues were pushed.
- Repository owner/name was detected automatically from `git remote -v`.
- After `gh auth login`, run the label-create block first, then the issue-create block. If any `gh label create` fails because the label already exists, ignore that error and continue.

## 21 SP / 34 SP issues

None. Every issue is scoped to 8 or 13 SP — each remains independently reviewable.
