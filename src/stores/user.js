import { readonly, ref } from "vue";
import axios from "axios";
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
let userSocket = ref(null);
let reconnectIntervalSeconds = 2;
const currentUser = ref(null);
const userTeam = ref(null);
const noTeam = ref(false);

const players_by_role = ref({
  goalkeepers: [],
  defenders: [],
  midfielders: [],
  strikers: [],
});

export function useUser() {
  const setCurrentUser = (user) => {
    if (!user) return;
    // 1. Prepare the complete data object first
    const userData = {
      ...user, // All original properties (id, email, budget)
      messages: [], // Ensure this is an empty reactive array
      isAdmin: user.email === "admin@gmail.com", // Set the boolean
    };
    currentUser.value = userData;
    setupSocket(user.id);
  };

  const clearUser = () => {
    currentUser.value = null;
    userTeam.value = null;
    if (userSocket.value) {
      userSocket.value.close(); // Need .value here
    }
  };

  const sortPlayersByRole = (playerList) => {
    // Reset categories to prevent duplicates
    players_by_role.value = {
      goalkeepers: [],
      defenders: [],
      midfielders: [],
      strikers: [],
    };

    if (!playerList?.length) return;

    const roleMap = {
      P: "goalkeepers",
      D: "defenders",
      C: "midfielders",
      A: "strikers",
    };

    playerList.forEach((player) => {
      const category = roleMap[player.role];
      if (category) players_by_role.value[category].push(player);
    });
  };

  const fetchTeamData = async () => {
    // 1. Safety check
    if (!currentUser.value?.id) return;

    try {
      // 3. Get the Team by User ID
      const teamRes = await axios.get(
        `${BACKEND_URL}/team/user/${currentUser.value.id}`,
      );

      if (teamRes.status === 200 && teamRes.data?.id) {
        userTeam.value = teamRes.data;
        noTeam.value = false;

        // 4. Get the Players for that specific Team ID
        const playersRes = await axios.get(
          `${BACKEND_URL}/team/${userTeam.value.id}/players`,
        );

        if (playersRes.status === 200) {
          userTeam.value.players = playersRes.data;
          sortPlayersByRole(playersRes.data);
        }
      } else {
        noTeam.value = true;
      }
    } catch (error) {
      console.error("Team sync failed:", error);
      noTeam.value = true;
    }
  };

  return {
    currentUser, // This is the ref itself
    team: readonly(userTeam),
    noTeam: readonly(noTeam),
    players_by_role: readonly(players_by_role),
    userSocket: readonly(userSocket), // Now the component can see the socket
    setCurrentUser,
    clearUser,
    fetchTeamData,
  };
}

const setupSocket = (userId) => {
  // 1. Detect if we are on https (ngrok) or http (localhost)
  const isSecure = window.location.protocol === "https:";
  const protocol = isSecure ? "wss:" : "ws:";

  // 2. Use the current host (localhost:5173 or ngrok-url)
  const host = window.location.host;

  // 3. Connect to the PROXY path (/ws-api)
  const socketUrl = `${protocol}//${host}/ws-api/admin/ws/${userId}`;

  console.log("Connecting to:", socketUrl);

  const socket = new WebSocket(socketUrl);

  socket.onerror = (err) => console.error("❌ WebSocket Error:", err);

  socket.addEventListener("open", (event) => {
    reconnectIntervalSeconds = 2;
    console.log("✅ WebSocket Connected!");
    userSocket.value = socket;
  });

  socket.addEventListener("close", (event) => {
    userSocket.value = null;
    setTimeout(() => setupSocket(userId), reconnectIntervalSeconds * 1000);
    reconnectIntervalSeconds = Math.min(reconnectIntervalSeconds * 2, 30);
  });

  socket.addEventListener("message", (event) => {
    const data = JSON.parse(event.data);
    if (currentUser.value) {
      currentUser.value.messages = [data];
      // Debugging: check this in your console
      console.log("Socket message received and state replaced:", data);
    }
  });
};

export const authenticatedUser = {
  auth0_id: "auth0|6953f6eb46dac7b969c75186",
  email: "atafi86@gmail.com",
  id: 3,
  budget: 500,
};

export const adminUser = {
  auth0_id: "auth0|6953f6eb46dac7b969c75333",
  email: "admin@gmail.com",
  id: 0,
  budget: 500,
};
