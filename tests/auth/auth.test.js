import { getTestServer, teardownTestServer } from "../test-setup.js";
import User from "../../src/user/user.schema.js";
import request from "supertest";
import bcrypt from "bcrypt";

describe("Auth Controller", () => {
    let testUser;
    let testUserData;
    let testServer;

    beforeAll(async () => {
        testServer = await getTestServer();
        const timestamp = Date.now();
        testUserData = {
          username: `testeUser`,
          email: `testeuser@example.com`,
          password: "teste123",
        };

        const hashedPassword = await bcrypt.hash(testUserData.password, 10);
        testUser = await User.create({
            ...testUserData,
            password: hashedPassword,
        });
    });

    afterAll(async () => {
        await teardownTestServer();
    });

    describe("POST /auth/register", () => {
        it("Deve registrar um novo usuário", async () => {
            const newUser = {
                username: `novoUsuario`,
                email: `novousuario@example.com`,
                password: "newpass123",
            };

            const response = await request(testServer)
                .post("/auth/register")
                .send(newUser);

            expect(response.status).toBe(201);
            expect(response.body.username).toBe(newUser.username);
        });

        it("Deve falhar ao cadastrar com o username duplicado", async () => {
            const response = await request(testServer)
                .post("/auth/register")
                .send({
                    ...testUserData,
                    email: "emaildiferente@example.com",
                })
                .expect(400);

            expect(response.body.message).toMatch("Username already taken");
        }, 10000);

        it("Deve falhar ao cadastrar com o email duplicado", async () => {
            const response = await request(testServer)
                .post("/auth/register")
                .send({
                    ...testUserData,
                    username: "usernameDiferente",
                })
                .expect(400);

            expect(response.body.message).toMatch("Email already in use");
        }, 10000);
    
        it("Deve logar com credenciais validas", async () => {
            const findedUser = await User.findOne({ email: "novousuario@example.com" });

            const response = await request(testServer)
                .post("/auth/login")
                .send({
                    email: findedUser.email,
                    password: "newpass123",
                })
                .expect(200);

            expect(response.body.token).toBeDefined();
            expect(response.body.userId).toBe(findedUser._id.toString());
        });
        
        it("Deve falhar ao logar com credenciais invalidas", async () => {
            const response = await request(testServer)
                .post("/auth/login")
                .send({
                    email: testUserData.email,
                    password: "senhaerrada",
                })
                .expect(401);

            expect(response.body.message).toMatch("Invalid credentials");
        });
    });
});