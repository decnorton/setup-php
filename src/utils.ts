import * as fs from 'fs';
import * as path from 'path';
import * as core from '@actions/core';

/**
 * Function to get inputs from both with and env annotations.
 *
 * @param name
 * @param mandatory
 */
export async function getInput(
  name: string,
  mandatory: boolean
): Promise<string> {
  let input = process.env[name];
  switch (input) {
    case '':
    case undefined:
      return core.getInput(name, {required: mandatory});
    default:
      return input;
  }
}

/**
 * Async foreach loop
 *
 * @author https://github.com/Atinux
 * @param array
 * @param callback
 */
export async function asyncForEach(
  array: Array<any>,
  callback: any
): Promise<any> {
  for (let index: number = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}

/**
 * Read the scripts
 *
 * @param filename
 * @param version
 * @param os_version
 */
export async function readScript(
  filename: string,
  version: string,
  os_version: string
): Promise<string> {
  switch (os_version) {
    case 'darwin':
      switch (version) {
        case '7.4':
          return fs.readFileSync(
            path.join(__dirname, '../src/scripts/7.4.sh'),
            'utf8'
          );
      }
      return fs.readFileSync(
        path.join(__dirname, '../src/scripts/' + filename),
        'utf8'
      );
    case 'linux':
    case 'win32':
      return fs.readFileSync(
        path.join(__dirname, '../src/scripts/' + filename),
        'utf8'
      );
    default:
      return await log(
        'Platform ' + os_version + ' is not supported',
        os_version,
        'error'
      );
  }
}

/**
 * Write final script which runs
 *
 * @param filename
 * @param version
 * @param script
 */
export async function writeScript(
  filename: string,
  script: string
): Promise<string> {
  let runner_dir: string = await getInput('RUNNER_TOOL_CACHE', false);
  let script_path: string = path.join(runner_dir, filename);
  fs.writeFileSync(script_path, script, {mode: 0o755});
  return script_path;
}

/**
 * Function to break extension csv into an array
 *
 * @param extension_csv
 */
export async function extensionArray(
  extension_csv: string
): Promise<Array<string>> {
  switch (extension_csv) {
    case '':
    case ' ':
      return [];
    default:
      return extension_csv.split(',').map(function(extension: string) {
        return extension
          .trim()
          .replace('php-', '')
          .replace('php_', '');
      });
  }
}

/**
 * Function to break ini values csv into an array
 *
 * @param ini_values_csv
 * @constructor
 */
export async function INIArray(ini_values_csv: string): Promise<Array<string>> {
  switch (ini_values_csv) {
    case '':
    case ' ':
      return [];
    default:
      return ini_values_csv.split(',').map(function(ini_value: string) {
        return ini_value.trim();
      });
  }
}

/**
 * Function to log a step
 *
 * @param message
 * @param os_version
 */
export async function stepLog(
  message: string,
  os_version: string
): Promise<string> {
  switch (os_version) {
    case 'win32':
      return 'Step-Log "' + message + '"';
    case 'linux':
    case 'darwin':
      return 'step_log "' + message + '"';
    default:
      return await log(
        'Platform ' + os_version + ' is not supported',
        os_version,
        'error'
      );
  }
}

/**
 * Function to log a result
 * @param mark
 * @param subject
 * @param message
 */
export async function addLog(
  mark: string,
  subject: string,
  message: string,
  os_version: string
): Promise<string> {
  switch (os_version) {
    case 'win32':
      return 'Add-Log "' + mark + '" "' + subject + '" "' + message + '"';
    case 'linux':
    case 'darwin':
      return 'add_log "' + mark + '" "' + subject + '" "' + message + '"';
    default:
      return await log(
        'Platform ' + os_version + ' is not supported',
        os_version,
        'error'
      );
  }
}

/**
 * Log to console
 *
 * @param message
 * @param os_version
 * @param log_type
 * @param prefix
 */
export async function log(
  message: string,
  os_version: string,
  log_type: string
): Promise<string> {
  const color: any = {
    error: '31',
    success: '32',
    warning: '33'
  };

  switch (os_version) {
    case 'win32':
      return (
        'printf "\\033[' + color[log_type] + ';1m' + message + ' \\033[0m"'
      );

    case 'linux':
    case 'darwin':
    default:
      return 'echo "\\033[' + color[log_type] + ';1m' + message + '\\033[0m"';
  }
}

/**
 * Function to get prefix required to load an extension.
 *
 * @param extension
 */
export async function getExtensionPrefix(extension: string): Promise<string> {
  let zend: Array<string> = ['xdebug', 'opcache', 'ioncube', 'eaccelerator'];
  switch (zend.indexOf(extension)) {
    case 0:
    case 1:
      return 'zend_extension';
    case -1:
    default:
      return 'extension';
  }
}

/**
 * Function to get the suffix to suppress console output
 *
 * @param os_version
 */
export async function suppressOutput(os_version: string): Promise<string> {
  switch (os_version) {
    case 'win32':
      return ' ';
    case 'linux':
    case 'darwin':
      return ' ';
    default:
      return await log(
        'Platform ' + os_version + ' is not supported',
        os_version,
        'error'
      );
  }
}
