const { defineConfig } = require("cypress");

module.exports = defineConfig({
  allowCypressEnv: false,

  e2e: {
    baseUrl: "https://front.serverest.dev",
    specPattern: "cypress/{e2e,api}/**/*.cy.{js,jsx,ts,tsx}",
    video: false,
  },

  env: {
    apiUrl: "https://serverest.dev",
  },
});
