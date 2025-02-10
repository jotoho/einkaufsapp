// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-FileCopyrightText: 2025 Jonas Tobias Hopusch <git@jotoho.de>

import { Client, Account, Models } from "appwrite";
import { CONFIG } from "./config.ts";

const requestClient = new Client();
requestClient
  .setEndpoint(CONFIG.BACKEND_ENDPOINT)
  .setProject(CONFIG.PROJECT_ID);

const account = new Account(requestClient);

let session: Models.Session | undefined = undefined;
const resumeSessionFn = (validSession: Models.Session) => {
  session = validSession;
};
const newSessionFn = async (reason: any) => {
  const promise = account
    .createEmailPasswordSession(CONFIG.TEST_ACC_USER, CONFIG.TEST_ACC_PASSWORD)
    .then((validSession) => (session = validSession))
    .finally(() => console.error("Automatic login failed!", CONFIG, reason));
  await promise;
};
const loginPromise = account
  .getSession("current")
  .then(resumeSessionFn)
  .catch(newSessionFn);

await loginPromise;

export { requestClient, account, session };
