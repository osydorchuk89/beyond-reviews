import { PrismaClient } from "@prisma/client";
import { faker } from "@faker-js/faker";

const prisma = new PrismaClient();
const NUM_USERS = 5000;

const users = Array.from({ length: NUM_USERS }, (_, i) => ({
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    email: `user${i + 1}@example.com`,
    password: faker.internet.password(),
    photo: faker.image.avatar(),
}));

async function main() {
    await prisma.user.createMany({
        data: users,
        skipDuplicates: true, // in case you run it multiple times
    });
    console.log(`Seeded ${users.length} users`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
