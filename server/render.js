const fs = require('node:fs');
const path = require('node:path');

const templateCache = new Map();
const projectRoot = path.resolve(__dirname, '..');

function getTemplate(templateName) {
  if (!templateCache.has(templateName)) {
    const templatePath = path.join(projectRoot, templateName);
    const template = fs.readFileSync(templatePath, 'utf8');
    templateCache.set(templateName, template);
  }

  return templateCache.get(templateName);
}

function renderHtml(templateName, appConfig) {
  const appConfigScript = `<script>window.APP_CONFIG=${JSON.stringify(appConfig)};</script>`;

  let html = getTemplate(templateName);
  for (const [key, value] of Object.entries(appConfig.assets || {})) {
    html = html.replaceAll(`{{${key}}}`, value);
  }

  return html.replace('{{APP_CONFIG_SCRIPT}}', appConfigScript);
}

module.exports = {
  renderHtml,
  projectRoot
};
