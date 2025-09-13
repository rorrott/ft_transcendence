import { getUserName, navigateTo } from "../main.js";

declare const google: any;

export class LoginView {
  async getHtml() {
    return `
      <h2 class="header_custom mt-20 mb-20" data-i18n="login_pong_42">Login Pong 42</h2>
      <form id="login-form" autocomplete="off" class="flex flex-col text-[14px] space-y-8 w-80">
        <label class="text-black text-left">Email</label>
        <input id="user-email" type="email" placeholder="abc123@gmail.com"
          class="px-3 py-2 rounded bg-gray-200 text-gray-600" required />

        <label class="text-black text-left mt-4" data-i18n="password">Password:</label>
        <input id="user-password" type="password" placeholder="******"
          class="px-3 py-2 rounded bg-gray-200 text-gray-600" required />

        <div id="otp-section" class="hidden">
          <label class="text-black text-left mt-4">OTP:</label>
          <input id="user-otp" type="text" placeholder="Enter OTP"
            class="px-3 py-2 rounded bg-gray-200 text-gray-600" />
          <button id="verify-otp-btn" type="button"
            class="bg-green-600 text-white py-2 rounded hover:bg-green-800 transition-all mt-2">
            Verify OTP
          </button>
        </div>

        <button type="submit"
          class="bg-blue-600 text-white py-4 rounded hover:bg-blue-800 transition-all"
          data-i18n="login">
          Login
        </button>

        <button id="google-login-btn" type="button"
          class="bg-black text-white py-4 rounded hover:bg-gray-700 transition-all"
          data-i18n="login_gg">
          Login with Google
        </button>
      </form>

      <div id="login-message" class="mt-4 text-red-900"></div>
    `;
  }

  async onMounted() {
    const form = document.getElementById("login-form") as HTMLFormElement;
    const emailInput = form.querySelector("#user-email") as HTMLInputElement;
    const passwordInput = form.querySelector("#user-password") as HTMLInputElement;
    const otpInput = document.getElementById("user-otp") as HTMLInputElement;
    const otpSection = document.getElementById("otp-section") as HTMLDivElement;
    const verifyOtpBtn = document.getElementById("verify-otp-btn") as HTMLButtonElement;
    const googleLoginBtn = document.getElementById("google-login-btn") as HTMLButtonElement;
    const messageDiv = document.getElementById("login-message") as HTMLElement;

    if (!form || !emailInput || !passwordInput || !otpInput || !otpSection || !verifyOtpBtn || !googleLoginBtn || !messageDiv) {
      console.error("LoginView: One or more required DOM elements not found.");
      return;
    }

    let tempToken: string | null = null;

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      this.clearMessage(messageDiv);

      try {
        const response = await fetch("/api/v1/auth/sign-in", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: emailInput.value.trim(),
            password: passwordInput.value,
          }),
        });

        const res = await response.json();

        if (!response.ok) return this.showMessage(messageDiv, res.message || "Login failed.");

        if (res.twoFactorRequired) {
          tempToken = res.tempToken;
          otpSection.classList.remove("hidden");
          this.showMessage(messageDiv, "Two-factor authentication required. Please enter your OTP.");
        } else {
          localStorage.setItem("token", res.data.token);
          navigateTo("/");
        }
      } catch (err) {
        console.error("Login error:", err);
        this.showMessage(messageDiv, "Login failed due to network or server error.");
      }
    });

    verifyOtpBtn.addEventListener("click", async () => {
      this.clearMessage(messageDiv);
      const otp = otpInput.value.trim();

      if (!otp || !tempToken) {
        return this.showMessage(messageDiv, "OTP or temporary token is missing.");
      }

      try {
        const response = await fetch("/api/v1/auth/2fa/verify", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${tempToken}`,
          },
          body: JSON.stringify({ token: otp }),
        });

        const res = await response.json();

        if (!response.ok) return this.showMessage(messageDiv, res.message || "OTP verification failed.");

        localStorage.setItem("token", res.data.token);
        navigateTo("/");
      } catch (err) {
        console.error("OTP verification failed:", err);
        this.showMessage(messageDiv, "OTP verification failed.");
      }
    });

    googleLoginBtn.addEventListener("click", () => {
      window.location.href = "/api/v1/auth/google/redirect";
      google.accounts.id.initialize({
        client_id: window.GOOGLE_CLIENT_ID,
        callback: async (response: any) => {
          try {
            await fetch("/api/v1/auth/google-auth", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ idToken: response.credential }),
            });
          } catch (error) {
            console.error("Google login error:", error);
            this.showMessage(messageDiv, "Google login failed.");
          }
        },
      });
      google.accounts.id.prompt();
    });

    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("token");
    if (token) {
      localStorage.setItem("token", token);
      await this.shortenName();
      navigateTo("/");
    }
  }

  async shortenName() {
    let username = await getUserName();
    if (username && username.length > 8) {
      try {
        const response = await fetch("/api/v1/user/me", { 
              method: "PUT",
              headers: {
                "Content-Type": "application/json", 
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
              body: JSON.stringify({ name: username.slice(0, 8) }),
            });

            const res = await response.json();
            if (!response.ok) {
              throw new Error(res.message || "Failed to update profile");
            }
        } catch (err) {
          console.error("Error updating profile:", err);
          alert(`Error updating profile: ${err}`);
        }
    }
  }

  showMessage(element: HTMLElement, message: string) {
    element.textContent = message;
  }

  clearMessage(element: HTMLElement) {
    element.textContent = "";
  }
}