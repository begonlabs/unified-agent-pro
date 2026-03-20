const fs = require('fs');
const path = require('path');

const directory = 'c:/Users/sarki/OneDrive/Escritorio/Antigravety/ondai/src/components';
const searchRegex = /\/dashboard\?view=profile&tab=subscription/g;
const replaceString = '/dashboard?view=profile&tab=plans';

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      results.push(file);
    }
  });
  return results;
}

const files = walk(directory);
let count = 0;
files.forEach(file => {
  if (file.endsWith('.tsx') || file.endsWith('.ts')) {
    const content = fs.readFileSync(file, 'utf8');
    if (searchRegex.test(content)) {
      fs.writeFileSync(file, content.replace(searchRegex, replaceString), 'utf8');
      count++;
    }
  }
});

console.log(`Updated ${count} files.`);
