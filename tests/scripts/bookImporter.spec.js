import mongoose from "mongoose";
import { describe, it, before, after, beforeEach, afterEach} from "mocha";
import { expect } from "chai";
import sinon from "sinon";
import fs from "fs";
import { fileURLToPath } from "url";
import path from "path";
import BookModel from "../../src/books/book.schema.js";
import { generateBooksToNDJSON } from "../../scripts/generateBooks.js";
import { importBooksFromNDJSON } from "../../scripts/populateBooks.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let insertManySpy;

describe("Book Importer", () => {
    const mainFilePath = path.join(__dirname, "test-books.ndjson")
    const smallFileParth = path.join(__dirname, "test-small-books.ndjson")
    const mainNumberOfBooks = 100000
    const smallNumberOfBooks = 100

    const batchSize = 1000;
    const expectBatches = Math.ceil(mainNumberOfBooks / batchSize)

    before(async() => {
        await mongoose.connect("mongodb://localhost:27017/books_test")
        await generateBooksToNDJSON(mainFilePath, mainNumberOfBooks)
        await generateBooksToNDJSON(smallFileParth, smallNumberOfBooks)
    })

    after(async() => {
        await mongoose.connection.close()
        if (fs.existsSync(mainFilePath)) {
            fs.unlinkSync(mainFilePath);
        }
        if (fs.existsSync(smallFileParth)) {
            fs.unlinkSync(smallFileParth);
        }
    })

    beforeEach(async() => {
        await BookModel.deleteMany();
        insertManySpy = sinon.spy(BookModel, "insertMany")
    })

    afterEach(() => {
        insertManySpy.restore();
    })

    it("Deve chamar BookModel.insertMany um número correto de vezes",async function()
    {
        this.timeout(0);
        await importBooksFromNDJSON(mainFilePath,batchSize)
        console.log("Chamadas registradas pelo spy", insertManySpy.callCount);
        expect(insertManySpy.callCount).to.equal(expectBatches)
        
        const booksOnDb = await BookModel.countDocuments()
        expect(booksOnDb).to.equal(mainNumberOfBooks)
    });

    describe("Testes com número menor de livros", async() =>{
    
        it("Deve inserir apenas livros válidos", async() =>{
            const invalidBook = { title: "O Hobbit #14" }
            fs.appendFileSync(smallFileParth, JSON.stringify(invalidBook) + '\n')

            await importBooksFromNDJSON(smallFileParth, batchSize)

            const booksOnDb = await BookModel.countDocuments();
            expect(booksOnDb).to.equal(smallNumberOfBooks)

            const invalidBookonDb = (await BookModel.findOne({ title: "O Hobbit #14" }))
            expect(invalidBookonDb).to.be.null
        })
    })
})