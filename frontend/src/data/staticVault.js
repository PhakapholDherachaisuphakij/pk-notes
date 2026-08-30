// Automatically generated Static Vault Snapshot for 100% Vercel Uptime
export const STATIC_VAULT_TREE = [
  {
    "type": "folder",
    "name": "Daily-Notes",
    "path": "Daily-Notes",
    "children": []
  },
  {
    "type": "folder",
    "name": "KMUTT-Study",
    "path": "KMUTT-Study",
    "children": [
      {
        "type": "note",
        "name": "testNote",
        "fileName": "testNote.md",
        "path": "KMUTT-Study/testNote.md",
        "title": "testNote",
        "attributes": {
          "title": "testNote",
          "created": "2026-08-30",
          "category": "KMUTT-Study",
          "tags": []
        },
        "body": "# testNote\n\nStart typing notes here...\n\n#",
        "raw": "---\ntitle: \"testNote\"\ncreated: \"2026-08-30\"\ncategory: \"KMUTT-Study\"\ntags: []\n---\n\n# testNote\n\nStart typing notes here...\n\n#"
      }
    ]
  },
  {
    "type": "folder",
    "name": "SCB-QA-Work",
    "path": "SCB-QA-Work",
    "children": [
      {
        "type": "note",
        "name": "Playwright-Automation-Guide",
        "fileName": "Playwright-Automation-Guide.md",
        "path": "SCB-QA-Work/Playwright-Automation-Guide.md",
        "title": "Playwright Automation Guide",
        "attributes": {
          "title": "Playwright Automation Guide",
          "category": "SCB-QA-Work",
          "tags": [
            "QA",
            "Playwright",
            "Automation",
            "Testing"
          ],
          "created": "2026-08-30"
        },
        "body": "# 🎭 Playwright Automation Cheat Sheet\n\n## Key Concepts\n- **End-to-End Testing (E2E)** for modern web applications.\n- Supports Chromium, WebKit, and Firefox out-of-the-box.\n- Auto-waiting for elements before clicking or typing.\n\n## Basic Test Example\n```javascript\nimport { test, expect } from '@playwright/test';\n\ntest('login and verify dashboard', async ({ page }) => {\n  await page.goto('https://app.example.com/login');\n  await page.fill('#username', 'phakaphol');\n  await page.fill('#password', 'secretpassword');\n  await page.click('button[type=\"submit\"]');\n\n  await expect(page.locator('.dashboard-title')).toHaveText('Welcome Back');\n});\n```\n\n## Checklist for Regression Test\n- [x] Verify authentication flow\n- [x] Check network error handling\n- [ ] Test mobile viewport responsiveness\n- [ ] Setup CI/CD execution in GitHub Actions",
        "raw": "---\ntitle: Playwright Automation Guide\ncategory: SCB-QA-Work\ntags: [QA, Playwright, Automation, Testing]\ncreated: 2026-08-30\n---\n\n# 🎭 Playwright Automation Cheat Sheet\n\n## Key Concepts\n- **End-to-End Testing (E2E)** for modern web applications.\n- Supports Chromium, WebKit, and Firefox out-of-the-box.\n- Auto-waiting for elements before clicking or typing.\n\n## Basic Test Example\n```javascript\nimport { test, expect } from '@playwright/test';\n\ntest('login and verify dashboard', async ({ page }) => {\n  await page.goto('https://app.example.com/login');\n  await page.fill('#username', 'phakaphol');\n  await page.fill('#password', 'secretpassword');\n  await page.click('button[type=\"submit\"]');\n\n  await expect(page.locator('.dashboard-title')).toHaveText('Welcome Back');\n});\n```\n\n## Checklist for Regression Test\n- [x] Verify authentication flow\n- [x] Check network error handling\n- [ ] Test mobile viewport responsiveness\n- [ ] Setup CI/CD execution in GitHub Actions\n"
      }
    ]
  },
  {
    "type": "folder",
    "name": "Tech-Skills",
    "path": "Tech-Skills",
    "children": [
      {
        "type": "note",
        "name": "React-Performance-Tips",
        "fileName": "React-Performance-Tips.md",
        "path": "Tech-Skills/React-Performance-Tips.md",
        "title": "React Performance Optimization Tips",
        "attributes": {
          "title": "React Performance Optimization Tips",
          "category": "Tech-Skills",
          "tags": [
            "React",
            "Vite",
            "Performance",
            "Frontend"
          ],
          "created": "2026-08-30"
        },
        "body": "# ⚡ React Performance Optimization Tips\n\n## 1. Network Resiliency with AbortController\nAlways pair long-running or external API calls with an `AbortController` timeout to prevent UI hanging on spotty networks:\n\n```javascript\nconst controller = new AbortController();\nconst timeoutId = setTimeout(() => controller.abort(), 2500);\n\nconst response = await fetch(url, { signal: controller.signal });\nclearTimeout(timeoutId);\n```\n\n## 2. Dynamic CDN Image Fallback\nUse multi-tier CDN fallbacks (e.g. Cloudinary + Static Pre-bundle) so assets load in 0ms regardless of VPN/Tailscale status.\n\n## Related Topics\n- See [[Playwright-Automation-Guide]] for automated testing.",
        "raw": "---\ntitle: React Performance Optimization Tips\ncategory: Tech-Skills\ntags: [React, Vite, Performance, Frontend]\ncreated: 2026-08-30\n---\n\n# ⚡ React Performance Optimization Tips\n\n## 1. Network Resiliency with AbortController\nAlways pair long-running or external API calls with an `AbortController` timeout to prevent UI hanging on spotty networks:\n\n```javascript\nconst controller = new AbortController();\nconst timeoutId = setTimeout(() => controller.abort(), 2500);\n\nconst response = await fetch(url, { signal: controller.signal });\nclearTimeout(timeoutId);\n```\n\n## 2. Dynamic CDN Image Fallback\nUse multi-tier CDN fallbacks (e.g. Cloudinary + Static Pre-bundle) so assets load in 0ms regardless of VPN/Tailscale status.\n\n## Related Topics\n- See [[Playwright-Automation-Guide]] for automated testing.\n"
      }
    ]
  }
];
