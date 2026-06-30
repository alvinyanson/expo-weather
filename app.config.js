// Dynamic config layered on top of app.json. Expo passes the static app.json
// config in as `config`; we only override android.googleServicesFile so the
// (gitignored) google-services.json can be sourced from the GOOGLE_SERVICES_JSON
// EAS file env var during cloud builds. Locally the env var is unset, so it
// falls back to the committed ./google-services.json path from app.json.
module.exports = ({ config }) => ({
  ...config,
  android: {
    ...config.android,
    googleServicesFile: process.env.GOOGLE_SERVICES_JSON ?? config.android.googleServicesFile,
  },
});
