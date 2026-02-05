# SB Intake Form

Simple, single-page intake form for sandbox reporting requests. It captures
additional fields merchants request, priorities, timelines, and other context.
Entries are stored locally by default and can also be exported to CSV.

## How to use

1. Open `index.html` in a browser.
2. Fill in the request details and submit.
3. Review submitted entries in the list below the form.
4. Click **Export CSV** to download the data as a spreadsheet-friendly file.

## Email notifications

Every submission triggers an email notification using a `mailto:` link.
Set the destination email address in `script.js`:

```js
const NOTIFY_EMAIL = "adnan.baleh@affirm.com";
```

Update the value if you want a different inbox to be notified.

## Shareable link (GitHub Pages)

To share the form as a link, host it with GitHub Pages:

1. In GitHub, go to **Settings → Pages**.
2. Under **Build and deployment**, select **Deploy from a branch**.
3. Choose the branch and `/root` folder, then **Save**.
4. GitHub will generate a public URL you can share.

The "Share this intake form" card will show the current page URL, ready to
copy.

## Shared entries (Google Sheets)

If you want everyone to see the same submissions, connect the form to a
shared Google Sheet using Apps Script.

1. Create a new Google Sheet.
2. Open **Extensions → Apps Script**.
3. Copy the contents of `apps-script.gs` into the script editor.
4. Click **Deploy → New deployment**.
5. Select **Web app**, set **Execute as** to yourself, and allow access to
   **Anyone** with the link.
6. Copy the Web App URL and set it in `script.js`:

```js
const REMOTE_API_URL = "insert-google-apps-script-url";
```

Once configured, new entries will be stored in the shared sheet and displayed
for all users who open the form.

If submissions still fail, confirm the Web App URL ends in `/exec` and that
the deployment access is set to **Anyone**.

If you update the Apps Script, use **Deploy → Manage deployments** and
publish a new version so the Web App URL serves the latest code.
