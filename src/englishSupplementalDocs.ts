import type { DocPage } from "./data";

const commonMeta = {
  status: "Published" as const,
  owner: "Product Operations",
  updatedAt: "2026-07-20",
  version: "1.0",
};

export const englishSupplementalDocs: DocPage[] = [
  {
    ...commonMeta,
    id: "en-getting-started-checklist",
    title: "Getting Started Checklist",
    route: "/en/docs/getting-started",
    category: "System Overview",
    readingTime: 4,
    summary:
      "Validate the account, browser, cameras, recordings, AI detection, and notification workflow before initial use.",
    tags: ["Getting Started", "Checklist", "English"],
    contentHtml: `
      <h2>Before You Begin</h2>
      <p>Prepare an account assigned by the system administrator and confirm that the workstation can access POLYTRON ONE. For the first operational check, work with an administrator or project delivery specialist so that camera permissions, recording schedules, and alarm rules are not overlooked.</p>
      <h2>Acceptance Checklist</h2>
      <ol>
        <li><p><strong>Login and permissions:</strong> Sign in and confirm that the menus and camera resources required for the role are visible.</p></li>
        <li><p><strong>Live video:</strong> Open at least one authorized camera. Confirm that video plays, the displayed time is correct, and the device is online.</p></li>
        <li><p><strong>Recording playback:</strong> Select a period that contains recordings. Confirm that recorded segments appear and play normally.</p></li>
        <li><p><strong>AI detection:</strong> Perform a controlled action that meets the test rule and confirm that the platform detects it and creates an alarm.</p></li>
        <li><p><strong>Notification handling:</strong> Open the alarm from Notifications, review the details, add a note, and update its status.</p></li>
        <li><p><strong>Record the result:</strong> Save any exception, error message, camera identifier, and test time for the administrator.</p></li>
      </ol>
      <h2>Initial Use Guidance</h2>
      <p>For initial use, start on Home and review camera availability, system resources, and alarms that require attention. Then open Live View and prepare the grids or tabs used for routine monitoring. Lock the workstation when stepping away and sign out when work is complete.</p>
    `,
    sections: [
      { id: "before-you-begin", heading: "Before You Begin", body: "Prepare an account and confirm access to the platform." },
      { id: "acceptance-checklist", heading: "Acceptance Checklist", body: "Validate login, live video, recordings, AI detection, and notifications." },
      { id: "initial-use-guidance", heading: "Initial Use Guidance", body: "Review system health and prepare the monitoring workspace." },
    ],
  },
  {
    ...commonMeta,
    id: "en-system-requirements",
    title: "System Requirements and Compatibility",
    route: "/en/docs/system-requirements",
    category: "System Overview",
    readingTime: 4,
    summary:
      "Review the browser, network, video access, time synchronization, and storage conditions required to operate POLYTRON ONE.",
    tags: ["System Requirements", "Compatibility", "English"],
    contentHtml: `
      <h2>Client Environment</h2>
      <p>Use a maintained desktop browser with JavaScript, media playback, and local storage enabled. A workstation used for continuous monitoring should have stable power and should not run other programs that consume excessive CPU, memory, graphics, or network capacity.</p>
      <h2>Network and Video Access</h2>
      <p>Cameras, platform services, and client workstations require stable connectivity. Before onboarding a camera, verify its IP address, port, credentials, protocol, and stream URL. Confirm that RTSP, ONVIF, and related ports required by the deployment are reachable.</p>
      <h2>Time and Recording</h2>
      <p>Platform servers, cameras, and client devices should use the same time zone and remain synchronized. Otherwise, alarm, notification, search-result, and recording timestamps may not align. Recording retention depends on camera count, bit rate, schedule, retention period, and available storage.</p>
      <h2>Pre-Launch Validation</h2>
      <ul>
        <li><p>The browser can sign in and play live video.</p></li>
        <li><p>Camera connectivity, credentials, and video stream settings have been validated.</p></li>
        <li><p>Server and camera clocks are synchronized.</p></li>
        <li><p>Storage capacity supports the configured schedule and retention period.</p></li>
        <li><p>Browser permissions and organizational network policies do not block playback or downloads.</p></li>
      </ul>
      <h2>Reporting Compatibility Issues</h2>
      <p>Provide the browser name and version, operating system, page address, occurrence time, error message, and a screenshot. For camera-related issues, also include the camera identifier, video protocol, and codec. Do not include passwords, access tokens, or complete stream credentials.</p>
    `,
    sections: [
      { id: "client-environment", heading: "Client Environment", body: "Use a maintained browser on a stable workstation." },
      { id: "network-and-video", heading: "Network and Video Access", body: "Validate camera connectivity, protocols, ports, and streams." },
      { id: "time-and-recording", heading: "Time and Recording", body: "Synchronize time and plan recording storage." },
      { id: "pre-launch-validation", heading: "Pre-Launch Validation", body: "Complete the compatibility checks before operations begin." },
    ],
  },
  {
    ...commonMeta,
    id: "en-global-troubleshooting",
    title: "Troubleshooting",
    route: "/en/docs/troubleshooting",
    category: "System Overview",
    readingTime: 7,
    summary:
      "Troubleshoot common login, permission, live video, recording, AI alarm, notification, playback, and export issues by workflow stage.",
    tags: ["Troubleshooting", "Operations", "English"],
    contentHtml: `
      <h2>Troubleshooting Method</h2>
      <p>Identify the workflow stage where the problem occurs, then check the configuration closest to that stage. Change only one setting at a time and test immediately after each change so that the cause remains clear.</p>
      <h2>Login and Permission Issues</h2>
      <p>If sign-in fails, verify the account, password, account status, and network connection. If menus, cameras, or alarms are missing after sign-in, check both role permissions and camera-resource permissions. If a password-reset email does not arrive, confirm the bound email address, spam folder, and mail-service configuration.</p>
      <h2>Live Video and Recording Issues</h2>
      <p>For an offline camera, check power, network, IP address, ports, and credentials. If a camera is online but has no image, verify its stream URL and codec. If live video works but no recording exists, inspect the recording schedule, storage capacity, and recording-task logs.</p>
      <h2>AI Alarm and Notification Issues</h2>
      <p>If video is available but no alarm is created, verify that the algorithm and rule are enabled, and check the detection region, direction, threshold, effective schedule, and rule status. If an alarm exists but is absent from Notifications, review the active filters, automatic refresh, account visibility, and alarm status.</p>
      <h2>Playback and Export Issues</h2>
      <p>If playback contains no data, first verify the selected camera, date, and time range, then check the recording schedule and storage. If export fails, shorten the clip range, confirm browser download permission and local disk space, and avoid submitting the same export repeatedly.</p>
      <h2>Escalation Information</h2>
      <p>When the issue cannot be recovered, provide the account or role, camera identifier, occurrence time, page address, reproduction steps, error message, screenshot, and relevant logs. Never send a real password, complete video-stream credential, or access token through a general communication channel.</p>
    `,
    sections: [
      { id: "troubleshooting-method", heading: "Troubleshooting Method", body: "Locate the failing stage and change one setting at a time." },
      { id: "login-permissions", heading: "Login and Permission Issues", body: "Check accounts, roles, and camera-resource access." },
      { id: "video-recording", heading: "Live Video and Recording Issues", body: "Check device connectivity, streams, schedules, and storage." },
      { id: "alarms-notifications", heading: "AI Alarm and Notification Issues", body: "Validate detection rules, filters, and visibility." },
      { id: "escalation-information", heading: "Escalation Information", body: "Collect reproducible evidence without exposing secrets." },
    ],
  },
  {
    ...commonMeta,
    id: "en-alarm-severity-response",
    title: "Alarm Severity and Response Guidelines",
    route: "/en/docs/alarm-trigger/severity-response",
    category: "Alarms",
    readingTime: 5,
    summary:
      "Apply consistent alarm prioritization, escalation, and handling records while keeping project-specific response policies authoritative.",
    tags: ["Alarm Severity", "Response", "English"],
    contentHtml: `
      <h2>How to Assign Severity</h2>
      <p>Assess personnel safety, the importance of the affected area, event duration, impact range, and response urgency together. AI results support the decision; the final severity and outcome must follow human review and the project response policy.</p>
      <h2>Recommended Response Order</h2>
      <ol>
        <li><p>Handle alarms involving personal safety, unauthorized entry, critical areas, or sustained abnormal conditions first.</p></li>
        <li><p>Then handle alarms that require on-site confirmation, may expand in impact, or have triggered repeatedly.</p></li>
        <li><p>Review lower-priority reminders, device-state changes, and operational events after urgent alarms are controlled.</p></li>
      </ol>
      <h2>Escalation Conditions</h2>
      <p>Escalate when an incident involves injury, critical facilities, multiple areas, unusual duration, repeated similar events, or conditions that cannot be confirmed remotely. Notify the site lead, security supervisor, or external response unit defined by the project procedure.</p>
      <h2>Handling Records</h2>
      <p>Record the verification result, site condition, action taken, handler, and completion time. For a false alarm, record the likely cause and review the detection region, threshold, direction, and effective schedule.</p>
      <h2>Project Policy Takes Priority</h2>
      <p>Any response time shown in training material is a baseline, not a fixed service commitment. The project owner should approve the response targets according to staffing, site risk, shift procedures, and the applicable service agreement.</p>
    `,
    sections: [
      { id: "assign-severity", heading: "How to Assign Severity", body: "Use safety, area importance, duration, impact, and urgency." },
      { id: "response-order", heading: "Recommended Response Order", body: "Prioritize safety and sustained high-impact events." },
      { id: "escalation-conditions", heading: "Escalation Conditions", body: "Escalate high-impact or unverified incidents." },
      { id: "handling-records", heading: "Handling Records", body: "Record the verification, actions, owner, and completion time." },
    ],
  },
  {
    ...commonMeta,
    id: "en-status-and-glossary",
    title: "Status Legend and Glossary",
    route: "/en/docs/status-reference",
    category: "System Overview",
    readingTime: 6,
    summary:
      "Understand device, alarm, and recording states, together with the core terms used throughout POLYTRON ONE.",
    tags: ["Status Legend", "Glossary", "English"],
    contentHtml: `
      <h2>Device States</h2>
      <ul>
        <li><p><strong>Online:</strong> The platform can connect to the device and read required status information. Confirm actual video availability by opening the stream.</p></li>
        <li><p><strong>Offline:</strong> The platform cannot establish a connection. Check power, network, address, ports, and credentials.</p></li>
        <li><p><strong>Abnormal:</strong> The device is recognized, but one or more capabilities are unavailable, such as video streaming, recording, or configuration retrieval.</p></li>
      </ul>
      <h2>Alarm States</h2>
      <ul>
        <li><p><strong>Pending verification:</strong> An alarm exists but has not completed human review.</p></li>
        <li><p><strong>In progress:</strong> The alarm requires action and handling has not finished.</p></li>
        <li><p><strong>Closed:</strong> Verification and handling are complete and the record is archived.</p></li>
        <li><p><strong>False alarm:</strong> The event does not meet the real-risk condition. Record the reason and consider whether the rule needs adjustment.</p></li>
      </ul>
      <h2>Core Terms</h2>
      <ul>
        <li><p><strong>Event:</strong> An observable change in camera imagery or device status.</p></li>
        <li><p><strong>Alarm:</strong> A traceable business record created when an event meets a detection rule.</p></li>
        <li><p><strong>Notification:</strong> A message and entry point that brings an alarm to a user's attention.</p></li>
        <li><p><strong>Detection rule:</strong> An AI analysis configuration consisting of target, region, trigger condition, effective schedule, and linked action.</p></li>
        <li><p><strong>Recording schedule:</strong> The configured periods and method used to retain camera recordings.</p></li>
        <li><p><strong>Main stream:</strong> A video stream generally used for high-quality viewing or recording.</p></li>
        <li><p><strong>Substream:</strong> A lower-bit-rate stream commonly used for multi-camera preview or bandwidth-constrained viewing.</p></li>
        <li><p><strong>Live 3D:</strong> A view that relates camera imagery to a 3D scene, building, floor, or spatial position.</p></li>
      </ul>
      <h2>Reading Status Cues</h2>
      <p>Color helps users scan status, but it does not replace text, icons, or detail information. If a deployment changes the color or status names, update its training material and response procedures accordingly.</p>
    `,
    sections: [
      { id: "device-states", heading: "Device States", body: "Definitions for online, offline, and abnormal." },
      { id: "alarm-states", heading: "Alarm States", body: "Definitions for pending, in progress, closed, and false alarm." },
      { id: "core-terms", heading: "Core Terms", body: "Definitions used across video, alarms, notifications, and rules." },
    ],
  },
  {
    ...commonMeta,
    id: "en-playback-export-evidence",
    title: "Recording Export and Evidence Retention",
    route: "/en/docs/playback/export-evidence",
    category: "Playback",
    readingTime: 6,
    summary:
      "Follow a traceable workflow from event location and recording review through clipping, export verification, naming, and secure retention.",
    tags: ["Recording Export", "Evidence", "English"],
    contentHtml: `
      <h2>When to Export</h2>
      <p>Export is used for alarm verification, incident review, security evidence, project reporting, and issue escalation. Before exporting, confirm that the account has playback and download permission for the relevant cameras and that project privacy requirements are satisfied.</p>
      <h2>Recommended Workflow</h2>
      <ol>
        <li><p><strong>Locate the event:</strong> Open Playback using the alarm time, camera, and location, then confirm that recordings exist for the target period.</p></li>
        <li><p><strong>Review the full context:</strong> Inspect footage before, during, and after the event instead of retaining only the trigger frame.</p></li>
        <li><p><strong>Set the clip range:</strong> Mark a clear start and end so that the file includes the necessary context without excessive footage.</p></li>
        <li><p><strong>Export:</strong> Confirm browser download permission, available disk space, and the intended storage location.</p></li>
        <li><p><strong>Verify the file:</strong> Open the exported file and check image, timestamp, duration, and playback completeness.</p></li>
        <li><p><strong>Register and retain:</strong> Record the incident identifier, camera, time range, exporter, and approved storage location.</p></li>
      </ol>
      <h2>File Naming</h2>
      <p>A practical structure is <strong>Date_Time_Location_Camera_EventType_EventID</strong>, for example <strong>20260720_143000_Office1F_CAM0460_RestrictedArea_EVT001</strong>. Use the project naming standard when one is defined.</p>
      <h2>Security Considerations</h2>
      <ul>
        <li><p>Export only the minimum time range and camera scope required for the task.</p></li>
        <li><p>Do not transfer recordings through unapproved personal drives, chat tools, cloud storage, or removable devices.</p></li>
        <li><p>Restrict access when footage contains identifiable people, work areas, or sensitive facilities.</p></li>
        <li><p>Before external sharing, confirm requirements for redaction, watermarking, approval, encryption, and access expiration.</p></li>
      </ul>
      <h2>Export Troubleshooting</h2>
      <p>Confirm that a recording exists, the clip range is valid, browser downloads are permitted, and local disk space is sufficient. If a file is too large, shorten the range or export multiple segments. Supported formats, duration limits, and file-size limits depend on the deployment.</p>
    `,
    sections: [
      { id: "when-to-export", heading: "When to Export", body: "Use export for authorized verification and evidence workflows." },
      { id: "recommended-workflow", heading: "Recommended Workflow", body: "Locate, review, clip, export, verify, and register." },
      { id: "file-naming", heading: "File Naming", body: "Use a traceable name based on time, location, camera, and event." },
      { id: "security-considerations", heading: "Security Considerations", body: "Minimize scope and use approved storage and transfer channels." },
    ],
  },
  {
    ...commonMeta,
    id: "en-ui-states",
    title: "Page States and Error Messages",
    route: "/en/docs/ui-states",
    category: "System Overview",
    readingTime: 5,
    summary:
      "Recognize loading, processing, empty, permission, connection, and operation-failure states and choose the appropriate response.",
    tags: ["Page States", "Error Messages", "English"],
    contentHtml: `
      <h2>How to Read a Page State</h2>
      <p>A page message normally identifies the current state, a possible cause, and an available action. Read and record the message before retrying. Avoid repeated clicks or changing several settings at once.</p>
      <h2>Loading and Processing</h2>
      <p>The system may be fetching data, generating a recording clip, exporting a file, or saving configuration. A short wait is normal. If the state continues significantly longer than expected, record the start time and check network connectivity, task status, and system resources.</p>
      <h2>No Data</h2>
      <p>An empty state does not always indicate a system failure. Review the date, time range, camera, alarm status, and active filters. Confirm that the account can access the resource and that recordings or events actually exist in the selected period.</p>
      <h2>Insufficient Permission</h2>
      <p>The current role cannot access the page, camera, or operation. Ask an administrator to check both feature permission and camera-resource permission. Do not bypass access control by sharing a privileged account.</p>
      <h2>Connection or Operation Failure</h2>
      <p>For a connection failure, check network availability, device state, and service health. For an operation failure, retain the error message and verify that the input and current record state allow the action. Stop and escalate after repeated failure.</p>
      <h2>Information to Provide</h2>
      <p>Include the page address, occurrence time, reproduction steps, error message, and screenshot. For camera, recording, or alarm issues, also include the camera identifier and event time. Remove passwords, tokens, and full stream credentials from screenshots.</p>
    `,
    sections: [
      { id: "read-page-state", heading: "How to Read a Page State", body: "Read and record the message before retrying." },
      { id: "loading-processing", heading: "Loading and Processing", body: "Wait briefly, then inspect network, task, and resource state." },
      { id: "no-data", heading: "No Data", body: "Check filters, permissions, and whether the data exists." },
      { id: "insufficient-permission", heading: "Insufficient Permission", body: "Ask an administrator to review feature and resource access." },
      { id: "connection-operation-failure", heading: "Connection or Operation Failure", body: "Record the error and troubleshoot by failure type." },
    ],
  },
  {
    ...commonMeta,
    id: "en-security-retention",
    title: "Security and Data Retention",
    route: "/en/docs/settings/security-retention",
    category: "Settings",
    readingTime: 7,
    summary:
      "Apply least-privilege access, secure shared workstations, control exports, and define recording, alarm, and log retention by project policy.",
    tags: ["Security", "Data Retention", "Permissions", "English"],
    contentHtml: `
      <h2>Least-Privilege Access</h2>
      <p>Users should receive only the features and camera resources required for their role. Administrator access, user management, system settings, log export, and large recording downloads should be limited to designated roles and reviewed regularly.</p>
      <h2>Accounts and Shared Workstations</h2>
      <ul>
        <li><p>Do not allow multiple people to share the same privileged account over an extended period.</p></li>
        <li><p>Do not enable saved passwords on public or temporary workstations.</p></li>
        <li><p>Lock the workstation when stepping away and sign out when the task is complete.</p></li>
        <li><p>Adjust roles and resource scope, or disable the account, when a person's responsibilities change or access is no longer required.</p></li>
      </ul>
      <h2>Recording, Alarm, and Log Retention</h2>
      <p>Set retention periods according to camera count, bit rate, storage capacity, investigation needs, and project policy. Recordings, alarm records, handling notes, and system logs may use different periods, but evidence for a critical incident should not be removed before investigation and audit are complete.</p>
      <h2>Export and External Sharing</h2>
      <p>Before exporting recordings, logs, or configuration, confirm the purpose, scope, recipient, and approval requirement. Apply redaction, watermarking, encryption, and access expiration when required, and record who exported the data, when it was exported, and where it is stored.</p>
      <h2>Periodic Review</h2>
      <p>Review administrator accounts, inactive accounts, role permissions, camera-resource scope, storage utilization, log retention, and abnormal sign-in records. Address excessive permission, abnormal account behavior, and storage-capacity risk promptly.</p>
      <h2>Project Policy Takes Priority</h2>
      <p>This page provides general operating principles. Password rules, retention periods, approval flows, and security classifications must follow the customer organization's policy, project contract, and applicable requirements.</p>
    `,
    sections: [
      { id: "least-privilege", heading: "Least-Privilege Access", body: "Assign only the features and resources required for the role." },
      { id: "shared-workstations", heading: "Accounts and Shared Workstations", body: "Protect credentials and shared monitoring terminals." },
      { id: "retention", heading: "Recording, Alarm, and Log Retention", body: "Balance traceability, project policy, and storage capacity." },
      { id: "external-sharing", heading: "Export and External Sharing", body: "Approve, protect, and register exported data." },
    ],
  },
  {
    ...commonMeta,
    id: "en-faq",
    title: "Frequently Asked Questions",
    route: "/en/docs/faq",
    category: "System Overview",
    readingTime: 8,
    summary:
      "Find answers to common questions about accounts, permissions, cameras, recordings, AI alarms, notifications, exports, and support information.",
    tags: ["FAQ", "Support", "English"],
    contentHtml: `
      <h2>Accounts and Permissions</h2>
      <h3>Why are some pages or cameras missing after sign-in?</h3>
      <p>The platform displays features and camera resources according to the user's role. Ask an administrator to check both feature permissions and camera-resource permissions.</p>
      <h3>What should I do if the password-reset email does not arrive?</h3>
      <p>Confirm that the submitted address is bound to the account and check the spam folder. If the email is still absent, ask an administrator to verify the account email and mail-service status.</p>
      <h2>Cameras and Live Video</h2>
      <h3>Why is there no image when the camera is online?</h3>
      <p>Online indicates that the basic device connection is available. Continue by checking the stream URL, codec, browser playback capability, and the current account's camera permission.</p>
      <h3>Why does image quality decrease in a multi-camera layout?</h3>
      <p>Multi-camera layouts may use a lower-bit-rate substream to reduce network and workstation load. Switch to a single pane or the appropriate high-quality stream when detail is required.</p>
      <h2>Recording and Export</h2>
      <h3>Why is the playback timeline empty?</h3>
      <p>Verify the camera, date, and time range. Confirm that a recording schedule covers the period, storage is available, and the recording task is operating normally.</p>
      <h3>What should I do if the exported video does not open?</h3>
      <p>Confirm that the download completed and that the file size is reasonable, then try the player recommended for the project. If playback still fails, export a shorter range and retain the error message.</p>
      <h2>AI Alarms and Notifications</h2>
      <h3>Why does live video work but no alarm is created?</h3>
      <p>Verify that the algorithm and rule are enabled, then check the detection region, direction, threshold, effective schedule, and rule state. Test with a controlled action that clearly meets the configured condition.</p>
      <h3>Why is an alarm missing from Notifications?</h3>
      <p>Review the time and status filters, automatic refresh, account visibility, and whether the alarm has already been closed or archived.</p>
      <h3>How should frequent false alarms be handled?</h3>
      <p>Record the likely cause. Check whether the detection area is too broad, whether reflections or background motion are present, whether the threshold is appropriate, and whether the schedule matches the scene.</p>
      <h2>Getting Help</h2>
      <p>Review the Troubleshooting page first. If the issue remains, provide the page address, occurrence time, camera identifier, reproduction steps, error message, screenshot, and relevant logs. Do not include passwords, tokens, or complete stream credentials.</p>
    `,
    sections: [
      { id: "accounts-permissions", heading: "Accounts and Permissions", body: "Resolve visibility and password-recovery questions." },
      { id: "cameras-live-video", heading: "Cameras and Live Video", body: "Resolve online-without-video and multi-camera quality issues." },
      { id: "recording-export", heading: "Recording and Export", body: "Resolve empty timelines and export playback issues." },
      { id: "alarms-notifications", heading: "AI Alarms and Notifications", body: "Resolve missing alarms, notification filters, and false alarms." },
      { id: "getting-help", heading: "Getting Help", body: "Provide reproducible evidence without exposing secrets." },
    ],
  },
];
