import type { PlatformCredentials } from "@src/shared";

export interface ChangedFile {
  changeType: string;
  diff: string;
  path: string;
}

export interface PushChanges {
  changedFiles: string[];
  commitMessages: string[];
  fileChanges: ChangedFile[];
}

export interface HandlePushEventOptions {
  after: string;
  apiKey: string;
  before: string;
  credentials: PlatformCredentials;
  owner: string;
  repo: string;
  token: string;
}
