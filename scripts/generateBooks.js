import fs from "fs";
import { faker } from "@faker-js/faker";
import { pipeline } from "stream/promises";

export async function generateBooksToNDJSON(filePath, numberOfBooks) {
  const writeStream = fs.createWriteStream(filePath);
  
  await pipeline(
    generateBooks(numberOfBooks),
    writeStream
  );
}

async function* generateBooks(numberOfBooks) {
  for (let i = 0; i < numberOfBooks; i++) {
    yield JSON.stringify({
      title: faker.lorem.words(3),
      author: faker.person.fullName(),
      ISBN: faker.string.numeric(10),
    }) + "\n";
  }
}

//generateBooksToNDJSON("books.ndjson", 100000);