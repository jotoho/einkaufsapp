// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-FileCopyrightText: 2025 Jonas Tobias Hopusch <git@jotoho.de>

import {
  Client,
  Account,
  Teams,
  ID,
  Models,
  Databases,
  Query,
  Functions,
} from "appwrite";
import { CONFIG } from "./config.ts";
import { showToast } from "./notifications.ts";
import { EinkaufslisteModel } from "./types.ts";

const client = new Client()
  .setEndpoint(CONFIG.BACKEND_ENDPOINT)
  .setProject(CONFIG.PROJECT_ID);
const accountAPI = new Account(client);
const teamsAPI = new Teams(client);
const dbAPI = new Databases(client);
const functionAPI = new Functions(client);

const currentUser = (await accountAPI.get().catch(() => {
  window.location.pathname = "/login.html";
})) as Models.User<Models.Preferences>;

const buttonNewHousehold = document.querySelector<HTMLButtonElement>(
  "main #households > form#newHouseholdForm > button#buttonCreateHousehold",
);

const currentTeams = await teamsAPI.list();
if (currentTeams.total < CONFIG.MAX_CONCURRENT_HOUSEHOLDS) {
  if (buttonNewHousehold) {
    buttonNewHousehold.disabled = false;
  }
}

const createNewHouseholdCallback = (event: HTMLElementEventMap["click"]) => {
  event.preventDefault();
  const inputHouseholdName = document.querySelector<HTMLInputElement>(
    "main #households input#inputNewHouseholdName",
  );
  if (inputHouseholdName && inputHouseholdName.value.trim().length > 0) {
    teamsAPI.create(ID.unique(), inputHouseholdName.value).then(
      () => {
        window.location.reload();
      },
      () => {},
    );
  }
};

if (buttonNewHousehold) {
  buttonNewHousehold.addEventListener("click", createNewHouseholdCallback);
}

const buttonDeleteAccountFn = async () => {
  const orderedDeletions = [];

  const teams = await teamsAPI.list().then(
    (list) => list.teams,
    () => [],
  );
  for (const team of teams) {
    if (team.total <= 1) {
      for (const shoppingList of await dbAPI
        .listDocuments<EinkaufslisteModel>(
          CONFIG.DATABASE_ID,
          CONFIG.DB_COLLECTION_SHOPPINGLISTS,
          [Query.equal("ID_Household", team.$id)],
        )
        .then(
          (s) => s.documents,
          () => [],
        )) {
        shoppingList.listeneintrag.forEach(async (entry) => {
          orderedDeletions.push(
            dbAPI.deleteDocument(
              CONFIG.DATABASE_ID,
              CONFIG.DB_COLLECTION_SHOPLISTENTRY,
              entry.$id,
            ),
          );
        });
        orderedDeletions.push(
          dbAPI.deleteDocument(
            CONFIG.DATABASE_ID,
            CONFIG.DB_COLLECTION_SHOPPINGLISTS,
            shoppingList.$id,
          ),
        );
      }
    }

    if (team.total <= 1) {
      orderedDeletions.push(teamsAPI.delete(team.$id));
    } else {
      for (const myTeamMembership of await teamsAPI
        .listMemberships(team.$id)
        .then(
          (l) => l.memberships,
          () => [],
        )) {
        orderedDeletions.push(
          teamsAPI.deleteMembership(team.$id, myTeamMembership.$id),
        );
      }
    }
  }

  Promise.all(orderedDeletions).then(() => {
    accountAPI.updateStatus().then(() => (window.location.pathname = "/"));
  });
};

const deleteAccountButton = document.querySelector<HTMLButtonElement>(
  "button#buttonDeleteAccount",
);
if (deleteAccountButton) {
  deleteAccountButton.addEventListener("click", buttonDeleteAccountFn);
}

const inviteToHousehold = async (
  household: Models.Team<Models.Preferences>,
) => {
  const targetUserEmail = window.prompt(
    "Welchen Nutzer möchten Sie einladen? Geben Sie dessen Email Adresse ein.",
  );
  if (
    targetUserEmail &&
    targetUserEmail.match(
      new RegExp("^[\\w\\-\\.]+@([\\w-]+\\.)+[\\w-]{2,}$", "gi"),
    )
  ) {
    functionAPI
      .createExecution(
        CONFIG.FUNCTION_INVITE_TO_TEAM,
        JSON.stringify({
          team_id: household.$id,
          invitee_email: targetUserEmail,
        }),
      )
      .then(
        (execution: Models.Execution) => {
          if (execution.status === "completed") {
            window.location.hash = "#newHouseholdForm";
            window.location.reload();
          } else {
            showToast("Einladung fehlgeschlagen");
            console.error("Invite failed:", execution);
          }
        },
        (reason) => {
          showToast("Einladung fehlgeschlagen.");
          console.error(
            "invitation failed",
            reason,
            household.$id,
            targetUserEmail,
          );
        },
      );
  } else {
    showToast("Ungültige Email. Einladung abgebrochen.");
  }
};
const leaveHousehold = async (household: Models.Team<Models.Preferences>) => {
  household.$id;
  const currentMembership = (await teamsAPI
    .listMemberships(household.$id)
    .catch(() => null))!.memberships.at(0)!;
  teamsAPI.deleteMembership(household.$id, currentMembership.$id).then(
    () => {
      window.location.reload();
    },
    (reason) => {
      showToast("Haushalt verlassen hat fehlgeschlagen.");
      console.debug("Leave household fail reason:", reason);
    },
  );
};

const kickTeamMember = (
  team_id: string,
  membership_id: string,
  member_element: HTMLElement,
  event: Event,
): void => {
  event.preventDefault();
  event.stopPropagation();
  teamsAPI
    .deleteMembership(team_id, membership_id)
    .then(() => member_element.remove());
};

const generateMemberElement = (member: Models.Membership) => {
  const element = document.createElement("li");
  element.classList.add("teammember");
  element.innerHTML = `
    <span>${member.userName.length > 0 ? "\"" + member.userName + "\" (" + member.userEmail + ")" : member.userEmail}</span>
    <button class="kickMember">Entfernen</button>
  `.trim();
  element
    .getElementsByClassName("kickMember")[0]!
    .addEventListener(
      "click",
      kickTeamMember.bind(null, member.teamId, member.$id, element),
      { once: true },
    );
  return element;
};

const listOfHouseholds = document.querySelector<HTMLUListElement>(
  "main #households ul#listHouseholds",
);
if (listOfHouseholds) {
  teamsAPI.list().then(
    async (userTeams) => {
      const teamList = userTeams.teams;
      for (const team of teamList) {
        const fragment = document.createElement("li");
        fragment.innerHTML = `
        <div class="householdInformation">
            <h3>${team.name}</h3>
            <ul class="members">Andere Mitglieder:</ul>
        </div>
        <div class="spaceBuffer"></div>
        <div class="householdActions">
          <button class="inviteToHousehold">✉</button>
          <button class="leaveHousehold"><img class="darkModeInvert" src="/logout.svg" /></button>
        </div>
      `;
        const inviteButton = fragment.querySelector<HTMLButtonElement>(
          "button.inviteToHousehold",
        )!;
        inviteButton.addEventListener(
          "click",
          inviteToHousehold.bind(null, team),
        );
        const leaveButton = fragment.querySelector<HTMLButtonElement>(
          "button.leaveHousehold",
        )!;
        leaveButton.addEventListener("click", leaveHousehold.bind(null, team));
        const listOfMembers =
          fragment.querySelector<HTMLUListElement>("ul.members")!;
        for (const member of await teamsAPI.listMemberships(team.$id).then(
          (listObj) => listObj.memberships,
          () => [],
        )) {
          if (member.confirm || member.joined.length > 0) {
            if (member.userId == currentUser.$id) {
              continue;
            }
            listOfMembers.appendChild(generateMemberElement(member));
          }
        }
        listOfHouseholds.appendChild(fragment);
      }
    },
    () => {},
  );
}
