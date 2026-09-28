import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import * as store from "@/lib/store";
export const runtime = "nodejs";
const text = z.string().trim().min(1).max(120);
const email = z.string().trim().toLowerCase().email().max(254);
const password = z
  .string()
  .min(10, "Use at least 10 characters for your password.")
  .max(128);
const date = z.iso
  .date()
  .refine(
    (value) => value >= "2000-01-01" && value <= "2100-12-31",
    "Choose a date between 2000 and 2100.",
  );
const schema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("register"),
    name: text,
    email,
    password,
    organization: text,
  }),
  z.object({
    action: z.literal("login"),
    email,
    password: z.string().min(1).max(128),
  }),
  z.object({ action: z.literal("demo") }),
  z.object({ action: z.literal("logout") }),
  z.object({
    action: z.literal("acceptInvite"),
    token: z.string().length(64),
    password,
  }),
  z.object({
    action: z.literal("addEmployee"),
    name: text,
    email,
    department: text,
    title: text,
    allowance: z.number().int().min(0).max(365),
    role: z.enum(["employee", "manager"]),
  }),
  z.object({ action: z.literal("renewInvite"), employeeId: text }),
  z.object({
    action: z.literal("request"),
    employeeId: text,
    type: z.enum(["Vacation", "Sick leave", "Personal"]),
    start: date,
    end: date,
    note: z.string().trim().max(1000),
  }),
  z.object({
    action: z.literal("review"),
    id: text,
    status: z.enum(["Approved", "Declined"]),
  }),
  z.object({ action: z.literal("cancel"), id: text }),
  z.object({ action: z.literal("profile"), name: text, title: text }),
  z.object({
    action: z.literal("settings"),
    name: text,
    allowance: z.number().int().min(0).max(365),
  }),
]);
export async function GET() {
  return NextResponse.json(await store.getWorkspace(), {
    headers: { "Cache-Control": "no-store" },
  });
}
export async function POST(request: NextRequest) {
  try {
    const origin = request.headers.get("origin");
    if (origin && new URL(origin).host !== request.headers.get("host"))
      throw new store.AppError("Request origin is not allowed.", 403);
    if (!request.headers.get("content-type")?.includes("application/json"))
      throw new store.AppError("Expected JSON.", 415);
    const raw = await request.text();
    if (raw.length > 12000)
      throw new store.AppError("Request is too large.", 413);
    let json: unknown;
    try {
      json = JSON.parse(raw);
    } catch {
      throw new store.AppError("Invalid JSON.");
    }
    const parsed = schema.safeParse(json);
    if (!parsed.success)
      throw new store.AppError(parsed.error.issues[0].message);
    const data = parsed.data;
    let invitation: string | undefined;
    if (["login", "register", "demo", "acceptInvite"].includes(data.action)) {
      // Set a trusted proxy header only at your reverse proxy; localhost uses a shared limit.
      const ip =
        process.env.TRUST_PROXY === "true"
          ? request.headers.get("x-forwarded-for")?.split(",")[0] || "local"
          : "local";
      store.rateLimit(`auth:${ip}:${data.action}`);
    }
    switch (data.action) {
      case "register":
        await store.register(data);
        break;
      case "login":
        await store.login(data.email, data.password);
        break;
      case "demo":
        if (!(await store.currentUser())) await store.startDemo();
        break;
      case "logout":
        await store.logout();
        break;
      case "acceptInvite":
        await store.acceptInvite(data.token, data.password);
        break;
      default: {
        const user = await store.requireUser();
        if (data.action === "addEmployee")
          invitation = store.addEmployee(user, data);
        if (data.action === "renewInvite")
          invitation = store.renewInvite(user, data.employeeId);
        if (data.action === "request") store.createRequest(user, data);
        if (data.action === "review")
          store.reviewRequest(user, data.id, data.status);
        if (data.action === "cancel") store.cancelRequest(user, data.id);
        if (data.action === "profile")
          store.updateProfile(user, data.name, data.title);
        if (data.action === "settings")
          store.updateSettings(user, data.name, data.allowance);
      }
    }
    return NextResponse.json(
      { workspace: await store.getWorkspace(), invitation },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (error instanceof store.AppError)
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    console.error("Workspace operation failed", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
