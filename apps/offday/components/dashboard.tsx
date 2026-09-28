"use client";

import {
  useEffect,
  useRef,
  useState,
  useId,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  CalendarBlank,
  Users,
  ClipboardText,
  GearSix,
  CaretDown,
  CaretLeft,
  CaretRight,
  Plus,
  ArrowUpRight,
  ArrowRight,
  Check,
  X,
  MagnifyingGlass,
  SignOut,
  Sun,
  Clock,
  AirplaneTilt,
  User,
  Buildings,
  List,
  Copy,
  CheckCircle,
  EnvelopeSimple,
  ShieldCheck,
} from "@phosphor-icons/react";
import {
  businessDays,
  dateKey,
  type Workspace,
  type Employee,
  type Leave,
} from "@/lib/types";

type Page = "Calendar" | "Requests" | "Employees" | "My profile" | "Settings";
type Modal = "request" | "employee" | "login" | "register" | "invite" | null;
const initials = (name: string) =>
  name
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("");
const prettyDate = (date: string) =>
  new Date(`${date}T12:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
const range = (r: Leave) =>
  r.start === r.end
    ? prettyDate(r.start)
    : `${prettyDate(r.start)} – ${prettyDate(r.end)}`;
const leaveClass = (type: string) =>
  type === "Vacation"
    ? "vacation"
    : type === "Sick leave"
      ? "sick"
      : "personal";
function Avatar({
  employee,
  small = false,
}: {
  employee: Pick<Employee, "name" | "color">;
  small?: boolean;
}) {
  return (
    <span className={`avatar color-${employee.color} ${small ? "small" : ""}`}>
      {initials(employee.name)}
    </span>
  );
}
function Button({
  children,
  onClick,
  primary = false,
  disabled = false,
  type = "button",
  className = "",
}: {
  children: ReactNode;
  onClick?: () => void;
  primary?: boolean;
  disabled?: boolean;
  type?: "button" | "submit";
  className?: string;
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`button ${primary ? "primary" : ""} ${className}`}
    >
      {children}
    </button>
  );
}
function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}
function ModalShell({
  title,
  subtitle,
  children,
  close,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  close: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    dialog.current?.showModal();
    const el = dialog.current;
    return () => el?.close();
  }, []);
  return (
    <dialog
      ref={dialog}
      aria-labelledby={titleId}
      className="modal"
      onCancel={close}
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div className="modal-head">
        <div>
          <h2 id={titleId}>{title}</h2>
          <p>{subtitle}</p>
        </div>
        <button
          className="icon-button"
          aria-label="Close dialog"
          onClick={close}
        >
          <X size={20} />
        </button>
      </div>
      {children}
    </dialog>
  );
}

export default function Dashboard({ initial }: { initial: Workspace }) {
  const [workspace, setWorkspace] = useState(initial),
    [page, setPage] = useState<Page>("Calendar"),
    [modal, setModal] = useState<Modal>(null);
  const [month, setMonth] = useState(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  );
  const [department, setDepartment] = useState("All departments"),
    [search, setSearch] = useState(""),
    [statusFilter, setStatusFilter] = useState("All requests");
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [toast, setToast] = useState(""),
    [inviteToken, setInviteToken] = useState(""),
    [inviteLink, setInviteLink] = useState(""),
    [mobileNav, setMobileNav] = useState(false),
    [selected, setSelected] = useState<Leave | null>(null);
  const [selectedDay, setSelectedDay] = useState("");
  const manager = workspace.user.role === "manager";
  const today = dateKey(new Date());
  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("invite");
    if (token) {
      setInviteToken(token);
      setModal("invite");
    }
  }, []);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 4500);
    return () => clearTimeout(timer);
  }, [toast]);
  const employees = workspace.employees;
  const employeeById = (id: string) => employees.find((e) => e.id === id)!;
  const pending = workspace.requests.filter(
    (r) =>
      r.status === "Pending" &&
      (manager || r.employeeId === workspace.user.employeeId),
  );
  const filteredEmployees = employees.filter(
    (e) =>
      (department === "All departments" || e.department === department) &&
      `${e.name} ${e.email} ${e.department}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  const visibleRequests = workspace.requests.filter(
    (r) =>
      filteredEmployees.some((e) => e.id === r.employeeId) &&
      r.status !== "Declined",
  );
  const outToday = workspace.requests.filter(
    (r) => r.status === "Approved" && r.start <= today && r.end >= today,
  );
  const upcoming = workspace.requests
    .filter((r) => r.status === "Approved" && r.end >= today)
    .sort((a, b) => a.start.localeCompare(b.start));
  const departments = [...new Set(employees.map((e) => e.department))];
  async function send(payload: Record<string, unknown>) {
    const response = await fetch("/api/workspace", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok)
      throw new Error(data.error || "Unable to save. Please try again.");
    setWorkspace(data.workspace);
    return data as { workspace: Workspace; invitation?: string };
  }
  async function act(
    payload: Record<string, unknown>,
    success: string,
    close = false,
  ) {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const result = await send(payload);
      if (result.invitation) {
        setInviteLink(`${window.location.origin}/?invite=${result.invitation}`);
      }
      if (close) setModal(null);
      setToast(success);
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      return false;
    } finally {
      setBusy(false);
    }
  }
  async function ensureDemo() {
    if (workspace.authenticated) return true;
    setBusy(true);
    setError("");
    try {
      await send({ action: "demo" });
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    } finally {
      setBusy(false);
    }
  }
  async function openForm(next: Modal, day = "") {
    if (next === "employee" || next === "request") {
      if (!(await ensureDemo())) return;
    }
    setSelectedDay(day);
    setError("");
    setModal(next);
  }
  function navigate(next: Page) {
    setPage(next);
    setSearch("");
    setDepartment("All departments");
    setError("");
    setMobileNav(false);
  }
  async function submit(event: FormEvent<HTMLFormElement>, action: string) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    const payload: Record<string, unknown> = { action, ...values };
    if ("allowance" in payload) payload.allowance = Number(payload.allowance);
    if (action === "acceptInvite") payload.token = inviteToken;
    const saved = await act(
      payload,
      action === "request"
        ? "Time-off request submitted."
        : action === "addEmployee"
          ? "Employee added. Share their invitation link."
          : action === "login"
            ? "Welcome back."
            : action === "register"
              ? "Your workspace is ready."
              : action === "acceptInvite"
                ? "You’re in! Welcome to your team."
                : "Changes saved.",
      true,
    );
    if (saved && action === "acceptInvite")
      window.history.replaceState({}, "", "/");
  }
  async function review(r: Leave, status: "Approved" | "Declined") {
    if (!workspace.authenticated) {
      setBusy(true);
      setError("");
      try {
        const result = await send({ action: "demo" });
        const person = result.workspace.employees.find(
          (e) => e.email === employeeById(r.employeeId).email,
        );
        const request = result.workspace.requests.find(
          (item) =>
            item.employeeId === person?.id &&
            item.start === r.start &&
            item.end === r.end &&
            item.type === r.type,
        );
        if (!request)
          throw new Error("Request could not be found. Please try again.");
        await send({ action: "review", id: request.id, status });
        setSelected(null);
        setToast(`Request ${status.toLowerCase()}.`);
      } catch (e) {
        setSelected(null);
        setError((e as Error).message);
      } finally {
        setBusy(false);
      }
      return;
    }
    await act(
      { action: "review", id: r.id, status },
      `Request ${status.toLowerCase()}.`,
    );
    setSelected(null);
  }
  const self = employeeById(workspace.user.employeeId);
  const used = workspace.requests
    .filter(
      (r) =>
        r.employeeId === self?.id &&
        r.status === "Approved" &&
        r.type === "Vacation" &&
        r.start.startsWith(String(new Date().getFullYear())),
    )
    .reduce((sum, r) => sum + businessDays(r.start, r.end), 0);
  const navItems: { name: Page; icon: typeof CalendarBlank }[] = [
    { name: "Calendar", icon: CalendarBlank },
    { name: "Requests", icon: ClipboardText },
    { name: "Employees", icon: Users },
    { name: "My profile", icon: User },
  ];
  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileNav ? "nav-open" : ""}`}>
        <a className="brand" href="/" aria-label="Offday home">
          <span className="brand-symbol">
            <Sun size={26} weight="bold" />
          </span>
          offday<span className="brand-period">.</span>
        </a>
        <button
          className="workspace-switch"
          onClick={() => navigate("Settings")}
        >
          <span className="workspace-logo">
            {workspace.organization.name[0]}
          </span>
          <span>
            <strong>{workspace.organization.name}</strong>
            <small>Team workspace</small>
          </span>
          <CaretDown size={14} />
        </button>
        <div className="nav-caption">WORKSPACE</div>
        <nav aria-label="Main navigation">
          {navItems.map(({ name, icon: Icon }) => (
            <button
              key={name}
              className={`nav-item ${page === name ? "active" : ""}`}
              onClick={() => navigate(name)}
            >
              <Icon size={20} weight={page === name ? "fill" : "regular"} />
              <span>{name === "Calendar" ? "Team calendar" : name}</span>
              {name === "Requests" && pending.length > 0 && (
                <b className="nav-count">{pending.length}</b>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="breathing-room">
            <Sun size={25} />
            <strong>Good work needs time off.</strong>
            <p>A little room to recharge goes a long way.</p>
            <span>Make space for it.</span>
          </div>
          <button
            className={`nav-item ${page === "Settings" ? "active" : ""}`}
            onClick={() => navigate("Settings")}
          >
            <GearSix size={20} />
            <span>Workspace settings</span>
          </button>
          <button className="account" onClick={() => navigate("My profile")}>
            <Avatar
              employee={self || { name: workspace.user.name, color: 0 }}
            />
            <span>
              <strong>{workspace.user.name}</strong>
              <small>{manager ? "Workspace admin" : "Team member"}</small>
            </span>
            <CaretDown size={14} />
          </button>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="icon-button mobile-menu"
              aria-label="Toggle navigation"
              onClick={() => setMobileNav(!mobileNav)}
            >
              <List size={22} />
            </button>
            <Buildings size={17} />
            <span>Workspace</span>
            <span className="slash">/</span>
            <strong>{page === "Calendar" ? "Team calendar" : page}</strong>
          </div>
          <div className="top-actions">
            {workspace.demo && (
              <span className="demo-label">Demo workspace</span>
            )}
            {!workspace.authenticated || workspace.demo ? (
              <button className="text-button" onClick={() => openForm("login")}>
                Sign in <ArrowUpRight size={15} />
              </button>
            ) : (
              <button
                className="icon-button"
                aria-label="Sign out"
                onClick={() => act({ action: "logout" }, "Signed out.")}
              >
                <SignOut size={19} />
              </button>
            )}
            <Avatar
              employee={self || { name: workspace.user.name, color: 0 }}
              small
            />
          </div>
        </header>
        <main>
          <div className="page-heading">
            <div>
              <div className="heading-kicker">A little space for time off</div>
              <h1>
                {page === "Calendar"
                  ? "Your team, in sync."
                  : page === "Requests"
                    ? "Time off, taken care of."
                    : page === "Employees"
                      ? "Good people. Great team."
                      : page === "My profile"
                        ? "Your space to recharge."
                        : "Make yourself at home."}
              </h1>
              <p>
                {page === "Calendar"
                  ? "See who’s away, plan ahead, and keep the good work flowing."
                  : page === "Requests"
                    ? "A clear view of every request, from first plans to final approval."
                    : page === "Employees"
                      ? "Everyone in your workspace, all in one place."
                      : page === "My profile"
                        ? "Manage your profile and keep an eye on your time off."
                        : "A few thoughtful defaults for your team’s time off."}
              </p>
            </div>
            {page === "Employees" && manager ? (
              <Button
                primary
                onClick={() => openForm("employee")}
                disabled={busy}
              >
                <Plus size={17} />
                Add employee
              </Button>
            ) : (
              page !== "Settings" && (
                <Button
                  primary
                  onClick={() => openForm("request")}
                  disabled={busy}
                >
                  <Plus size={17} />
                  Request time off
                </Button>
              )
            )}
          </div>
          {error && !modal && (
            <div className="error-banner" role="alert">
              {error}
              <button
                className="icon-button"
                aria-label="Dismiss error"
                onClick={() => setError("")}
              >
                <X />
              </button>
            </div>
          )}
          {inviteLink && (
            <div className="invitation-banner">
              <EnvelopeSimple size={22} />
              <div>
                <strong>Your employee’s invitation is ready</strong>
                <p>
                  Share this private, single-use link. It expires in 7 days.
                </p>
                <input
                  aria-label="Invitation link"
                  readOnly
                  value={inviteLink}
                />
              </div>
              <Button
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(inviteLink);
                    setToast("Invitation copied.");
                  } catch {
                    setToast("Select and copy the invitation link.");
                  }
                }}
              >
                <Copy size={16} />
                Copy link
              </Button>
              <button
                className="icon-button"
                aria-label="Dismiss invitation"
                onClick={() => setInviteLink("")}
              >
                <X />
              </button>
            </div>
          )}
          {page === "Calendar" && (
            <>
              <div className="overview">
                <div className="overview-item">
                  <span className="stat-icon rose">
                    <Sun size={21} />
                  </span>
                  <div>
                    <span>Out today</span>
                    <strong>
                      {outToday.length}
                      <small>
                        {outToday.length === 1
                          ? "teammate recharging"
                          : "teammates recharging"}
                      </small>
                    </strong>
                  </div>
                  <div className="avatar-stack">
                    {outToday.slice(0, 3).map((r) => (
                      <Avatar
                        key={r.id}
                        employee={employeeById(r.employeeId)}
                        small
                      />
                    ))}
                  </div>
                </div>
                <div className="overview-item">
                  <span className="stat-icon amber">
                    <Clock size={21} />
                  </span>
                  <div>
                    <span>Pending requests</span>
                    <strong>
                      {pending.length}
                      <small>
                        {manager
                          ? "waiting for a little attention"
                          : "awaiting review"}
                      </small>
                    </strong>
                  </div>
                  <button
                    className="icon-button"
                    aria-label="View pending requests"
                    onClick={() => {
                      navigate("Requests");
                      setStatusFilter("Pending");
                    }}
                  >
                    <ArrowUpRight size={20} />
                  </button>
                </div>
                <div className="overview-item">
                  <span className="stat-icon mint">
                    <Users size={21} />
                  </span>
                  <div>
                    <span>Your team</span>
                    <strong>
                      {employees.length}
                      <small>people, one workspace</small>
                    </strong>
                  </div>
                  <button
                    className="icon-button"
                    aria-label="View employees"
                    onClick={() => navigate("Employees")}
                  >
                    <ArrowUpRight size={20} />
                  </button>
                </div>
              </div>
              <div className="calendar-layout">
                <section className="calendar-panel">
                  <div className="calendar-toolbar">
                    <div className="month-control">
                      <h2>
                        {month.toLocaleDateString("en-US", {
                          month: "long",
                          year: "numeric",
                        })}
                      </h2>
                      <div>
                        <button
                          className="icon-button"
                          aria-label="Previous month"
                          onClick={() =>
                            setMonth(
                              new Date(
                                month.getFullYear(),
                                month.getMonth() - 1,
                                1,
                              ),
                            )
                          }
                        >
                          <CaretLeft size={16} />
                        </button>
                        <button
                          className="icon-button"
                          aria-label="Next month"
                          onClick={() =>
                            setMonth(
                              new Date(
                                month.getFullYear(),
                                month.getMonth() + 1,
                                1,
                              ),
                            )
                          }
                        >
                          <CaretRight size={16} />
                        </button>
                      </div>
                      <button
                        className="today-button"
                        onClick={() =>
                          setMonth(
                            new Date(
                              new Date().getFullYear(),
                              new Date().getMonth(),
                              1,
                            ),
                          )
                        }
                      >
                        Today
                      </button>
                    </div>
                    <select
                      aria-label="Filter calendar by department"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                    >
                      <option>All departments</option>
                      {departments.map((d) => (
                        <option key={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                  <Calendar
                    month={month}
                    requests={visibleRequests}
                    employees={employees}
                    today={today}
                    onSelect={setSelected}
                    onDay={(day) => openForm("request", day)}
                  />
                  <div className="calendar-footer">
                    <div className="legend">
                      <span>
                        <i className="vacation" />
                        Vacation
                      </span>
                      <span>
                        <i className="sick" />
                        Sick leave
                      </span>
                      <span>
                        <i className="personal" />
                        Personal
                      </span>
                      <span>
                        <i className="pending-dot" />
                        Pending
                      </span>
                    </div>
                    <span>Weekends don’t count toward PTO</span>
                  </div>
                </section>
                <aside className="right-panel">
                  <section className="request-panel">
                    <div className="section-title">
                      <h2>
                        {manager
                          ? "Needs your attention"
                          : "Your pending requests"}
                      </h2>
                      <span className="number-badge">{pending.length}</span>
                    </div>
                    {pending.length === 0 ? (
                      <div className="empty-small">
                        <CheckCircle size={28} />
                        <strong>You’re all caught up.</strong>
                        <p>No pending requests right now.</p>
                      </div>
                    ) : (
                      pending.slice(0, 3).map((r) => (
                        <div className="pending-card" key={r.id}>
                          <div className="person-line">
                            <Avatar
                              employee={employeeById(r.employeeId)}
                              small
                            />
                            <div>
                              <strong>{employeeById(r.employeeId).name}</strong>
                              <span>
                                {r.type} · {businessDays(r.start, r.end)}{" "}
                                {businessDays(r.start, r.end) === 1
                                  ? "day"
                                  : "days"}
                              </span>
                            </div>
                          </div>
                          <div className="request-dates">
                            <CalendarBlank size={14} />
                            {range(r)}
                          </div>
                          {manager ? (
                            <div className="review-actions">
                              <button
                                disabled={busy}
                                onClick={() => review(r, "Approved")}
                              >
                                <Check size={15} />
                                Approve
                              </button>
                              <button
                                disabled={busy}
                                aria-label={`Decline ${employeeById(r.employeeId).name}'s request`}
                                onClick={() => review(r, "Declined")}
                              >
                                <X size={15} />
                              </button>
                            </div>
                          ) : (
                            <span className="status Pending">
                              Awaiting approval
                            </span>
                          )}
                        </div>
                      ))
                    )}
                    <button
                      className="panel-link"
                      onClick={() => navigate("Requests")}
                    >
                      View all requests <ArrowRight size={15} />
                    </button>
                  </section>
                  <section className="upcoming-panel">
                    <div className="section-title">
                      <h2>Coming up</h2>
                      <Sun size={18} />
                    </div>
                    {upcoming.slice(0, 3).map((r) => (
                      <button
                        className="upcoming-row"
                        key={r.id}
                        onClick={() => setSelected(r)}
                      >
                        <Avatar employee={employeeById(r.employeeId)} small />
                        <div>
                          <strong>{employeeById(r.employeeId).name}</strong>
                          <span>{range(r)}</span>
                        </div>
                        <span className={`leave-dot ${leaveClass(r.type)}`} />
                      </button>
                    ))}
                    {!upcoming.length && (
                      <p className="muted">
                        Nothing planned yet. A blank calendar has possibilities.
                      </p>
                    )}
                  </section>
                  <div className="little-note">
                    <AirplaneTilt size={25} />
                    <p>Time off is time well spent.</p>
                    <span>Help your team make the most of it.</span>
                  </div>
                </aside>
              </div>
            </>
          )}
          {page === "Employees" && (
            <section className="data-panel">
              <div className="table-toolbar">
                <h2>
                  Everyone{" "}
                  <span className="number-badge">{employees.length}</span>
                </h2>
                <div className="filters">
                  <label className="search">
                    <MagnifyingGlass size={17} />
                    <input
                      aria-label="Search employees"
                      placeholder="Search your team…"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </label>
                  <select
                    aria-label="Department"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                  >
                    <option>All departments</option>
                    {departments.map((d) => (
                      <option key={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Department</th>
                      <th>Annual allowance</th>
                      <th>Vacation remaining</th>
                      {manager && <th>Account</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEmployees.map((e) => {
                      const taken = workspace.requests
                        .filter(
                          (r) =>
                            r.employeeId === e.id &&
                            r.type === "Vacation" &&
                            r.status === "Approved" &&
                            r.start.startsWith(
                              String(new Date().getFullYear()),
                            ),
                        )
                        .reduce((s, r) => s + businessDays(r.start, r.end), 0);
                      return (
                        <tr key={e.id}>
                          <td>
                            <div className="person-line">
                              <Avatar employee={e} />
                              <div>
                                <strong>{e.name}</strong>
                                <span>{e.email}</span>
                              </div>
                            </div>
                          </td>
                          <td>
                            <strong>{e.department}</strong>
                            <small>{e.title}</small>
                          </td>
                          <td>{e.allowance} days</td>
                          <td>
                            <strong>
                              {Math.max(0, e.allowance - taken)} days
                            </strong>
                          </td>
                          {manager && (
                            <td>
                              {e.id === workspace.user.employeeId ? (
                                <span className="muted">You</span>
                              ) : (
                                <button
                                  className="text-button"
                                  disabled={busy}
                                  onClick={async () => {
                                    if (!workspace.authenticated) {
                                      await ensureDemo();
                                      return;
                                    }
                                    await act(
                                      {
                                        action: "renewInvite",
                                        employeeId: e.id,
                                      },
                                      "Invitation ready.",
                                    );
                                  }}
                                >
                                  Get invite link <ArrowUpRight size={14} />
                                </button>
                              )}
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {!filteredEmployees.length && (
                <Empty
                  title="No teammates found"
                  text="Try another search or add your first employee."
                />
              )}
            </section>
          )}
          {page === "Requests" && (
            <section className="data-panel">
              <div className="table-toolbar">
                <div className="segmented">
                  {["All requests", "Pending", "Approved", "Declined"].map(
                    (s) => (
                      <button
                        className={s === statusFilter ? "selected" : ""}
                        key={s}
                        onClick={() => setStatusFilter(s)}
                      >
                        {s}
                      </button>
                    ),
                  )}
                </div>
                <span className="muted">
                  {manager
                    ? "Manage your team’s time off"
                    : "Your time-off requests"}
                </span>
              </div>
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Time off</th>
                      <th>Dates</th>
                      <th>Days</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {workspace.requests
                      .filter(
                        (r) =>
                          (manager ||
                            r.employeeId === workspace.user.employeeId) &&
                          (statusFilter === "All requests" ||
                            r.status === statusFilter),
                      )
                      .map((r) => (
                        <tr key={r.id}>
                          <td>
                            <div className="person-line">
                              <Avatar
                                employee={employeeById(r.employeeId)}
                                small
                              />
                              <strong>{employeeById(r.employeeId).name}</strong>
                            </div>
                          </td>
                          <td>{r.type}</td>
                          <td>
                            <button
                              className="text-button"
                              onClick={() => setSelected(r)}
                            >
                              {range(r)}
                            </button>
                          </td>
                          <td>{businessDays(r.start, r.end)}</td>
                          <td>
                            <span className={`status ${r.status}`}>
                              {r.status}
                            </span>
                          </td>
                          <td>
                            {r.status === "Pending" &&
                              (manager ? (
                                <div className="row-actions">
                                  <button
                                    className="icon-button"
                                    aria-label={`Approve ${employeeById(r.employeeId).name}'s request`}
                                    disabled={busy}
                                    onClick={() => review(r, "Approved")}
                                  >
                                    <Check size={18} />
                                  </button>
                                  <button
                                    className="icon-button"
                                    aria-label={`Decline ${employeeById(r.employeeId).name}'s request`}
                                    disabled={busy}
                                    onClick={() => review(r, "Declined")}
                                  >
                                    <X size={18} />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  className="text-button"
                                  disabled={busy}
                                  onClick={() =>
                                    act(
                                      { action: "cancel", id: r.id },
                                      "Request canceled.",
                                    )
                                  }
                                >
                                  Cancel
                                </button>
                              ))}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
              {!workspace.requests.some(
                (r) =>
                  (manager || r.employeeId === workspace.user.employeeId) &&
                  (statusFilter === "All requests" ||
                    r.status === statusFilter),
              ) && (
                <Empty
                  title="A little breathing room"
                  text="No requests here yet. Plan your next break with Request time off."
                />
              )}
            </section>
          )}
          {page === "My profile" && (
            <div className="profile-layout">
              <section className="form-panel" key={workspace.user.employeeId}>
                <div className="profile-heading">
                  <Avatar employee={self} />
                  <div>
                    <h2>{workspace.user.name}</h2>
                    <p>{workspace.user.email}</p>
                  </div>
                  <span className="status Approved">
                    {manager ? "Manager" : "Employee"}
                  </span>
                </div>
                <form onSubmit={(e) => submit(e, "profile")}>
                  <h3>Personal details</h3>
                  <Field label="Full name">
                    <input
                      name="name"
                      required
                      maxLength={120}
                      defaultValue={workspace.user.name}
                    />
                  </Field>
                  <Field label="Job title">
                    <input
                      name="title"
                      required
                      maxLength={120}
                      defaultValue={workspace.user.title}
                    />
                  </Field>
                  <Field label="Work email">
                    <input value={workspace.user.email} disabled readOnly />
                  </Field>
                  <p className="helper">
                    Your work email connects you to{" "}
                    {workspace.organization.name}.
                  </p>
                  <Button
                    primary
                    type="submit"
                    disabled={busy || !workspace.authenticated}
                  >
                    {busy ? "Saving…" : "Save changes"}
                  </Button>
                  {!workspace.authenticated && (
                    <button
                      type="button"
                      className="text-button inline-link"
                      onClick={() => ensureDemo()}
                    >
                      Enter demo to edit your profile <ArrowRight />
                    </button>
                  )}
                </form>
              </section>
              <section className="balance-panel">
                <Sun size={30} />
                <h2>Your time to recharge</h2>
                <div className="balance-number">
                  {Math.max(0, (self?.allowance || 0) - used)}
                  <span>days available</span>
                </div>
                <div className="balance-line">
                  <span>Annual vacation allowance</span>
                  <strong>{self?.allowance} days</strong>
                </div>
                <div className="balance-line">
                  <span>Approved vacation</span>
                  <strong>{used} days</strong>
                </div>
                <p>
                  For {new Date().getFullYear()}. Pending requests reserve days
                  when you submit another request. Weekends are excluded.
                </p>
                <Button onClick={() => openForm("request")}>
                  Plan a little time off <ArrowUpRight size={16} />
                </Button>
              </section>
            </div>
          )}
          {page === "Settings" && (
            <section className="form-panel settings-panel">
              <div className="section-title">
                <h2>Workspace details</h2>
                <Buildings size={22} />
              </div>
              <p className="muted">
                The essentials for {workspace.organization.name}.
              </p>
              <form onSubmit={(e) => submit(e, "settings")}>
                <Field label="Organization name">
                  <input
                    name="name"
                    defaultValue={workspace.organization.name}
                    maxLength={120}
                    required
                    disabled={!manager}
                  />
                </Field>
                <Field label="Default annual vacation allowance">
                  <div className="input-suffix">
                    <input
                      type="number"
                      name="allowance"
                      min={0}
                      max={365}
                      defaultValue={workspace.organization.allowance}
                      required
                      disabled={!manager}
                    />
                    <span>days / year</span>
                  </div>
                </Field>
                <p className="helper">
                  Applies to new employees. Existing employee allowances stay
                  unchanged. Working days are Monday through Friday.
                </p>
                {manager && (
                  <Button
                    primary
                    type="submit"
                    disabled={busy || !workspace.authenticated}
                  >
                    {busy ? "Saving…" : "Save workspace"}
                  </Button>
                )}
                {!workspace.authenticated && (
                  <button
                    className="text-button inline-link"
                    type="button"
                    onClick={() => ensureDemo()}
                  >
                    Enter demo to edit settings <ArrowRight />
                  </button>
                )}
              </form>
              <div className="security-note">
                <ShieldCheck size={24} />
                <div>
                  <strong>A workspace of your own</strong>
                  <p>
                    Employee accounts are invitation-only. Managers review
                    requests; employees manage their own time off.
                  </p>
                </div>
              </div>
              {workspace.demo && (
                <Button onClick={() => openForm("register")}>
                  Create your company workspace <ArrowRight size={16} />
                </Button>
              )}
            </section>
          )}
          <footer className="page-footer">
            <span>
              <Sun size={14} /> A happier team starts with a little time off.
            </span>
            <span>Made for a better work-life balance.</span>
          </footer>
        </main>
      </div>
      {toast && (
        <div className="toast" role="status">
          <CheckCircle size={20} />
          {toast}
          <button
            aria-label="Dismiss notification"
            className="icon-button"
            onClick={() => setToast("")}
          >
            <X size={15} />
          </button>
        </div>
      )}
      {modal && (
        <ModalShell
          close={() => {
            setModal(null);
            setError("");
          }}
          title={
            modal === "request"
              ? "Make room for a break."
              : modal === "employee"
                ? "A new face on the team."
                : modal === "register"
                  ? "A fresh start for your team."
                  : modal === "invite"
                    ? "Welcome to your team."
                    : "Welcome back."
          }
          subtitle={
            modal === "request"
              ? "Pick your dates. We’ll take care of the working days."
              : modal === "employee"
                ? "Add their work email and share their invitation link."
                : modal === "register"
                  ? "Create a workspace. Give good work a little breathing room."
                  : modal === "invite"
                    ? "Set a password to activate your assigned work account."
                    : "Sign in with your organization’s work email."
          }
        >
          <form
            onSubmit={(e) =>
              submit(
                e,
                modal === "request"
                  ? "request"
                  : modal === "employee"
                    ? "addEmployee"
                    : modal === "invite"
                      ? "acceptInvite"
                      : modal,
              )
            }
          >
            {error && (
              <div className="form-error" role="alert">
                {error}
              </div>
            )}
            {modal === "request" && (
              <>
                <Field label="Team member">
                  <select
                    name="employeeId"
                    defaultValue={workspace.user.employeeId}
                  >
                    {employees
                      .filter(
                        (e) => manager || e.id === workspace.user.employeeId,
                      )
                      .map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.name}
                          {e.id === workspace.user.employeeId ? " (you)" : ""}
                        </option>
                      ))}
                  </select>
                </Field>
                <Field label="Type of time off">
                  <select name="type">
                    <option>Vacation</option>
                    <option>Sick leave</option>
                    <option>Personal</option>
                  </select>
                </Field>
                <div className="form-grid">
                  <Field label="First day">
                    <input
                      required
                      type="date"
                      name="start"
                      defaultValue={selectedDay || today}
                      min="2000-01-01"
                      max="2100-12-31"
                    />
                  </Field>
                  <Field label="Last day">
                    <input
                      required
                      type="date"
                      name="end"
                      defaultValue={selectedDay || today}
                      min="2000-01-01"
                      max="2100-12-31"
                    />
                  </Field>
                </div>
                <Field label="Note (optional)">
                  <textarea
                    name="note"
                    maxLength={1000}
                    rows={3}
                    placeholder="Anything your manager should know?"
                  />
                </Field>
                <p className="helper">
                  <Clock size={14} /> Only weekdays count toward your allowance.
                </p>
              </>
            )}
            {modal === "employee" && (
              <>
                <Field label="Full name">
                  <input
                    name="name"
                    required
                    maxLength={120}
                    placeholder="e.g. Jordan Lee"
                  />
                </Field>
                <Field label="Work email">
                  <input
                    name="email"
                    type="email"
                    required
                    maxLength={254}
                    placeholder="jordan@company.com"
                  />
                </Field>
                <div className="form-grid">
                  <Field label="Department">
                    <input
                      name="department"
                      required
                      maxLength={120}
                      placeholder="e.g. Design"
                    />
                  </Field>
                  <Field label="Job title">
                    <input
                      name="title"
                      required
                      maxLength={120}
                      placeholder="e.g. Product Designer"
                    />
                  </Field>
                </div>
                <div className="form-grid">
                  <Field label="Annual vacation days">
                    <input
                      type="number"
                      name="allowance"
                      min={0}
                      max={365}
                      required
                      defaultValue={workspace.organization.allowance}
                    />
                  </Field>
                  <Field label="Workspace role">
                    <select name="role">
                      <option value="employee">Employee</option>
                      <option value="manager">HR / Manager</option>
                    </select>
                  </Field>
                </div>
              </>
            )}
            {(modal === "register" ||
              modal === "login" ||
              modal === "invite") && (
              <>
                {modal === "register" && (
                  <>
                    <Field label="Your full name">
                      <input
                        name="name"
                        required
                        autoComplete="name"
                        maxLength={120}
                        placeholder="Alex Morgan"
                      />
                    </Field>
                    <Field label="Organization name">
                      <input
                        name="organization"
                        required
                        autoComplete="organization"
                        maxLength={120}
                        placeholder="Your company"
                      />
                    </Field>
                  </>
                )}
                {modal !== "invite" && (
                  <Field label="Work email">
                    <input
                      type="email"
                      name="email"
                      autoComplete="email"
                      required
                      maxLength={254}
                      placeholder="you@company.com"
                    />
                  </Field>
                )}
                <Field
                  label={modal === "login" ? "Password" : "Create a password"}
                >
                  <input
                    type="password"
                    name="password"
                    autoComplete={
                      modal === "login" ? "current-password" : "new-password"
                    }
                    required
                    minLength={modal === "login" ? 1 : 10}
                    maxLength={128}
                    placeholder={
                      modal === "login"
                        ? "Your password"
                        : "At least 10 characters"
                    }
                  />
                </Field>
              </>
            )}
            <div className="modal-actions">
              <Button onClick={() => setModal(null)}>Cancel</Button>
              <Button primary type="submit" disabled={busy}>
                {busy
                  ? "Please wait…"
                  : modal === "request"
                    ? "Send request"
                    : modal === "employee"
                      ? "Add employee"
                      : modal === "register"
                        ? "Create workspace"
                        : modal === "invite"
                          ? "Activate account"
                          : "Sign in"}
                <ArrowRight size={16} />
              </Button>
            </div>
            {(modal === "login" || modal === "register") && (
              <div className="auth-switch">
                {modal === "login"
                  ? "Setting up for your company?"
                  : "Already have an account?"}{" "}
                <button
                  type="button"
                  onClick={() => {
                    setError("");
                    setModal(modal === "login" ? "register" : "login");
                  }}
                >
                  {modal === "login" ? "Create a workspace" : "Sign in"}
                </button>
                {modal === "login" && (
                  <p>
                    Joining an existing team? Use the invitation link from your
                    manager.
                  </p>
                )}
              </div>
            )}
          </form>
        </ModalShell>
      )}
      {selected && (
        <ModalShell
          close={() => setSelected(null)}
          title={`${employeeById(selected.employeeId)?.name}’s time off`}
          subtitle={`${selected.type} · ${range(selected)} · ${businessDays(selected.start, selected.end)} working days`}
        >
          <span className={`status ${selected.status}`}>{selected.status}</span>
          <p className="detail-note">
            {selected.note || "No additional note."}
          </p>
          <div className="modal-actions">
            <Button onClick={() => setSelected(null)}>Close</Button>
            {manager && selected.status === "Pending" && (
              <>
                <Button
                  disabled={busy}
                  onClick={() => review(selected, "Declined")}
                >
                  Decline
                </Button>
                <Button
                  primary
                  disabled={busy}
                  onClick={() => review(selected, "Approved")}
                >
                  Approve request
                </Button>
              </>
            )}
          </div>
        </ModalShell>
      )}
    </div>
  );
}
function Empty({ title, text }: { title: string; text: string }) {
  return (
    <div className="empty-state">
      <CalendarBlank size={35} />
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}
function Calendar({
  month,
  requests,
  employees,
  today,
  onSelect,
  onDay,
}: {
  month: Date;
  requests: Leave[];
  employees: Employee[];
  today: string;
  onSelect: (r: Leave) => void;
  onDay: (day: string) => void;
}) {
  const start = new Date(month.getFullYear(), month.getMonth(), 1);
  start.setDate(1 - ((start.getDay() + 6) % 7));
  const count =
    Math.ceil(
      (((new Date(month.getFullYear(), month.getMonth(), 1).getDay() + 6) % 7) +
        new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()) /
        7,
    ) * 7;
  return (
    <div className="calendar-scroll">
      <div className="calendar">
        <div className="weekdays">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
            <div key={d}>{d}</div>
          ))}
        </div>
        <div className="calendar-grid">
          {Array.from({ length: count }, (_, i) => {
            const date = new Date(start);
            date.setDate(start.getDate() + i);
            const key = dateKey(date),
              outside = date.getMonth() !== month.getMonth(),
              weekend = i % 7 >= 5;
            const events = requests.filter(
              (r) => r.start <= key && r.end >= key,
            );
            return (
              <div
                className={`calendar-day ${outside ? "outside" : ""} ${weekend ? "weekend" : ""} ${key === today ? "is-today" : ""}`}
                key={key}
              >
                <button
                  className="day-number"
                  aria-label={`Request time off on ${key}`}
                  onClick={() => onDay(key)}
                >
                  {date.getDate()}
                </button>
                <div className="day-events">
                  {events.slice(0, 3).map((r) => {
                    const employee = employees.find(
                      (e) => e.id === r.employeeId,
                    )!;
                    return (
                      <button
                        title={`${employee.name} · ${r.type} · ${r.status}`}
                        key={r.id}
                        className={`calendar-event ${leaveClass(r.type)} ${r.status === "Pending" ? "pending-event" : ""}`}
                        onClick={() => onSelect(r)}
                      >
                        <span className="event-dot" />
                        {employee.name.split(" ")[0]}{" "}
                        {employee.name.split(" ").at(-1)?.[0]}.
                        {r.status === "Pending" && <Clock size={11} />}
                      </button>
                    );
                  })}
                  {events.length > 3 && (
                    <button
                      className="more-events"
                      onClick={() => onSelect(events[3])}
                    >
                      +{events.length - 3} more
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
