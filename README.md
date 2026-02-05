# SB Intake Form

Simple, single-page intake form for sandbox reporting requests. It captures
additional fields merchants request, feedback, and improvement ideas, then
stores each entry in local storage for review. Entries can also be exported
to CSV.

## How to use

1. Open `index.html` in a browser.
2. Fill in the request details and submit.
3. Review submitted entries in the list below the form.
4. Click **Export CSV** to download the data as a spreadsheet-friendly file.

## Email notifications

Every submission triggers an email notification using a `mailto:` link.
Set the destination email address in `script.js`:

```js
const NOTIFY_EMAIL = "insert-notification-email@affirm.com";
```

Replace the placeholder value with the inbox you want to notify.
