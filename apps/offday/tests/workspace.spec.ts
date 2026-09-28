import {
  test,
  expect,
  request as api,
  type APIRequestContext,
} from "@playwright/test";
import { businessDays } from "../lib/types";
const password = "Test-only-password-2026";
const post = (client: APIRequestContext, data: Record<string, unknown>) =>
  client.post("/api/workspace", { data });

test("weekday calculations include boundaries and exclude weekends", () => {
  expect(businessDays("2026-10-02", "2026-10-05")).toBe(2);
  expect(businessDays("2026-10-03", "2026-10-04")).toBe(0);
  expect(businessDays("2026-10-05", "2026-10-05")).toBe(1);
});
test("anonymous mutations, cross-origin requests and invalid input are rejected", async ({
  request,
}) => {
  expect(
    (
      await post(request, {
        action: "settings",
        name: "Intruder",
        allowance: 10,
      })
    ).status(),
  ).toBe(401);
  expect(
    (
      await request.post("/api/workspace", {
        data: { action: "demo" },
        headers: { origin: "https://untrusted.example" },
      })
    ).status(),
  ).toBe(403);
  expect(
    (
      await post(request, {
        action: "register",
        email: "invalid",
        password: "x",
        name: "A",
        organization: "B",
      })
    ).status(),
  ).toBe(400);
});
test("organizations, invitations, employee permissions, approvals and login work end to end", async () => {
  const manager = await api.newContext({ baseURL: "http://localhost:3100" });
  const employee = await api.newContext({ baseURL: "http://localhost:3100" });
  const outsider = await api.newContext({ baseURL: "http://localhost:3100" });
  try {
    let response = await post(manager, {
      action: "register",
      name: "Morgan Manager",
      email: "manager@example.test",
      password,
      organization: "Test Studio",
    });
    expect(response.ok()).toBeTruthy();
    let state = (await response.json()).workspace;
    const managerEmployeeId = state.user.employeeId;
    expect(state.user.role).toBe("manager");
    expect(state.demo).toBe(false);
    expect(state.employees).toHaveLength(1);
    const cookie = (await manager.storageState()).cookies.find(
      (c) => c.name === "offday_session",
    );
    expect(cookie?.httpOnly).toBe(true);
    expect(cookie?.sameSite).toBe("Lax");
    response = await post(manager, {
      action: "addEmployee",
      name: "Taylor Employee",
      email: "employee@example.test",
      department: "Engineering",
      title: "Engineer",
      allowance: 10,
      role: "employee",
    });
    expect(response.ok()).toBeTruthy();
    const added = await response.json(),
      token = added.invitation;
    const employeeId = added.workspace.employees.find(
      (e: { email: string }) => e.email === "employee@example.test",
    ).id;
    response = await post(employee, {
      action: "acceptInvite",
      token,
      password,
    });
    expect(response.ok()).toBeTruthy();
    expect((await response.json()).workspace.user.role).toBe("employee");
    expect(
      (
        await post(outsider, { action: "acceptInvite", token, password })
      ).status(),
    ).toBe(400);
    expect(
      (
        await post(employee, {
          action: "settings",
          name: "Hijacked",
          allowance: 99,
        })
      ).status(),
    ).toBe(403);
    expect(
      (
        await post(employee, {
          action: "addEmployee",
          name: "Bad",
          email: "bad@example.test",
          department: "X",
          title: "X",
          allowance: 10,
          role: "manager",
        })
      ).status(),
    ).toBe(403);
    const leave = {
      action: "request",
      employeeId,
      type: "Vacation",
      start: "2027-01-04",
      end: "2027-01-08",
      note: "Private leave note",
    };
    expect(
      (
        await post(employee, { ...leave, employeeId: managerEmployeeId })
      ).status(),
    ).toBe(403);
    expect(
      (
        await post(employee, {
          ...leave,
          start: "2027-01-09",
          end: "2027-01-10",
        })
      ).status(),
    ).toBe(400);
    expect(
      (await post(employee, { ...leave, end: "2027-01-01" })).status(),
    ).toBe(400);
    expect(
      (await post(employee, { ...leave, end: "2028-01-01" })).status(),
    ).toBe(400);
    response = await post(employee, leave);
    expect(response.ok()).toBeTruthy();
    const leaveId = (await response.json()).workspace.requests[0].id;
    expect((await post(employee, leave)).status()).toBe(400);
    expect(
      (
        await post(employee, {
          ...leave,
          start: "2027-02-01",
          end: "2027-02-12",
        })
      ).status(),
    ).toBe(400);
    expect(
      (
        await post(employee, {
          action: "review",
          id: leaveId,
          status: "Approved",
        })
      ).status(),
    ).toBe(403);
    response = await post(outsider, {
      action: "register",
      name: "Other Manager",
      email: "other@example.test",
      password,
      organization: "Other Company",
    });
    expect(response.ok()).toBeTruthy();
    state = (await response.json()).workspace;
    expect(state.requests).toHaveLength(0);
    expect(state.employees).toHaveLength(1);
    expect(
      (
        await post(outsider, {
          action: "review",
          id: leaveId,
          status: "Approved",
        })
      ).status(),
    ).toBe(409);
    expect(
      (
        await post(outsider, {
          ...leave,
          start: "2027-03-01",
          end: "2027-03-02",
        })
      ).status(),
    ).toBe(404);
    response = await post(manager, {
      action: "review",
      id: leaveId,
      status: "Approved",
    });
    expect(response.ok()).toBeTruthy();
    expect((await response.json()).workspace.requests[0].status).toBe(
      "Approved",
    );
    expect(
      (
        await post(manager, {
          action: "review",
          id: leaveId,
          status: "Declined",
        })
      ).status(),
    ).toBe(409);
    expect(
      (await post(employee, { action: "cancel", id: leaveId })).status(),
    ).toBe(403);
    expect(
      (
        await post(employee, {
          action: "profile",
          name: "Taylor Updated",
          title: "Senior Engineer",
        })
      ).ok(),
    ).toBeTruthy();
    await post(employee, { action: "logout" });
    expect(
      (await (await employee.get("/api/workspace")).json()).authenticated,
    ).toBe(false);
    expect(
      (
        await post(employee, {
          action: "login",
          email: "employee@example.test",
          password: "incorrect",
        })
      ).status(),
    ).toBe(401);
    response = await post(employee, {
      action: "login",
      email: "employee@example.test",
      password,
    });
    expect(response.ok()).toBeTruthy();
    expect((await response.json()).workspace.user.name).toBe("Taylor Updated");
  } finally {
    await manager.dispose();
    await employee.dispose();
    await outsider.dispose();
  }
});
test("demo sessions have independent workspaces", async () => {
  const a = await api.newContext({ baseURL: "http://localhost:3100" }),
    b = await api.newContext({ baseURL: "http://localhost:3100" });
  try {
    const first = await (await post(a, { action: "demo" })).json();
    const second = await (await post(b, { action: "demo" })).json();
    expect(first.workspace.user.employeeId).not.toBe(
      second.workspace.user.employeeId,
    );
    await post(a, { action: "settings", name: "Changed demo", allowance: 30 });
    expect(
      (await (await b.get("/api/workspace")).json()).organization.name,
    ).toBe("Studio");
  } finally {
    await a.dispose();
    await b.dispose();
  }
});
