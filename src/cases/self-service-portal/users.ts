import { faker } from "@faker-js/faker";
import type { Option, User } from "@/cases/self-service-portal/types";

/** Fixed so the same 24 people come back on every build. Chromatic diffs pixels, and
    a fresh set of names on each regeneration would read as a change to the design. */
const SEED = 20_240_922;

const COUNT = 24;

const JOB_TITLES = [
  "Design Engineer",
  "Software Engineer",
  "Mechanical Engineer",
  "Project Manager",
  "Systems Engineer",
  "Human Factors Specialist",
];

function nextUser(taken: Set<string>): User {
  const givenName = faker.person.firstName();
  const surname = faker.person.lastName();

  const stem = `${givenName.charAt(0)}${surname.charAt(0)}`.toUpperCase();
  let initials = stem;
  let suffix = 1;
  while (taken.has(initials)) {
    suffix += 1;
    initials = `${stem}${suffix}`;
  }
  taken.add(initials);

  return {
    id: faker.string.uuid(),
    givenName,
    surname,
    displayName: `${givenName} ${surname}`,
    initials,
    email: `${givenName}.${surname}@example.invalid`.toLowerCase(),
    jobTitle: faker.helpers.arrayElement(JOB_TITLES),
  };
}

function buildUsers(): [User, ...User[]] {
  faker.seed(SEED);

  const taken = new Set<string>();
  const users: [User, ...User[]] = [nextUser(taken)];
  while (users.length < COUNT) users.push(nextUser(taken));

  return users;
}

export const users: [User, ...User[]] = buildUsers();

/** The shape the page's user endpoint returns, mapped for react-select. */
export const userOptions: Option[] = users.map((u) => ({
  label: u.displayName,
  value: u.initials,
}));

export const currentUser: User = users[0];
