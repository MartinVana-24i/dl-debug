import { ok } from 'assert';
import * as cmdUtils from '@24i/smartapps-bigscreen-rnv-build-engine/dist/src/scripts/utils/cmdUtils.js';
import * as gitUtils from '@24i/smartapps-bigscreen-rnv-build-engine/dist/src/scripts/utils/gitUtils.js';

const MAIN_BRANCH = 'development';
const CHECKS = 'npm run lintcheck && npm run typecheck && npm run test';
const GIT_VERIFY_FLAG = false;

// check if GitHub cli is available
try {
    ok(cmdUtils.cmdSyncTrimOut('gh --version'));
} catch (error) {
    throw new Error('GitHub cli (gh) is not installed! See https://cli.github.com/\n');
}

// check if GitHub cli is authenticated
try {
    ok(cmdUtils.cmdSync('gh auth status'));
} catch (error) {
    throw new Error('You need to authenticate using gh auth login.');
}

// make sure we're on the lastest dev branch with no local changes
gitUtils.assertCurrentBranch(MAIN_BRANCH);
gitUtils.assertEmptyStatusList();
gitUtils.pull();

// make sure that everything actually works
cmdUtils.cmdSyncInheritOut(CHECKS);

// bump the version
const bumpType = process.argv[2] || 'patch'; // major | minor | patch | X.Y.Z
cmdUtils.cmdSyncInheritOut(`npm --no-git-tag-version version ${bumpType}`);
const targetVersion = cmdUtils.cmdSyncTrimOut('npm pkg get version').replace(/"/g, '');
const RELEASE_BRANCH = `release/${targetVersion}`;

// create release branch and push it to origin
gitUtils.createBranch(RELEASE_BRANCH);
gitUtils.checkout(RELEASE_BRANCH);
gitUtils.addAll();
gitUtils.commit(targetVersion, GIT_VERIFY_FLAG);
gitUtils.push(RELEASE_BRANCH, GIT_VERIFY_FLAG)

// publish the package on NPM
cmdUtils.cmdSyncInheritOut('npm publish --dry-run');

// create release on GitHub
cmdUtils.cmdSyncInheritOut(`gh release create v${targetVersion} -target ${RELEASE_BRANCH} --generate-notes`);

// create pull request into development with updated version files
cmdUtils.cmdSyncInheritOut(`gh pr create --title "release ${targetVersion}" --body "" --head ${RELEASE_BRANCH} --base ${MAIN_BRANCH}`);
