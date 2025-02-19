// SPDX-License-Identifier: AGPL-3.0-only
// SPDX-FileCopyrightText: 2025 Tim Beckmann <beckmann.tim@fh-swf.de>

import {
    Client,
    Databases,
    ID,
    Permission,
    RealtimeResponseEvent,
    Role
} from 'appwrite';
import { CONFIG } from './config.ts';
import type {
    Einkaufsliste,
    Listeneintrag
} from './types.ts';

const client: Client = new Client();

client
    .setEndpoint(CONFIG.BACKEND_ENDPOINT)
    .setProject(CONFIG.PROJECT_ID);

const database: Databases = new Databases(client);

const urlParams = new URLSearchParams(window.location.search);

const listid = urlParams.get('id') || '';

if (listid == '') {
    window.location.pathname = '/uebersicht.html';
}

const form = document.getElementById('newProduct') as HTMLFormElement;
const deadline = document.getElementById('deadline') as HTMLInputElement;
const quantity = document.getElementById('quantity') as HTMLInputElement;
const listTitel = document.getElementById('listTitel') as HTMLInputElement;
const productName = document.getElementById('productName') as HTMLInputElement;
const productTable = document.getElementById('productTable') as HTMLTableElement;
const listDescription = document.getElementById('listDescription') as HTMLTextAreaElement;
const editDescriptionButton = document.getElementById('editDescriptionButton') as HTMLButtonElement;

const shoppinglist = database.getDocument(
    CONFIG.DATABASE_ID,
    CONFIG.DB_COLLECTION_SHOPPINGLISTS,
    listid
) as Promise<Einkaufsliste>;

shoppinglist.then((list) => {
    realtimeUpdate(list);

    updateListInfo(list);

    editDescriptionButton.addEventListener('click', () => {
        if (!listDescription.disabled.valueOf()) {
            database.updateDocument(
                CONFIG.DATABASE_ID,
                CONFIG.DB_COLLECTION_SHOPPINGLISTS,
                list.$id!,
                {
                    stichtag: deadline.value,
                    beschriftung: listTitel.value,
                    beschreibung: listDescription.value
                }
            );
        }
        listTitel.disabled = !listTitel.disabled.valueOf();
        listDescription.disabled = !listDescription.disabled.valueOf();
        deadline.disabled = !deadline.disabled.valueOf();
    });

    form.addEventListener('submit', (event) => {
        event.preventDefault();

        const product: Listeneintrag = {
            artikelname: productName.value,
            anzahl: Number.parseInt(quantity.value),
            erledigt: false,
            einkaufslisten: list.$id!
        }

        database.createDocument(
            CONFIG.DATABASE_ID,
            CONFIG.DB_COLLECTION_SHOPLISTENTRY,
            ID.unique(),
            product,
            [
                Permission.read(Role.team(list.ID_Household)),
                Permission.update(Role.team(list.ID_Household)),
                Permission.delete(Role.team(list.ID_Household)),
            ],
        ).then(() => { },
            () => { window.alert('Das geforderte Produkt konnte nicht erstellt werden. :(') });
    });

    list.listeneintrag.forEach(function (value: Listeneintrag) {
        productTable.appendChild(createTableRow(value));
    });
}, () => {
    window.location.pathname = '/uebersicht.html';
});

function createTableRow(data: Listeneintrag, id?: string): HTMLTableRowElement {
    const row = document.createElement('tr');
    if (id) {
        row.setAttribute('id', id!);
    } else {
        row.setAttribute('id', data.$id!);
    }

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = data.erledigt;
    checkbox.addEventListener('change', async () => {
        data.erledigt = Boolean(checkbox.checked);
        await updateListEntry(data);
    });

    const productName = document.createElement('input');
    productName.type = 'text';
    productName.disabled = true;
    productName.value = data.artikelname;

    const quantity = document.createElement('input');
    quantity.type = 'number';
    quantity.min = '1';
    quantity.max = '999';
    quantity.value = String(data.anzahl);
    quantity.disabled = true;

    const editButton = document.createElement('button');
    editButton.innerHTML = '&#9998';

    const deleteButton = document.createElement('button');
    deleteButton.innerHTML = '&#x1F5D1;';

    deleteButton.addEventListener('click', async (event) => {
        event.preventDefault();

        database.deleteDocument(
            CONFIG.DATABASE_ID,
            CONFIG.DB_COLLECTION_SHOPLISTENTRY,
            data.$id!
        ).then(() => { },
            () => {
                window.alert('Das ausgewählte Produkt konnte nicht gelöscht werden. :(');
            });
    });

    editButton.addEventListener('click', async (event) => {
        event.preventDefault();
        if (!productName.disabled.valueOf()) {
            data.anzahl = Number.parseInt(quantity.value);
            data.artikelname = productName.value;
            await updateListEntry(data);
        }
        productName.disabled = !productName.disabled.valueOf();
        quantity.disabled = !quantity.disabled.valueOf();
    });

    addToRow(checkbox, row);
    addToRow(productName, row);
    addToRow(quantity, row);
    addToRow(editButton, row);
    addToRow(deleteButton, row);

    return row;
}

function addToRow(element: HTMLElement, row: HTMLTableRowElement) {
    const td = document.createElement('td');
    td.appendChild(element);
    row.appendChild(td);
}

function addRowToTable(newEntry: Listeneintrag, id?: string) {
    if (id == undefined) {
        productTable.appendChild(createTableRow(newEntry));
        return;
    }
    productTable.appendChild(createTableRow(newEntry, id));
}

function realtimeUpdate(list: Einkaufsliste) {
    const listChannel = 'databases.' + CONFIG.DATABASE_ID +
        '.collections.' + CONFIG.DB_COLLECTION_SHOPPINGLISTS +
        '.documents.' + list.$id!;
    const documentChannel = 'databases.' + CONFIG.DATABASE_ID +
        '.collections.' + CONFIG.DB_COLLECTION_SHOPLISTENTRY +
        '.documents';
    client.subscribe([listChannel, documentChannel], response => {
        if (response.channels.includes(listChannel)) {
            const changedList = response.payload as Einkaufsliste;
            updateListInfo(changedList);
        }
        if (response.channels.includes(documentChannel)) {
            documentEventHandler(response, list.$id!);
        }
    });
}

function documentEventHandler(response: RealtimeResponseEvent<unknown>, id: string) {
    const changedEntry = response.payload as Listeneintrag;
    if (changedEntry.$id != id) {
        return;
    }
    switch (true) {
        case /create$/.test(response.events[0]):
            addRowToTable(changedEntry);
            console.log('It creates!');
            break;
        case /delete$/.test(response.events[0]):
            deleteRow(changedEntry.$id!);
            console.log('It deletes!');
            break;
        case /update$/.test(response.events[0]):
            updateRowEntry(changedEntry);
            console.log('It updates!');
            break;
        default:
            break;
    }
}

function deleteRow(id: string) {
    const deletedElement = document.getElementById(id) as HTMLTableRowElement;
    productTable.removeChild(deletedElement);
}

function updateRowEntry(entry: Listeneintrag) {
    const tableRow = document.getElementById(entry.$id!);
    const checkbox = tableRow?.children[0].firstChild as HTMLInputElement;
    checkbox.checked = entry.erledigt;

    const name = tableRow?.children[1].firstChild as HTMLInputElement;
    name.value = entry.artikelname;

    const quantity = tableRow?.children[2].firstChild as HTMLInputElement;
    quantity.value = String(entry.anzahl);
}

async function updateListEntry(entry: Listeneintrag) {
    database.updateDocument(
        CONFIG.DATABASE_ID,
        CONFIG.DB_COLLECTION_SHOPLISTENTRY,
        entry.$id!,
        {
            erledigt: entry.erledigt,
            artikelname: entry.artikelname,
            anzahl: entry.anzahl
        }
    );
}

function updateListInfo(list: Einkaufsliste) {
    listTitel.value = list.beschriftung;
    deadline.value = list.stichtag.split('T')[0];
    listDescription.value = list.beschreibung;
}
