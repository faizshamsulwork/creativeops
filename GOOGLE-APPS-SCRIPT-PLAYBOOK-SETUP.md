# AutoPlaybook Apps Script — idempotency-by-job_id (required for safe retries)

**Status: not applied.** I don't have edit access to your Google Apps Script project — this is
exactly what needs to be pasted into it and redeployed, using the **same existing deployment**
(edit the script bound to it, push a new version — the `/exec` URL in `app.js` does not change).

## Why this is required

The frontend (`app.js`) now retries `generate_playbook` up to 2 times on transient failures (404,
429, 500, 502, 503, 504, network failure) — see the root-cause report for why. A retry means the
Apps Script's `doPost` can run **more than once for the same job_id**, including cases where an
earlier "failed" attempt had actually already created a file server-side before the client saw the
error. Without a check, that creates duplicate Slides. This document is what makes that safe.

## Required logic

**Before `template.makeCopy()`**, search the configured output folder for a file already generated
for this `job_id`. If one exists, return it instead of creating another:

```json
{ "status": "success", "job_id": "...", "url": "https://docs.google.com/presentation/d/.../edit", "existing": true }
```

Only call `makeCopy()` when no such file is found. On the success path where a new copy *was* just
created, add `"existing": false` (the frontend reads this to show "reused existing" vs "generated"
in the notification — cosmetic only, safe to omit if you'd rather not touch the response shape, the
frontend treats a missing `existing` key as `false`).

## Code to paste

Fill in the two `TODO` constants with the same template/output-folder IDs your current script
already uses (I don't know these — they're not visible from the outside), then integrate
`handleGeneratePlaybook` into your existing `doPost` routing for the `generate_playbook` action. If
this deployment handles *only* `generate_playbook` and nothing else, the full block below (both
functions plus `doPost`) is a complete, ready-to-paste replacement.

```javascript
// TODO: same IDs your current script already uses — find them in your existing source.
const PLAYBOOK_TEMPLATE_ID = 'YOUR_TEMPLATE_SLIDES_ID_HERE';
const PLAYBOOK_OUTPUT_FOLDER_ID = 'YOUR_OUTPUT_FOLDER_ID_HERE';

function doPost(e) {
  let result;
  try {
    const body = JSON.parse(e.postData.contents);
    const action = body.action;
    const data = body.data || {};

    if (action === 'generate_playbook') {
      result = handleGeneratePlaybook(data);
    } else {
      result = { status: 'error', message: 'Unknown action: ' + action };
    }
  } catch (err) {
    result = { status: 'error', message: String(err) };
  }

  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Idempotent by job_id: checks for an existing generated file BEFORE creating one, so a client
 * retry (or a second manual click, or anything else that calls this twice for the same job_id)
 * returns the existing file instead of making a duplicate.
 */
function handleGeneratePlaybook(data) {
  const jobId = String(data.job_id || '').trim();
  if (!jobId) {
    return { status: 'error', message: 'Missing job_id' };
  }

  const outputFolder = DriveApp.getFolderById(PLAYBOOK_OUTPUT_FOLDER_ID);

  const existing = findExistingPlaybookByJobId(outputFolder, jobId);
  if (existing) {
    return { status: 'success', job_id: jobId, url: existing.getUrl(), existing: true };
  }

  const clientName = String(data.client_name || '').trim();
  const projectTitle = String(data.project_title || '').trim();
  // The "[job_id] " prefix is what findExistingPlaybookByJobId() matches on below — keep them in
  // sync if you change this. Using job_id (not client/title text) is what makes the lookup
  // reliable: client/title can repeat or be edited, job_id is the one stable identifier.
  const fileName = '[' + jobId + '] ' + clientName + ' - ' + projectTitle;

  const template = DriveApp.getFileById(PLAYBOOK_TEMPLATE_ID);
  const copy = template.makeCopy(fileName, outputFolder);

  return { status: 'success', job_id: jobId, url: copy.getUrl(), existing: false };
}

function findExistingPlaybookByJobId(folder, jobId) {
  const prefix = '[' + jobId + ']';
  const files = folder.getFiles();
  while (files.hasNext()) {
    const file = files.next();
    if (file.getName().indexOf(prefix) === 0) {
      return file;
    }
  }
  return null;
}
```

**If your current script does more than just `generate_playbook`** (other actions, other routing),
don't replace your whole `doPost` — just add/replace the `generate_playbook` branch to call
`handleGeneratePlaybook(data)`, and add the two helper functions. Share your current script source
if you'd like an exact patch instead of this reference implementation — I can't produce one without
seeing it (matching your real naming convention, output-folder ID, etc.).

## After pasting

**Deploy → Manage deployments → edit the existing AutoPlaybook deployment → New version → Deploy.**
This keeps the same `/exec` URL already in `app.js`'s `PRODUCTION_GAS_API` — no frontend change
needed for this step.

## What's NOT yet verified

Duplicate-prevention was tested against a local mock that simulates this exact logic (see the test
report) — **not against your real script**, since doing that before this fix exists would create a
real duplicate file. Please redeploy this, then ask me to run the "same Job ID twice" test again
directly against production so it's verified for real before you rely on it at volume.
