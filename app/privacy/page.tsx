import Link from 'next/link';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: '隐私政策 — 方直智胜',
  description: '方直智胜短剧平台个人信息保护政策',
};

const gold = '#C9912A';
const textMuted = 'rgba(240,237,232,0.58)';
const textBase = '#F0EDE8';
const fontBody = 'var(--font-body), sans-serif';
const fontDisplay = 'var(--font-display), serif';

function H2({ children }: { children: string }) {
  return (
    <h2 style={{
      fontFamily: fontBody, fontSize: 15, fontWeight: 500,
      color: textBase, marginTop: 36, marginBottom: 12,
      letterSpacing: '0.04em',
    }}>
      {children}
    </h2>
  );
}

function P({ children }: { children: ReactNode }) {
  return (
    <p style={{
      fontFamily: fontBody, fontSize: 13, color: textMuted,
      lineHeight: 2, marginBottom: 12, letterSpacing: '0.03em',
    }}>
      {children}
    </p>
  );
}

function Li({ children }: { children: ReactNode }) {
  return (
    <li style={{
      fontFamily: fontBody, fontSize: 13, color: textMuted,
      lineHeight: 2, marginBottom: 6, letterSpacing: '0.03em',
    }}>
      {children}
    </li>
  );
}

export default function PrivacyPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#1a140f', padding: '48px 24px 100px' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>

        <Link href="/" style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          color: 'rgba(240,237,232,0.35)', fontSize: 12,
          fontFamily: fontBody, textDecoration: 'none',
          marginBottom: 48, letterSpacing: '0.06em',
        }}>
          ← 返回首页
        </Link>

        <h1 style={{
          fontFamily: fontDisplay, fontSize: 26, fontWeight: 400,
          color: gold, marginBottom: 8, letterSpacing: '0.1em',
        }}>
          隐私政策
        </h1>
        <p style={{
          fontFamily: fontBody, fontSize: 11, color: 'rgba(240,237,232,0.3)',
          letterSpacing: '0.06em', marginBottom: 40,
        }}>
          更新时间：2026年6月1日 &nbsp;|&nbsp; 生效时间：2026年6月1日
        </p>

        <P>深圳市方直智胜科技有限公司（以下简称"我们"）非常重视您的个人信息保护。本隐私政策依据《中华人民共和国个人信息保护法》《网络安全法》及相关法规制定，说明我们如何收集、使用和保护您的个人信息。</P>

        <H2>一、我们收集的信息</H2>
        <P>我们仅收集以下一项个人信息：</P>
        <ul style={{ paddingLeft: 20 }}>
          <Li><strong style={{ color: textBase }}>手机号码</strong>：在您注册账号或登录时，我们需要您提供大陆手机号码，用于向您发送短信验证码以验证身份。</Li>
        </ul>
        <P>我们不收集您的姓名、身份证号、地址、电子邮件、设备标识符或其他个人信息。</P>

        <H2>二、信息使用目的</H2>
        <P>您的手机号码仅用于：</P>
        <ol style={{ paddingLeft: 20 }}>
          <Li>发送短信验证码，完成账号注册或登录；</Li>
          <Li>在必要时（如账号安全异常）向您发送重要服务通知。</Li>
        </ol>
        <P>我们不会将您的手机号码用于商业推广、广告投放或任何营销目的。</P>

        <H2>三、信息共享</H2>
        <P>我们不会向任何第三方出售或出租您的个人信息。以下情形除外：</P>
        <ol style={{ paddingLeft: 20 }}>
          <Li>
            <strong style={{ color: textBase }}>腾讯微信支付</strong>：当您主动发起会员购买时，我们将向微信支付传输订单金额及订单号，用于完成支付交易。我们不会向微信支付传输您的手机号码或其他个人信息。
          </Li>
          <Li>
            <strong style={{ color: textBase }}>法律要求</strong>：依据中华人民共和国法律法规的规定，向有权机关提供必要信息时。
          </Li>
        </ol>

        <H2>四、数据存储与安全</H2>
        <ol style={{ paddingLeft: 20 }}>
          <Li>您的个人信息存储于中国境内的服务器，不会传输至境外。</Li>
          <Li>短信验证码在发送后10分钟内有效，验证完成或过期后自动失效，不作留存。</Li>
          <Li>您注销账号后，我们将在30个自然日内删除您的手机号码及相关账号信息。</Li>
          <Li>我们采用加密传输（HTTPS）保护您的个人信息在传输过程中的安全。</Li>
        </ol>

        <H2>五、您的权利</H2>
        <P>依据《个人信息保护法》，您享有以下权利：</P>
        <ol style={{ paddingLeft: 20 }}>
          <Li><strong style={{ color: textBase }}>查询权</strong>：您可以联系我们，了解我们持有的您的个人信息。</Li>
          <Li><strong style={{ color: textBase }}>更正权</strong>：如您的手机号码发生变更，可联系我们申请更新。</Li>
          <Li><strong style={{ color: textBase }}>删除权</strong>：您可以申请注销账号，我们将在30日内删除您的全部个人信息。</Li>
          <Li><strong style={{ color: textBase }}>撤回同意</strong>：您可以随时停止使用本平台，不再向我们提供任何个人信息。</Li>
        </ol>
        <P>如需行使上述权利，请通过本政策第九条所列联系方式与我们联系，我们将在15个工作日内予以回复。</P>

        <H2>六、未成年人保护</H2>
        <P>本平台主要面向18周岁及以上成年用户。14周岁以下未成年人禁止注册使用。14至18周岁未成年人须在监护人同意下使用，且不得单独使用付费会员服务。如我们发现已收集14周岁以下未成年人的个人信息，将立即删除。</P>

        <H2>七、Cookie 使用</H2>
        <P>本平台仅使用 Cookie（会话令牌）用于维持您的登录状态。我们不使用 Cookie 追踪您的浏览行为，不建立用户画像，也不将 Cookie 数据用于广告定向。您可在浏览器设置中禁用 Cookie，但这将导致您无法保持登录状态。</P>

        <H2>八、隐私政策更新</H2>
        <P>如本政策发生重大变更（包括收集信息范围扩大、共享对象变更等），我们将提前不少于7个自然日在平台首页显著位置公告，并向注册用户发送短信通知。继续使用本平台，即视为您同意更新后的隐私政策。</P>

        <H2>九、联系我们</H2>
        <P>如您对本隐私政策有任何疑问或投诉，请通过以下方式联系我们：</P>
        <P>公司名称：深圳市方直智胜科技有限公司</P>
        <P>电子邮件：support@fzzs.com</P>
        <P>我们将在收到您的请求后15个工作日内予以回复。</P>

        <div style={{
          marginTop: 60, paddingTop: 24,
          borderTop: '1px solid rgba(240,236,228,0.07)',
        }}>
          <Link href="/terms" style={{
            fontFamily: fontBody, fontSize: 12,
            color: 'rgba(201,145,42,0.7)', textDecoration: 'none',
            letterSpacing: '0.04em',
          }}>
            查看用户协议 →
          </Link>
        </div>

      </div>
    </div>
  );
}
