const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const workflowPath = path.join(
  __dirname,
  '..',
  '.github',
  'workflows',
  'deploy-sae.yml',
);

function readWorkflow() {
  return fs.readFileSync(workflowPath, 'utf8');
}

test('SAE deployment workflow exists', () => {
  assert.equal(fs.existsSync(workflowPath), true);
});

test('SAE deployment workflow runs tests and build before deploy', () => {
  const workflow = readWorkflow();

  assert.match(workflow, /npm test/);
  assert.match(workflow, /npm run build/);
});

test('SAE deployment workflow builds and pushes docker image', () => {
  const workflow = readWorkflow();

  assert.match(workflow, /docker build/);
  assert.match(workflow, /docker push/);
});

test('SAE deployment workflow deploys to SAE', () => {
  const workflow = readWorkflow();

  assert.match(workflow, /SAE/);
  assert.match(workflow, /aliyun sae DeployApplication/);
  assert.match(workflow, /workflow_dispatch/);
  assert.match(workflow, /branches:\s*\n\s*-\s*main/);
});
