interface User {
  id: number;
  name: string;
  avatar: string;
  wins: number;
  losses: number;
  onlineStatus: number;
  createdAt: string;
  updatedAt: string;
}

export class SearchView {
    async getHtml() {
		return `
      <div class="p-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <!-- User List -->
        <div class="col-span-1">
          <!-- Search -->
          <div class="flex items-center space-x-2 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-black" fill="none" viewBox="0 0 24 30" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-4.35-4.35M16.65 16.65A7.5 7.5 0 1116.65 2a7.5 7.5 0 010 15z" />
            </svg>
            <input id="searchInput" type="text" class=" text-black w-full px-3 py-1 rounded bg-gray-200 outline-none" />
          </div>

          <!-- User Cards example -->
          <div id="userCards" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-1 gap-4">      
          </div>
        </div>

      </div>
    `;

	}

  async onMounted() {
    try {
      const myID = await this.getMyID();
      const friendID = await this.getFriends();
      await this.getUserCard(friendID, myID);
    } catch (error) {
      console.error("Error during SearchView onMounted:", error);
      const userCards = document.getElementById("userCards")!;
      userCards.innerHTML = "<p>Failed to load users.</p>";
    }
  }

  async getMyID(): Promise<number> {
    try {
      const response = await fetch("/api/v1/user/me", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token") || ""}`
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch your user");
      }
      const result = await response.json();
      if (result?.data?.user) {
        return result.data.user.id;
      }
      throw new Error("User not found");
    } catch (error) {
      console.error("Error fetching your user ID:", error);
      throw error;
    }
  }

  async getFriends(): Promise<number[]> {
    try {
      const response = await fetch("/api/v1/user/me/friends", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token") || ""}`
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch friends");
      }
      const result = await response.json();
      const acceptedID = result.data.accepted?.map((u: { id: number }) => u.id) || [];
      const pendingSentID = result.data.pendingSent?.map((u: { id: number }) => u.id) || [];
      const pendingReceivedID = result.data.pendingReceived?.map((u: { id: number }) => u.id) || [];
      const allFriendIDs = [...acceptedID, ...pendingSentID, ...pendingReceivedID];
      return allFriendIDs;
    } catch (error) {
      console.error("Error fetching friends:", error);
      throw error;
    }
  } 

  async getUserCard(friendID: number[], myID: number) { 
    const userCards = document.getElementById("userCards")!;
    try {
      const response = await fetch("/api/v1/user/users", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token") || ""}`
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }
      const result = await response.json();
      const users: User[] = result?.data?.users || [];

      users.forEach((user: User) => {
        if (user.id !== myID && friendID.indexOf(user.id) === -1 && user.id < 100) {
          const card = document.createElement("div");
          card.className = "user-card";
          card.setAttribute("data-username", user.name);

          const img = document.createElement("img");
          img.src = `/uploads/${user.avatar}`;
          img.alt = user.name;
          img.className = "user-avatar";

          const nameLink = document.createElement("a");
          nameLink.href = `/profile/${user.id}`;
          nameLink.setAttribute("data-link", "");
          nameLink.className = "flex items-center gap-2 font-semibold text-black";

          const statusDot = document.createElement("span");
          statusDot.textContent = "●";
          statusDot.style.color = user.onlineStatus === 0 ? "#dc2626" : "#16a34a"; 
          statusDot.style.fontSize = "20px";
          const nameText = document.createElement("span");
          nameText.textContent = user.name;
          nameLink.appendChild(statusDot);
          nameLink.appendChild(nameText);
          const addButton = document.createElement("button");
          addButton.className = "btn-add-friend";
          addButton.textContent = "Add Friend";
          addButton.addEventListener("click", async () => {
            try { 
              const addFriendRequest = await fetch("/api/v1/user/me/friends", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${localStorage.getItem("token") || ""}`
                },
                body: JSON.stringify({ friendId: user.id }),
              })
              if (!addFriendRequest.ok) {
                throw new Error("Failed to send friend request");
              }
              addButton.style.display = "none"
              const successMessage = document.createElement("span");
              successMessage.textContent = "Friend request sent!";
              successMessage.style.color = "green";
              addButton.parentElement?.appendChild(successMessage);
              setTimeout(() => {
                successMessage.remove();
              }, 2000);
            } catch (error) {
              console.error("Error sending friend request:", error);
              const errorMessage = document.createElement("span");
              errorMessage.textContent = "Failed to send friend request.";
              errorMessage.style.color = "red";
              addButton.parentElement?.appendChild(errorMessage);      
              setTimeout(() => {
                errorMessage.remove();
                }, 2000);        
            }
          });

          card.appendChild(img);
          card.appendChild(nameLink);
          card.appendChild(addButton);
          userCards.appendChild(card);
        }
      });
      const searchInput = document.getElementById("searchInput") as HTMLInputElement;
      searchInput.addEventListener("input", () => {
        const filter = searchInput.value.toLowerCase();
        const cards = userCards.getElementsByClassName("user-card") as HTMLCollectionOf<HTMLElement>;
        Array.from(cards).forEach((card) => {
          const username = card.getAttribute("data-username") || "";
          if (username.toLowerCase().includes(filter)) {
            card.style.display = "flex";
          } else {
            card.style.display = "none";
          }
        })
      });
    } catch (error) {
      console.error("Error fetching users:", error);
      userCards.innerHTML = "<p>Failed to load users.</p>";
    }
  }
}
