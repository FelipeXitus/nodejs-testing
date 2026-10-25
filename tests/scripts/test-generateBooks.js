import { test } from "node:test";
import assert from "node:assert";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { generateBooksToNDJSON } from "../../scripts/generateBooks.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function cleanUpFile(filePath) {
    try {
        await fs.unlink(filePath);
    } catch (err) {
        if (err.code !== "ENOENT") {
            throw err;
        }
    }
}

test('Deve gerar o numero correto de livros no arquivo NDJSON', async () => {
    const testFilePath = path.join(__dirname, "test-books.ndjson");
    const numberOfBooks = 100;

    await cleanUpFile(testFilePath);
    await generateBooksToNDJSON(testFilePath, numberOfBooks);

    const fileContent = await fs.readFile(testFilePath, "utf-8");
    const books = fileContent.trim().split("\n").map(line => JSON.parse(line));
    
    assert.strictEqual(books.length, numberOfBooks, `Deveria gerar ${numberOfBooks} livros no arquivo NDJSON`);
    await cleanUpFile(testFilePath);
});

test('Deve gerar um NDJSON válido', async () => {
    const testFilePath = path.join(__dirname, "test-books.ndjson");
    const numberOfBooks = 10;

    await cleanUpFile(testFilePath);
    await generateBooksToNDJSON(testFilePath, numberOfBooks);

    const fileContent = await fs.readFile(testFilePath, "utf-8");
    const books = fileContent.trim().split("\n");

    assert.ok(
        books.every((book) => book.startsWith("{")),
        "Todos os livros devem ser objetos JSON válidos"
    );

    books.forEach((book, index) => {
        assert.doesNotThrow(() => {
            JSON.parse(book);
        }, `O livro na linha ${index + 1} não é um objeto JSON válido`);
    });

    await cleanUpFile(testFilePath);
});

test('Deve gerar um erro ao tentar ler um arquivo inexistente', async () => {
    const testFilePath = path.join("/dev/invalid/non-existent-file.ndjson");

    await assert.rejects(() => generateBooksToNDJSON(testFilePath, 10), {
        name: "Error",
        message: /ENOENT|EACCES/
    });
}); 