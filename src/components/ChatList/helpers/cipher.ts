import { run } from '@/utils/pool';
import CryptoJS from 'crypto-js';
import JSEncrypt from 'jsencrypt';

export class CryptoHelper {
  private rsaPair: JSEncrypt // alice's rsa key pair
  private bob_rsa: JSEncrypt // bob's rsa key pair (public key only)
  private aesKey: CryptoJS.lib.WordArray
  private bob_aes_key: CryptoJS.lib.WordArray

  constructor() {
    this.rsaPair = new JSEncrypt({ default_key_size: '2048' });
    this.bob_rsa = new JSEncrypt({ default_key_size: '2048' });
    this.aesKey = CryptoJS.lib.WordArray.random(32);
  }

  public getPublicKey(): string {
    return this.rsaPair.getPublicKey();
  }

  public setBobPublicKey(bob_public_key: string) {
    this.bob_rsa.setPublicKey(bob_public_key);
  }

  public async getEncryptedAESKey() {
    const encryptedAESKey = await run(this.bob_rsa.encrypt, this.aesKey.toString(CryptoJS.enc.Base64));
    if (encryptedAESKey === false) {
      throw new Error('Failed to encrypt AES key');
    }
    return encryptedAESKey;
  }

  public async decryptAndSaveAESKey(encryptedAESKey: string) {
    const decryptedAESKey = await run(this.rsaPair.decrypt, encryptedAESKey)
    if (decryptedAESKey === false) {
      throw new Error('Failed to decrypt AES key');
    }
    this.bob_aes_key = CryptoJS.enc.Base64.parse(decryptedAESKey);
  }


  public get bob_aes(): string {
    return this.bob_aes_key.toString(CryptoJS.enc.Base64);
  }

  public get my_aes(): string {
    return this.aesKey.toString(CryptoJS.enc.Base64);
  }

  public async encryptMessage(message: string) {
    const encryptedMessage = await run(CryptoJS.AES.encrypt, message, this.aesKey, { iv: this.aesKey })
    return encryptedMessage.toString()
  }

  public async decryptMessage(encryptedMessage: string) {
    const decryptedMessage = await run(CryptoJS.AES.decrypt,
      encryptedMessage, this.bob_aes_key, { iv: this.bob_aes_key })
    return decryptedMessage.toString(CryptoJS.enc.Utf8)
  }


}


