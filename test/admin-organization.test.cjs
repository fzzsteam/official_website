const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8');
}

test('organization service supports registration, admin creation, and review', () => {
  const source = read('src/lib/admin/organization-service.ts');

  assert.match(source, /registerOrganization/);
  assert.match(source, /createOrganizationByAdmin/);
  assert.match(source, /reviewOrganization/);
  assert.match(source, /hashAdminPassword/);
  assert.match(source, /businessLicensePath/);
});

test('organization APIs require admin role for list and review', () => {
  const listRoute = read('app/api/admin/organizations/route.ts');
  const reviewRoute = read('app/api/admin/organizations/[id]/review/route.ts');

  assert.match(listRoute, /requireAdminRole/);
  assert.match(reviewRoute, /requireAdminRole/);
});

test('register API creates pending organization account', () => {
  const route = read('app/api/admin/register/route.ts');

  assert.match(route, /registerOrganization/);
  assert.match(route, /ok\s*\(/);
  assert.match(route, /fail\s*\(/);
});
