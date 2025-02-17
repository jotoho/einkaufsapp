// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-FileCopyrightText: 2025 Jonas Tobias Hopusch <git@jotoho.de>

import type { Models } from "appwrite";

export type Listeneintrag = {
  artikelname: string;
  anzahl: number;
  erledigt: boolean;
  einkaufslisten: Einkaufsliste | null;
} & Readonly<Partial<Models.Document>>;

export type Einkaufsliste = {
  ID_Household: string;
  stichtag: string;
  beschriftung: string;
  beschreibung: string;
  listeneintrag: Listeneintrag[];
} & Readonly<Partial<Models.Document>>;
