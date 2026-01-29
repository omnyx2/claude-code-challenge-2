import fs from "fs";
import path from "path";

const LOG_FILE = path.resolve(
  process.cwd(),
  "hooks/edit-log.json"
);

async function main() {
  const chunks = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  const hookData = JSON.parse(Buffer.concat(chunks).toString());

  const toolName = hookData.tool_name || "unknown";
  const toolInput = hookData.tool_input || {};
  const filePath = toolInput.file_path || toolInput.path || "unknown";

  const entry = {
    timestamp: new Date().toISOString(),
    tool: toolName,
    file: filePath,
  };

  // Add stats based on tool type
  if (toolName === "Write") {
    const content = toolInput.content || "";
    entry.lines = content.split("\n").length;
  } else if (toolName === "Edit" || toolName === "MultiEdit") {
    const oldStr = toolInput.old_string || "";
    const newStr = toolInput.new_string || "";
    entry.linesRemoved = oldStr.split("\n").length;
    entry.linesAdded = newStr.split("\n").length;
  }

  // Append to log file
  let log = [];
  try {
    const existing = fs.readFileSync(LOG_FILE, "utf-8");
    log = JSON.parse(existing);
  } catch {
    // File doesn't exist yet or is invalid
  }

  log.push(entry);
  fs.writeFileSync(LOG_FILE, JSON.stringify(log, null, 2) + "\n");

  process.exit(0);
}

main().catch((err) => {
  console.error(`Log hook error: ${err.message}`);
  process.exit(0);
});
