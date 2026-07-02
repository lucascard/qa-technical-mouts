import { faker } from "@faker-js/faker";

// cada teste cria sua própria massa (o banco do ServeRest reseta com frequência)
const criarUsuario = () => {
  const usuario = {
    nome: faker.person.firstName().toLowerCase(),
    email: faker.internet.email().toLowerCase(),
    password: faker.internet.password({ length: 10 }),
    administrador: "true",
  };

  return cy.env(["apiUrl"]).then(({ apiUrl }) =>
    cy.request("POST", `${apiUrl}/usuarios`, usuario).then((response) => {
      expect(response.status).to.eq(201);
      return { apiUrl, usuario };
    }),
  );
};

const obterToken = () =>
  criarUsuario().then(({ apiUrl, usuario }) =>
    cy
      .request("POST", `${apiUrl}/login`, {
        email: usuario.email,
        password: usuario.password,
      })
      .then((response) => {
        expect(response.status).to.eq(200);
        return { apiUrl, token: response.body.authorization };
      }),
  );

const criarProduto = () =>
  obterToken().then(({ apiUrl, token }) => {
    const produto = {
      nome: `${faker.commerce.productName()} ${faker.string.alphanumeric(5)}`,
      preco: 250,
      descricao: faker.commerce.productDescription(),
      quantidade: 10,
    };

    return cy
      .request({
        method: "POST",
        url: `${apiUrl}/produtos`,
        headers: { Authorization: token },
        body: produto,
      })
      .then((response) => {
        expect(response.status).to.eq(201);
        return { apiUrl, token, produto: { ...produto, id: response.body._id } };
      });
  });

describe("API - Produtos", () => {
  it("deve atualizar um produto com sucesso", () => {
    criarProduto().then(({ apiUrl, token, produto }) => {
      const produtoAtualizado = {
        nome: `${faker.commerce.productName()} ${faker.string.alphanumeric(5)}`,
        preco: 999,
        descricao: produto.descricao,
        quantidade: 55,
      };

      cy.request({
        method: "PUT",
        url: `${apiUrl}/produtos/${produto.id}`,
        headers: { Authorization: token },
        body: produtoAtualizado,
      }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body.message).to.eq("Registro alterado com sucesso");
      });

      cy.request(`${apiUrl}/produtos/${produto.id}`).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body.nome).to.eq(produtoAtualizado.nome);
        expect(response.body.preco).to.eq(produtoAtualizado.preco);
        expect(response.body.quantidade).to.eq(produtoAtualizado.quantidade);
      });

      // teardown
      cy.request({
        method: "DELETE",
        url: `${apiUrl}/produtos/${produto.id}`,
        headers: { Authorization: token },
      });
    });
  });

  it("deve excluir um produto com sucesso", () => {
    criarProduto().then(({ apiUrl, token, produto }) => {
      cy.request({
        method: "DELETE",
        url: `${apiUrl}/produtos/${produto.id}`,
        headers: { Authorization: token },
      }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body.message).to.eq("Registro excluído com sucesso");
      });

      cy.request({
        url: `${apiUrl}/produtos/${produto.id}`,
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.eq(400);
        expect(response.body.message).to.eq("Produto não encontrado");
      });
    });
  });

});

describe("API - Carrinhos", () => {
  it("deve criar um carrinho com sucesso", () => {
    criarProduto().then(({ apiUrl, token, produto }) => {
      cy.request({
        method: "POST",
        url: `${apiUrl}/carrinhos`,
        headers: { Authorization: token },
        body: { produtos: [{ idProduto: produto.id, quantidade: 2 }] },
      }).then((response) => {
        expect(response.status).to.eq(201);
        expect(response.body.message).to.eq("Cadastro realizado com sucesso");

        cy.request(`${apiUrl}/carrinhos/${response.body._id}`).then(
          (responseGet) => {
            expect(responseGet.status).to.eq(200);
            expect(responseGet.body.produtos[0].idProduto).to.eq(produto.id);
            expect(responseGet.body.produtos[0].quantidade).to.eq(2);
          },
        );
      });

      // teardown
      cy.request({
        method: "DELETE",
        url: `${apiUrl}/carrinhos/cancelar-compra`,
        headers: { Authorization: token },
      })
        .its("status")
        .should("eq", 200);
    });
  });
});
