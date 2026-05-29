import React from 'react';
import { InnerPage, PageSection, SectionBody } from './InnerPage';

const BusinessPage: React.FC = () => (
  <InnerPage label="Business" title="业务介绍">
    <PageSection title="AI 短剧制作">
      <SectionBody>
        方直智胜以自主研发的 AI 内容生产流程为核心，面向市场推出高品质 AI 短剧作品。从剧本创作、角色设计到场景生成与后期制作，全链路融合人工智能技术，大幅提升内容产出效率，同时保持影视级品质标准。
      </SectionBody>
    </PageSection>

    <PageSection title="AI 漫剧制作">
      <SectionBody>
        依托 AI 图像生成与故事叙述能力，方直智胜同步布局 AI 漫剧赛道，打造适合移动端传播的竖屏动态漫剧内容，覆盖古风、都市、仙侠、悬疑等多元题材。
      </SectionBody>
    </PageSection>

    <PageSection title="商务合作">
      <SectionBody>
        方直智胜面向机构与合作方提供短剧内容展示、项目合作与平台服务支持。当前商务沟通采用人工对接方式，可通过电子邮箱 lanyanfeng@fzzsedu.cn 或联系电话 0755-86336966 发起合作咨询，我们将在工作日24小时内回复。
      </SectionBody>
    </PageSection>
  </InnerPage>
);

export default BusinessPage;
