// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-FileCopyrightText: 2025 Jonas Tobias Hopusch <git@jotoho.de>

import type { Models } from "appwrite";

export type Listeneintrag = {
  artikelname: string;
  anzahl: number;
  erledigt: boolean;
  einkaufslisten: Einkaufsliste | null;
};
export type ListeneintragModel = Listeneintrag & Readonly<Models.Document>;

export type Einkaufsliste = {
  ID_Household: string;
  stichtag: string;
  beschriftung: string | null;
  listeneintrag: ListeneintragModel[];
};
export type EinkaufslisteModel = Einkaufsliste & Readonly<Models.Document>;
