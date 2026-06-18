# SDK CI/CD Workflows

This document explains how to use the automated workflows for SDK regeneration and publishing.

## 🔄 SDK Regeneration Workflow

**File:** `.github/workflows/sdk-regeneration.yml`

This workflow automatically regenerates all SDKs when `spec.yaml` changes.

### Manual Trigger

You can manually trigger SDK regeneration anytime:

1. Go to **Actions** tab in GitHub
2. Select **SDK Regeneration** workflow
3. Click **Run workflow**
4. Choose which SDKs to regenerate (all/ts/js/python/go/php)
5. Click **Run workflow** button

### Automatic Trigger (Toggle)

The workflow can automatically run when `spec.yaml` is updated:

**Currently:** `DISABLED` (default for safety while API is evolving)

**To enable automatic regeneration:**

1. Edit `.github/workflows/sdk-regeneration.yml`
2. Change line 29: `AUTO_REGENERATE_ENABLED: 'false'` → `AUTO_REGENERATE_ENABLED: 'true'`
3. Commit and push

Now every push to `spec.yaml` on `main` branch will automatically regenerate SDKs and create a PR.

**To disable:**  
Change back to `'false'`

## 📦 SDK Publishing Workflow

**File:** `.github/workflows/publish-sdks.yml`

This workflow publishes SDKs to their respective package registries.

### How to Publish

1. Go to **Actions** tab in GitHub
2. Select **Publish SDKs** workflow
3. Click **Run workflow**
4. Choose SDK to publish (typescript/javascript/python/embed/all)
5. Optionally choose version bump (skip/patch/minor/major)
6. Click **Run workflow** button

### Required Secrets

Before using the publish workflow, set these secrets in GitHub repository settings:

- `NPM_TOKEN` - For publishing TypeScript & JavaScript SDKs to npm
- `PYPI_TOKEN` - For publishing Python SDK to PyPI

**To create tokens:**

**npm:** https://www.npmjs.com → Account Settings → Access Tokens → Generate New Token (Automation)  
**PyPI:** https://pypi.org → Account Settings → API tokens → Add API token

## 📋 Current Published Packages

### TypeScript SDK
- **Package:** `@lomi./sdk`
- **Version:** `1.5.11` ✅
- **Install:** `npm i @lomi./sdk`
- **Registry:** https://www.npmjs.com/package/@lomi./sdk

### JavaScript SDK
- **Package:** `@lomi./sdk-js`
- **Version:** `1.0.0` ✅
- **Install:** `npm i @lomi./sdk-js`
- **Registry:** https://www.npmjs.com/package/@lomi./sdk-js

### Python SDK
- **Package:** `lomi-sdk`
- **Version:** `1.5.11` (publish via workflow when ready)
- **Install:** `pip install lomi-sdk`
- **Registry:** https://pypi.org/project/lomi-sdk/

### Embed SDK
- **Package:** `@lomi./embed`
- **Version:** `0.2.0`
- **Install:** `npm i @lomi./embed`
- **Registry:** https://www.npmjs.com/package/@lomi./embed
- **Publish:** GitHub Actions → Publish SDKs → `embed`, or locally:

```bash
cd apps/sdks/embed
npm ci
npm test
npm run build
npm publish --access public
```

## 🚀 Quick Commands

### Publish Locally (Manual)

**TypeScript:**
```bash
cd apps/sdks/ts
npm run build
npm publish --access public
```

**JavaScript:**
```bash
cd apps/sdks/js
npm run build
npm publish --access public
```

**Python:**
```bash
cd apps/sdks/python
python -m build
twine upload dist/*
```

### Regenerate SDKs Locally

```bash
cd apps/sdks
npm run generate:ts
npm run generate:js
npm run generate:python
# or all at once
npm run generate:all
```
