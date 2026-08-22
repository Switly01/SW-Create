import type { SwAccount } from "./api";

export type RememberedSwAccount = {
  id: string;
  username: string;
  displayName: string;
  lastUsedAt: number;
  loginToken?: string;
};

const STORAGE_KEY = "sw-identity-accounts-v1";
const MAX_REMEMBERED_ACCOUNTS = 5;

export function readRememberedSwAccounts(): RememberedSwAccount[] {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "[]") as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item): item is RememberedSwAccount => Boolean(
        item && typeof item === "object"
        && typeof (item as RememberedSwAccount).id === "string"
        && typeof (item as RememberedSwAccount).username === "string"
        && typeof (item as RememberedSwAccount).displayName === "string"
        && typeof (item as RememberedSwAccount).lastUsedAt === "number",
      ))
      .sort((left, right) => right.lastUsedAt - left.lastUsedAt)
      .slice(0, MAX_REMEMBERED_ACCOUNTS);
  } catch {
    return [];
  }
}

export function rememberSwAccount(account: SwAccount) {
  const username = account.user.username || account.user.displayName;
  const existing = readRememberedSwAccounts().find((item) => item.id === account.user.id);
  const next: RememberedSwAccount = {
    id: account.user.id,
    username,
    displayName: account.user.displayName || username,
    lastUsedAt: Date.now(),
    ...(account.rememberedLoginToken || existing?.loginToken ? { loginToken: account.rememberedLoginToken || existing?.loginToken } : {}),
  };
  const accounts = readRememberedSwAccounts().filter((item) => item.id !== next.id);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify([next, ...accounts].slice(0, MAX_REMEMBERED_ACCOUNTS)));
}

export function forgetRememberedSwAccount(id: string) {
  const accounts = readRememberedSwAccounts().filter((item) => item.id !== id);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
  return accounts;
}

export function expireRememberedSwLogin(id: string) {
  const accounts = readRememberedSwAccounts().map((item) => item.id === id ? { ...item, loginToken: undefined } : item);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
  return accounts;
}
