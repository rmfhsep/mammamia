import { PrismaClient, type QuestionCategory, type Difficulty } from "@prisma/client";
import questions from "../data/questions.json";

const prisma = new PrismaClient();

type SeedQuestion = {
  slug: string;
  category: QuestionCategory;
  difficulty: Difficulty;
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
};

async function main() {
  const data = questions as SeedQuestion[];

  for (const q of data) {
    await prisma.question.upsert({
      where: { slug: q.slug },
      create: q,
      update: q,
    });
  }

  console.log(`시드 완료: ${data.length}개 문제 upsert`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
