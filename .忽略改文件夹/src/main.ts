import "uno.css";
import "./Assets/main.css";
import "github-markdown-css/github-markdown-light.css"
import { createApp } from "vue";


import App from './App.vue';
import ArcoVue from '@arco-design/web-vue';
import '@arco-design/web-vue/dist/arco.css';


createApp(App)
  .use(ArcoVue)
  .mount('#app');

// import Editor from "./Editor.vue";
// createApp(Editor).mount("#app")
