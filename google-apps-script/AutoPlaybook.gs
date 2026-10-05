/**
 * AdTechinno AutoPlaybook — Google Apps Script web app (source of truth for what's deployed).
 *
 * Changes vs the 2026-10-05 deployed version:
 *   - findExistingPlaybook: Drive search (title contains <job_id>, not trashed) instead of
 *     iterating every file in the folder — that loop got slower with every playbook ever made,
 *     and could also return a trashed file's URL.
 *   - doPost: new "ping" action (instant no-op, used by the app's warm-up) and "find_playbook"
 *     (lookup only, never creates — used by the app after a timeout before showing an error).
 *
 * DEPLOY (keeps the same /exec URL — do NOT create a new deployment):
 *   Deploy → Manage deployments → pencil (edit) on the existing deployment →
 *   Version: "New version" → Deploy.
 */

const TEMPLATE_ID = "1qpP8QgyqryH3OAiTJgO5wXNNZ7z84izdVh2DsRSVHLc";
const FOLDER_ID = "106rZYOPKjxy--S4PGvXK41kBk786FJqx";

/**
 * Simple health check.
 * Opening the deployed /exec URL in a browser should return JSON.
 */
function doGet() {
  return jsonResponse({
    status: "success",
    service: "AdTechinno AutoPlaybook",
    message: "AutoPlaybook service is running"
  });
}

/**
 * Main web-app endpoint used by Creative OS.
 *
 * Actions:
 *   { "action": "generate_playbook", "data": { job_id, client_name, project_title, requester_name } }
 *   { "action": "find_playbook",     "data": { job_id } }   — lookup only, never creates
 *   { "action": "ping" }                                     — no-op, keeps the script warm
 */
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      throw new Error("Missing request body");
    }

    const requestData = JSON.parse(e.postData.contents);
    const action = requestData.action;

    if (action === "ping") {
      return jsonResponse({ status: "success", message: "pong" });
    }

    if (action === "find_playbook") {
      return findPlaybook(requestData.data || {});
    }

    if (action !== "generate_playbook") {
      return jsonResponse({
        status: "error",
        message: "Unsupported action"
      });
    }

    return generatePlaybook(requestData.data || {});

  } catch (err) {
    return jsonResponse({
      status: "error",
      message: err.message
    });
  }
}

/**
 * Lookup only — returns the existing Playbook for a Job ID, or found:false.
 * Never creates anything, so it's always safe to call (e.g. after a client-side timeout).
 */
function findPlaybook(data) {
  try {
    const jobId = cleanText(data.job_id);
    if (!jobId) {
      throw new Error("Missing Job ID");
    }

    const folder = DriveApp.getFolderById(FOLDER_ID);
    const existingFile = findExistingPlaybook(folder, jobId);

    if (existingFile) {
      return jsonResponse({
        status: "success",
        job_id: jobId,
        found: true,
        url: existingFile.getUrl(),
        existing: true
      });
    }

    return jsonResponse({ status: "success", job_id: jobId, found: false });

  } catch (err) {
    return jsonResponse({
      status: "error",
      message: err.message
    });
  }
}

/**
 * Generates a Creative Playbook from the master template.
 *
 * IMPORTANT:
 * This function is idempotent by Job ID.
 *
 * If a Playbook for the same Job ID already exists in the
 * generated Playbook folder, the existing file is returned
 * instead of creating another copy.
 */
function generatePlaybook(data) {
  const lock = LockService.getScriptLock();
  let lockAcquired = false;

  try {
    const jobId = cleanText(data.job_id);
    const clientName = cleanText(data.client_name);
    const projectTitle = cleanText(data.project_title);
    const requesterName = cleanText(data.requester_name);

    if (!jobId) {
      throw new Error("Missing Job ID");
    }

    if (!clientName) {
      throw new Error("Missing Client Name");
    }

    /**
     * Prevent simultaneous requests for the same generation flow
     * from creating duplicate Google Slides files.
     *
     * Wait up to 30 seconds for another generation to finish.
     */
    lock.waitLock(30000);
    lockAcquired = true;

    const folder = DriveApp.getFolderById(FOLDER_ID);

    /**
     * STEP 1:
     * Check whether a generated Playbook for this Job ID
     * already exists.
     */
    const existingFile = findExistingPlaybook(folder, jobId);

    if (existingFile) {
      return jsonResponse({
        status: "success",
        job_id: jobId,
        url: existingFile.getUrl(),
        existing: true
      });
    }

    /**
     * STEP 2:
     * No existing Playbook found.
     * Create a new copy from the master template.
     */
    const template = DriveApp.getFileById(TEMPLATE_ID);

    const fileName =
      jobId +
      " - " +
      clientName +
      " - Creative Playbook";

    const newFile = template.makeCopy(fileName, folder);

    /**
     * STEP 3:
     * Open the newly-created Google Slides file.
     */
    const presentation = SlidesApp.openById(newFile.getId());

    /**
     * STEP 4:
     * Replace template placeholders.
     */
    presentation.replaceAllText("{{JOB_ID}}", jobId);
    presentation.replaceAllText("{{CLIENT_NAME}}", clientName);
    presentation.replaceAllText("{{PROJECT_TITLE}}", projectTitle);
    presentation.replaceAllText("{{REQUESTER_NAME}}", requesterName);

    presentation.saveAndClose();

    /**
     * STEP 5:
     * Return successful response.
     *
     * existing:false tells Creative OS that
     * a brand-new file was created.
     */
    return jsonResponse({
      status: "success",
      job_id: jobId,
      url: newFile.getUrl(),
      existing: false
    });

  } catch (err) {
    return jsonResponse({
      status: "error",
      message: err.message
    });

  } finally {
    /**
     * Always release the lock if this execution acquired it.
     */
    if (lockAcquired) {
      try {
        lock.releaseLock();
      } catch (releaseError) {
        console.log(
          "Unable to release AutoPlaybook lock: " +
          releaseError.message
        );
      }
    }
  }
}

/**
 * Finds an existing generated Creative Playbook by Job ID.
 *
 * Expected generated filename:
 *
 * WEI-2608-004 - Weisen-U - Creative Playbook
 *
 * Uses a Drive search scoped to this folder (fast, and skips trashed files) instead of
 * walking every file. The search narrows candidates; the exact prefix/suffix check below
 * still decides — so e.g. "ABC-2610-01" can never match "ABC-2610-012".
 *
 * We intentionally match using Job ID rather than the full
 * filename because client/project information may later change,
 * while Job ID remains the permanent task identifier.
 */
function findExistingPlaybook(folder, jobId) {
  const prefix = jobId + " - ";
  const safeJobId = jobId.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
  const files = folder.searchFiles("title contains '" + safeJobId + "' and trashed = false");

  while (files.hasNext()) {
    const file = files.next();
    const fileName = file.getName();

    if (
      fileName.startsWith(prefix) &&
      fileName.endsWith(" - Creative Playbook")
    ) {
      return file;
    }
  }

  return null;
}

/**
 * Removes null / undefined and converts values to safe strings.
 */
function cleanText(value) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value).trim();
}

/**
 * Standard JSON response helper.
 */
function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * RUN THIS BEFORE DEPLOYING.
 *
 * Checks the new Drive-search lookup finds a Playbook that you KNOW exists, and that the
 * old full-folder scan agrees. Change KNOWN_JOB_ID to any job that already has a Playbook.
 */
function testFindPlaybook() {
  const KNOWN_JOB_ID = "GTN-2610-005";
  const folder = DriveApp.getFolderById(FOLDER_ID);

  const t0 = Date.now();
  const viaSearch = findExistingPlaybook(folder, KNOWN_JOB_ID);
  const searchMs = Date.now() - t0;

  const t1 = Date.now();
  let viaScan = null;
  const all = folder.getFiles();
  while (all.hasNext()) {
    const f = all.next();
    if (f.getName().startsWith(KNOWN_JOB_ID + " - ") && f.getName().endsWith(" - Creative Playbook") && !f.isTrashed()) {
      viaScan = f;
      break;
    }
  }
  const scanMs = Date.now() - t1;

  Logger.log("Search: " + (viaSearch ? viaSearch.getName() + " " + viaSearch.getUrl() : "NOT FOUND") + " (" + searchMs + "ms)");
  Logger.log("Scan:   " + (viaScan ? viaScan.getName() + " " + viaScan.getUrl() : "NOT FOUND") + " (" + scanMs + "ms)");

  if (!viaSearch || !viaScan || viaSearch.getId() !== viaScan.getId()) {
    throw new Error("testFindPlaybook FAILED — search and scan disagree. Do not deploy; send this log to Claude.");
  }
  Logger.log("testFindPlaybook PASSED ✅");
}

/**
 * BASIC MANUAL TEST
 *
 * Creates a test Playbook if TEST-001 does not already exist.
 * If TEST-001 already exists, it returns the existing file.
 */
function testGeneratePlaybook() {
  const response = generatePlaybook({
    job_id: "TEST-001",
    client_name: "Test Client",
    project_title: "AutoPlaybook Test",
    requester_name: "Faiz"
  });

  Logger.log(response.getContent());
}

/**
 * IDEMPOTENCY TEST
 *
 * Generates a unique Job ID, then calls generatePlaybook()
 * twice using exactly the same Job ID.
 *
 * Expected: FIRST existing:false, SECOND existing:true, same URL, only ONE file in the folder.
 */
function testIdempotency() {
  const uniqueJobId =
    "IDEMPOTENCY-TEST-" +
    Utilities.formatDate(
      new Date(),
      Session.getScriptTimeZone(),
      "yyyyMMdd-HHmmss"
    );

  const testData = {
    job_id: uniqueJobId,
    client_name: "Test Client",
    project_title: "Idempotency Test",
    requester_name: "Faiz"
  };

  const firstResult = JSON.parse(generatePlaybook(testData).getContent());
  Logger.log("FIRST RESPONSE: " + JSON.stringify(firstResult));

  const secondResult = JSON.parse(generatePlaybook(testData).getContent());
  Logger.log("SECOND RESPONSE: " + JSON.stringify(secondResult));

  if (firstResult.status !== "success" || secondResult.status !== "success") {
    throw new Error("Idempotency test failed: generation was not successful.");
  }
  if (firstResult.url !== secondResult.url) {
    throw new Error("Idempotency test failed: different Playbook URLs were returned.");
  }
  if (secondResult.existing !== true) {
    throw new Error("Idempotency test failed: second request did not return existing:true.");
  }

  Logger.log("IDEMPOTENCY TEST PASSED ✅ — " + firstResult.url);
}

/**
 * Optional Drive / Slides permission test.
 */
function testDriveAccess() {
  const folder = DriveApp.getFolderById(FOLDER_ID);
  const template = DriveApp.getFileById(TEMPLATE_ID);

  Logger.log("Folder: " + folder.getName());
  Logger.log("Template: " + template.getName());
}
