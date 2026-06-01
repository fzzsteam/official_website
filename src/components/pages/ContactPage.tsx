import React from 'react';
import { InfoRow, InnerPage, PageSection, SectionBody } from './InnerPage';

const ContactPage: React.FC = () => (
  <InnerPage label="Contact" title="联系我们">
    <PageSection title="公司地址">
      <InfoRow label="办公地址">深圳市南山区南头街道马家龙社区大新路198号创新大厦B栋901</InfoRow>
      <SectionBody>欢迎预约来访。</SectionBody>
    </PageSection>

    <PageSection title="联系方式">
      <InfoRow label="邮箱">lanyanfeng@fzzsedu.cn</InfoRow>
      <InfoRow label="电话">0755-86336966</InfoRow>
      <InfoRow label="回复时效">工作日24小时内回复</InfoRow>
      <InfoRow label="工作时间">周一至周五 9:00-18:00，周末及法定节假日休息</InfoRow>
    </PageSection>


  </InnerPage>
);

export default ContactPage;
