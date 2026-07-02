import { faker } from "@faker-js/faker";

describe("Gestão de usuários", () => {
  it("deve cadastrar e excluir um usuário pelo painel administrativo", () => {
    cy.cadastrarUsuario({ admin: true }).then((usuario) => {
      cy.logout();
      cy.login(usuario.email, usuario.password);
      cy.wrap(usuario, { log: false }).as("usuarioLogado");
    });

    cy.intercept("POST", "**/usuarios").as("cadastrarNovoUsuario");

    cy.get('[data-testid="cadastrar-usuarios"]').click();
    cy.url().should("include", "/admin/cadastrarusuarios");
    cy.contains("h1", "Cadastro de usuários").should("be.visible");

    const novoUsuario = {
      nome: faker.person.firstName().toLowerCase(),
      email: faker.internet.email().toLowerCase(),
      password: faker.internet.password({ length: 10 }),
    };

    cy.get('[data-testid="nome"]').type(novoUsuario.nome);
    cy.get('[data-testid="email"]').type(novoUsuario.email);
    cy.get('[data-testid="password"]').type(novoUsuario.password);
    cy.get('[data-testid="cadastrarUsuario"]').click();

    cy.wait("@cadastrarNovoUsuario")
      .its("response.statusCode")
      .should("eq", 201);
    cy.url({ timeout: 10000 }).should("include", "/admin/listarusuarios");
    cy.contains("h1", "Lista dos usuários").should("be.visible");
    cy.contains("tr", novoUsuario.email, { timeout: 10000 }).should(
      "be.visible",
    );

    cy.intercept("DELETE", "**/usuarios/*").as("excluirUsuario");

    // o botão Excluir não tem data-testid
    cy.contains("tr", novoUsuario.email)
      .contains("button", "Excluir")
      .click();

    cy.wait("@excluirUsuario").its("response.statusCode").should("eq", 200);

    // o front recarrega a página após excluir
    cy.get("@usuarioLogado").then(({ email }) => {
      cy.contains("tr", email, { timeout: 10000 }).should("be.visible");
    });
    cy.contains("tr", novoUsuario.email).should("not.exist");
  });
});
