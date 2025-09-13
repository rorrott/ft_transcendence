import { navigateTo } from "../main.js";

export class SignupView {
    async getHtml() {
		return `
      <h2 class="header_custom mb-20 mt-20" data-i18n="welcome">Welcome to Pong42</h2>
        <p class="text-lg mb-10 text-black" data-i18n="create_new_ac">Create new account:</p>

    <form id="signup-form" class="flex flex-col text-[13px] space-y-4 w-80">
      <div>
        <label for="username" class="py-4 block text-black text-left w-full" data-i18n="username">Username</label>
        <input id="username" type="text" placeholder="abc123" class="w-full px-3 py-2 rounded  bg-gray-200 text-gray-600 " />
      </div>

      <div>
        <label for="email" class="py-4 block text-black text-left w-full">Email</label>
        <input id="email" type="email" placeholder="alex@gmail.com" class="w-full px-3 py-2 rounded bg-gray-200 text-gray-600 " />
      </div>

      <div>
        <label for="password" class="py-4 block text-black text-left w-full" data-i18n="password">Password</label>
        <input id="password" type="password" placeholder="******" class="w-full px-3 py-2 rounded bg-gray-200 text-gray-600" />
      </div>

      <div>
        <label for="confirm" class="py-4 block text-black text-left w-full" data-i18n="cf_password">Confirm password</label>
        <input id="confirm" type="password" placeholder="******" class="w-full px-3 py-2 rounded bg-gray-200 text-gray-600" />
      </div>

      <button
        type="submit"
        class="mt-2 bg-black text-white py-4 rounded font-bold hover:bg-gray-800 transition-all" data-i18n="register">
        Register
      </button>
    </form>
    <div id="signup-message" class="mt-4 text-red-900"></div>

    `;
	}

  async onMounted() {
    const form = document.getElementById("signup-form") as HTMLFormElement;
    const messageDiv = document.getElementById("signup-message") as HTMLElement;
    
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = (form.querySelector("#username") as HTMLInputElement).value.trim();
      const email = (form.querySelector("#email") as HTMLInputElement).value.trim();
      const password = (form.querySelector("#password") as HTMLInputElement).value;
      const confirm = (form.querySelector("#confirm") as HTMLInputElement).value;

      if (name.length < 3 || name.length > 8) {
        alert("Username must be between 3 and 8 characters.");
        return;
      }

      if (!name || !email || !password || !confirm) {
        alert("All fields are required.");
        return;
      }
      if (password !== confirm) {
        alert("Passwords do not match.");
        return;
      }

      try {
        const response = await fetch("/api/v1/auth/sign-up", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          messageDiv.textContent = errorData.message;
          return;
        }

        const res = await response.json();
        localStorage.setItem("token", res.data.token);
        navigateTo("/");

      } catch (error) {
        messageDiv.style.color = "red";
        messageDiv.textContent = "Sign-up failed!";
      }
      });
    }
}