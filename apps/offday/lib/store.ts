import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import {
  createHash,
  randomBytes,
  randomUUID,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";
import { cookies } from "next/headers";
import {
  businessDays,
  previewWorkspace,
  type Employee,
  type Leave,
  type Workspace,
} from "./types";

const dbPath = resolve(
  /* turbopackIgnore: true */ process.env.DATABASE_PATH || "data/offday.db",
);
mkdirSync(dirname(dbPath), { recursive: true });
const db = new Database(dbPath);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");
db.exec(`
CREATE TABLE IF NOT EXISTS organizations (id TEXT PRIMARY KEY, name TEXT NOT NULL, allowance INTEGER NOT NULL DEFAULT 25, demo INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS employees (id TEXT PRIMARY KEY, org_id TEXT NOT NULL REFERENCES organizations(id), name TEXT NOT NULL, email TEXT NOT NULL, department TEXT NOT NULL, title TEXT NOT NULL, allowance INTEGER NOT NULL, color INTEGER NOT NULL, UNIQUE(org_id,email));
CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, org_id TEXT NOT NULL REFERENCES organizations(id), employee_id TEXT NOT NULL REFERENCES employees(id), email TEXT NOT NULL UNIQUE, password TEXT NOT NULL, role TEXT NOT NULL CHECK(role IN ('manager','employee')));
CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), expires INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS invitations (token TEXT PRIMARY KEY, employee_id TEXT NOT NULL REFERENCES employees(id), org_id TEXT NOT NULL REFERENCES organizations(id), role TEXT NOT NULL, expires INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS requests (id TEXT PRIMARY KEY, org_id TEXT NOT NULL REFERENCES organizations(id), employeeId TEXT NOT NULL REFERENCES employees(id), type TEXT NOT NULL, start TEXT NOT NULL, end TEXT NOT NULL, note TEXT NOT NULL, status TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS attempts (key TEXT PRIMARY KEY, count INTEGER NOT NULL, expires INTEGER NOT NULL);
`);
const hash = (value: string) =>
  createHash("sha256").update(value).digest("hex");
function passwordHash(password: string) {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}
function passwordMatches(password: string, stored: string) {
  const [salt, key] = stored.split(":");
  return timingSafeEqual(
    scryptSync(password, salt, 64),
    Buffer.from(key, "hex"),
  );
}
export class AppError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
export function rateLimit(key: string) {
  const now = Date.now();
  db.prepare("DELETE FROM attempts WHERE expires < ?").run(now);
  const row = db.prepare("SELECT count FROM attempts WHERE key=?").get(key) as
    { count: number } | undefined;
  if (row && row.count >= 12)
    throw new AppError(
      "Too many attempts. Please try again in 15 minutes.",
      429,
    );
  db.prepare(
    "INSERT INTO attempts(key,count,expires) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1",
  ).run(key, now + 15 * 60 * 1000);
}
type User = {
  id: string;
  org_id: string;
  employee_id: string;
  email: string;
  password: string;
  role: "manager" | "employee";
};
export async function currentUser() {
  const token = (await cookies()).get("offday_session")?.value;
  if (!token) return undefined;
  return db
    .prepare(
      "SELECT u.* FROM users u JOIN sessions s ON s.user_id=u.id WHERE s.token=? AND s.expires>?",
    )
    .get(hash(token), Date.now()) as User | undefined;
}
async function setSession(userId: string) {
  const token = randomBytes(32).toString("hex");
  db.prepare("DELETE FROM sessions WHERE expires < ?").run(Date.now());
  db.prepare("INSERT INTO sessions VALUES(?,?,?)").run(
    hash(token),
    userId,
    Date.now() + 7 * 86400000,
  );
  (await cookies()).set("offday_session", token, {
    httpOnly: true,
    secure:
      process.env.NODE_ENV === "production" &&
      process.env.COOKIE_SECURE !== "false",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 86400,
  });
}
export async function logout() {
  const jar = await cookies(),
    token = jar.get("offday_session")?.value;
  if (token) db.prepare("DELETE FROM sessions WHERE token=?").run(hash(token));
  jar.delete("offday_session");
}
export async function getWorkspace(): Promise<Workspace> {
  const user = await currentUser();
  if (!user) return previewWorkspace();
  const org = db
    .prepare("SELECT * FROM organizations WHERE id=?")
    .get(user.org_id) as { name: string; allowance: number; demo: number };
  const employees = db
    .prepare(
      "SELECT id,name,email,department,title,allowance,color FROM employees WHERE org_id=? ORDER BY rowid",
    )
    .all(user.org_id) as Employee[];
  const self = employees.find((e) => e.id === user.employee_id)!;
  const requests = db
    .prepare(
      "SELECT id,employeeId,type,start,end,note,status FROM requests WHERE org_id=? ORDER BY start",
    )
    .all(user.org_id) as Leave[];
  // Coworkers can see availability, but private notes are only for managers and the requester.
  if (user.role === "employee")
    requests.forEach((r) => {
      if (r.employeeId !== user.employee_id) r.note = "";
    });
  return {
    organization: { name: org.name, allowance: org.allowance },
    user: {
      name: self.name,
      email: user.email,
      title: self.title,
      role: user.role,
      employeeId: self.id,
    },
    employees,
    requests,
    demo: !!org.demo,
    authenticated: true,
  };
}
export async function register(input: {
  name: string;
  email: string;
  password: string;
  organization: string;
}) {
  if (db.prepare("SELECT id FROM users WHERE email=?").get(input.email))
    throw new AppError(
      "An account already exists for this email. Sign in instead.",
    );
  const org = randomUUID(),
    employee = randomUUID(),
    user = randomUUID();
  const encoded = passwordHash(input.password);
  db.transaction(() => {
    db.prepare("INSERT INTO organizations(id,name) VALUES(?,?)").run(
      org,
      input.organization,
    );
    db.prepare("INSERT INTO employees VALUES(?,?,?,?,?,?,?,?)").run(
      employee,
      org,
      input.name,
      input.email,
      "People",
      "Workspace owner",
      25,
      0,
    );
    db.prepare("INSERT INTO users VALUES(?,?,?,?,?,?)").run(
      user,
      org,
      employee,
      input.email,
      encoded,
      "manager",
    );
  })();
  await setSession(user);
}
export async function login(email: string, password: string) {
  const user = db.prepare("SELECT * FROM users WHERE email=?").get(email) as
    User | undefined;
  const fallback = "0".repeat(32) + ":" + "0".repeat(128);
  const matches = passwordMatches(password, user?.password || fallback);
  if (!user || !matches)
    throw new AppError("Email or password is incorrect.", 401);
  await setSession(user.id);
}
export async function startDemo() {
  const seed = previewWorkspace(),
    org = randomUUID(),
    user = randomUUID();
  const employeeIds = new Map(seed.employees.map((e) => [e.id, randomUUID()]));
  db.transaction(() => {
    db.prepare("INSERT INTO organizations VALUES(?,?,?,1)").run(
      org,
      "Studio",
      25,
    );
    for (const e of seed.employees)
      db.prepare("INSERT INTO employees VALUES(?,?,?,?,?,?,?,?)").run(
        employeeIds.get(e.id),
        org,
        e.name,
        e.email,
        e.department,
        e.title,
        e.allowance,
        e.color,
      );
    db.prepare("INSERT INTO users VALUES(?,?,?,?,?,?)").run(
      user,
      org,
      employeeIds.get("e1"),
      `demo-${org}@offday.local`,
      passwordHash(randomBytes(32).toString("hex")),
      "manager",
    );
    for (const r of seed.requests)
      db.prepare("INSERT INTO requests VALUES(?,?,?,?,?,?,?,?)").run(
        randomUUID(),
        org,
        employeeIds.get(r.employeeId),
        r.type,
        r.start,
        r.end,
        r.note,
        r.status,
      );
  })();
  await setSession(user);
}
export async function requireUser() {
  const user = await currentUser();
  if (!user) throw new AppError("Please sign in to continue.", 401);
  return user;
}
export function requireManager(user: User) {
  if (user.role !== "manager")
    throw new AppError("Only managers can do this.", 403);
}
export function addEmployee(
  user: User,
  input: {
    name: string;
    email: string;
    department: string;
    title: string;
    allowance: number;
    role: "manager" | "employee";
  },
) {
  requireManager(user);
  if (
    db
      .prepare("SELECT id FROM employees WHERE org_id=? AND email=?")
      .get(user.org_id, input.email) ||
    db.prepare("SELECT id FROM users WHERE email=?").get(input.email)
  )
    throw new AppError("This email already has an employee or account.");
  const id = randomUUID(),
    token = randomBytes(32).toString("hex");
  db.transaction(() => {
    db.prepare("INSERT INTO employees VALUES(?,?,?,?,?,?,?,?)").run(
      id,
      user.org_id,
      input.name,
      input.email,
      input.department,
      input.title,
      input.allowance,
      Math.floor(Math.random() * 6),
    );
    db.prepare("INSERT INTO invitations VALUES(?,?,?,?,?)").run(
      hash(token),
      id,
      user.org_id,
      input.role,
      Date.now() + 7 * 86400000,
    );
  })();
  return token;
}
export async function acceptInvite(token: string, password: string) {
  const invitation = db
    .prepare(
      "SELECT i.*,e.email FROM invitations i JOIN employees e ON e.id=i.employee_id WHERE i.token=? AND i.expires>?",
    )
    .get(hash(token), Date.now()) as
    | { employee_id: string; org_id: string; role: string; email: string }
    | undefined;
  if (!invitation)
    throw new AppError(
      "This invitation has expired or has already been used. Ask your manager for a new link.",
    );
  if (db.prepare("SELECT id FROM users WHERE email=?").get(invitation.email))
    throw new AppError("This account already exists. Please sign in.");
  const id = randomUUID(),
    encoded = passwordHash(password);
  db.transaction(() => {
    db.prepare("INSERT INTO users VALUES(?,?,?,?,?,?)").run(
      id,
      invitation.org_id,
      invitation.employee_id,
      invitation.email,
      encoded,
      invitation.role,
    );
    db.prepare("DELETE FROM invitations WHERE token=?").run(hash(token));
  })();
  await setSession(id);
}
export function renewInvite(user: User, employeeId: string) {
  requireManager(user);
  if (
    !db
      .prepare("SELECT id FROM employees WHERE id=? AND org_id=?")
      .get(employeeId, user.org_id)
  )
    throw new AppError("Employee not found.", 404);
  if (db.prepare("SELECT id FROM users WHERE employee_id=?").get(employeeId))
    throw new AppError("This employee already activated their account.");
  const token = randomBytes(32).toString("hex");
  const previous = db
    .prepare("SELECT role FROM invitations WHERE employee_id=?")
    .get(employeeId) as { role: string } | undefined;
  db.transaction(() => {
    db.prepare("DELETE FROM invitations WHERE employee_id=?").run(employeeId);
    db.prepare("INSERT INTO invitations VALUES(?,?,?,?,?)").run(
      hash(token),
      employeeId,
      user.org_id,
      previous?.role || "employee",
      Date.now() + 7 * 86400000,
    );
  })();
  return token;
}
export function createRequest(
  user: User,
  input: {
    employeeId: string;
    type: Leave["type"];
    start: string;
    end: string;
    note: string;
  },
) {
  if (user.role !== "manager" && input.employeeId !== user.employee_id)
    throw new AppError("You can only request your own time off.", 403);
  const employee = db
    .prepare("SELECT * FROM employees WHERE id=? AND org_id=?")
    .get(input.employeeId, user.org_id) as Employee | undefined;
  if (!employee) throw new AppError("Employee not found.", 404);
  if (
    input.start > input.end ||
    input.start.slice(0, 4) !== input.end.slice(0, 4)
  )
    throw new AppError(
      "Choose an end date after the start date, within the same calendar year.",
    );
  const days = businessDays(input.start, input.end);
  if (days === 0)
    throw new AppError("Choose at least one working day (Monday–Friday).");
  const requests = db
    .prepare(
      "SELECT * FROM requests WHERE org_id=? AND employeeId=? AND status!='Declined'",
    )
    .all(user.org_id, input.employeeId) as Leave[];
  if (requests.some((r) => r.start <= input.end && r.end >= input.start))
    throw new AppError("This employee already has a request on these dates.");
  const used = requests
    .filter(
      (r) =>
        r.type === "Vacation" &&
        r.start.slice(0, 4) === input.start.slice(0, 4),
    )
    .reduce((sum, r) => sum + businessDays(r.start, r.end), 0);
  if (input.type === "Vacation" && used + days > employee.allowance)
    throw new AppError(
      `Only ${Math.max(0, employee.allowance - used)} vacation days remain for that year, including pending requests.`,
    );
  db.prepare("INSERT INTO requests VALUES(?,?,?,?,?,?,?,?)").run(
    randomUUID(),
    user.org_id,
    input.employeeId,
    input.type,
    input.start,
    input.end,
    input.note,
    "Pending",
  );
}
export function reviewRequest(
  user: User,
  id: string,
  status: "Approved" | "Declined",
) {
  requireManager(user);
  const result = db
    .prepare(
      "UPDATE requests SET status=? WHERE id=? AND org_id=? AND status='Pending'",
    )
    .run(status, id, user.org_id);
  if (!result.changes)
    throw new AppError(
      "This request was already reviewed or could not be found.",
      409,
    );
}
export function cancelRequest(user: User, id: string) {
  const result = db
    .prepare(
      "DELETE FROM requests WHERE id=? AND org_id=? AND employeeId=? AND status='Pending'",
    )
    .run(id, user.org_id, user.employee_id);
  if (!result.changes)
    throw new AppError("Only your own pending requests can be canceled.", 403);
}
export function updateProfile(user: User, name: string, title: string) {
  db.prepare("UPDATE employees SET name=?,title=? WHERE id=? AND org_id=?").run(
    name,
    title,
    user.employee_id,
    user.org_id,
  );
}
export function updateSettings(user: User, name: string, allowance: number) {
  requireManager(user);
  db.prepare("UPDATE organizations SET name=?,allowance=? WHERE id=?").run(
    name,
    allowance,
    user.org_id,
  );
}
