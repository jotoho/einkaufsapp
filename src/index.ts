// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-FileCopyrightText: 2025 Jonas Tobias Hopusch <git@jotoho.de>
// SPDX-FileCopyrightText: 2025 Tim Beckmann <beckmann.tim@fh-swf.de>

import { Client, Account } from "appwrite";
import { CONFIG } from "./config.ts";

const client = new Client().setEndpoint(CONFIG.BACKEND_ENDPOINT).setProject(CONFIG.PROJECT_ID);
const accountAPI = new Account(client);

accountAPI.get()
          .then(() => window.location.pathname = "/uebersicht.html",
                () => {});
