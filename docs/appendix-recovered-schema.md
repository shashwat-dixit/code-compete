# Appendix — Recovered 2024 schema

Source: commit `044ecee` (`Prisma Model and seed data`). This is **reference only**. Do not copy it forward unchanged. The current target model is in [04 Data model](./04-data-model.md).

## What to keep

- `User` with unique username/email and `rating` default 1200
- `Question` → rename to `Problem` with time/memory limits and difficulty
- `Submission` statuses (AC/WA/TLE/MLE/RE/CE)
- `TestResult` as optional per-test rows
- `RatingHistory` as an append-only audit log

## What to change

- Rating must hang off **matches**, not `(user, question, submission)`
- Test cases must not be a JSON blob on the problem row (leakage + weak typing)
- Add `matches`, `match_players`, `auth_identities`
- Drop `UserQuestionProgress` until practice mode exists
- `s3CodeUrl` is optional later; store code in Postgres first

## Prisma schema (historical)

```prisma
enum Difficulty {
    EASY
    MEDIUM
    HARD
}

enum SubmissionStatus {
    PENDING
    RUNNING
    ACCEPTED
    WRONG_ANSWER
    TIME_LIMIT_EXCEEDED
    MEMORY_LIMIT_EXCEEDED
    RUNTIME_ERROR
    COMPILATION_ERROR
}

enum QuestionProgressStatus {
    NOT_STARTED
    ATTEMPTED
    SOLVED
}

model User {
    id        String   @id @default(uuid()) @db.Uuid
    username  String   @unique
    email     String   @unique
    rating    Int      @default(1200)
    createdAt DateTime @default(now())
    updatedAt DateTime @updatedAt

    submissions   Submission[]
    progress      UserQuestionProgress[]
    ratingHistory RatingHistory[]

    @@index([rating])
}

model Question {
    id          String     @id @default(uuid()) @db.Uuid
    title       String
    description String
    difficulty  Difficulty
    categories  String[]
    testCases   Json
    timeLimit   Int // milliseconds
    memoryLimit Int // megabytes
    createdAt   DateTime   @default(now())
    updatedAt   DateTime   @updatedAt

    submissions   Submission[]
    progress      UserQuestionProgress[]
    RatingHistory RatingHistory[]

    @@index([difficulty])
    @@index([categories])
}

model Submission {
    id         String           @id @default(uuid()) @db.Uuid
    userId     String           @db.Uuid
    questionId String           @db.Uuid
    code       String           @db.Text
    language   String
    status     SubmissionStatus
    runtime    Int?
    memory     Int?
    s3CodeUrl  String?
    createdAt  DateTime         @default(now())

    user          User            @relation(fields: [userId], references: [id])
    question      Question        @relation(fields: [questionId], references: [id])
    testResults   TestResult[]
    RatingHistory RatingHistory[]

    @@index([userId])
    @@index([questionId])
    @@index([status])
    @@index([createdAt])
}

model TestResult {
    id             String  @id @default(uuid()) @db.Uuid
    submissionId   String  @db.Uuid
    testCaseNumber Int
    passed         Boolean
    output         String? @db.Text
    errorMessage   String? @db.Text
    executionTime  Int?
    memoryUsed     Int?

    submission Submission @relation(fields: [submissionId], references: [id])

    @@index([submissionId])
}

model UserQuestionProgress {
    id            String                 @id @default(uuid()) @db.Uuid
    userId        String                 @db.Uuid
    questionId    String                 @db.Uuid
    status        QuestionProgressStatus @default(NOT_STARTED)
    attemptCount  Int                    @default(0)
    bestRuntime   Int?
    bestMemory    Int?
    lastAttemptAt DateTime?

    user     User     @relation(fields: [userId], references: [id])
    question Question @relation(fields: [questionId], references: [id])

    @@unique([userId, questionId])
}

model RatingHistory {
    id           String   @id @default(uuid()) @db.Uuid
    userId       String   @db.Uuid
    questionId   String   @db.Uuid
    submissionId String   @db.Uuid
    oldRating    Int
    newRating    Int
    ratingChange Int
    createdAt    DateTime @default(now())

    user       User       @relation(fields: [userId], references: [id])
    question   Question   @relation(fields: [questionId], references: [id])
    submission Submission @relation(fields: [submissionId], references: [id])
}
```

## Seed notes

The seed created 50 users, 100 random questions, and 20 submissions/user with faker text as “code”. That is useless for a judge. Replacement: 3–5 hand-written problems with real fixtures in git.

## Other recovered bits

- Frontend routes: `/`, `/compete`, `/problems`, `/rankings`, `/login`, `/user` (note: navbar linked `/profile` while the router used `/user`)
- Clerk was the auth SDK
- Socket.IO was a dependency; no match protocol was implemented
- CDK sketched per-language SQS + Fargate workers (`javascript`, `java`, `cpp`, `golang`)
- Languages in seed: `javascript`, `python`, `java`, `cpp`, `golang`
