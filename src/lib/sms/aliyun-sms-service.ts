import 'server-only';

import Dysmsapi20170525, { SendSmsRequest } from '@alicloud/dysmsapi20170525';
import * as OpenApi from '@alicloud/openapi-client';
import * as UtilClient from '@alicloud/tea-util';
import { getEnv } from '@/lib/config/env';

let cachedClient: Dysmsapi20170525 | null = null;

function getClient() {
  if (!cachedClient) {
    const env = getEnv();
    const config = new OpenApi.Config({
      accessKeyId: env.ALIYUN_ACCESS_KEY_ID,
      accessKeySecret: env.ALIYUN_ACCESS_KEY_SECRET,
      endpoint: 'dysmsapi.aliyuncs.com',
    });

    cachedClient = new Dysmsapi20170525(config);
  }

  return cachedClient;
}

export async function sendLoginSms(phone: string, code: string) {
  const env = getEnv();
  const request = new SendSmsRequest({
    phoneNumbers: phone,
    signName: env.ALIYUN_SMS_SIGN_NAME,
    templateCode: env.ALIYUN_SMS_TEMPLATE_CODE,
    templateParam: JSON.stringify({ code }),
  });
  const runtime = new UtilClient.RuntimeOptions({});
  const response = await getClient().sendSmsWithOptions(request, runtime);

  if (response.body?.code !== 'OK') {
    throw new Error(response.body?.message || 'SMS_SEND_FAILED');
  }

  return response;
}
