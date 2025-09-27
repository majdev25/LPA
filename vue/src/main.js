import { createApp } from "vue";
import App from "./App.vue";

import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "./assets/fonts.css";
import "./style.scss";

import FontAwesomeIcon from "./fontAwesome.js";

const app = createApp(App);

app.component("FontAwesomeIcon", FontAwesomeIcon);

app.mount("#app");
