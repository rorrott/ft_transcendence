import { io, Socket } from "socket.io-client";
import { navigateTo } from "../main.js";

export interface Friend {
    id: number;
    name: string;
}

export interface Message {
    sender_id: string;
    receiver_id: string;
    message: string;
}

export class LiveChatService {
    private socket: Socket | null = null;
    private selectedFriend: string = "";
    private selectedFriendId: string = "";
    connect(token: string): void {
        if (!token) {
            console.warn("No token provided for livechat connection");
            return;
        }

        this.socket = io("/", {
            auth: {
                token: token,
            },
        });

        this.setupSocketListeners();
    }

    private setupSocketListeners(): void {
        if (!this.socket) return;

        this.socket.on("get-chat-message", ({ from, msg, fromId }: { from: string; msg: string, fromId: string}) => {
           // alert(this.selectedFriendId)
            if (fromId == this.selectedFriendId) {
                this.addMessageToChat(from, msg);
            }
        });

         this.socket.on("invitation-error", ({ msg }: { from: string; msg: string }) => {
                this.addMessageToChat("server", msg);
        });

        this.socket.on("game-invitation-with-buttons", ({ from, invitationId, message, roomName, fromId }: { from: string; invitationId: string; message: string; roomName: string, fromId: string }) => {
            console.log("Received game invitation with buttons");
            
            if (fromId == this.selectedFriendId) {
                this.createGameInvitationUI(invitationId, message, roomName);
            }
        });

        this.socket.on("game-invitation-response", ({ from, accepted, message }: { from: string; accepted: boolean; message: string }) => {
            console.log("Received game invitation response");
            this.createResponseMessage(accepted, message);
        });

        this.socket.on("game-start", ({ roomName, opponent, message }: { roomName: string; opponent: string; message: string }) => {
            console.log("Game starting!");
            console.log("Room name:", roomName);
            console.log("Opponent:", opponent);
            
            this.createGameStartMessage(message);
            
            setTimeout(() => {
                navigateTo(`/online-game/${roomName}`);
            }, 2000);
        });
    }

    private addMessageToChat(from: string, msg: string): void {
        const chatMessages = document.getElementById("chatMessages");
        if (!chatMessages) return;

        const item = document.createElement("li");
        item.textContent = `${msg}`;
        chatMessages.appendChild(item);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    private createGameInvitationUI(invitationId: string, message: string, roomName: string): void {
        const chatMessages = document.getElementById("chatMessages");
        if (!chatMessages) return;

        const invitationDiv = document.createElement("div");
        invitationDiv.className = "game-invitation";
        invitationDiv.setAttribute("data-invitation-id", invitationId);
        invitationDiv.style.cssText = `
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 15px;
            margin: 10px 0;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        `;
        
        const messageDiv = document.createElement("div");
        messageDiv.textContent = message;
        messageDiv.style.marginBottom = "10px";
        messageDiv.style.fontWeight = "bold";
        
        const roomDiv = document.createElement("div");
        roomDiv.textContent = `Room: ${roomName}`;
        roomDiv.style.fontSize = "12px";
        roomDiv.style.opacity = "0.8";
        roomDiv.style.marginBottom = "10px";
        
        const buttonContainer = document.createElement("div");
        buttonContainer.style.display = "flex";
        buttonContainer.style.gap = "10px";
        
        const acceptBtn = document.createElement("button");
        acceptBtn.textContent = "Accept";
        acceptBtn.style.cssText = `
            background: #4CAF50;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 5px;
            cursor: pointer;
            font-weight: bold;
        `;
        
        const declineBtn = document.createElement("button");
        declineBtn.textContent = "Decline";
        declineBtn.style.cssText = `
            background: #f44336;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 5px;
            cursor: pointer;
            font-weight: bold;
        `;
        declineBtn.setAttribute("data-i18n", "Reject");
        
        acceptBtn.onclick = () => {
            console.log(`Accepting invitation ${invitationId}`);
            this.socket?.emit('accept-game-invitation', { invitationId });
            invitationDiv.remove();
        };
        
        declineBtn.onclick = () => {
            console.log(`Declining invitation ${invitationId}`);
            this.socket?.emit('decline-game-invitation', { invitationId });
            invitationDiv.remove();
        };
        
        buttonContainer.appendChild(acceptBtn);
        buttonContainer.appendChild(declineBtn);
        
        invitationDiv.appendChild(messageDiv);
        invitationDiv.appendChild(roomDiv);
        invitationDiv.appendChild(buttonContainer);
        
        chatMessages.appendChild(invitationDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    private createResponseMessage(accepted: boolean, message: string): void {
        const chatMessages = document.getElementById("chatMessages");
        if (!chatMessages) return;

        const responseDiv = document.createElement("div");
        responseDiv.style.cssText = `
            background: ${accepted ? '#4CAF50' : '#f44336'};
            color: white;
            padding: 10px;
            margin: 10px 0;
            border-radius: 5px;
            text-align: center;
            font-weight: bold;
        `;
        responseDiv.textContent = message;
        
        chatMessages.appendChild(responseDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    private createGameStartMessage(message: string): void {
        const chatMessages = document.getElementById("chatMessages");
        if (!chatMessages) return;

        const startDiv = document.createElement("div");
        startDiv.style.cssText = `
            background: #2196F3;
            color: white;
            padding: 15px;
            margin: 10px 0;
            border-radius: 5px;
            text-align: center;
            font-weight: bold;
        `;
        startDiv.textContent = message;
        
        chatMessages.appendChild(startDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    async getFriendsList(token: string): Promise<Friend[]> {
        try {
            if (!token) {
                throw new Error('No token');
            }

            const response = await fetch("/api/v1/user/me/friends", {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Failed to fetch friends");
            }

            const friends = await response.json();
            return friends.data.accepted || [];

        } catch (error) {
            throw error;
        }
    }

    async getMessageHistory(token: string, selectedFriendName: string): Promise<Message[]> {
        try {
            if (!token) {
                throw new Error('No token');
            }

            const response = await fetch(`/livechat/api/messages/${selectedFriendName}`, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Failed to get message history");
            }
            const messages = await response.json();
            return messages;

        } catch (error) {
            throw error;
        }
    }

    async renderFriends(friends: Friend[]): Promise<void> {
    let onlineUserIds: number[]
    try {
    const res = await fetch("/livechat/api/getOnlineFriends", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`
      }
    });

    if (!res.ok) throw new Error("Failed to fetch online friends");

    const json = await res.json();
    onlineUserIds = json.data;
    } catch (err) {
    console.error("Error fetching or parsing online friends:", err);
    }


        const friendsList = document.getElementById("friendsList");
        if (!friendsList) return;

        friendsList.innerHTML = "";
        friends.forEach(friend => {
            const li = document.createElement("li");
            li.textContent = friend.name;
            li.style.padding = "10px";
            li.style.cursor = "pointer";
            li.style.borderBottom = "1px solid #eee";

            if (onlineUserIds && onlineUserIds.includes(friend.id))
            {
                li.style.color = "green";
            }
            li.addEventListener("click", () => {
                this.openChat(friend);
            });
            friendsList.appendChild(li);
        });
    }

    showFriendsList(): void {
        const friendsList = document.getElementById("friendsList");
        const chatContainer = document.getElementById("chatContainer");
        if (!friendsList || !chatContainer) return;

        friendsList.style.display = "block";
        chatContainer.style.display = "none";
    }

    async openChat(friend: Friend): Promise<void> {
        console.log("tried to open chat")
        const friendsList = document.getElementById("friendsList");
        const chatContainer = document.getElementById("chatContainer");
        const chatMessages = document.getElementById("chatMessages");
        const chatInput = document.getElementById("chatInput") as HTMLInputElement;

        if (!friendsList || !chatContainer || !chatMessages || !chatInput) return;

        this.selectedFriend = friend.name;
        this.selectedFriendId = friend.id.toString();
        friendsList.style.display = "none";
        chatContainer.style.display = "flex";
        // Create clickable friend name that navigates to profile
        const friendNameElement = document.createElement("b");
        friendNameElement.textContent = friend.name;
        friendNameElement.style.cursor = "pointer";
        friendNameElement.addEventListener("click", () => {
            navigateTo(`/profile/${friend.id}`);
        });
        
        chatMessages.innerHTML = "";
        chatMessages.appendChild(friendNameElement);
        chatInput.value = "";
        chatInput.focus();

        const token = localStorage.getItem("token");
        if (!token) return;

        try {
            this.setupChatInputHandler(friend.name, friend.id.toString());
        } catch (error) {
            console.error("Failed to load message history:", error);
        }
    }

    private setupChatInputHandler(friendName: string, friendId: string): void {
        const chatInput = document.getElementById("chatInput") as HTMLInputElement;
        if (!chatInput) return;

        const onSend = (e: KeyboardEvent) => {
            if (e.key === "Enter" && chatInput.value.trim() !== "") {
                const msg = chatInput.value.trim();
                const chatMessages = document.getElementById("chatMessages");
                if (chatMessages) {
                    const messageDiv = document.createElement("div");
                    messageDiv.textContent = `${msg}`;
                    chatMessages.appendChild(messageDiv);
                }
                
                this.socket?.emit("emit-chat-message", {
                    to: friendName,
                    msg: chatInput.value,
                    toId: friendId
                });
                
                chatInput.value = "";
                if (chatMessages) {
                    chatMessages.scrollTop = chatMessages.scrollHeight;
                }
            }
        };

        chatInput.removeEventListener("keydown", onSend);
        chatInput.addEventListener("keydown", onSend);
    }

    sendMessage(to: string, msg: string): void {
        this.socket?.emit("emit-chat-message", { to, msg });
    }

    disconnect(): void {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }
} 