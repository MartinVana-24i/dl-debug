import * as cmdUtils from '@24i/smartapps-bigscreen-rnv-build-engine/dist/src/scripts/utils/cmdUtils.js';
import * as gitUtils from '@24i/smartapps-bigscreen-rnv-build-engine/dist/src/scripts/utils/gitUtils.js';

const MAIN_BRANCH = 'development';
const VERIFY_FLAG = false;

// make sure we're on the lastest dev branch with no local changes
gitUtils.assertCurrentBranch(MAIN_BRANCH);
// gitUtils.assertEmptyStatusList();
gitUtils.pull();

// make sure that everything actually works
cmdUtils.cmdSyncInheritOut('npm run lintcheck && npm run typecheck && npm run test');

// bump the version
const bumpType = process.argv[2] || 'patch'; // major | minor | patch | X.Y.Z
// cmdUtils.cmdSyncInheritOut(`npm --no-git-tag-version version ${bumpType}`);
const targetVersion = cmdUtils.cmdSyncPipeOut('npm pkg get version')
    .toString()
    .replace(/"/g, '');
const RELEASE_BRANCH = `release/${targetVersion}`;

// create release branch and push it to origin
gitUtils.createBranch(RELEASE_BRANCH);
gitUtils.checkout(RELEASE_BRANCH);
gitUtils.addAll();
gitUtils.commit(targetVersion, VERIFY_FLAG);
gitUtils.push(RELEASE_BRANCH, VERIFY_FLAG)

// publish the package on NPM
cmdUtils.cmdSyncInheritOut('npm publish --dry-run');

// create release on GitHUB
cmdUtils.cmdSyncInheritOut(`hub release create -t ${RELEASE_BRANCH} v${targetVersion}`);

// create pull request into development with updated version files
gitUtils.pullRequest(RELEASE_BRANCH, MAIN_BRANCH, `release ${targetVersion}`);
