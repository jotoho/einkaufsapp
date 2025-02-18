// SPDX-License-Identifier: CC0-1.0
// SPDX-FileCopyrightText: 2025 Jonas Tobias Hopusch <git@jotoho.de>

import { resolve } from "path";
import { defineConfig } from 'vite';
import injectHTML from 'vite-plugin-html-inject';

export default defineConfig({
	plugins: [injectHTML()],
	build: {
		rollupOptions: {
			input: {
				index: resolve(__dirname, '/index.html'),
				login: resolve(__dirname, '/login.html'),
				uebersicht: resolve(__dirname, '/uebersicht.html'),
				registration: resolve(__dirname, '/registration.html'),
				settings: resolve(__dirname, '/settings.html'),
			},
		},
		target: 'es2024',
	},
});
