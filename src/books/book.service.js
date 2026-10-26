import BookModel from "./book.schema.js";

export class BookService {
  async create(book) {
    const existingBook = await BookModel.findOne({ ISBN: book.ISBN });
    if (existingBook) {
      throw new Error("Book with this ISBN already exists");
    }
    return await BookModel.create(book);
  }

  async find() {
    return await BookModel.find().limit(500);
  }

  async findByTitle(title) {
    return await BookModel.find({ title: title });
  }

  async findByISBN(ISBN) {
    return await BookModel.findOne({ ISBN: ISBN });
  }

  async update(id, book) {
    const updatedBook = await BookModel.findByIdAndUpdate(id, book, {
      new: true,
    });
    return updatedBook;
  }

  async delete(id) {
    const deletedBook = await BookModel.findByIdAndDelete(id);
    return deletedBook;
  }
}
