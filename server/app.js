const express = require('express');
const path = require('node:path');

const { PAGE_ASSET_KEYS } = require('./assets');
const { buildSignedAssetMap, createAssetSigner, loadSiteConfig } = require('./config');
const { renderHtml, projectRoot } = require('./render');

const htmlPages = new Set([
  'index.html',
  'about.html',
  'business.html',
  'contact.html',
  'drama.html'
]);

function createApp(overrides = {}) {
  const app = express();
  const siteConfig = loadSiteConfig(overrides);
  const assetSigner = createAssetSigner(overrides);

  app.disable('x-powered-by');

  app.get('/healthz', function healthzHandler(_req, res) {
    res.json({ ok: true });
  });

  app.get('/api/site-config', async function siteConfigHandler(_req, res, next) {
    try {
      const assetKeys = [
        'lizhiTrailer',
        'upcomingCover01'
      ];
      const assets = await buildSignedAssetMap(assetSigner, assetKeys);
      res.json({
        bucket: siteConfig.bucket,
        region: siteConfig.region,
        expiresInSeconds: siteConfig.expiresInSeconds,
        assets
      });
    } catch (error) {
      next(error);
    }
  });

  app.use('/css', express.static(path.join(projectRoot, 'css')));
  app.use('/js', express.static(path.join(projectRoot, 'js')));
  app.use('/未上线', express.static(path.join(projectRoot, '未上线')));

  app.get('/', async function indexHandler(_req, res, next) {
    try {
      const assets = await buildSignedAssetMap(assetSigner, PAGE_ASSET_KEYS['index.html']);
      res.type('html').send(renderHtml('index.html', { assets, expiresInSeconds: siteConfig.expiresInSeconds }));
    } catch (error) {
      next(error);
    }
  });

  app.get('/:page', async function pageHandler(req, res, next) {
    const page = req.params.page;

    if (!htmlPages.has(page)) {
      return next();
    }

    try {
      const assets = await buildSignedAssetMap(assetSigner, PAGE_ASSET_KEYS[page]);
      return res.type('html').send(renderHtml(page, { assets, expiresInSeconds: siteConfig.expiresInSeconds }));
    } catch (error) {
      return next(error);
    }
  });

  app.use(function errorHandler(error, _req, res, _next) {
    res.status(500).json({ message: error.message });
  });

  app.use(function notFoundHandler(_req, res) {
    res.status(404).json({ message: 'Not Found' });
  });

  return app;
}

module.exports = {
  createApp
};
