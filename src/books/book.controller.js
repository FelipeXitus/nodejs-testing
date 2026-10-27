import { BookService } from "./book.service.js";

class BookController {
  async create(req, res) {
    try {
      const book = await new BookService().create(req.body);
      res.status(201).send(book);
    } catch (error) {
      res.status(400).send({ message: error.message });
    }
  }

  async find(req, res) {
    try {
      const { page = 1, limit = 20 } = req.query;

      const books = await new BookService().find(page, limit);

      res.status(200).send(books);
    } catch (error) {
      res.status(500).send({
        message: "Internal Server Error",
        error,
      });
    }
  }

  async findByTitle(req, res) {
    try {
      const book = await new BookService().findByTitle(req.params.title);
      if (!book || book.length === 0) {
        return res.status(404).send({ message: "Book not found" });
      }
      res.status(200).send(book);
    } catch (error) {
      res.status(500).send({ message: "Internal Server Error", error });
    }
  }

  async findByISBN(req, res) {
    try {
      const book = await new BookService().findByISBN(req.params.isbn);
      if (!book) {
        return res.status(404).send({ message: "Book not found" });
      }
      res.status(200).send(book);
    } catch (error) {
      res.status(500).send({ message: "Internal Server Error", error });
    }
  }

  async update(req, res) {
    try {
      const updatedBook = await new BookService().update(
        req.params.id,
        req.body
      );
      if (!updatedBook) {
        return res.status(404).send({ message: "Book not found" });
      }
      res.status(200).send(updatedBook);
    } catch (error) {
      res.status(400).send({ message: error.message });
    }
  }

  async delete(req, res) {
    try {
      const deletedBook = await new BookService().delete(req.params.id);
      if (!deletedBook) {
        return res.status(404).send({ message: "Book not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).send({ message: "Internal Server Error", error });
    }
  }
}

export default new BookController();
