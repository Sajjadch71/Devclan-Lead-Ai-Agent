// Usage: node scripts/hash-password.mjs "yourpassword"
// Prints a bcrypt hash to paste into ADMIN_PASSWORD_HASH.
import bcrypt from "bcryptjs";

const password = process.argv[2];
if (!password) {
  console.error('Usage: node scripts/hash-password.mjs "yourpassword"');
  process.exit(1);
}

const hash = bcrypt.hashSync(password, 10);
console.log("\nAdd this to ADMIN_PASSWORD_HASH:\n");
console.log(hash);
console.log("");
