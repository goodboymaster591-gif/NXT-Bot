/**
 * Simple colored logger utility
 */

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  magenta: '\x1b[35m',
  gray: '\x1b[90m',
};

function timestamp() {
  return new Date().toLocaleTimeString('en-US', { hour12: false });
}

const logger = {
  info: (msg) => console.log(`${colors.gray}[${timestamp()}]${colors.reset} ${colors.cyan}[INFO]${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.gray}[${timestamp()}]${colors.reset} ${colors.green}[OK]${colors.reset}  ${msg}`),
  warn: (msg) => console.log(`${colors.gray}[${timestamp()}]${colors.reset} ${colors.yellow}[WARN]${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.gray}[${timestamp()}]${colors.reset} ${colors.red}[ERR]${colors.reset}  ${msg}`),
  cmd: (name) => console.log(`${colors.gray}[${timestamp()}]${colors.reset} ${colors.magenta}[CMD]${colors.reset}  /${name}`),
  event: (name) => console.log(`${colors.gray}[${timestamp()}]${colors.reset} ${colors.cyan}[EVT]${colors.reset}  ${name}`),
};

module.exports = logger;
