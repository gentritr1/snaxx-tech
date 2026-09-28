export type Employee = {
  id: string;
  name: string;
  email: string;
  department: string;
  title: string;
  allowance: number;
  color: number;
};
export type Leave = {
  id: string;
  employeeId: string;
  type: "Vacation" | "Sick leave" | "Personal";
  start: string;
  end: string;
  note: string;
  status: "Pending" | "Approved" | "Declined";
};
export type Workspace = {
  organization: { name: string; allowance: number };
  user: {
    name: string;
    email: string;
    title: string;
    role: "manager" | "employee";
    employeeId: string;
  };
  employees: Employee[];
  requests: Leave[];
  demo: boolean;
  authenticated: boolean;
};
export function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function businessDays(start: string, end: string) {
  let total = 0;
  const cursor = new Date(`${start}T12:00:00Z`),
    last = new Date(`${end}T12:00:00Z`);
  while (cursor <= last) {
    if (cursor.getUTCDay() !== 0 && cursor.getUTCDay() !== 6) total++;
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return total;
}
export function previewWorkspace(): Workspace {
  const now = new Date(),
    y = now.getFullYear(),
    m = now.getMonth();
  const day = (d: number) => dateKey(new Date(y, m, d));
  const employees: Employee[] = [
    {
      id: "e1",
      name: "Alex Morgan",
      email: "alex@studio.co",
      department: "People",
      title: "People Operations Lead",
      allowance: 25,
      color: 0,
    },
    {
      id: "e2",
      name: "Olivia Chen",
      email: "olivia@studio.co",
      department: "Design",
      title: "Product Designer",
      allowance: 25,
      color: 1,
    },
    {
      id: "e3",
      name: "James Wilson",
      email: "james@studio.co",
      department: "Engineering",
      title: "Frontend Engineer",
      allowance: 25,
      color: 2,
    },
    {
      id: "e4",
      name: "Sofia Martinez",
      email: "sofia@studio.co",
      department: "Marketing",
      title: "Marketing Manager",
      allowance: 25,
      color: 3,
    },
    {
      id: "e5",
      name: "Noah Williams",
      email: "noah@studio.co",
      department: "Engineering",
      title: "Software Engineer",
      allowance: 25,
      color: 4,
    },
    {
      id: "e6",
      name: "Emma Davis",
      email: "emma@studio.co",
      department: "Design",
      title: "Brand Designer",
      allowance: 25,
      color: 5,
    },
    {
      id: "e7",
      name: "Liam Patel",
      email: "liam@studio.co",
      department: "Product",
      title: "Product Manager",
      allowance: 25,
      color: 2,
    },
    {
      id: "e8",
      name: "Isabella Kim",
      email: "isabella@studio.co",
      department: "People",
      title: "People Partner",
      allowance: 25,
      color: 1,
    },
  ];
  const requests: Leave[] = [
    {
      id: "r1",
      employeeId: "e2",
      type: "Vacation",
      start: day(3),
      end: day(5),
      note: "A little time by the coast.",
      status: "Approved",
    },
    {
      id: "r2",
      employeeId: "e3",
      type: "Personal",
      start: day(8),
      end: day(8),
      note: "Moving day.",
      status: "Approved",
    },
    {
      id: "r3",
      employeeId: "e4",
      type: "Vacation",
      start: day(10),
      end: day(14),
      note: "Family trip.",
      status: "Approved",
    },
    {
      id: "r4",
      employeeId: "e6",
      type: "Sick leave",
      start: day(17),
      end: day(18),
      note: "",
      status: "Approved",
    },
    {
      id: "r5",
      employeeId: "e5",
      type: "Vacation",
      start: day(21),
      end: day(25),
      note: "Visiting family.",
      status: "Approved",
    },
    {
      id: "r6",
      employeeId: "e7",
      type: "Vacation",
      start: day(28),
      end: day(30),
      note: "A long weekend away.",
      status: "Approved",
    },
    {
      id: "r7",
      employeeId: "e2",
      type: "Vacation",
      start: day(29),
      end: day(32),
      note: "Taking a few days to recharge.",
      status: "Pending",
    },
    {
      id: "r8",
      employeeId: "e3",
      type: "Personal",
      start: day(30),
      end: day(30),
      note: "Personal appointment.",
      status: "Pending",
    },
    {
      id: "r9",
      employeeId: "e8",
      type: "Vacation",
      start: day(33),
      end: day(35),
      note: "Family celebration.",
      status: "Pending",
    },
  ];
  return {
    organization: { name: "Studio", allowance: 25 },
    user: {
      name: "Alex Morgan",
      email: "alex@studio.co",
      title: "People Operations Lead",
      role: "manager",
      employeeId: "e1",
    },
    employees,
    requests,
    demo: true,
    authenticated: false,
  };
}
