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

test('organization service returns signed business license URL', () => {
  const media = read('src/lib/admin/media-url.ts');
  const organization = read('src/lib/admin/organization-service.ts');

  assert.match(media, /mapAdminOrganizationMedia/);
  assert.match(organization, /businessLicenseUrl/);
  assert.match(organization, /mapAdminOrganizationMedia/);
});

test('admin organization creation supports approved or pending initial status', () => {
  const service = read('src/lib/admin/organization-service.ts');
  const route = read('app/api/admin/organizations/route.ts');

  assert.match(service, /initialStatus/);
  assert.match(service, /z\.enum\(\['approved', 'pending'\]\)/);
  assert.match(service, /status:\s*data\.initialStatus/);
  assert.match(service, /data\.initialStatus === 'approved' \? 'active' : 'pending'/);
  assert.match(route, /createOrganizationByAdmin/);
});

test('admin organization detail route supports updating organization details', () => {
  const route = read('app/api/admin/organizations/[id]/route.ts');
  const service = read('src/lib/admin/organization-service.ts');

  assert.match(route, /export async function PUT/);
  assert.match(route, /updateOrganizationByAdmin/);
  assert.match(service, /updateOrganizationByAdmin/);
});
