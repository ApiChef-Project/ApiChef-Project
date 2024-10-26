import request from "supertest";
import app from "../app";
import { config } from "dotenv";
import connectMongoDB from "../config/connect.db.js";
import mongoose from "mongoose";
import { user1payload, user2payload } from "./mockData";

config();
const DB_URI = process.env.DB_URI || "mongodb://127.0.0.1:27017/TalentBridge";

let user1ID;
let newEmail = "new-email@gmail.com";

beforeAll(async () => {
	// connecting to mongoDB
	await connectMongoDB(DB_URI, false);
	// droping the database
	await mongoose.connection.dropDatabase();
	// creating an user
	const response = await request(app).post("/auth/signup").send(user1payload);
	user1ID = response.body._id;
});

afterAll(async () => {
	// closing the database
	await mongoose.connection.close();
});

describe("GET /", () => {
	it("responds with 200 status code", async () => {
		const response = await request(app).get("/");
		expect(response.statusCode).toBe(200);
	});
});

describe("GET /users", () => {
	it("return all users", async () => {
		let response = await request(app).get("/users");
		expect(response.statusCode).toBe(200);
		expect(response.body).toHaveLength(1);
		let usersCount = response.body.length;
		// adding another user
		await request(app)
			.post("/auth/signup")
			.send(user2payload)
			.set("Content-Type", "application/json");
		response = await request(app).get("/users");
		expect(response.body).toHaveLength(usersCount + 1);
	});
});

describe("GET /users/:id", () => {
	it("return an user by id", async () => {
		let response = await request(app).get(`/users/${user1ID}`);
		const payloadWithoutPassword = { ...user1payload };
		delete payloadWithoutPassword["password"];
		expect(response.statusCode).toBe(200);
		expect(response.body).toMatchObject(payloadWithoutPassword);
	});
});

describe("GET /users/:id", () => {
	it('return { error: "User not found" }', async () => {
		let response = await request(app).get(
			"/users/671956a76d4214c084a6d36b"
		);
		expect(response.statusCode).toBe(404);
		expect(response.body).toStrictEqual({ error: "User not found" });
	});
});

describe("GET /users/:id", () => {
	it('return { error: "Invalid User ID" }', async () => {
		let response = await request(app).get("/users/123");
		expect(response.statusCode).toBe(400);
		expect(response.body).toStrictEqual({ error: "Invalid User ID" });
	});
});

describe("PUT /users/:id", () => {
	it("update an user by id", async () => {
		let response = await request(app)
			.put(`/users/${user1ID}`)
			.send({ ...user1payload, email: newEmail });
		expect(response.statusCode).toBe(200);
		expect(response.body.email).toBe(newEmail);
	});
});

describe("DELETE /users/:id", () => {
	it("delete an user by id", async () => {
		let response = await request(app).get("/users");
		let usersCount = response.body.length;
		response = await request(app).delete(`/users/${user1ID}`);
		expect(response.statusCode).toBe(204);
		response = await request(app).get("/users");
		expect(response.body).toHaveLength(usersCount - 1);
	});
});
