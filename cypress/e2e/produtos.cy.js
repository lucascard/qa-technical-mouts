import { faker } from "@faker-js/faker";

describe("Produtos", () => {
  it("deve cadastrar um produto com sucesso", () => {
    cy.cadastrarUsuario({ admin: true }).then((usuario) => {
      cy.logout();
      cy.login(usuario.email, usuario.password);
    });

    cy.intercept("POST", "**/produtos").as("cadastrarProduto");

    cy.get('[data-testid="cadastrar-produtos"]').click();
    cy.url().should("include", "/admin/cadastrarprodutos");
    cy.contains("h1", "Cadastro de Produtos").should("be.visible");

    // a API não aceita produto com nome duplicado
    const nomeProduto = `${faker.commerce.productName()} ${faker.string.alphanumeric(5)}`;

    cy.get('[data-testid="nome"]').type(nomeProduto);
    cy.get('[data-testid="preco"]').type("250");
    cy.get('[data-testid="descricao"]').type(faker.commerce.productDescription());
    cy.get('[data-testid="quantity"]').type("10");
    // typo no testid é do próprio front
    cy.get('[data-testid="cadastarProdutos"]').click();

    cy.wait("@cadastrarProduto").its("response.statusCode").should("eq", 201);
    cy.url({ timeout: 10000 }).should("include", "/admin/listarprodutos");
    cy.contains(nomeProduto).should("be.visible");
  });

  it("deve adicionar um produto à lista de compras e seguir para o carrinho", () => {
    cy.cadastrarUsuario().then((usuario) => {
      cy.logout();
      cy.login(usuario.email, usuario.password);
    });

    cy.get('[data-testid="adicionarNaLista"]', { timeout: 10000 })
      .first()
      .click();

    cy.url().should("include", "/minhaListaDeProdutos");
    cy.contains("h1", "Lista de Compras").should("be.visible");

    cy.get('[data-testid="adicionar carrinho"]').click();

    cy.url().should("include", "/carrinho");
    cy.contains("h1", "Em construção aguarde").should("be.visible");
  });
});
