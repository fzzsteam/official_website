const OSS = require('ali-oss');

const { ASSET_PATHS } = require('./assets');

class OssAssetSigner {
  constructor(options) {
    this.client = new OSS({
      region: options.region,
      bucket: options.bucket,
      accessKeyId: options.accessKeyId,
      accessKeySecret: options.accessKeySecret
    });
    this.expiresInSeconds = options.expiresInSeconds;
  }

  async sign(resourcePath) {
    return this.client.signatureUrl(resourcePath, {
      expires: this.expiresInSeconds
    });
  }
}

function loadSiteConfig(overrides = {}) {
  const expiresInSeconds = Number(
    overrides.expiresInSeconds ||
    process.env.OSS_URL_EXPIRES_SECONDS ||
    3600
  );

  return {
    bucket: overrides.bucket || process.env.OSS_BUCKET || 'fangzhi-prod',
    region: overrides.region || process.env.OSS_REGION || 'oss-cn-shenzhen',
    expiresInSeconds,
    accessKeyId: overrides.accessKeyId || process.env.OSS_ACCESS_KEY_ID,
    accessKeySecret: overrides.accessKeySecret || process.env.OSS_ACCESS_KEY_SECRET
  };
}

function createAssetSigner(overrides = {}) {
  if (overrides.assetSigner) {
    return overrides.assetSigner;
  }

  const config = loadSiteConfig(overrides);
  if (!config.accessKeyId || !config.accessKeySecret) {
    throw new Error('Missing OSS_ACCESS_KEY_ID or OSS_ACCESS_KEY_SECRET');
  }

  return new OssAssetSigner(config);
}

async function buildSignedAssetMap(assetSigner, assetKeys) {
  const entries = await Promise.all(
    assetKeys.map(async function signEntry(assetKey) {
      const resourcePath = ASSET_PATHS[assetKey];
      return [assetKey, await assetSigner.sign(resourcePath)];
    })
  );

  return Object.fromEntries(entries);
}

module.exports = {
  buildSignedAssetMap,
  createAssetSigner,
  loadSiteConfig
};
