import { createRouter, createWebHistory } from "vue-router";
import NavLayout from "@/views/NavLayout.vue";
import Home from "@/views/Home.vue";
import Team from "@/views/Team.vue";
import Auction from "@/views/Auction.vue";
import Admin from "@/views/Admin.vue";
import { authGuard } from "@auth0/auth0-vue";

// 1. Create the custom Admin checker
const adminGuard = (to, from, next) => {
  const auth0 = getInstance();

  // Look for the exact namespace you created in Auth0
  const userRoles = auth0.user.value["blind-fanta"] || [];

  if (userRoles.includes("Admin")) {
    next(); // They are an admin, let them in!
  } else {
    next("/"); // Not an admin? Kick them back to the home page
  }
};

const routes = [
  {
    path: "/", // You can make the path empty for the parent layout route
    component: NavLayout,
    children: [
      { path: "", name: "Home", component: Home },
      { path: "team", name: "Team", component: Team, beforeEnter: authGuard },
      {
        path: "auction",
        name: "Auction",
        component: Auction,
        beforeEnter: authGuard,
      },
      {
        path: "admin",
        name: "Admin",
        component: Admin,
        // Use an array to run authGuard FIRST (to ensure they are logged in),
        // and adminGuard SECOND (to ensure they have the right role)
        beforeEnter: [authGuard, adminGuard],
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
