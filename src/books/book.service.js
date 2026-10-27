import BookModel from "./book.schema.js";

export class BookService {
  async create(book) {
    const existingBook = await BookModel.findOne({ ISBN: book.ISBN });
    if (existingBook) {
      throw new Error("Book with this ISBN already exists");
    }
    return await BookModel.create(book);
  }

    async find(page = 1, limit = 20) {
    page = Math.max(Number(page) || 1, 1);
    limit = Math.min(Math.max(Number(limit) || 20, 1), 100);

    const skip = (page - 1) * limit;

    const [books, total] = await Promise.all([
      BookModel.find()
        .sort({ _id: 1 })
        .skip(skip)
        .limit(limit),
      BookModel.countDocuments()
    ]);

    return {
      data: books,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPreviousPage: page > 1
      }
    };
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
