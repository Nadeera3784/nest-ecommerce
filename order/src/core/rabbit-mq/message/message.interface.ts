export interface EncryptedMessageInterface {
  iv: string;
  content: string;
}

export interface MessageInterface {
  pattern: any;
  data: any;
}

export interface RsaKeysInterface {
  public: string;
  private: string;
}
