import { faker } from "@faker-js/faker";

// cadastra um usuário pela tela, o front já loga sozinho depois do cadastro
Cypress.Commands.add("cadastrarUsuario", ({ admin = false } = {}) => {
  const usuario = {
    nome: faker.person.firstName().toLowerCase(),
    email: faker.internet.email().toLowerCase(),
    password: faker.internet.password({ length: 10 }),
  };

  cy.intercept("POST", "**/usuarios").as("cadastrarUsuario");
  cy.intercept("POST", "**/login").as("loginAutomatico");

  cy.visit("/cadastrarusuarios");
  cy.get('[data-testid="nome"]').type(usuario.nome);
  cy.get('[data-testid="email"]').type(usuario.email);
  cy.get('[data-testid="password"]').type(usuario.password);
  if (admin) {
    cy.get('[data-testid="checkbox"]').check();
  }
  cy.get('[data-testid="cadastrar"]').click();

  cy.wait("@cadastrarUsuario").its("response.statusCode").should("eq", 201);
  cy.wait("@loginAutomatico", { timeout: 30000 });
  cy.url({ timeout: 10000 }).should("include", admin ? "/admin/home" : "/home");

  return cy.wrap(usuario, { log: false });
});

Cypress.Commands.add("logout", () => {
  cy.get('[data-testid="logout"]').click();
  cy.url().should("include", "/login");
});

Cypress.Commands.add("login", (email, password) => {
  cy.intercept("POST", "**/login").as("login");

  cy.visit("/login");
  cy.get('[data-testid="email"]').type(email);
  cy.get('[data-testid="senha"]').type(password);
  cy.get('[data-testid="entrar"]').click();

  cy.wait("@login", { timeout: 30000 })
    .its("response.statusCode")
    .should("eq", 200);
  cy.url({ timeout: 10000 }).should("include", "/home");
});
