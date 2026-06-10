import React from 'react';
import { InfoRow, InnerPage, PageSection, SectionBody } from './InnerPage';

const AboutPage: React.FC = () => (
  <InnerPage label="About Us" title="关于方直智胜">
    <PageSection title="公司简介">
      <SectionBody>
        深圳市方直智胜科技有限公司成立于深圳，是一家专注于 AI 技术赋能影视内容创作的科技企业。我们深耕 AI 短剧、AI 漫剧等新型内容形态，将前沿人工智能技术与优质内容创作深度融合，致力于打造具有市场竞争力的高品质 AI 影视作品。
      </SectionBody>
    </PageSection>

    <PageSection title="企业愿景">
      <SectionBody>
        以技术为笔，以故事为魂。我们相信 AI 不仅是工具，更是创作伙伴。通过持续的技术创新与内容探索，方直智胜致力于成为 AI 影视内容领域的领先品牌，让更多优质故事以全新的方式触达观众。
      </SectionBody>
    </PageSection>

    <PageSection title="公司信息">
      <InfoRow label="网站名称">方直智胜AI漫剧工场</InfoRow>
      <InfoRow label="公司名称">深圳市方直智胜科技有限公司</InfoRow>
      <InfoRow label="办公地址">深圳市南山区南头街道马家龙社区大新路198号创新大厦B栋901</InfoRow>
      <InfoRow label="经营范围">互联网信息服务；人工智能技术研发；影视内容制作；软件开发</InfoRow>
      <InfoRow label="备案号">粤ICP备2026044251号</InfoRow>
    </PageSection>
  </InnerPage>
);

export default AboutPage;
