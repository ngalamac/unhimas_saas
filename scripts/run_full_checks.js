#!/usr/bin/env node
/*
 run_full_checks.js
 Executes frontend build, lint, typecheck and automated backend smoke tests.
 Writes a detailed log to check-results.log with step boundaries and exit codes.
*/
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const logPath = path.join(root, 'check-results.log');

function log(line) {
  const ts = new Date().toISOString();
  fs.appendFileSync(logPath, `[${ts}] ${line}\n`);
  process.stdout.write(`${line}\n`);
}

function runStep(name, cmd, args, options = {}) {
  return new Promise((resolve) => {
    log(`--- STEP START: ${name} -> ${cmd} ${args.join(' ')} ---`);
    const child = spawn(cmd, args, { cwd: options.cwd || root, shell: false, env: process.env });
    child.stdout.on('data', d => log(`[${name}] ${d.toString().trimEnd()}`));
    child.stderr.on('data', d => log(`[${name}][ERR] ${d.toString().trimEnd()}`));
    child.on('close', (code) => {
      log(`--- STEP END: ${name} EXIT ${code} ---`);
      resolve(code === 0);
    });
    child.on('error', (err) => {
      log(`--- STEP ERROR: ${name} ${err.message} ---`);
      resolve(false);
    });
  });
}

(async () => {
  try {
    if (fs.existsSync(logPath)) fs.unlinkSync(logPath);
    log('RUN FULL CHECKS START');

    const steps = [];
    steps.push(await runStep('frontend-build', 'npm', ['run', 'build']));
    steps.push(await runStep('frontend-lint', 'npm', ['run', 'lint']));
    steps.push(await runStep('frontend-typecheck', 'npx', ['tsc', '--noEmit', '-p', 'tsconfig.json']));

    // backend build (tsc) if needed
    steps.push(await runStep('backend-build', 'npm', ['run', 'build'], { cwd: path.join(root, 'backend') }));

    // attempt health check (requires backend server already running externally)
    steps.push(await runStep('backend-health', 'node', ['-e', "(async()=>{try{const f=await fetch('http://localhost:5000/api/health');const j=await f.json();console.log('health:',JSON.stringify(j));}catch(e){console.error('health check failed',e.message);} })();"]));

    // run automated smoke (assumes backend is running)
    steps.push(await runStep('automated-smoke', 'node', ['scripts/automated_smoke.js']));

    const success = steps.every(Boolean);
    log(`RUN FULL CHECKS COMPLETE success=${success}`);
    if (!success) {
      log('One or more steps failed. Inspect logs above.');
      process.exitCode = 1;
    }
  } catch (e) {
    log('UNCAUGHT ERROR ' + (e && e.message));
    process.exitCode = 1;
  }
})();
