import * as crypto from "crypto";
import * as dotenv from "dotenv";
import * as idTools from "id-tools";

dotenv.config();

export function generatePTId() {
    return idTools.idByFormat("xxxx-nnnn-xxxx-nnnn", { upper: true, unique: true });
}

if(!process.env.PT_enc_key)
    throw new Error("PT_enc_key is not defined");

const SECRET = crypto
  .createHash("sha256")
  .update(process.env.PT_enc_key)
  .digest();


export function generatePT(ulid: string): string {
  const timestamp = Date.now().toString();
  const payload = `${ulid}:${timestamp}`;
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-gcm", SECRET, iv);
  let encrypted = cipher.update(payload, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");
  return `${iv.toString("hex")}:${authTag}:${encrypted}`;
}

export function verifyPT(
  token: string
): { ulid: string; timestamp: number } | null {
  try {
    const [ivHex, authTagHex, encrypted] = token.split(":");
    if (!ivHex || !authTagHex || !encrypted) return null;

    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");
    const decipher = crypto.createDecipheriv("aes-256-gcm", SECRET, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");

    const [ulid, timestampStr] = decrypted.split(":");
    const timestamp = Number(timestampStr);

    // if (Date.now() - timestamp > 2 * 60 * 1000) return null;

    return { ulid, timestamp };
  } catch {
    return null;
  }
}
