import { setLanguage } from "../main.js";

export function setupNavbar() {
	const nav = document.getElementById("mainNav");
	if (!nav) return;

	nav.innerHTML = !!localStorage.getItem("token")
		? `
      <a href="/" class="hover:underline" data-i18n="nav_home" data-link>Home</a>
      <a href="/search" class="hover:underline" data-i18n="nav_search" data-link>Search</a>
      <a href="/profile" class="hover:underline" data-i18n="nav_profile" data-link>Profile</a>
      <a href="#" id="logoutBtn" class="hover:underline" data-i18n="nav_signout">Sign out</a>
      ${languageDropdownHTML()}
    `
		: `
      <a href="/" class="hover:underline" data-i18n="nav_home" data-link>Home</a>
      <a href="/signup" class="hover:underline" data-link data-i18n="nav_signup">Sign-up</a>
      <a href="/login" class="hover:underline" data-i18n="nav_signin" data-link>Login</a>
      ${languageDropdownHTML()}
    `;

	attachLanguageDropdownEvents();
}

function languageDropdownHTML(): string {
	return `
    <div class="relative inline-block text-left">
      <button data-i18n="nav_language" id="langDropdownBtn" class="hover:underline focus:outline-none">
        Language
      </button>
      <div id="langDropdownMenu" class="hidden text-[11px] absolute right-0 mt-2 w-32 bg-white text-black rounded shadow-lg z-50">
        <button data-lang="en" class="lang-option block w-full text-left px-4 py-2 hover:bg-gray-200">English</button>
        <button data-lang="fr" class="lang-option block w-full text-left px-4 py-2 hover:bg-gray-200">Français</button>
		<button data-lang="es" class="lang-option block w-full text-left px-4 py-2 hover:bg-gray-200">Español</button>

      </div>
    </div>`;
}

function attachLanguageDropdownEvents() {
	const btn = document.getElementById("langDropdownBtn");
	const menu = document.getElementById("langDropdownMenu");
	const langButtons = document.querySelectorAll(".lang-option");

	if (!btn || !menu) return;

	btn.addEventListener("click", (e) => {
		e.stopPropagation();
		menu.classList.toggle("hidden");
	});
	document.addEventListener("click", (e) => {
		const target = e.target as HTMLElement;
		if (!menu.contains(target) && !btn.contains(target)) {
			menu.classList.add("hidden");
		}
	});
	langButtons.forEach((btn) => {
		btn.addEventListener("click", (e) => {
			const lang = (e.currentTarget as HTMLElement).getAttribute("data-lang");
			if (lang) loadLanguage(lang);
			menu.classList.add("hidden");
		});
	});
}

export async function loadLanguage(lang: string | null) {
	try {
		const response = await fetch(`/langs/${lang}.json`);
		if (!response.ok) {
			throw new Error(`HTTP ${response.status}: ${response.statusText}`);
		}
		const translations = await response.json();
		applyTranslations(translations);
		setLanguage(lang);
	} catch (err) {
		console.error("Failed to load language:", err);
	}
}



function applyTranslations(translations: Record<string, string>) {
	const elements = document.querySelectorAll("[data-i18n]");
	elements.forEach((el) => {
		const key = el.getAttribute("data-i18n");
		if (key && translations[key]) {
			el.textContent = translations[key];
		}
	});
}
