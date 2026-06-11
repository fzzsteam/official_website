const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8');
}

test('admin UI uses the existing brand theme and shadcn-style primitives', () => {
  const layout = read('src/components/admin/AdminLayout.tsx');
  const badge = read('src/components/admin/StatusBadge.tsx');

  assert.match(layout, /brand-bg/);
  assert.match(layout, /brand-card/);
  assert.match(layout, /brand-gold/);
  assert.match(badge, /rounded-md/);
});

test('admin login and register pages wire admin APIs', () => {
  const login = read('app/admin/login/page.tsx');
  const register = read('app/admin/register/page.tsx');

  assert.match(login, /\/api\/admin\/auth\/login/);
  assert.match(register, /\/api\/admin\/register/);
  assert.match(register, /mediaKind="image"/);
  assert.match(register, /previewSize="document"/);
  assert.match(register, /FormField label="营业执照"/);
  assert.match(register, /showAdminToast/);
  assert.match(register, /注册已提交，请等待审核/);
  assert.doesNotMatch(register, /注册提交中/);
  assert.doesNotMatch(register, /variant="banner"/);
  assert.match(register, /inputMode="numeric"/);
  assert.match(register, /maxLength=\{11\}/);
  assert.match(register, /replace\(\/\\D\/g, ''\)\.slice\(0, 11\)/);
});

test('admin upload field requests upload policy API', () => {
  const source = read('src/components/admin/UploadField.tsx');
  const upload = read('src/components/admin/AdminMediaUpload.tsx');

  assert.match(source, /AdminMediaUpload/);
  assert.match(upload, /\/api\/admin\/uploads\/policy/);
  assert.match(upload, /fetch/);
});

test('admin form field does not wrap custom upload controls in a label', () => {
  const source = read('src/components/admin/FormField.tsx');

  assert.match(source, /<div className="block space-y-2">/);
  assert.doesNotMatch(source, /<label className="block space-y-2">/);
});

test('admin shared drawer and toolbar components exist', () => {
  const drawer = read('src/components/admin/AdminDrawer.tsx');
  const toolbar = read('src/components/admin/AdminListToolbar.tsx');

  assert.match(drawer, /export function AdminDrawer/);
  assert.match(drawer, /fixed inset-y-0 right-0/);
  assert.match(drawer, /role="dialog"/);
  assert.match(toolbar, /export function AdminListToolbar/);
  assert.match(toolbar, /filterGroups/);
});

test('admin media upload and preview components support rich media states', () => {
  const upload = read('src/components/admin/AdminMediaUpload.tsx');
  const preview = read('src/components/admin/AdminMediaPreview.tsx');

  assert.match(upload, /\/api\/admin\/uploads\/policy/);
  assert.match(upload, /uploading/);
  assert.match(upload, /onChange\(objectKey\)/);
  assert.match(upload, /onClear/);
  assert.match(upload, /previewUrl/);
  assert.match(upload, /previewSize/);
  assert.match(upload, /border-dashed/);
  assert.match(upload, /hover:border-slate-400/);
  assert.match(upload, /hover:bg-slate-100/);
  assert.doesNotMatch(upload, /hover:bg-brand-gold\/5/);
  assert.match(upload, /aria-label="清空上传文件"/);
  assert.match(upload, /htmlFor=\{inputId\}/);
  assert.match(upload, /aspect-\[9\/16\]/);
  assert.match(upload, /aspect-video/);
  assert.match(upload, /aspect-\[4\/3\]/);
  assert.doesNotMatch(upload, /rounded-md border border-slate-200 bg-white p-3/);
  assert.match(preview, /type === 'video'/);
  assert.match(preview, /<video/);
  assert.match(preview, /<img/);
});

test('status badge labels include review and release statuses', () => {
  const badge = read('src/components/admin/StatusBadge.tsx');

  assert.match(badge, /upcoming:\s*'待上架'/);
  assert.match(badge, /released:\s*'已上架'/);
  assert.match(badge, /submitted:\s*'待审核'/);
});

test('admin layout uses dark sidebar and light content workspace', () => {
  const layout = read('src/components/admin/AdminLayout.tsx');
  const sidebar = read('src/components/admin/AdminSidebar.tsx');

  assert.match(layout, /bg-slate-100/);
  assert.match(layout, /text-slate-950/);
  assert.match(layout, /AdminToast/);
  assert.match(sidebar, /bg-brand-card/);
});

test('admin API errors are surfaced through global toast', () => {
  const api = read('src/lib/admin-ui/api.ts');
  const toast = read('src/components/admin/AdminToast.tsx');
  const toastBus = read('src/lib/admin-ui/toast.ts');

  assert.match(api, /showAdminToast/);
  assert.match(api, /payload\?\.error\?\.message/);
  assert.match(toast, /subscribeAdminToast/);
  assert.match(toast, /role="status"/);
  assert.match(toast, /z-\[9999\]/);
  assert.match(toast, /left-1\/2 top-6/);
  assert.match(toast, /5000/);
  assert.match(api, /网络请求失败，请稍后重试/);
  assert.match(toastBus, /CustomEvent/);
  assert.match(toastBus, /admin-toast/);
});

test('admin auth pages render without sidebar chrome', () => {
  const layout = read('src/components/admin/AdminLayout.tsx');

  assert.match(layout, /usePathname/);
  assert.match(layout, /\/admin\/login/);
  assert.match(layout, /\/admin\/register/);
  assert.match(layout, /isAuthPage/);
  assert.match(layout, /© 2026 深圳市方直智胜科技有限公司/);
  assert.match(layout, /粤ICP备2026044251号/);
  assert.match(layout, /https:\/\/beian\.miit\.gov\.cn\//);
});

test('admin sidebar exposes logout action', () => {
  const sidebar = read('src/components/admin/AdminSidebar.tsx');

  assert.match(sidebar, /\/api\/admin\/auth\/logout/);
  assert.match(sidebar, /adminApi/);
  assert.match(sidebar, /退出登录/);
  assert.match(sidebar, /window\.location\.href = '\/admin\/login'/);
  assert.doesNotMatch(sidebar, /logoutError/);
  assert.doesNotMatch(sidebar, /text-red-300/);
});

test('admin login page exposes organization registration entry', () => {
  const login = read('app/admin/login/page.tsx');

  assert.match(login, /机构注册/);
  assert.match(login, /href="\/admin\/register"/);
});

test('admin dramas page uses drawer workspace and independent status actions', () => {
  const page = read('app/admin/dramas/page.tsx');
  const actionButton = read('src/components/admin/AdminActionButton.tsx');

  assert.match(page, /AdminDrawer/);
  assert.match(page, /AdminLoadingState/);
  assert.match(page, /AdminListToolbar/);
  assert.match(page, /AdminMediaUpload/);
  assert.match(page, /AdminMoreActions/);
  assert.match(page, /GenreMultiSelect/);
  assert.match(page, /\/api\/admin\/auth\/me/);
  assert.match(page, /\/api\/admin\/dramas\/\$\{selectedDrama\.id\}\/release/);
  assert.match(page, /\/api\/admin\/dramas\/\$\{drama\.id\}\/review/);
  assert.match(page, /reviewStatus === 'submitted'/);
  assert.match(page, /actionBusy/);
  assert.match(page, /showAdminToast/);
  assert.match(page, /ignoreHandledError/);
  assert.doesNotMatch(page, /busyMessage/);
  assert.doesNotMatch(page, /variant="banner"/);
  assert.match(page, /previewSize="portrait"/);
  assert.match(page, /previewSize="landscape"/);
  assert.match(page, /aspect-\[9\/16\]/);
  assert.match(page, /overflow-visible/);
  assert.match(actionButton, /whitespace-nowrap/);
  assert.match(page, /posterUrl/);
  assert.doesNotMatch(page, /短标语.*列表/);
});

test('admin episodes page uses drawer workspace with video previews and publish actions', () => {
  const page = read('app/admin/dramas/[id]/episodes/page.tsx');

  assert.match(page, /AdminDrawer/);
  assert.match(page, /AdminMediaPreview/);
  assert.match(page, /AdminMediaUpload/);
  assert.match(page, /AdminMoreActions/);
  assert.match(page, /videoPreviewUrl/);
  assert.match(page, /actionBusy/);
  assert.doesNotMatch(page, /busyMessage/);
  assert.doesNotMatch(page, /variant="banner"/);
  assert.match(page, /maxEpisodeNo \+ 1/);
  assert.match(page, /summary: ''/);
  assert.match(page, /coverPath: ''/);
  assert.match(page, /previewSize="video"/);
  assert.match(page, /overflow-visible/);
  assert.doesNotMatch(page, /label="分集封面"/);
  assert.match(page, /\/status/);
  assert.match(page, /ignoreHandledError/);
  assert.match(page, /saveEpisode\(\)\.catch\(ignoreHandledError\)/);
  assert.match(page, /updateEpisodeStatus\(episode\.id[\s\S]*\.catch\(ignoreHandledError\)/);
  assert.match(page, /remove\(episode\.id\)\.catch\(ignoreHandledError\)/);
  assert.doesNotMatch(page, /accessLevel/);
});

test('admin organizations page uses drawer workspace and admin-create form', () => {
  const page = read('app/admin/organizations/page.tsx');
  const actionButton = read('src/components/admin/AdminActionButton.tsx');
  const moreActions = read('src/components/admin/AdminMoreActions.tsx');

  assert.match(page, /AdminDrawer/);
  assert.match(page, /AdminLoadingState/);
  assert.match(page, /AdminListToolbar/);
  assert.match(page, /AdminMediaUpload/);
  assert.match(page, /AdminMoreActions/);
  assert.match(page, /initialStatus/);
  assert.match(page, /统一社会信用代码/);
  assert.match(page, /actionBusy/);
  assert.match(page, /showAdminToast/);
  assert.match(page, /ignoreHandledError/);
  assert.doesNotMatch(page, /busyMessage/);
  assert.doesNotMatch(page, /formError/);
  assert.doesNotMatch(page, /variant="banner"/);
  assert.match(page, /直接启用/);
  assert.match(page, /待审核/);
  assert.match(page, /overflow-visible/);
  assert.match(actionButton, /whitespace-nowrap/);
  assert.match(moreActions, /group-hover:visible/);
  assert.match(moreActions, /group-focus-within:visible/);
  assert.match(moreActions, /更多/);
  assert.match(page, /mediaKind="image"/);
  assert.match(page, /previewSize="document"/);
  assert.match(page, /\/api\/admin\/organizations\/\$\{organization\.id\}\/review/);
});
