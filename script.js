const STORAGE_KEY = "sandbox-reporting-intake-entries";

const NOTIFY_EMAIL = "adnan.baleh@affirm.com";
// Insert the Google Apps Script Web App URL here to share entries.
const REMOTE_API_URL = "https://script.google.com/a/macros/affirm.com/s/AKfycbx7iGJ2QLKFZrGxEersXlXmHRZQeGNsANEJmaVskyKX95XiFAl1YqfTv3eba_EyqU9q/exec";

const intakeForm = document.getElementById("intakeForm");
const resetFormButton = document.getElementById("resetForm");
const entriesBody = document.getElementById("entriesBody");
const emptyState = document.getElementById("emptyState");
const tableWrapper = document.getElementById("tableWrapper");
const clearEntriesButton = document.getElementById("clearEntries");
const exportCsvButton = document.getElementById("exportCsv");
const shareLinkInput = document.getElementById("shareLink");
const copyLinkButton = document.getElementById("copyLink");
const storageStatus = document.getElementById("storageStatus");

let cachedEntries = [];

const isRemoteConfigured = () =>
  Boolean(REMOTE_API_URL) && !REMOTE_API_URL.includes("insert-");

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

const setEntries = (entries) => {
  cachedEntries = entries;
  renderEntries();
};

const parseRemoteEntries = (data) => {
  if (Array.isArray(data)) {
    return data;
  }
  if (data && Array.isArray(data.entries)) {
    return data.entries;
  }
  return [];
};

const fetchRemoteEntries = () => {
  return new Promise((resolve, reject) => {
    const callbackName = `remoteEntriesCallback_${Date.now()}_${Math.floor(
      Math.random() * 1000
    )}`;
    const script = document.createElement("script");
    const timeoutId = setTimeout(() => {
      cleanup();
      reject(new Error("Timed out while loading shared entries."));
    }, 8000);

    const cleanup = () => {
      clearTimeout(timeoutId);
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
      try {
        delete window[callbackName];
      } catch (error) {
        window[callbackName] = undefined;
      }
    };

    window[callbackName] = (data) => {
      cleanup();
      resolve(parseRemoteEntries(data));
    };

    script.src = `${REMOTE_API_URL}?callback=${callbackName}&cacheBust=${Date.now()}`;
    script.onerror = () => {
      cleanup();
      reject(new Error("Unable to load shared entries."));
    };
    document.body.appendChild(script);
  });
};

const saveRemoteEntry = async (entry) => {
  await fetch(REMOTE_API_URL, {
    method: "POST",
    mode: "no-cors",
    body: JSON.stringify({ entry }),
  });
};

const refreshEntries = async () => {
  if (isRemoteConfigured()) {
    try {
      const entries = await fetchRemoteEntries();
      setEntries(entries);
      return;
    } catch (error) {
      console.error(error);
      alert(
        "Unable to load shared entries. Double-check the remote URL in script.js."
      );
      setEntries([]);
      return;
    }
  }
  setEntries(loadEntries());
};

const formatDate = (isoString) => {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) {
    return "Invalid date";
  }
  return date.toLocaleString();
};

const renderEntries = () => {
  entriesBody.innerHTML = "";

  if (cachedEntries.length === 0) {
    emptyState.style.display = "block";
    tableWrapper.style.display = "none";
    return;
  }

  emptyState.style.display = "none";
  tableWrapper.style.display = "block";

  cachedEntries.forEach((entry) => {
    const row = document.createElement("tr");
    const columns = [
      formatDate(entry.createdAt),
      `${entry.employeeName} (${entry.employeeEmail})`,
      entry.employeeTeam,
      entry.priority,
      entry.additionalFields,
      entry.merchantRequests,
      entry.desiredTimeline || "—",
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
    `Name: ${entry.employeeName}`,
    `Email: ${entry.employeeEmail}`,
    `Team: ${entry.employeeTeam}`,
    `Priority: ${entry.priority}`,
    `Additional fields: ${entry.additionalFields}`,
    `Merchant asks: ${entry.merchantRequests}`,
    `Desired timeline: ${entry.desiredTimeline || "N/A"}`,
    `More information: ${entry.moreInfo || "N/A"}`,
  ].join("\n");
};

const sendNotificationEmail = (entry) => {
  if (!NOTIFY_EMAIL || NOTIFY_EMAIL.includes("insert-")) {
    console.info("Notification email not configured.");
    return;
  }

  const subject = `Sandbox reporting request from ${entry.employeeName}`;
  const body = buildEmailBody(entry);
  const mailtoLink = `mailto:${encodeURIComponent(NOTIFY_EMAIL)}?subject=${encodeURIComponent(
    subject
  )}&body=${encodeURIComponent(body)}`;

  window.location.href = mailtoLink;
};

const handleSubmit = async (event) => {
  event.preventDefault();
  const formData = new FormData(intakeForm);
  const getValue = (name) => String(formData.get(name) || "").trim();
  const entry = {
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
    employeeName: getValue("employeeName"),
    employeeEmail: getValue("employeeEmail"),
    employeeTeam: getValue("employeeTeam"),
    priority: formData.get("priority"),
    additionalFields: getValue("additionalFields"),
    merchantRequests: getValue("merchantRequests"),
    desiredTimeline: getValue("desiredTimeline"),
    moreInfo: getValue("moreInfo"),
  };

  if (isRemoteConfigured()) {
    try {
      await saveRemoteEntry(entry);
      await new Promise((resolve) => setTimeout(resolve, 800));
      await refreshEntries();
    } catch (error) {
      console.error(error);
      alert("Unable to save to the shared list. Please try again.");
      return;
    }
  } else {
    const entries = loadEntries();
    entries.unshift(entry);
    saveEntries(entries);
    setEntries(entries);
  }

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
  const entries = cachedEntries;
  if (entries.length === 0) {
    alert("No entries to export yet.");
    return;
  }

  const headers = [
    "created_at",
    "employee_name",
    "employee_email",
    "team",
    "priority",
    "additional_fields",
    "merchant_requests",
    "desired_timeline",
    "more_info",
  ];

  const rows = entries.map((entry) => [
    entry.createdAt,
    entry.employeeName,
    entry.employeeEmail,
    entry.employeeTeam,
    entry.priority,
    entry.additionalFields,
    entry.merchantRequests,
    entry.desiredTimeline,
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
  if (isRemoteConfigured()) {
    alert(
      "Clear entries is disabled when shared storage is enabled. Remove rows from the shared sheet instead."
    );
    return;
  }
  const confirmed = confirm("Clear all saved entries?");
  if (!confirmed) {
    return;
  }
  localStorage.removeItem(STORAGE_KEY);
  setEntries([]);
};

const updateShareSection = () => {
  if (shareLinkInput) {
    shareLinkInput.value = window.location.href;
  }
  if (storageStatus) {
    const enabled = isRemoteConfigured();
    storageStatus.textContent = enabled
      ? "Shared storage: On"
      : "Shared storage: Local only";
    storageStatus.classList.toggle("on", enabled);
    storageStatus.classList.toggle("off", !enabled);
  }
};

const copyShareLink = async () => {
  if (!shareLinkInput) {
    return;
  }
  const shareLink = shareLinkInput.value;
  try {
    await navigator.clipboard.writeText(shareLink);
  } catch (error) {
    shareLinkInput.select();
    document.execCommand("copy");
  }
  if (copyLinkButton) {
    copyLinkButton.textContent = "Copied";
    setTimeout(() => {
      copyLinkButton.textContent = "Copy link";
    }, 1500);
  }
};

intakeForm.addEventListener("submit", handleSubmit);
resetFormButton.addEventListener("click", () => intakeForm.reset());
clearEntriesButton.addEventListener("click", clearEntries);
exportCsvButton.addEventListener("click", exportCsv);

if (copyLinkButton) {
  copyLinkButton.addEventListener("click", copyShareLink);
}

updateShareSection();
refreshEntries();
