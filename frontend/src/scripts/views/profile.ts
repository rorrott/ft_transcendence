import { navigateTo } from "../main";

export class ProfileView {
  private DEFAULT_AVATAR_PATH: string = '/uploads/default-avatar.png';
  private meID: number | undefined = undefined;
  constructor(private userID?: string, private isMyProfile: boolean = true) {}
  async getHtml() {
      if (!this.isMyProfile) {
        return `
        <section class="bg-gray-100 max-w-5xl w-full mx-auto rounded-lg shadow-md p-4 sm:p-6 flex flex-col md:flex-row gap-4 md:gap-6">
        
        <div class="font-mono flex flex-col items-center h-40">
          <div class="flex-grow"></div> 
          <img id="profileAvatar" src="" alt="Avatar" class="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-white shadow" /> 
          <div class="flex-grow"></div>

        </div>
        
        <div class="font-mono flex-1 bg-white rounded p-4 shadow space-y-4">
          <div>
            <label data-i18n="username" class="text-black text-left block font-semibold">Username</label>
            <input id="usernameInput" type="text" disabled value="" class="w-full mt-1 p-2 rounded bg-gray-200 text-gray-600"/>
          </div>
          <div>
            <label data-i18n="email" class="text-black text-left block font-semibold">Email</label>
            <input id="emailInput" type="text" disabled value="********" class="w-full mt-1 p-2 rounded bg-gray-200 text-gray-600"/>
          </section>
      
          <section class="font-mono bg-white max-w-5xl w-full mx-auto mt-6 p-4 rounded-lg shadow">
            <h2 class=" text-lg text-black font-bold mb-2" data-i18n="statistics">Statistics</h2>
            <div class="grid grid-cols-1 sm:grid-cols-3 text-gray-700 gap-2 text-center">
              <div data-i18n="total">Total</div> 
              <div data-i18n="win">Win</div>
              <div data-i18n="lose">Lose</div>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-3 text-gray-700 gap-2 text-center">
            <div id="total">x</div> 
            <div id="win">x</div> 
            <div id="lose">x</div> 
          </section>
        `;
    }
    return `
    <section class="bg-gray-100 max-w-5xl w-full mx-auto rounded-lg shadow-md p-4 sm:p-6 flex flex-col md:flex-row gap-4 md:gap-6">
      
      <div class="font-mono flex flex-col items-center h-40">
        <div class="flex-grow"></div> 
        <img id="profileAvatar" src="" alt="Avatar" class="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-white shadow" /> 
        <div class="flex-grow"></div>
        ${this.isMyProfile ? `
          <button id="editProfileBtn" data-i18n="edit_profile" class="bg-blue-500 text-white px-4 py-1 rounded shadow hover:bg-blue-600 w-full max-w-xs mt-auto">
            Edit profile
          </button>` : ""}
      </div>
      
      <div class="font-mono flex-1 bg-white rounded p-4 shadow space-y-4">
        <div>
          <label data-i18n="username" class="text-black text-left block font-semibold">Username</label>
          <input id="usernameInput" type="text" disabled value="" class="w-full mt-1 p-2 rounded bg-gray-200 text-gray-600"/>
        </div>
        <div>
          <label data-i18n="email" class="text-black text-left block font-semibold">Email</label>
          <input id="emailInput" type="text" disabled value="" class="w-full mt-1 p-2 rounded bg-gray-200 text-gray-600"/>
        </div>
        <button id="deleteAccountBtn" class="bg-black text-white px-4 py-1 rounded shadow hover:bg-red-600 w-full max-w-xs" data-i18n="delete_account">Delete account</button>
        </div>
        </section>
        
        <section class="bg-white max-w-5xl w-full mx-auto mt-6 p-4 rounded-lg shadow">
          <h2 class="font-mono text-lg text-black font-bold mb-2" data-i18n="friends">Friends</h2>          
          <div id="friendsContainer" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">          
              <p id="noFriendsMessage" class="text-gray-600 italic mt-2 hidden" data-i18n="no_friends_yet">No friends yet.</p>
          </div>
          <h2 class="font-mono text-lg text-black font-bold my-5" data-i18n="pending_request">Pending Requests</h2>
          <div id="pendingRequest" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">          
          </div>
        </section>
        
        <section class="font-mono bg-white max-w-5xl w-full mx-auto mt-6 p-4 rounded-lg shadow">
          <h2 class=" text-lg text-black font-bold mb-2" data-i18n="statistics">Statistics</h2>
          <div class="grid grid-cols-1 sm:grid-cols-3 text-gray-700 gap-2 text-center">
            <div data-i18n="total">Total</div> 
            <div data-i18n="win">Win</div>
            <div data-i18n="lose">Lose</div>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-3 text-gray-700 gap-2 text-center">
          <div id="total">x</div> 
          <div id="win">x</div> 
          <div id="lose">x</div> 
        </section>
        
        <section class="font-mono bg-white max-w-5xl w-full mx-auto mt-6 p-4 rounded-lg shadow">
          <h2 data-i18n="history" class="text-lg font-bold mb-4 text-black">History</h2>
          
          <div class="overflow-x-auto">
            <table class="min-w-full table-fixed w-full border-collapse">
              <thead>
                <tr class="bg-gray-100">
                  <th class="w-1/4 text-center py-2 text-gray-700" data-i18n="time">Time</th>
                  <th class="w-1/4 text-center py-2 text-gray-700" data-i18n="opponent">Opponent</th>
                  <th class="w-1/4 text-center py-2 text-gray-700" data-i18n="score">Score</th>
                  <th class="w-1/4 text-center py-2 text-gray-700" data-i18n="status">Status</th>
                </tr>
              </thead>
              <tbody id="historyTableBody" class="text-center text-gray-700">
              </tbody>
            </table>
            <p id="noHistoryMessage" class="text-gray-600 italic mt-2 hidden" data-i18n="no_history_yet">No history yet.</p>
          </div>
        </section>

        <div id="editProfilePopup" class="text-black font-mono fixed inset-0 hidden items-center justify-center bg-black/50 backdrop-blur-sm z-50">
        <div class="bg-white rounded-lg shadow-lg max-w-md w-full p-6 relative">
        <h2 class="text-xl font-bold mb-4" data-i18n="edit_profile">Edit Profile</h2>
        <form id="editProfileForm" class="space-y-4">
        <div class="flex flex-col items-center">
        <img id="editAvatarPreview" src="" alt="Avatar Preview" class="w-24 h-24 rounded-full mb-2 object-cover" />
        <input type="file" id="avatarInput" accept="image/*" class="hidden" />
        <button id="chooseFileBtn" type="button" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700" data-i18n="choose_avatar">
        Choose Avatar
        </button>
        </div>
        <div>
        <label for="editUsername" class="text-left block font-semibold text-black mb-1" data-i18n="email">Username</label> <input type="text" id="editUsername" class="w-full border rounded p-2" required />
        </div>
        <div class="flex justify-end gap-2 mt-4">
        <button type="button" id="cancelEditBtn" class="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400" data-i18n="cancel">Cancel</button>
        <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700" data-i18n="save">Save</button>
        </div>
        </form>
        </div>
        </div>
        `;
      }
      
  async onMounted() {
    if (!this.isMyProfile) {
        try {
          await this.setupFriendProfile();
        } catch (err: any) {
          alert(err);
          navigateTo("/");
        }
      }
    else {
      try {
        await this.setupProfileDefault();
        this.handleEditProfile();
        await this.loadFriends();
        await this.loadHistory();
        await this.deleteUser();
      } catch (err: any) {
        alert(err);
        navigateTo("/");
      }
    }
  }
    
  private async setupProfileDefault() {
    const url = "/api/v1/user/me";
    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const userData = await response.json();
      if (!response.ok) {
        throw new Error(userData.message || "Failed to fetch user data");
      }
      const username = document.getElementById("usernameInput") as HTMLInputElement;
      const email = document.getElementById("emailInput") as HTMLInputElement;
      const profileAvatar = document.getElementById("profileAvatar") as HTMLImageElement; 
      
      this.meID = userData.data.user.id;
      username.value = userData.data.user.name;
      email.value = userData.data.user.email;
      
      const avatarFilename = userData.data.user.avatar;
      profileAvatar.src = avatarFilename ? `/uploads/${avatarFilename}` : this.DEFAULT_AVATAR_PATH;

      const statsTotal = document.getElementById("total")!;
      const statsWin = document.getElementById("win")!;
      const statsLose = document.getElementById("lose")!;

      const wins = userData.data.user.wins;
      const losses = userData.data.user.losses;
      const total = wins + losses;

      statsWin.textContent = wins.toString(); 
      statsLose.textContent = losses.toString(); 
      statsTotal.textContent = total.toString(); 
    } catch (error:any) {
      console.error("Error setting up profile default:", error);
      throw new Error(error);
    }
  }             
  
  private handleEditProfile() {
    const editProfileBtn = document.getElementById("editProfileBtn")!;
    const popup = document.getElementById("editProfilePopup")!;
    const cancelBtn = document.getElementById("cancelEditBtn")!;
    const avatarInput = document.getElementById("avatarInput") as HTMLInputElement;
    const avatarPreview = document.getElementById("editAvatarPreview") as HTMLImageElement;     
    const usernameInput = document.getElementById("editUsername") as HTMLInputElement;
    const currentAvatarSrc = (document.getElementById("profileAvatar") as HTMLImageElement).src;     
    const chooseFileBtn = document.getElementById("chooseFileBtn")!;     
    
    let selectedAvatarFile: File | null = null;

    chooseFileBtn.addEventListener("click", () => {
      avatarInput.click();
    });
    
    editProfileBtn.addEventListener("click", () => {
      const currentUsername = (document.getElementById("usernameInput") as HTMLInputElement).value;
      const currentAvatarSrc = (document.getElementById("profileAvatar") as HTMLImageElement).src;
      popup.classList.remove("hidden");
      popup.classList.add("flex");
  
      usernameInput.value = currentUsername;
      avatarPreview.src = currentAvatarSrc;
      avatarInput.value = ''; 
      selectedAvatarFile = null;
    });
    
    cancelBtn.addEventListener("click", () => {
      popup.classList.add("hidden");
      popup.classList.remove("flex");
    });
    

    avatarInput.addEventListener("change", (e) => {
      const files = avatarInput.files;
      if (files && files[0]) {
        selectedAvatarFile = files[0]; 
        const reader = new FileReader();
        reader.onload = function (event) {
          if (event.target?.result) {
            avatarPreview.src = event.target.result as string;
          }
        };
        reader.readAsDataURL(files[0]);
      } else {
        selectedAvatarFile = null; 
      }
    });
    
    const form = document.getElementById("editProfileForm") as HTMLFormElement;
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      
      const newUsername = usernameInput.value.trim();
      if (!newUsername) {
        alert("Username cannot be empty.");
        return;
      }
      if (newUsername.length < 3 || newUsername.length > 8) {
        alert("Username must be between 3 and 8 characters.");
        return;
      }

      try {
        let uploadedAvatarFilename: string | null = null;
        if (selectedAvatarFile) {
            const formDataAvatar = new FormData();
            formDataAvatar.append("avatar", selectedAvatarFile);

            const avatarUploadResponse = await fetch("/api/v1/user/me/avatar", { 
                method: "POST", 
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
                body: formDataAvatar,
            });

            const avatarUploadRes = await avatarUploadResponse.json();
            if (!avatarUploadResponse.ok) {
                throw new Error(avatarUploadRes.message || "Failed to upload avatar");
            }
            uploadedAvatarFilename = avatarUploadRes.data.avatar; 
        }

        const updateBody: { name: string; avatar?: string } = { name: newUsername };
        if (uploadedAvatarFilename) {
            updateBody.avatar = uploadedAvatarFilename; 
        }

        const response = await fetch("/api/v1/user/me", { 
          method: "PUT",
          headers: {
            "Content-Type": "application/json", 
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify(updateBody),
        });

        const res = await response.json();
        if (!response.ok) {
          throw new Error(res.message || "Failed to update profile");
        }
          
        (document.getElementById("usernameInput") as HTMLInputElement).value = newUsername;
        const finalAvatarSrc = uploadedAvatarFilename ? `/uploads/${uploadedAvatarFilename}` : currentAvatarSrc;
        (document.getElementById("profileAvatar") as HTMLImageElement).src = finalAvatarSrc;
        
        popup.classList.add("hidden");
        popup.classList.remove("flex");

      } catch (err) {
        console.error("Error updating profile:", err);
        alert(`Error updating profile: ${err}`);
      }
    });
  }

  private async loadFriends() {
    const friendsContainer = document.getElementById("friendsContainer")!;
    const pendingRequestContainer = document.getElementById("pendingRequest")!;
    try {
      const response = await fetch("/api/v1/user/me/friends", { 
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const resJson = await response.json();

      if (!response.ok || !resJson.success) {
        throw new Error(resJson.message || "Failed to load friends");
      }

      const friends = resJson.data.accepted;

      const friendsPending = resJson.data.pendingReceived;
      const friendsSent = resJson.data.pendingSent;
     
     friendsPending.forEach((friend: any) => {
        const friendCard = document.createElement('div');
        friendCard.setAttribute('data-username', friend.name);
        friendCard.className = 'user-card';
        const avatarSrc = friend.avatar ? `/uploads/${friend.avatar}` : this.DEFAULT_AVATAR_PATH;

        friendCard.innerHTML = `
          <img src="${avatarSrc}" alt="avatar" class="user-avatar" />
          <div href="/profile/${friend.id}" data-link class="user-name">${friend.name}</div>
          <div class="user-actions">
            <button id="acceptBtn" data-i18n="Accept" class="btn-send-message">Accept</button>
          </div>
        `;
        const acceptBtn = friendCard.querySelector('#acceptBtn') as HTMLButtonElement;
        acceptBtn.addEventListener('click', async () => {
          try {
            const response = await fetch(`/api/v1/user/me/friends/accept`, {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ requesterId: friend.id }),
            });
            const resJson = await response.json();
            if (!response.ok || !resJson.success) {
              throw new Error(resJson.message || "Failed to reject friend request");
            }
            friendCard.remove();
            navigateTo("/profile");
          } catch (error: any) {
            console.error("Error rejecting friend request:", error);
            alert(`Error rejecting friend request: ${error.message || error}`);
          }
        });

        
        pendingRequestContainer.appendChild(friendCard);
      });

      friendsSent.forEach((friend: any) => {
        const friendCard = document.createElement('div');
        friendCard.setAttribute('data-username', friend.name);
        friendCard.className = 'user-card';
        const avatarSrc = friend.avatar ? `/uploads/${friend.avatar}` : this.DEFAULT_AVATAR_PATH;

        friendCard.innerHTML = `
          <img src="${avatarSrc}" alt="avatar" class="user-avatar" />
          <div href="/profile/${friend.id}" data-link class="user-name">${friend.name}</div>
          <div class="user-actions">
            <button id="cancelBtn" data-i18n="cancel_request" class="btn-remove-friend">Pending</button>
          </div>
        `;
        
        pendingRequestContainer.appendChild(friendCard);
      }); 

      friends.forEach((friend: any) => {
        const friendCard = document.createElement('div');
        friendCard.setAttribute('data-username', friend.name);
        friendCard.className = 'user-card';
        const avatarSrc = friend.avatar ? `/uploads/${friend.avatar}` : this.DEFAULT_AVATAR_PATH;

        friendCard.innerHTML = `
          <img src="${avatarSrc}" alt="avatar" class="user-avatar" />
          <div href="/profile/${friend.id}" data-link class="user-name">${friend.name}</div>
        `;
        friendsContainer.appendChild(friendCard);
      });

    } catch (error: any) {
      console.error("Error loading friends:", error);
      friendsContainer.innerHTML = `<p class="text-red-500">Error loading friends: ${error.message || error}</p>`;
    }
  }

  private async loadHistory() {
    const url = `/api/v1/user/me/matches`;

    try {
        const response = await fetch(url, {
            headers: {  
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        });
        const resJson = await response.json();
        const tbody = document.getElementById("historyTableBody")!;
        const noHistoryMsg = document.getElementById("noHistoryMessage")!;

        if (!response.ok || !resJson.success) {
            throw new Error(resJson.message || "Failed to load match history");
        }

        const matches = resJson.data;
        if (!matches || matches.length === 0) {
            tbody.innerHTML = "";
            noHistoryMsg.classList.remove("hidden");
            return;
        }

        noHistoryMsg.classList.add("hidden");
        tbody.innerHTML = "";

        for (const match of matches) {
            const playedAt = new Date(match.playedAt).toLocaleString();
            const displayOpponent = match.opponentName;
            const score = `${match.player1Score} - ${match.player2Score}`;
            const status = match.isWinner ? "Win" : "Loss";
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td class="px-4 py-2 text-center">${playedAt}</td>
                <td class="px-4 py-2 text-center">${displayOpponent}</td>
                <td class="px-4 py-2 text-center">${score}</td>
                <td class="px-4 py-2 text-center">${status}</td>
            `;
            tbody.appendChild(tr);
        }
    } catch (error: any) {
        console.error("Error loading match history:", error);
        alert(`Error loading match history: ${error.message || error}`);
    }
  }

  private async deleteUser() {
    const deleteAccountBtn = document.getElementById("deleteAccountBtn")!;
    deleteAccountBtn.addEventListener("click", async () => {
      if (!confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
        return;
      }
      try {
        const response = await fetch("/api/v1/user/me", {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        const resJson = await response.json();
        if (!response.ok || !resJson.success) {
          throw new Error(resJson.message || "Failed to delete account");
        }
        alert("Account deleted successfully.");
        localStorage.removeItem("token");
        navigateTo("/");
      } catch (error: any) {
        console.error("Error deleting account:", error);
        alert(`Error deleting account: ${error.message || error}`);
      }
    });
  }

  async setupFriendProfile() {
    try {
      const response = await fetch("/api/v1/user/users",{
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const resJson = await response.json();
      if (!response.ok || !resJson.success) {
        throw new Error(resJson.message || "Failed to fetch user data");    
      }
      const user = resJson.data.users.find((user: any) => user.id === Number(this.userID));
      if (!user) {
        throw new Error("User not found");
      }
      const usernameFriend = document.getElementById("usernameInput") as HTMLInputElement;
      usernameFriend.value = user.name;
      const avtFriend = document.getElementById("profileAvatar") as HTMLImageElement;
      const avatarFilename = user.avatar;
      avtFriend.src = avatarFilename ? `/uploads/${avatarFilename}` : this.DEFAULT_AVATAR_PATH;
      const statsTotal = document.getElementById("total")!;
      const statsWin = document.getElementById("win")!;
      const statsLose = document.getElementById("lose")!;
      const wins = user.wins;
      const losses = user.losses;
      const total = wins + losses;  
      statsWin.textContent = wins.toString();
      statsLose.textContent = losses.toString();
      statsTotal.textContent = total.toString();
    } catch (error: any) {
      console.error("Error setting up friend profile:", error);
      throw new Error(error);
    }
  }
}


