import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'wxt';

// https://wxt.dev/api/config.html
export default defineConfig({
  srcDir: 'src',
  modules: ['@wxt-dev/module-react', '@wxt-dev/i18n/module'],
  vite: () => ({
    plugins: [tailwindcss()],
  }),
  // MV3 everywhere (Firefox included) so both targets share one permission model.
  manifestVersion: 3,
  manifest: ({ browser }) => ({
    name: '__MSG_extName__',
    description: '__MSG_extDescription__',
    default_locale: 'en',
    // Least privilege: host access is requested at runtime per site (optional_host_permissions).
    // Firefox has no `sidePanel` permission: WXT maps the sidepanel entrypoint to `sidebar_action`.
    permissions: ['storage', 'activeTab', ...(browser === 'firefox' ? [] : ['sidePanel'])],
    optional_host_permissions: ['<all_urls>'],
    action: { default_title: '__MSG_extName__' },
    // Explicit and stricter than the MV3 default (research R13). WXT adds its dev server in dev mode.
    content_security_policy: {
      extension_pages:
        "script-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'",
    },
    ...(browser === 'firefox' && {
      browser_specific_settings: {
        gecko: {
          id: 'jwt-inspector@lggutierrez0.github.io',
          // First Firefox release with MV3 optional_host_permissions.
          strict_min_version: '128.0',
          data_collection_permissions: { required: ['none'] },
        },
      },
    }),
  }),
});
