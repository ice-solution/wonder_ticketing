import crypto from "crypto";

/** Wonder Payment RSA-SHA256 簽名（移植自 checkinSystem/nodejs/wonder_signature.js） */
export class WonderSignature {
  static generateRandomString(length: number): string {
    const alphabet = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let randomString = "";
    for (let i = 0; i < length; i++) {
      randomString += alphabet[Math.floor(Math.random() * alphabet.length)];
    }
    return randomString;
  }

  parseCredential(credential: string) {
    const parts = credential.split("/");
    if (parts.length !== 3) throw new Error("Invalid credential format");
    return { appid: parts[0], request_time: parts[1], algorithm: parts[2] };
  }

  generateSignatureMessage(
    credential: string,
    nonce: string,
    method: string,
    uri: string,
    body: string | null = null
  ): string {
    const parsed = this.parseCredential(credential);
    let signatureKey = crypto.createHmac("sha256", nonce).update(parsed.request_time).digest();
    signatureKey = crypto.createHmac("sha256", signatureKey).update(parsed.algorithm).digest();

    let content = method.toUpperCase() + "\n" + uri;
    if (body !== null && body.trim().length > 0) {
      content += "\n" + body;
    }
    return crypto.createHmac("sha256", signatureKey).update(content).digest("hex");
  }

  signature(
    privateKey: string,
    credential: string,
    nonce: string,
    method: string,
    uri: string,
    body: string | null = null
  ): string {
    const plainSignature = this.generateSignatureMessage(credential, nonce, method, uri, body);
    const sign = crypto.createSign("RSA-SHA256");
    sign.update(plainSignature);
    sign.end();
    return sign.sign(privateKey, "base64");
  }
}
