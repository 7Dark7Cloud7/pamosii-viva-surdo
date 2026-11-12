const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const source = path.join(root, 'app');
const files = [
  'index.html', 'styles.css', 'app.js', 'dados.js', 'maos.js', 'theme.js',
  'manifest.webmanifest', 'assets/vivasurdo-logo-icon-512.png',
  'assets/vivasurdo-logo-maskable-512.png',
];
const destinations = ['extension/widget', 'android/.build/web/app'];
for (const destination of destinations) {
  for (const file of files) {
    const target = path.join(root, destination, file);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(path.join(source, file), target);
    const hash = value => crypto.createHash('sha256').update(value).digest('hex');
    if (hash(fs.readFileSync(target)) !== hash(fs.readFileSync(path.join(source, file)))) {
      throw new Error('Cópia divergente: ' + target);
    }
  }
  console.log(destination + ': ' + files.length + ' ficheiros idênticos à base web.');
}
const archive = path.join(source, 'extensao', 'agatha-viva-surdo.zip');
fs.mkdirSync(path.dirname(archive), { recursive: true });
const zip = spawnSync('python', ['-m', 'zipfile', '-c', archive,
  'manifest.json', 'background.js', 'content.js', 'signer.css',
  'icon-192.png', 'icon-512.png', 'widget'], {
  cwd: path.join(root, 'extension'), encoding: 'utf8',
});
if (zip.status !== 0) throw new Error(zip.stderr || 'Não foi possível criar o ZIP da extensão.');
const stale = path.join(source, 'extensao', 'agatha-signer.zip');
if (fs.existsSync(stale)) fs.unlinkSync(stale);
console.log('Extensão: ' + archive);
