import {exec} from '@actions/exec/lib/exec';
import * as core from '@actions/core';
import * as config from './config';
import * as coverage from './coverage';
import * as extensions from './extensions';
import {addMatchers} from './matchers';
import * as utils from './utils';
import * as path from 'path';

/**
 * Build the script
 *
 * @param filename
 * @param version
 * @param os_version
 */
export async function build(
  filename: string,
  version: string,
  os_version: string
): Promise<string> {
  // taking inputs
  let extension_csv: string = await utils.getInput('extension-csv', false);
  let ini_values_csv: string = await utils.getInput('ini-values-csv', false);
  let coverage_driver: string = await utils.getInput('coverage', false);

  let script: string = await utils.readScript(filename, version, os_version);
  if (extension_csv) {
    script += await extensions.addExtension(extension_csv, version, os_version);
  }
  if (ini_values_csv) {
    script += await config.addINIValues(ini_values_csv, os_version);
  }
  if (coverage_driver) {
    script += await coverage.addCoverage(coverage_driver, version, os_version);
  }

  return await utils.writeScript(filename, script);
}

/**
 * Run the script
 */
export async function run() {
  try {
    let os_version: string = process.platform;
    let version: string = await utils.getInput('php-version', true);
    // check the os version and run the respective script
    let script_path: string = '';
    switch (os_version) {
      case 'darwin':
        script_path = await build(os_version + '.sh', version, os_version);
        await exec('sh ' + script_path + ' ' + version + ' ' + __dirname);
        break;
      case 'linux':
        let pecl: string = await utils.getInput('pecl', false);
        script_path = await build(os_version + '.sh', version, os_version);
        await exec('sh ' + script_path + ' ' + version + ' ' + pecl);
        break;
      case 'win32':
        script_path = await build('win32.ps1', version, os_version);
        await exec(
          'pwsh ' + script_path + ' -version ' + version + ' -dir ' + __dirname
        );
        break;
    }

    addMatchers();
  } catch (error) {
    core.setFailed(error.message);
  }
}

// call the run function
run();
