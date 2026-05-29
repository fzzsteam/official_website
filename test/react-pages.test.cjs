const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

test('React app includes converted inner pages and routes them from the navbar', () => {
  const appContext = read('src/context/AppContext.tsx');
  const app = read('src/App.tsx');
  const navbar = read('src/components/episode-detail/Navbar.tsx');

  for (const page of ['about', 'business', 'contact']) {
    assert.match(appContext, new RegExp(`'${page}'`), `${page} page type should exist`);
    assert.match(app, new RegExp(`page === '${page}'`), `${page} page should render from App`);
    assert.match(navbar, new RegExp(`page: '${page}'`), `${page} nav link should route through context`);
  }
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
