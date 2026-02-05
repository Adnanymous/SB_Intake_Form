const STORAGE_KEY = "sandbox-reporting-intake-entries";

// Insert the notification email address here.
const NOTIFY_EMAIL = "insert-notification-email@affirm.com";

const intakeForm = document.getElementById("intakeForm");
const resetFormButton = document.getElementById("resetForm");
const entriesBody = document.getElementById("entriesBody");
const emptyState = document.getElementById("emptyState");
const tableWrapper = document.getElementById("tableWrapper");
const clearEntriesButton = document.getElementById("clearEntries");
const exportCsvButton = document.getElementById("exportCsv");

const loadEntries = () => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return [];
  }
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Unable to read stored entries", error);
    return [];
  }
};

const saveEntries = (entries) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
};

const formatDate = (isoString) => {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) {
    return "Invalid date";
  }
  return date.toLocaleString();
};

const renderEntries = () => {
  const entries = loadEntries();
  entriesBody.innerHTML = "";

  if (entries.length === 0) {
    emptyState.style.display = "block";
    tableWrapper.style.display = "none";
    return;
  }

  emptyState.style.display = "none";
  tableWrapper.style.display = "block";

  entries.forEach((entry) => {
    const row = document.createElement("tr");
    const columns = [
      formatDate(entry.createdAt),
      `${entry.employeeName} (${entry.employeeEmail})`,
      entry.employeeTeam,
      entry.requestTitle,
      entry.reportType,
      entry.priority,
      entry.additionalFields,
      entry.merchantRequests,
      entry.improvementIdeas || "—",
      entry.desiredTimeline || "—",
      entry.relatedTickets || "—",
      entry.moreInfo || "—",
    ];

    columns.forEach((value) => {
      const cell = document.createElement("td");
      cell.textContent = value;
      row.appendChild(cell);
    });

    entriesBody.appendChild(row);
  });
};

const buildEmailBody = (entry) => {
  return [
    `Employee: ${entry.employeeName}`,
    `Email: ${entry.employeeEmail}`,
    `Team: ${entry.employeeTeam}`,
    `Request title: ${entry.requestTitle}`,
    `Report type: ${entry.reportType}`,
    `Priority: ${entry.priority}`,
    `Additional fields: ${entry.additionalFields}`,
    `Merchant asks: ${entry.merchantRequests}`,
    `Room for improvement: ${entry.improvementIdeas || "N/A"}`,
    `Desired timeline: ${entry.desiredTimeline || "N/A"}`,
    `Related ticket or doc: ${entry.relatedTickets || "N/A"}`,
    `More information: ${entry.moreInfo || "N/A"}`,
  ].join("\n");
};

const sendNotificationEmail = (entry) => {
  if (!NOTIFY_EMAIL || NOTIFY_EMAIL.includes("insert-")) {
    console.info("Notification email not configured.");
    return;
  }

  const subject = `Sandbox reporting request: ${entry.requestTitle}`;
  const body = buildEmailBody(entry);
  const mailtoLink = `mailto:${encodeURIComponent(NOTIFY_EMAIL)}?subject=${encodeURIComponent(
    subject
  )}&body=${encodeURIComponent(body)}`;

  window.location.href = mailtoLink;
};

const handleSubmit = (event) => {
  event.preventDefault();
  const formData = new FormData(intakeForm);
  const getValue = (name) => String(formData.get(name) || "").trim();
  const entry = {
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
    employeeName: getValue("employeeName"),
    employeeEmail: getValue("employeeEmail"),
    employeeTeam: getValue("employeeTeam"),
    requestTitle: getValue("requestTitle"),
    reportType: formData.get("reportType"),
    priority: formData.get("priority"),
    additionalFields: getValue("additionalFields"),
    merchantRequests: getValue("merchantRequests"),
    improvementIdeas: getValue("improvementIdeas"),
    desiredTimeline: getValue("desiredTimeline"),
    relatedTickets: getValue("relatedTickets"),
    moreInfo: getValue("moreInfo"),
  };

  const entries = loadEntries();
  entries.unshift(entry);
  saveEntries(entries);
  renderEntries();
  sendNotificationEmail(entry);
  intakeForm.reset();
};

const toCsvValue = (value) => {
  const safeValue = value == null ? "" : String(value);
  if (/[",\n]/.test(safeValue)) {
    return `"${safeValue.replace(/"/g, '""')}"`;
  }
  return safeValue;
};

const exportCsv = () => {
  const entries = loadEntries();
  if (entries.length === 0) {
    alert("No entries to export yet.");
    return;
  }

  const headers = [
    "created_at",
    "employee_name",
    "employee_email",
    "team",
    "request_title",
    "report_type",
    "priority",
    "additional_fields",
    "merchant_requests",
    "room_for_improvement",
    "desired_timeline",
    "related_tickets",
    "more_info",
  ];

  const rows = entries.map((entry) => [
    entry.createdAt,
    entry.employeeName,
    entry.employeeEmail,
    entry.employeeTeam,
    entry.requestTitle,
    entry.reportType,
    entry.priority,
    entry.additionalFields,
    entry.merchantRequests,
    entry.improvementIdeas,
    entry.desiredTimeline,
    entry.relatedTickets,
    entry.moreInfo,
  ]);

  const csvContent = [headers, ...rows]
    .map((row) => row.map(toCsvValue).join(","))
    .join("\n");

  const blob = new Blob([csvContent], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "sandbox-reporting-requests.csv";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

const clearEntries = () => {
  const confirmed = confirm("Clear all saved entries?");
  if (!confirmed) {
    return;
  }
  localStorage.removeItem(STORAGE_KEY);
  renderEntries();
};

intakeForm.addEventListener("submit", handleSubmit);
resetFormButton.addEventListener("click", () => intakeForm.reset());
clearEntriesButton.addEventListener("click", clearEntries);
exportCsvButton.addEventListener("click", exportCsv);

renderEntries();
