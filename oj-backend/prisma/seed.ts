import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, Difficulty } from "../src/generated/prisma/client";
import bcrypt from "bcryptjs";
import { problems } from "../data/problems";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not found");

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function seed() {
  await prisma.user.upsert({
    where: { id: "test-user-1" },
    update: {},
    create: {
      id: "test-user-1",
      username: "test-user-1",
      email: "user@example.com",
      password: await bcrypt.hash("password", 10),
    },
  });

  for (const problem of problems) {
    await prisma.question.upsert({
      where: { id: problem.id },
      update: {
        title: problem.title,
        statement: problem.statement,
        difficulty: problem.difficulty as Difficulty,
        examples: problem.examples,
        constraints: problem.constraints,
        tags: problem.tags || [],
      },
      create: {
        id: problem.id,
        title: problem.title,
        statement: problem.statement,
        difficulty: problem.difficulty as Difficulty,
        examples: problem.examples,
        constraints: problem.constraints,
        tags: problem.tags || [],
      },
    });

    await prisma.testCase.deleteMany({ where: { questionId: problem.id } });
    await prisma.testCase.createMany({
      data: problem.testCases.map((tc) => ({
        questionId: problem.id,
        input: tc.input,
        expectedOutput: tc.expectedOutput,
        order: tc.order,
        isHidden: tc.isHidden,
      })),
    });

    console.log(`${problem.title}`);
  }
}

async function main() {
  console.log(`Seeding ${problems.length} problems...`);
  await seed();
  console.log("Seeding complete.");
}

main()
  .catch((e) => {
    console.error("Seeding failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());