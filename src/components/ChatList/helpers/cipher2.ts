import { run } from '@/utils/pool';

export async function generateRSAKeyPair(): Promise<CryptoKeyPair> {
  const keyPair = await self.crypto.subtle.generateKey(
    {
      name: 'RSA-OAEP',
      modulusLength: 2048,
      publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
      hash: 'SHA-256',
    },
    true,
    ['encrypt', 'decrypt']
  );
  return keyPair;
}

// 生成 AES 密钥
export async function generateAESKey(): Promise<CryptoKey> {
  const aesKey = await self.crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256,
    },
    true,
    ['encrypt', 'decrypt']
  );
  return aesKey;
}

// 使用外部公钥加密 AES 密钥
export async function encryptAESKeyWithPublicKey(aesKey: CryptoKey, publicKey: CryptoKey): Promise<ArrayBuffer> {
  const encryptedKey = await self.crypto.subtle.encrypt(
    {
      name: 'RSA-OAEP',
    },
    publicKey,
    new TextEncoder().encode(aesKey.toString())
  );
  return encryptedKey;
}

// 使用自己的私钥解密密文
export async function decryptWithPrivateKey(encryptedData: ArrayBuffer, privateKey: CryptoKey): Promise<ArrayBuffer> {
  const decryptedData = await self.crypto.subtle.decrypt(
    {
      name: 'RSA-OAEP',
    },
    privateKey,
    encryptedData
  );
  return decryptedData;
}

// 使用对方的 AES 密钥加密密文
export async function encryptWithAESKey(text: string, aesKey: CryptoKey): Promise<ArrayBuffer> {
  const encodedText = new TextEncoder().encode(text);
  const encryptedData = await self.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
    },
    aesKey,
    encodedText
  );
  return encryptedData;
}


