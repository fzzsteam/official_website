const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

test('React app includes converted inner pages and routes them from the navbar', () => {
  const homePage = read('app/page.tsx');
  const dramaPage = read('app/drama/[id]/page.tsx');
  const appShell = read('src/app/AppShell.tsx');
  const appContext = read('src/context/AppContext.tsx');
  const app = read('src/App.tsx');

  assert.match(homePage, /AppShell/, 'app/page.tsx should render AppShell');
  assert.match(dramaPage, /AppShell/, 'app\\/drama\\/\\[id\\]\\/page\\.tsx should render AppShell');
  assert.match(appShell, /AppProvider/, 'AppShell should wrap AppProvider');
  assert.match(appShell, /<App \/>/, 'AppShell should render App');
  assert.match(appContext, /export const AppProvider/, 'AppProvider should exist');
  assert.match(appContext, /useEffect/, 'AppProvider should sync when initialDramaId changes');
  assert.match(appContext, /initialDramaId/, 'AppProvider should read initialDramaId');
  assert.match(app, /const App:/, 'App should exist');
  assert.doesNotMatch(app, /const AppShell:/, 'src/App.tsx should not define an internal AppShell');
  assert.match(app, /const AppContent:/, 'src/App.tsx should use a clearer internal component name');
});

test('Converted React pages preserve key legacy page content', () => {
  const pages = [
    ['src/components/pages/AboutPage.tsx', ['关于方直智胜', '深圳市方直智胜科技有限公司', '粤ICP备2026044251号']],
    ['src/components/pages/BusinessPage.tsx', ['业务介绍', 'AI 短剧制作', '商务合作']],
    ['src/components/pages/ContactPage.tsx', ['联系我们', 'lanyanfeng@fzzsedu.cn', '0755-86336966']],
  ];

  for (const [file, expectedTexts] of pages) {
    const source = read(file);
    for (const text of expectedTexts) {
      assert.match(source, new RegExp(text), `${file} should include ${text}`);
    }
  }
});
