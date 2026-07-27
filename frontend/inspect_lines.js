const fs = require('fs');
const path = 'src/app/shared/components/chatbot/chatbot.component.ts';
const src = fs.readFileSync(path, 'utf8');
const lines = src.split(/\r?\n/);
lines.forEach((line, i) => {
  if (i + 1 >= 520 && i + 1 <= 620) {
    console.log((i + 1) + ': ' + line);
  }
});
