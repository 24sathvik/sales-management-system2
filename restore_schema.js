const fs = require('fs');
const readline = require('readline');

async function restore() {
  const logPath = 'C:/Users/HP/.gemini/antigravity-ide/brain/9b34f882-1990-438c-b2ca-83e41bbfc782/.system_generated/logs/transcript_full.jsonl';
  const fileStream = fs.createReadStream(logPath);
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let lines = new Map();
  for await (const line of rl) {
    const entry = JSON.parse(line);
    if (entry.content && typeof entry.content === 'string') {
      const output = entry.content;
      if (output.includes('c:/Users/HP/Desktop/sales-management-system2/prisma/schema.prisma')) {
        const linesArr = output.split('\n');
        for (const l of linesArr) {
          const match = l.match(/^(\d+):\s(.*)$/);
          if (match) {
            const num = parseInt(match[1], 10);
            if (!lines.has(num)) {
               lines.set(num, match[2]);
            }
          }
        }
      }
    }
  }

  const sorted = [...lines.entries()].sort((a,b) => a[0] - b[0]);
  if (sorted.length === 0) {
    console.log("No lines found.");
    return;
  }
  const maxLine = sorted[sorted.length-1][0];
  let finalStr = '';
  for(let i=1; i<=maxLine; i++) {
    finalStr += (lines.get(i) !== undefined ? lines.get(i) : '') + '\n';
  }
  fs.writeFileSync('c:/Users/HP/Desktop/sales-management-system2/prisma/schema.prisma.restored', finalStr);
  console.log("Restored " + maxLine + " lines.");
}
restore();
