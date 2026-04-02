const { execSync } = require('child_process');
const gulp = require('gulp');
const { rmSync } = require('fs');

function clean(cb) {
  rmSync('dist', { recursive: true, force: true });
  cb();
}

function build(cb) {
  execSync(
    'npx nx run-many -t build -p frontend backend --configuration=production',
    {
      stdio: 'inherit',
    },
  );
  cb();
}

function compileSamples(cb) {
  execSync(
    'npx tsc --resolveJsonModule --esModuleInterop --module commonjs --moduleResolution node --target es2015 --outDir dist/apps/backend/samples apps/backend/src/app/mock-server/workers/samples/index.ts',
    { stdio: 'inherit' },
  );
  cb();
}

gulp.task('deploy', gulp.series(clean, build, compileSamples));
