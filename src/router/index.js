import { createRouter, createWebHistory } from "vue-router";
import NavLayout from "@/views/NavLayout.vue";
import Home from "@/views/Home.vue";
import Team from "@/views/Team.vue";
import Auction from "@/views/Auction.vue";
import Admin from "@/views/Admin.vue";
import { authGuard } from "@auth0/auth0-vue";
import { ROLES } from "@/roles";

const routes = [
  {
    path: "/", // You can make the path empty for the parent layout route
    component: NavLayout,
    children: [
      { path: "", name: "Home", component: Home },
      { path: "team", name: "Team", component: Team
        // , beforeEnter: authGuard
         },
      {
        path: "auction",
        name: "Auction",
        component: Auction,
        // beforeEnter: authGuard,
      },
      {
        path: "admin",
        name: "Admin",
        component: Admin,
        // beforeEnter: authGuard,
        meta: {
          requiresAuth: true,
          allowedRoles: [ROLES.ADMIN], // Only admins can access
        },
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
