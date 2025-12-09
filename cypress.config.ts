import { defineConfig } from "cypress";
import  * as dotenv  from 'dotenv'
import {FRONTEND_URL} from "./src/utils/constants";
dotenv.config()

export default defineConfig({
  e2e: {
    setupNodeEvents(_, config) {
      config.env = {
        ...config.env,
        auth0_domain: process.env.auth0_domain,
        AUTH0_USERNAME: process.env.AUTH0_USERNAME,
        AUTH0_PASSWORD: process.env.AUTH0_PASSWORD,
      }
      return config
    },
    experimentalStudio: true,
    baseUrl: FRONTEND_URL,
    defaultCommandTimeout: 10000,  // Increase from default 4000ms
    requestTimeout: 15000,          // Increase from default 5000ms
    responseTimeout: 15000,         // Increase from default 30000ms
  },
  viewportWidth: 1280,
  viewportHeight: 1024,
});
