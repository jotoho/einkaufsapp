// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-FileCopyrightText: 2025 Jonas Tobias Hopusch <git@jotoho.de>

import { Client, Account, ID } from "appwrite";
import { CONFIG } from "./config.ts";
import { showToast } from "./notifications.ts";

const client = new Client()
  .setEndpoint(CONFIG.BACKEND_ENDPOINT)
  .setProject(CONFIG.PROJECT_ID);
const accountAPI = new Account(client);

accountAPI.get().then(
  () => {
    window.location.href = "/uebersicht.html";
  },
  () => {
    document
      .querySelectorAll<
        HTMLInputElement | HTMLButtonElement
      >("main #registerForm :is(input, button)")
      .forEach((e) => {
        e.disabled = false;
      });
  },
);

const inputEmail = document.querySelector<HTMLInputElement>("input#inputEmail");
const inputPassword1 = document.querySelector<HTMLInputElement>(
  "input#inputPassword1",
);
const inputPassword2 = document.querySelector<HTMLInputElement>(
  "input#inputPassword2",
);
const inputSubmit = document.querySelector<HTMLButtonElement>(
  "button#submitRegistration",
);
const inputReset = document.querySelector<HTMLButtonElement>(
  "input[type=reset]#buttonReset",
);

if (
  !inputEmail ||
  !inputPassword1 ||
  !inputPassword2 ||
  !inputSubmit ||
  !inputReset
) {
  throw "Login form is damaged. Registration cannot continue.";
}

const registerAction = async (event: HTMLElementEventMap["click"]) => {
  event.preventDefault();
  event.stopPropagation();

  if (
    [inputEmail, inputPassword1, inputPassword2].every(
      (i) => i.validity.valid,
    ) &&
    inputPassword1.value === inputPassword2.value
  ) {
    accountAPI.create(ID.unique(), inputEmail.value, inputPassword1.value).then(
      () => {
        accountAPI
          .createEmailPasswordSession(inputEmail.value, inputPassword1.value)
          .then(
            () => {
              window.location.href = "/uebersicht.html";
            },
            async () => {
              showToast(
                "Automatische Anmeldung in neues Konto fehlgeschlagen :(",
              );
              window.location.href = "/login.html";
            },
          );
      },
      async () => {
        showToast("Kontenerstellung fehlgeschlagen. :(");
      },
    );
  } else {
    (async () => {
      showToast("Ungültige Registrierungsdaten. Prüfen Sie bitte Ihre Eingaben.")
      console.debug(
        inputEmail.validity,
        inputPassword1.validity,
        inputPassword2.validity,
      );
    })();
  }
};

inputSubmit.addEventListener("click", registerAction);
