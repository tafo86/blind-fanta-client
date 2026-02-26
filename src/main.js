import "bootstrap/dist/css/bootstrap.min.css";
import "./assets/main.css";
import "bootstrap";

import { createApp} from "vue";
import App from "./App.vue";
import router from "@/router";
import { createAuth0 } from "@auth0/auth0-vue";

const app = createApp(App).use(router);

app.use(
  createAuth0({
    domain: import.meta.env.VITE_AUTH0_DOMAIN,
    clientId: import.meta.env.VITE_AUTH0_CLIENT_ID,
    authorizationParams: {
      redirect_uri: window.location.origin,
      scope: "openid profile email",
    },
    onRedirectCallback: async (appState) => {
      // This line is what actually takes the user from the
      // Auth0 "callback" URL to your actual "/auction" page
      appState && appState.target ? appState.target : window.location.pathname;
    },
  })
);

app.mount("#app");
