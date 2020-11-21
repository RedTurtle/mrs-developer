const fs = require('fs');
const path = require('path');
const colors = require('colors/safe');
const simpleGit = require('simple-git');
const currentPath = process.cwd();

const DEVELOP_DIRECTORY = 'develop';

function getRemotePath(url) {
  if (url.startsWith('.')) {
    return path.resolve(currentPath, url);
  }
  return url;
}

function getRepoDir(root, output) {
  // Check for download directory; create if needed.
  const repoDir = path.join(root || '.', 'src', output || DEVELOP_DIRECTORY);
  if (!fs.existsSync(repoDir)) {
    console.log(`\nCreating repoDir ${repoDir}`);
    fs.mkdirSync(repoDir);
  } else {
    console.log(`\nUsing ${repoDir}`);
  }
  return repoDir;
}

async function cloneRepository(name, path, url) {
  fs.mkdirSync(path);
  const git = simpleGit({ baseDir: path });
  try {
    await git.init();
    await git.addRemote('origin', getRemotePath(url));
    console.log(`Cloning ${name} from ${url}...`);
    await git.fetch();
    console.log(colors.green(`✓ cloned ${name} at ${path}`));
    return git;
  } catch (err) {
    console.error(colors.red(`Cannot clone ${url}`, err));
  }
}

async function setHead(name, repository, settings, options = {}) {
  const { reset, lastTag, noFetch, defaultToMaster, allMaster } = options;
  if (reset) {
    await repository.reset('hard');
    console.log(colors.yellow.inverse(`Hard reset in ${name}.`));
  } else {
    const status = await repository.status();
    if (status.files.length > 0) {
      console.log(
        colors.yellow.inverse(
          `Cannot update ${name}. Commit your changes first.`
        )
      );
      return { abort: true };
    }
  }
  const branch = !allMaster ? settings.branch || 'master' : 'master';
  if (lastTag) {
    try {
      return await repository.checkoutLatestTag();
    } catch (err) {
      await repository.pull('origin', branch);
      const tags = await repository.tags();
      return await repository.checkout(tags.latest);
    }
  }
  if (!allMaster && settings.tag) {
    try {
      if (!noFetch) await repository.fetch();
      await repository.checkout(settings.tag);
      console.log(colors.green(`✓ update ${name} to tag ${settings.tag}`));
    } catch (err) {
      console.error(
        colors.red(
          `✗ tag ${settings.tag} does not exist in ${name}${
            defaultToMaster ? ', using master as default' : ''
          }`
        )
      );
      if (defaultToMaster) {
        await repository.checkout('master');
        console.log(
          colors.yellow(`✓ update ${name} to master instead of ${settings.tag}`)
        );
      }
    }
    return;
  }
  try {
    if (!noFetch) await repository.fetch();
    await repository.checkout(branch);
    if (!noFetch) {
      try {
        await repository.pull('origin', branch, ['--rebase']);
      } catch (err) {
        console.error(
          colors.yellow.inverse(
            `Cannot merge origin/${branch}. Please merge manually.`
          )
        );
      }
    }
  } catch (err) {
    console.error(colors.red(`✗ branch ${branch} does not exist in ${name}`));
    if (defaultToMaster) {
      await repository.checkout('master');
      console.log(
        colors.yellow(`✓ update ${name} to master instead of ${branch}`)
      );
    }
  }
  console.log(colors.green(`✓ update ${name} to branch ${branch}`));
}

async function openRepository(name, path) {
  const git = simpleGit({ baseDir: path });
  try {
    const isRepo = await git.checkIsRepo();
    if (isRepo) {
      console.log(`Found ${name} at ${path}`);
      return git;
    }
    throw new Error('No repo');
  } catch (err) {
    console.error(colors.red(`Cannot open ${path}`, err));
  }
}

async function checkoutRepository(name, root, settings, options = {}) {
  const {
    noFetch,
    reset,
    lastTag,
    https,
    defaultToMaster,
    allMaster,
  } = options;
  const pathToRepo = path.join(root, name);
  let { url } = settings;
  if (https && settings.https) {
    url = settings.https;
  }
  const git = await (!fs.existsSync(pathToRepo)
    ? cloneRepository(name, pathToRepo, url)
    : openRepository(name, pathToRepo));
  if (!git) {
    console.error(colors.red(`Cannot checkout ${name}`));
  }
  await setHead(name, git, settings, {
    reset,
    lastTag,
    noFetch,
    defaultToMaster,
    allMaster,
  });
  const commits = await git.log();
  const tags = commits.latest.refs
    .split(', ')
    .filter((ref) => ref.includes('tag: '));
  return tags.length > 0 ? tags[0].slice(5) : '';
}

async function develop(options) {
  // Read in mrs.developer.json.
  const raw = fs.readFileSync(
    path.join(options.root || '.', 'mrs.developer.json')
  );
  const pkgs = JSON.parse(raw);
  const repoDir = getRepoDir(options.root, options.output);
  const paths = {};
  // Checkout the repos.
  for (const name in pkgs) {
    const settings = pkgs[name];
    if (!settings.local) {
      const res = await checkoutRepository(name, repoDir, settings, options);
      if (options.lastTag) {
        pkgs[name].tag = res;
      }
      const packages = settings.packages || {
        [settings.package || name]: settings.path,
      };
      Object.entries(packages).forEach(([packageId, subPath]) => {
        let packagePath = path.join(
          '.',
          options.output || DEVELOP_DIRECTORY,
          name
        );
        if (subPath) {
          packagePath = path.join(packagePath, subPath);
        }
        paths[packageId] = [packagePath.replace(/\\/g, '/')]; // we do not want Windows separators here
      });
    } else {
      paths[settings.package || name] = [settings.local];
    }
  }

  if (!options.noConfig) {
    // update paths in configFile
    const defaultConfigFile = fs.existsSync('./tsconfig.base.json')
      ? 'tsconfig.base.json'
      : 'tsconfig.json';
    const configFile = options.configFile || defaultConfigFile;
    const tsconfig = JSON.parse(
      fs.readFileSync(path.join(options.root || '.', configFile))
    );
    const baseUrl = tsconfig.compilerOptions.baseUrl;
    const nonDevelop = Object.entries(tsconfig.compilerOptions.paths || {})
      .filter(
        ([pkg, path]) =>
          !path[0].startsWith(
            baseUrl === 'src'
              ? `${DEVELOP_DIRECTORY}/`
              : `src/${DEVELOP_DIRECTORY}`
          )
      )
      .reduce((acc, [pkg, path]) => {
        acc[pkg] = path;
        return acc;
      }, {});
    tsconfig.compilerOptions.paths = Object.entries(paths).reduce(
      (acc, [pkg, path]) => {
        acc[pkg] = baseUrl === 'src' ? path : [`src/${path[0]}`];
        return acc;
      },
      nonDevelop
    );
    console.log(colors.yellow(`Update paths in ${defaultConfigFile}\n`));
    fs.writeFileSync(
      path.join(options.root || '.', configFile),
      JSON.stringify(tsconfig, null, 4)
    );
  }
  // update mrs.developer.json with last tag if needed
  if (options.lastTag) {
    fs.writeFileSync(
      path.join(options.root || '.', 'mrs.developer.json'),
      JSON.stringify(pkgs, null, 4)
    );
    console.log(colors.yellow(`Update tags in mrs.developer.json\n`));
  }
}

exports.cloneRepository = cloneRepository;
exports.openRepository = openRepository;
exports.setHead = setHead;
exports.checkoutRepository = checkoutRepository;
exports.getRepoDir = getRepoDir;
exports.develop = develop;
