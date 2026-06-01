import Link from 'next/link';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: '用户协议 — 方直智胜',
  description: '方直智胜短剧平台用户服务协议',
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

export default function TermsPage() {
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
          用户服务协议
        </h1>
        <p style={{
          fontFamily: fontBody, fontSize: 11, color: 'rgba(240,237,232,0.3)',
          letterSpacing: '0.06em', marginBottom: 40,
        }}>
          更新时间：2026年6月1日 &nbsp;|&nbsp; 生效时间：2026年6月1日
        </p>

        <P>欢迎使用深圳市方直智胜科技有限公司（以下简称"本公司"或"我们"）运营的短剧平台。在注册账号或使用本平台前，请仔细阅读本协议。使用本平台即视为您已阅读并同意本协议全部条款。</P>

        <H2>一、服务说明</H2>
        <P>本平台通过互联网向用户提供短剧内容在线播放服务。平台所提供的内容仅限授权会员在线观看，不提供下载或离线缓存服务。本平台持有工业和信息化部颁发的互联网信息服务经营许可（ICP 备案：粤ICP备2026044251号），增值电信业务经营许可证申请中。</P>

        <H2>二、账号注册与使用</H2>
        <ol style={{ paddingLeft: 20 }}>
          <Li>用户须以本人有效大陆手机号码完成注册，每个手机号仅限注册一个账号。</Li>
          <Li>账号归本公司所有，用户享有使用权，不得转让、出售、共享或以任何方式提供给第三方使用。</Li>
          <Li>用户对其账号下发生的一切行为（包括但不限于内容消费、支付）负完全责任。</Li>
          <Li>用户须保证注册及使用时年满14周岁；14至18周岁未成年人须在监护人同意下注册使用。</Li>
        </ol>

        <H2>三、会员服务</H2>
        <ol style={{ paddingLeft: 20 }}>
          <Li>本平台提供按月、按季度、按年的付费会员订阅服务，具体套餐价格以购买页面实时展示为准。</Li>
          <Li>会员订阅到期后不自动续费。如需继续使用，请重新选购套餐。</Li>
          <Li>会员服务属于虚拟网络服务，一经激活即开始消费，除法律另有规定外，不支持退款或转让。</Li>
          <Li>会员账号不得共享。发现账号异常共享行为的，本公司有权限制或终止该账号，不予退款。</Li>
          <Li>本公司有权根据内容授权情况调整会员可观看的内容范围，不另行通知。</Li>
        </ol>

        <H2>四、用户行为规范</H2>
        <P>在使用本平台过程中，用户不得从事以下行为：</P>
        <ol style={{ paddingLeft: 20 }}>
          <Li>以任何方式录制、截取、上传、传播平台内受版权保护的内容；</Li>
          <Li>使用技术手段（包括但不限于爬虫、脚本、破解工具）绕过或破坏平台付费机制；</Li>
          <Li>冒充他人、虚假注册账号或从事欺诈行为；</Li>
          <Li>上传、传播违反中华人民共和国法律法规的内容；</Li>
          <Li>以任何方式干扰平台正常运营或侵害本公司及第三方的合法权益。</Li>
        </ol>
        <P>违反上述规定的，本公司有权暂停或永久终止该用户账号，并依法追究相应责任。</P>

        <H2>五、知识产权</H2>
        <P>平台上展示的所有短剧内容、界面设计、商标、文字说明等，其知识产权归深圳市方直智胜科技有限公司或相关授权方所有。未经书面授权，任何人不得以任何形式复制、发行、改编、传播上述内容。</P>

        <H2>六、服务变更与终止</H2>
        <ol style={{ paddingLeft: 20 }}>
          <Li>本公司有权根据业务需要随时调整平台功能和内容库，无需提前通知。</Li>
          <Li>如平台拟停止运营，本公司将提前不少于7个自然日在平台首页显著位置公告，并向已开通会员的用户发送短信通知。</Li>
          <Li>用户违反本协议的，本公司有权立即暂停或终止提供服务，已收取费用不予退还。</Li>
        </ol>

        <H2>七、免责声明</H2>
        <ol style={{ paddingLeft: 20 }}>
          <Li>因不可抗力（包括但不限于自然灾害、政府行为、网络基础设施故障等）导致的服务中断，本公司不承担赔偿责任。</Li>
          <Li>本公司对第三方支付服务（微信支付）的可用性及安全性不承担责任，如遇支付问题请联系相应支付平台。</Li>
          <Li>本公司对用户设备、网络环境或浏览器兼容性问题导致的内容无法播放不承担责任。</Li>
        </ol>

        <H2>八、争议解决</H2>
        <P>本协议适用中华人民共和国法律。因本协议或使用本平台产生的任何争议，双方应首先友好协商解决；协商不成的，任何一方均可将争议提交深圳市仲裁委员会，按其届时有效的仲裁规则进行仲裁。仲裁裁决为最终裁决，对双方均有约束力。</P>

        <H2>九、联系我们</H2>
        <P>如您对本协议有任何疑问，请通过以下方式联系我们：</P>
        <P>公司名称：深圳市方直智胜科技有限公司</P>
        <P>电子邮件：lanyanfeng@fzzsedu.cn</P>

        <div style={{
          marginTop: 60, paddingTop: 24,
          borderTop: '1px solid rgba(240,236,228,0.07)',
        }}>
          <Link href="/privacy" style={{
            fontFamily: fontBody, fontSize: 12,
            color: 'rgba(201,145,42,0.7)', textDecoration: 'none',
            letterSpacing: '0.04em',
          }}>
            查看隐私政策 →
          </Link>
        </div>

      </div>
    </div>
  );
}
