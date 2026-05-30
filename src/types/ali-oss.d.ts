declare module 'ali-oss' {
  interface OSSOptions {
    region: string;
    bucket: string;
    accessKeyId: string;
    accessKeySecret: string;
  }

  interface SignatureUrlOptions {
    expires?: number;
  }

  export default class OSS {
    constructor(options: OSSOptions);
    signatureUrl(name: string, options?: SignatureUrlOptions): string;
  }
}
