import {
  beforeAll,
  afterAll,
  describe,
  it,
  expect,
} from "@jest/globals";
import request from "supertest";
import path from "path";
import { fileURLToPath } from "url";
import BookModel from "../../src/books/book.schema.js";
import {
  getTestServer,
  teardownTestServer,
} from "../test-setup.js";
import { generateBooksToNDJSON } from "../../scripts/generateBooks.js";
import { importBooksFromNDJSON } from "../../scripts/populateBooks.js";

const numberOfBooks = 20;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const filePath = path.join(
  __dirname,
  "books-integration.ndjson"
);

const mockBook = {
  title: "Livro de Teste",
  author: "Autor Teste",
  ISBN: Date.now().toString(),
};

describe("Book Controller", () => {
  let testServer;

  beforeAll(async () => {
    testServer = await getTestServer();

    await generateBooksToNDJSON(
      filePath,
      numberOfBooks
    );

    await importBooksFromNDJSON(filePath);

    const count = await BookModel.countDocuments();

    console.log("Livros no banco:", count);
  });

  afterAll(async () => {
    await teardownTestServer();
  });

  /*
   * POST
   */
  describe("POST /books", () => {
    it("Deve criar um novo livro", async () => {
      const response = await request(testServer)
        .post("/books")
        .send(mockBook)
        .expect(201);

      expect(response.body.title).toBe(
        mockBook.title
      );

      expect(response.body.author).toBe(
        mockBook.author
      );

      expect(response.body.ISBN).toBe(
        mockBook.ISBN
      );

      const savedBook =
        await BookModel.findOne({
          ISBN: mockBook.ISBN,
        });

      expect(savedBook).toBeTruthy();

      expect(savedBook.title).toBe(
        mockBook.title
      );
    });

    it("Não deve criar um livro com ISBN duplicado", async () => {
      const bookData = {
        title: "Livro repetido",
        author: "Teste repetido",
        ISBN: mockBook.ISBN,
      };

      const response = await request(testServer)
        .post("/books")
        .send(bookData)
        .expect(400);

      expect(response.body.message).toBe(
        "Book with this ISBN already exists"
      );
    });
  });

  /*
   * GET
   */
  describe("GET /books", () => {
    it("Deve listar a primeira página de livros", async () => {
      const response = await request(testServer)
        .get("/books")
        .query({
          page: 1,
          limit: 10,
        })
        .expect(200);

      expect(response.body.data).toBeInstanceOf(
        Array
      );

      expect(response.body.data).toHaveLength(
        10
      );

      expect(
        response.body.pagination.page
      ).toBe(1);

      expect(
        response.body.pagination.limit
      ).toBe(10);

      expect(
        response.body.pagination
          .hasPreviousPage
      ).toBe(false);

      expect(
        response.body.pagination.hasNextPage
      ).toBe(true);
    });

    it("Deve retornar os dados da paginação corretamente", async () => {
      const limit = 10;

      const response = await request(testServer)
        .get("/books")
        .query({
          page: 1,
          limit,
        })
        .expect(200);

      const dbCount =
        await BookModel.countDocuments();

      expect(
        response.body.pagination.total
      ).toBe(dbCount);

      expect(
        response.body.pagination.totalPages
      ).toBe(
        Math.ceil(dbCount / limit)
      );

      expect(
        response.body.pagination.page
      ).toBe(1);

      expect(
        response.body.pagination.limit
      ).toBe(limit);

      expect(
        response.body.pagination
          .hasPreviousPage
      ).toBe(false);

      expect(
        response.body.pagination.hasNextPage
      ).toBe(dbCount > limit);
    });

    it("Deve listar a segunda página de livros", async () => {
      const response = await request(testServer)
        .get("/books")
        .query({
          page: 2,
          limit: 10,
        })
        .expect(200);

      expect(response.body.data).toBeInstanceOf(
        Array
      );

      expect(
        response.body.pagination.page
      ).toBe(2);

      expect(
        response.body.pagination.limit
      ).toBe(10);

      expect(
        response.body.pagination
          .hasPreviousPage
      ).toBe(true);
    });

    it("Deve retornar livros diferentes em páginas diferentes", async () => {
      const page1 = await request(testServer)
        .get("/books")
        .query({
          page: 1,
          limit: 10,
        })
        .expect(200);

      const page2 = await request(testServer)
        .get("/books")
        .query({
          page: 2,
          limit: 10,
        })
        .expect(200);

      expect(page1.body.data).toHaveLength(
        10
      );

      expect(page2.body.data).toHaveLength(
        10
      );

      const page1Ids =
        page1.body.data.map(
          (book) => book._id
        );

      const page2Ids =
        page2.body.data.map(
          (book) => book._id
        );

      page1Ids.forEach((id) => {
        expect(
          page2Ids
        ).not.toContain(id);
      });
    });

    it("Deve utilizar paginação padrão quando page e limit não forem informados", async () => {
      const response = await request(testServer)
        .get("/books")
        .expect(200);

      expect(response.body.data).toBeInstanceOf(
        Array
      );

      expect(
        response.body.pagination.page
      ).toBe(1);

      expect(
        response.body.pagination.limit
      ).toBe(20);
    });

    it("Deve listar livros com base no titulo", async () => {
      const response = await request(testServer)
        .get(`/books/${mockBook.title}`)
        .expect(200);

      expect(
        response.body[0].title
      ).toBe(mockBook.title);
    });

    it("Deve retornar 404 quando o livro não for encontrado pelo titulo", async () => {
      const response = await request(testServer)
        .get("/books/Não existe")
        .expect(404);

      expect(response.body.message).toBe(
        "Book not found"
      );
    });

    it("Deve listar um livro com base no ISBN", async () => {
      const response = await request(testServer)
        .get(
          `/books/isbn/${mockBook.ISBN}`
        )
        .expect(200);

      expect(response.body.title).toBe(
        mockBook.title
      );

      expect(response.body.ISBN).toBe(
        mockBook.ISBN
      );
    });

    it("Deve retornar 404 quando o livro não for encontrado pelo ISBN", async () => {
      const response = await request(testServer)
        .get(
          "/books/isbn/978-0-123456-78-9"
        )
        .expect(404);

      expect(response.body.message).toBe(
        "Book not found"
      );
    });
  });

  /*
   * PUT
   */
  describe("PUT /books/:id", () => {
    it("Deve atualizar um livro com base no ID", async () => {
      const bookToUpdate =
        await BookModel.findOne({
          ISBN: mockBook.ISBN,
        });

      const updatedData = {
        title: "Livro Atualizado",
        author: "Autor Atualizado",
      };

      const response = await request(testServer)
        .put(
          `/books/${bookToUpdate._id}`
        )
        .send(updatedData)
        .expect(200);

      expect(response.body.title).toBe(
        "Livro Atualizado"
      );

      expect(response.body.author).toBe(
        "Autor Atualizado"
      );
    });

    it("Deve retornar 404 quando o livro não for encontrado para atualizar", async () => {
      const response = await request(testServer)
        .put(
          "/books/6adf193d6eaa8e44849302a8"
        )
        .send({
          title: "Livro Inexistente",
        })
        .expect(404);

      expect(response.body.message).toBe(
        "Book not found"
      );
    });
  });

  /*
   * DELETE
   */
  describe("DELETE /books/:id", () => {
    it("Deve deletar um livro com base no ID", async () => {
      const bookToDelete =
        await BookModel.findOne({
          ISBN: mockBook.ISBN,
        });

      await request(testServer)
        .delete(
          `/books/${bookToDelete._id}`
        )
        .expect(204);

      const deletedBook =
        await BookModel.findById(
          bookToDelete._id
        );

      expect(deletedBook).toBeNull();
    });

    it("Deve retornar 404 quando o livro não for encontrado para deletar", async () => {
      const response = await request(testServer)
        .delete(
          "/books/6adf193d6eaa8e44849302a8"
        )
        .expect(404);

      expect(response.body.message).toBe(
        "Book not found"
      );
    });
  });
});