const WASM_CDN = "https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.2/";
const DB_NAME = "htmsql-content-db";
const STORE_NAME = "db";
const DB_KEY = "main";

const root = document.getElementById("app");
const pageSlug = document.body.dataset.page || "home";
let db;

function openIndexedDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function readDbBytes() {
  const database = await openIndexedDb();
  return new Promise((resolve, reject) => {
    const tx = database.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(DB_KEY);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => database.close();
    tx.onerror = () => database.close();
  });
}

async function writeDbBytes(bytes) {
  const database = await openIndexedDb();
  return new Promise((resolve, reject) => {
    const tx = database.transaction(STORE_NAME, "readwrite");
    tx.oncomplete = () => {
      database.close();
      resolve();
    };
    tx.onerror = () => {
      database.close();
      reject(tx.error);
    };
    tx.objectStore(STORE_NAME).put(bytes, DB_KEY);
  });
}

async function persistDatabase() {
  const data = db.export();
  await writeDbBytes(data);
}

function normalizeBytes(bytes) {
  if (!bytes) {
    return null;
  }
  if (bytes instanceof Uint8Array) {
    return bytes;
  }
  return new Uint8Array(bytes);
}

function getScalar(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  let value = null;
  if (stmt.step()) {
    value = stmt.get()[0];
  }
  stmt.free();
  return value;
}

function getRows(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

function createTables() {
  db.exec(
    "CREATE TABLE IF NOT EXISTS pages (slug TEXT PRIMARY KEY, title TEXT NOT NULL);"
  );
  db.exec(
    "CREATE TABLE IF NOT EXISTS blocks (id INTEGER PRIMARY KEY AUTOINCREMENT, page_slug TEXT NOT NULL, block_order INTEGER NOT NULL, type TEXT NOT NULL, payload TEXT NOT NULL);"
  );
}

function seedIfEmpty() {
  const count = getScalar("SELECT COUNT(*) FROM pages;");
  if (count > 0) {
    return false;
  }

  const pages = [
    { slug: "home", title: "HTMSQL — HTML + SQL Framework" },
    { slug: "docs", title: "HTMSQL Docs" },
    { slug: "launch", title: "Launch HTMSQL" },
    { slug: "start", title: "Start Building" },
    { slug: "generate", title: "Generate Project" },
    { slug: "sales", title: "Talk to Sales" },
  ];

  const blocks = [];
  const addBlock = (pageSlug, order, type, payload) => {
    blocks.push({ pageSlug, order, type, payload });
  };

  addBlock("global", 10, "nav", {
    logo: "HTMSQL",
    logoHref: "index.html",
    links: [
      { label: "Features", href: "index.html#features" },
      { label: "Why HTMSQL", href: "index.html#stats" },
      { label: "Get Started", href: "index.html#cta" },
    ],
    actions: [{ label: "Launch App", href: "launch.html", style: "primary" }],
  });

  addBlock("global", 90, "footer", {
    brand: "HTMSQL",
    brandHref: "index.html",
    tagline: "HTML & SQL. That is the stack.",
    links: [
      { label: "Features", href: "index.html#features" },
      { label: "Performance", href: "index.html#stats" },
      { label: "Get started", href: "index.html#cta" },
    ],
  });

  addBlock("home", 20, "hero", {
    badge: "New • The HTML + SQL runtime",
    title: "HTMSQL is the web framework that speaks HTML & SQL.",
    lead:
      "Build data-driven interfaces without servers, without ORMs, and without build steps. The JS/WASM runtime is invisible glue—developers only write HTML and SQL.",
    actions: [
      { label: "Start Building", href: "start.html", style: "primary" },
      { label: "View Docs", href: "docs.html", style: "secondary" },
    ],
    meta: ["Local-first", "Zero tooling", "Instant persistence"],
    card: {
      header: { left: "app.htmsql", right: "Live" },
      code:
        "<section>\n  <h2>Latest Orders</h2>\n  <table>\n    {{ SQL:\n      SELECT id, total, status\n      FROM orders\n      ORDER BY created_at DESC\n      LIMIT 5;\n    }}\n  </table>\n</section>",
      footer: [
        { value: "12ms", label: "query time" },
        { value: "99.98%", label: "local uptime" },
      ],
    },
  });

  addBlock("home", 30, "stats", {
    id: "stats",
    items: [
      { value: "0", label: "servers required" },
      { value: "1", label: "language to ship" },
      { value: "100%", label: "browser-native" },
    ],
  });

  addBlock("home", 40, "feature-grid", {
    id: "features",
    heading: "Everything you need to ship data-rich UI.",
    lead:
      "HTMSQL keeps your data and UI in sync with a SQL-first renderer and a modern HTML runtime.",
    items: [
      {
        title: "SQL-native components",
        body:
          "Compose layouts with SQL blocks that render directly into HTML. No ORM mapping, no glue code.",
      },
      {
        title: "Instant persistence",
        body:
          "Local-first storage means your app keeps state even offline. Sync later, ship now.",
      },
      {
        title: "Zero-build pipeline",
        body:
          "Drop in a single HTML file. HTMSQL handles execution in the browser with no bundlers or tooling.",
      },
      {
        title: "Enterprise-grade security",
        body:
          "Your data stays in the client. No servers, no leaked credentials, no surprises.",
      },
    ],
  });

  addBlock("home", 50, "cta", {
    id: "cta",
    heading: "Ship your first HTMSQL app in minutes.",
    body: "Join the developers replacing stacks with a single HTML file.",
    actions: [
      { label: "Generate Project", href: "generate.html", style: "primary" },
      { label: "Talk to Sales", href: "sales.html", style: "secondary" },
    ],
  });

  addBlock("docs", 20, "hero", {
    badge: "Docs",
    title: "HTMSQL Documentation",
    lead:
      "Learn the primitives that power HTMSQL and build production-ready HTML + SQL apps.",
    actions: [
      { label: "Start Building", href: "start.html", style: "primary" },
      { label: "Launch App", href: "launch.html", style: "secondary" },
    ],
  });

  addBlock("docs", 30, "content", {
    id: "overview",
    heading: "What is HTMSQL?",
    body: [
      "HTMSQL is a browser-native runtime that pairs HTML with SQL queries to render UI instantly.",
      "Developers author only HTML and SQL; a lightweight JS/WASM layer runs the queries and handles persistence behind the scenes.",
    ],
  });

  addBlock("docs", 40, "card-grid", {
    heading: "Core concepts",
    lead: "Master the three building blocks that make HTMSQL feel effortless.",
    items: [
      {
        title: "Blocks",
        body: "Define sections that render from SQL with the runtime handling execution.",
      },
      {
        title: "Stores",
        body: "Local-first persistence keeps data fast and reliable everywhere via WASM SQLite.",
      },
      {
        title: "Flows",
        body: "Composable steps that capture, transform, and render data.",
      },
    ],
  });

  addBlock("docs", 50, "code-section", {
    heading: "Your first HTMSQL query",
    body: "Drop SQL directly into HTML and the runtime renders the table.",
    code:
      "<section>\n  <h2>Accounts</h2>\n  {{ SQL:\n    SELECT name, tier, status\n    FROM accounts\n    WHERE status = 'active';\n  }}\n</section>",
  });

  addBlock("docs", 60, "steps", {
    heading: "Recommended workflow",
    items: [
      {
        title: "Design the HTML layout",
        body: "Sketch sections and components as plain HTML.",
      },
      {
        title: "Attach SQL blocks",
        body: "Bind each section to a SQL statement while the runtime handles JS/WASM.",
      },
      {
        title: "Ship and iterate",
        body: "Persist data locally, then sync when you are ready.",
      },
    ],
  });

  addBlock("docs", 80, "cta", {
    heading: "Ready to dive deeper?",
    body: "Generate a project and explore the runtime with real data.",
    actions: [
      { label: "Generate Project", href: "generate.html", style: "primary" },
      { label: "Launch App", href: "launch.html", style: "secondary" },
    ],
  });

  addBlock("launch", 20, "hero", {
    badge: "Runtime",
    title: "Launch the HTMSQL App",
    lead:
      "Run the full HTMSQL runtime in minutes and start exploring the HTML + SQL workflow.",
    actions: [
      { label: "Start Building", href: "start.html", style: "primary" },
      { label: "Generate Project", href: "generate.html", style: "secondary" },
    ],
  });

  addBlock("launch", 40, "steps", {
    heading: "Launch in three steps",
    items: [
      {
        title: "Open the runtime",
        body: "Launch the local HTMSQL runtime from any modern browser.",
      },
      {
        title: "Connect your data",
        body: "Load your SQLite data or start with a starter dataset.",
      },
      {
        title: "Build live UI",
        body: "Compose HTML sections and see SQL results instantly.",
      },
    ],
  });

  addBlock("launch", 50, "card-grid", {
    heading: "Runtime modes",
    lead: "Pick the workflow that matches your team.",
    items: [
      {
        title: "Local-first",
        body: "Everything runs inside the browser with persistent storage.",
      },
      {
        title: "Hybrid sync",
        body: "Work offline, then sync to your team database later.",
      },
      {
        title: "Demo mode",
        body: "Share a self-contained HTML file with live data.",
      },
    ],
  });

  addBlock("launch", 80, "cta", {
    heading: "Ready for the live runtime?",
    body: "Start the app and render your first SQL-powered UI.",
    actions: [
      { label: "Launch App", href: "launch.html", style: "primary" },
      { label: "View Docs", href: "docs.html", style: "secondary" },
    ],
  });

  addBlock("start", 20, "hero", {
    badge: "Quickstart",
    title: "Start Building with HTMSQL",
    lead:
      "Spin up a project in minutes and ship an HTML + SQL experience without tooling.",
    actions: [
      { label: "Generate Project", href: "generate.html", style: "primary" },
      { label: "View Docs", href: "docs.html", style: "secondary" },
    ],
  });

  addBlock("start", 40, "steps", {
    heading: "Quickstart checklist",
    items: [
      {
        title: "Create an HTML shell",
        body: "Start with your layout and mark where SQL should render.",
      },
      {
        title: "Define SQL blocks",
        body: "Bind data queries directly in the markup.",
      },
      {
        title: "Deploy instantly",
        body: "Share the file or host it anywhere with no build step.",
      },
    ],
  });

  addBlock("start", 50, "code-section", {
    heading: "Sample HTMSQL layout",
    body: "HTMSQL lets you co-locate UI and data without a framework.",
    code:
      "<section>\n  <h2>Active Tasks</h2>\n  {{ SQL:\n    SELECT title, owner\n    FROM tasks\n    WHERE status = 'open'\n    LIMIT 10;\n  }}\n</section>",
  });

  addBlock("start", 60, "card-grid", {
    heading: "Starter templates",
    lead: "Jump into common use cases with prebuilt layouts.",
    items: [
      { title: "Operations Dashboard", body: "Track KPIs with SQL-driven cards." },
      { title: "Customer Workspace", body: "Keep everything local-first." },
      { title: "Offline Field App", body: "Use SQLite with instant sync." },
    ],
  });

  addBlock("start", 80, "cta", {
    heading: "Build your first HTMSQL experience.",
    body: "Generate a project and start editing the content database.",
    actions: [
      { label: "Generate Project", href: "generate.html", style: "primary" },
      { label: "Talk to Sales", href: "sales.html", style: "secondary" },
    ],
  });

  addBlock("generate", 20, "hero", {
    badge: "Generator",
    title: "Generate an HTMSQL Project",
    lead:
      "Scaffold a production-ready HTMSQL app with templates for every team.",
    actions: [
      { label: "Start Building", href: "start.html", style: "primary" },
      { label: "View Docs", href: "docs.html", style: "secondary" },
    ],
  });

  addBlock("generate", 40, "card-grid", {
    heading: "Choose your template",
    lead: "Every template ships with SQL-ready layouts and sample data.",
    items: [
      { title: "Analytics Studio", body: "Dashboards, KPIs, and alerts." },
      { title: "Support Console", body: "Queues, triage, and customer history." },
      { title: "Project Hub", body: "Tasks, roadmaps, and team updates." },
    ],
  });

  addBlock("generate", 50, "code-section", {
    heading: "Generate from the CLI",
    body: "Create a new project in seconds.",
    code: "htmsql new my-project --template analytics\ncd my-project\nopen index.html",
  });

  addBlock("generate", 80, "cta", {
    heading: "Need a custom template?",
    body: "Talk to us about enterprise-ready HTMSQL starter kits.",
    actions: [
      { label: "Talk to Sales", href: "sales.html", style: "primary" },
      { label: "Launch App", href: "launch.html", style: "secondary" },
    ],
  });

  addBlock("sales", 20, "hero", {
    badge: "Sales",
    title: "Talk to the HTMSQL team",
    lead:
      "See how HTMSQL replaces traditional stacks with a single HTML + SQL file.",
    actions: [
      { label: "Book a demo", href: "sales.html#contact", style: "primary" },
      { label: "View Docs", href: "docs.html", style: "secondary" },
    ],
  });

  addBlock("sales", 40, "card-grid", {
    id: "contact",
    heading: "Contact options",
    lead: "Reach us in the format that works for you.",
    items: [
      { title: "Live demo", body: "Schedule a walkthrough with our engineers." },
      { title: "Enterprise sales", body: "Plan your rollout and security review." },
      { title: "Partnerships", body: "Explore integrations and co-marketing." },
    ],
  });

  addBlock("sales", 50, "faq", {
    heading: "Frequently asked questions",
    items: [
      {
        question: "Does HTMSQL work offline?",
        answer: "Yes. HTMSQL runs entirely in-browser and persists data locally.",
      },
      {
        question: "How do we sync to our backend?",
        answer:
          "Use the hybrid sync runtime to export SQLite changes when you are ready.",
      },
      {
        question: "Can we white-label the runtime?",
        answer: "Enterprise plans include custom branding and templates.",
      },
    ],
  });

  addBlock("sales", 80, "cta", {
    heading: "Ready to make the switch?",
    body: "Let us tailor HTMSQL for your team.",
    actions: [
      { label: "Book a demo", href: "sales.html#contact", style: "primary" },
      { label: "Generate Project", href: "generate.html", style: "secondary" },
    ],
  });

  const pageStmt = db.prepare("INSERT INTO pages (slug, title) VALUES (?, ?);");
  pages.forEach((page) => pageStmt.run([page.slug, page.title]));
  pageStmt.free();

  const blockStmt = db.prepare(
    "INSERT INTO blocks (page_slug, block_order, type, payload) VALUES (?, ?, ?, ?);"
  );
  blocks.forEach((block) =>
    blockStmt.run([
      block.pageSlug,
      block.order,
      block.type,
      JSON.stringify(block.payload),
    ])
  );
  blockStmt.free();

  return true;
}

function ensureNavLogoLink() {
  const [navBlock] = getRows(
    "SELECT id, payload FROM blocks WHERE page_slug = ? AND type = ? LIMIT 1;",
    ["global", "nav"]
  );
  if (!navBlock) {
    return false;
  }
  const payload = JSON.parse(navBlock.payload || "{}");
  if (payload.logoHref) {
    return false;
  }
  payload.logoHref = "index.html";
  const stmt = db.prepare("UPDATE blocks SET payload = ? WHERE id = ?;");
  stmt.run([JSON.stringify(payload), navBlock.id]);
  stmt.free();
  return true;
}

function ensureFooterBrandLink() {
  const [footerBlock] = getRows(
    "SELECT id, payload FROM blocks WHERE page_slug = ? AND type = ? LIMIT 1;",
    ["global", "footer"]
  );
  if (!footerBlock) {
    return false;
  }
  const payload = JSON.parse(footerBlock.payload || "{}");
  if (payload.brandHref) {
    return false;
  }
  payload.brandHref = "index.html";
  const stmt = db.prepare("UPDATE blocks SET payload = ? WHERE id = ?;");
  stmt.run([JSON.stringify(payload), footerBlock.id]);
  stmt.free();
  return true;
}

function ensureNavActionsClean() {
  const [navBlock] = getRows(
    "SELECT id, payload FROM blocks WHERE page_slug = ? AND type = ? LIMIT 1;",
    ["global", "nav"]
  );
  if (!navBlock) {
    return false;
  }
  const payload = JSON.parse(navBlock.payload || "{}");
  const actions = Array.isArray(payload.actions) ? payload.actions : [];
  const filtered = actions.filter(
    (action) =>
      !/changelog/i.test(action.label || "") &&
      !/changelog/i.test(action.href || "")
  );
  if (filtered.length === actions.length) {
    return false;
  }
  payload.actions = filtered;
  const stmt = db.prepare("UPDATE blocks SET payload = ? WHERE id = ?;");
  stmt.run([JSON.stringify(payload), navBlock.id]);
  stmt.free();
  return true;
}

function ensureNavLinksValid() {
  const [navBlock] = getRows(
    "SELECT id, payload FROM blocks WHERE page_slug = ? AND type = ? LIMIT 1;",
    ["global", "nav"]
  );
  if (!navBlock) {
    return false;
  }
  const payload = JSON.parse(navBlock.payload || "{}");
  const defaultLinks = [
    { label: "Features", href: "index.html#features" },
    { label: "Why HTMSQL", href: "index.html#stats" },
    { label: "Get Started", href: "index.html#cta" },
  ];
  let changed = false;

  const existingLinks = Array.isArray(payload.links) ? payload.links : [];
  if (!existingLinks.length) {
    payload.links = defaultLinks;
    changed = true;
  } else {
    const updatedLinks = existingLinks.map((link) => {
      const updated = { ...link };
      const label = (updated.label || "").trim() || "Link";
      let href = (updated.href || "").trim();
      if (!href) {
        const lowered = label.toLowerCase();
        if (lowered.includes("feature")) {
          href = "index.html#features";
        } else if (lowered.includes("why") || lowered.includes("performance")) {
          href = "index.html#stats";
        } else if (lowered.includes("start") || lowered.includes("get")) {
          href = "index.html#cta";
        } else {
          href = "index.html";
        }
      }
      if (label !== updated.label || href !== updated.href) {
        changed = true;
      }
      updated.label = label;
      updated.href = href;
      return updated;
    });
    payload.links = updatedLinks;
  }

  const existingActions = Array.isArray(payload.actions) ? payload.actions : [];
  if (!existingActions.length) {
    payload.actions = [
      { label: "Launch App", href: "launch.html", style: "primary" },
    ];
    changed = true;
  } else {
    const updatedActions = existingActions.map((action) => {
      const updated = { ...action };
      const label = (updated.label || "").trim() || "Action";
      let href = (updated.href || "").trim();
      if (!href) {
        const lowered = label.toLowerCase();
        if (lowered.includes("launch")) {
          href = "launch.html";
        } else if (lowered.includes("docs")) {
          href = "docs.html";
        } else if (lowered.includes("start")) {
          href = "start.html";
        } else {
          href = "index.html";
        }
      }
      if (label !== updated.label || href !== updated.href) {
        changed = true;
      }
      updated.label = label;
      updated.href = href;
      return updated;
    });
    payload.actions = updatedActions;
  }

  if (!changed) {
    return false;
  }
  const stmt = db.prepare("UPDATE blocks SET payload = ? WHERE id = ?;");
  stmt.run([JSON.stringify(payload), navBlock.id]);
  stmt.free();
  return true;
}

function createButton(action, fallbackStyle = "secondary") {
  const button = document.createElement("a");
  const style = action.style || fallbackStyle;
  button.className = `btn ${style}`;
  button.href = action.href || "#";
  button.textContent = action.label || "Learn more";
  return button;
}

function appendParagraphs(container, body) {
  if (!body) {
    return;
  }
  const paragraphs = Array.isArray(body) ? body : [body];
  paragraphs.forEach((text) => {
    const p = document.createElement("p");
    p.textContent = text;
    container.appendChild(p);
  });
}

function renderNav(payload) {
  const header = document.createElement("header");
  header.className = "site-header";

  const nav = document.createElement("nav");
  nav.className = "nav container";

  const logo = document.createElement("a");
  logo.className = "logo";
  logo.textContent = payload.logo || "HTMSQL";
  logo.href = payload.logoHref || "index.html";

  const links = document.createElement("div");
  links.className = "nav-links";
  (payload.links || []).forEach((link) => {
    const anchor = document.createElement("a");
    anchor.href = link.href || "#";
    anchor.textContent = link.label || "Link";
    links.appendChild(anchor);
  });

  const actions = document.createElement("div");
  actions.className = "nav-actions";
  (payload.actions || []).forEach((action) => {
    actions.appendChild(createButton(action));
  });

  nav.appendChild(logo);
  nav.appendChild(links);
  nav.appendChild(actions);
  header.appendChild(nav);
  return header;
}

function renderHero(payload) {
  const section = document.createElement("section");
  const hasCard = Boolean(payload.card);
  section.className = `hero container${hasCard ? "" : " hero-simple"}`;

  const content = document.createElement("div");
  content.className = "hero-content";

  if (payload.badge) {
    const badge = document.createElement("span");
    badge.className = "badge";
    badge.textContent = payload.badge;
    content.appendChild(badge);
  }

  const title = document.createElement("h1");
  title.textContent = payload.title || "HTMSQL";
  content.appendChild(title);

  if (payload.lead) {
    const lead = document.createElement("p");
    lead.className = "lead";
    lead.textContent = payload.lead;
    content.appendChild(lead);
  }

  if (payload.actions?.length) {
    const actions = document.createElement("div");
    actions.className = "hero-actions";
    payload.actions.forEach((action) => actions.appendChild(createButton(action)));
    content.appendChild(actions);
  }

  if (payload.meta?.length) {
    const meta = document.createElement("div");
    meta.className = "hero-meta";
    payload.meta.forEach((item) => {
      const span = document.createElement("span");
      span.textContent = item;
      meta.appendChild(span);
    });
    content.appendChild(meta);
  }

  section.appendChild(content);

  if (payload.card) {
    const card = document.createElement("div");
    card.className = "hero-card";

    const header = document.createElement("div");
    header.className = "card-header";
    const headerLeft = document.createElement("span");
    headerLeft.textContent = payload.card.header?.left || "app.htmsql";
    const headerRight = document.createElement("span");
    headerRight.className = "pill";
    headerRight.textContent = payload.card.header?.right || "Live";
    header.appendChild(headerLeft);
    header.appendChild(headerRight);

    const pre = document.createElement("pre");
    pre.className = "code-block";
    const code = document.createElement("code");
    code.textContent = payload.card.code || "";
    pre.appendChild(code);

    const footer = document.createElement("div");
    footer.className = "card-footer";
    (payload.card.footer || []).forEach((item) => {
      const wrapper = document.createElement("div");
      const strong = document.createElement("strong");
      strong.textContent = item.value;
      const label = document.createElement("span");
      label.textContent = item.label;
      wrapper.appendChild(strong);
      wrapper.appendChild(label);
      footer.appendChild(wrapper);
    });

    card.appendChild(header);
    card.appendChild(pre);
    card.appendChild(footer);
    section.appendChild(card);
  }

  return section;
}

function renderStats(payload) {
  const section = document.createElement("section");
  section.className = "stats container";
  (payload.items || []).forEach((item) => {
    const card = document.createElement("div");
    card.className = "stat-card";
    const value = document.createElement("h3");
    value.textContent = item.value;
    const label = document.createElement("p");
    label.textContent = item.label;
    card.appendChild(value);
    card.appendChild(label);
    section.appendChild(card);
  });
  return section;
}

function renderFeatureGrid(payload) {
  const section = document.createElement("section");
  section.className = "features container";

  const heading = document.createElement("div");
  heading.className = "section-heading";
  const title = document.createElement("h2");
  title.textContent = payload.heading || "Features";
  heading.appendChild(title);
  if (payload.lead) {
    const lead = document.createElement("p");
    lead.textContent = payload.lead;
    heading.appendChild(lead);
  }

  const grid = document.createElement("div");
  grid.className = "feature-grid";
  (payload.items || []).forEach((item) => {
    const card = document.createElement("article");
    card.className = "feature-card";
    const cardTitle = document.createElement("h3");
    cardTitle.textContent = item.title;
    const cardBody = document.createElement("p");
    cardBody.textContent = item.body;
    card.appendChild(cardTitle);
    card.appendChild(cardBody);
    grid.appendChild(card);
  });

  section.appendChild(heading);
  section.appendChild(grid);
  return section;
}

function renderContent(payload) {
  const section = document.createElement("section");
  section.className = "content-section container";
  const heading = document.createElement("h2");
  heading.textContent = payload.heading || "Overview";
  section.appendChild(heading);
  appendParagraphs(section, payload.body);
  return section;
}

function renderCardGrid(payload) {
  const section = document.createElement("section");
  section.className = "card-grid-section container";

  const heading = document.createElement("div");
  heading.className = "section-heading";
  const title = document.createElement("h2");
  title.textContent = payload.heading || "Highlights";
  heading.appendChild(title);
  if (payload.lead) {
    const lead = document.createElement("p");
    lead.textContent = payload.lead;
    heading.appendChild(lead);
  }

  const grid = document.createElement("div");
  grid.className = "card-grid";
  (payload.items || []).forEach((item) => {
    const card = document.createElement("article");
    card.className = "card";
    const cardTitle = document.createElement("h3");
    cardTitle.textContent = item.title;
    const cardBody = document.createElement("p");
    cardBody.textContent = item.body;
    card.appendChild(cardTitle);
    card.appendChild(cardBody);
    if (item.list?.length) {
      const list = document.createElement("ul");
      item.list.forEach((listItem) => {
        const li = document.createElement("li");
        li.textContent = listItem;
        list.appendChild(li);
      });
      card.appendChild(list);
    }
    grid.appendChild(card);
  });

  section.appendChild(heading);
  section.appendChild(grid);
  return section;
}

function renderSteps(payload) {
  const section = document.createElement("section");
  section.className = "steps container";

  const heading = document.createElement("h2");
  heading.textContent = payload.heading || "Steps";
  section.appendChild(heading);

  const list = document.createElement("div");
  list.className = "step-list";
  (payload.items || []).forEach((item, index) => {
    const step = document.createElement("div");
    step.className = "step";
    const badge = document.createElement("span");
    badge.className = "step-number";
    badge.textContent = String(index + 1).padStart(2, "0");
    const content = document.createElement("div");
    const title = document.createElement("h3");
    title.textContent = item.title;
    const body = document.createElement("p");
    body.textContent = item.body;
    content.appendChild(title);
    content.appendChild(body);
    step.appendChild(badge);
    step.appendChild(content);
    list.appendChild(step);
  });

  section.appendChild(list);
  return section;
}

function renderCodeSection(payload) {
  const section = document.createElement("section");
  section.className = "code-section container";
  const heading = document.createElement("h2");
  heading.textContent = payload.heading || "Example";
  section.appendChild(heading);
  appendParagraphs(section, payload.body);
  const pre = document.createElement("pre");
  pre.className = "code-block";
  const code = document.createElement("code");
  code.textContent = payload.code || "";
  pre.appendChild(code);
  section.appendChild(pre);
  return section;
}

function renderFaq(payload) {
  const section = document.createElement("section");
  section.className = "faq container";
  const heading = document.createElement("h2");
  heading.textContent = payload.heading || "FAQ";
  section.appendChild(heading);

  const grid = document.createElement("div");
  grid.className = "faq-grid";
  (payload.items || []).forEach((item) => {
    const card = document.createElement("article");
    card.className = "faq-item";
    const question = document.createElement("h3");
    question.textContent = item.question;
    const answer = document.createElement("p");
    answer.textContent = item.answer;
    card.appendChild(question);
    card.appendChild(answer);
    grid.appendChild(card);
  });
  section.appendChild(grid);
  return section;
}

function renderCta(payload) {
  const section = document.createElement("section");
  section.className = "cta";
  const card = document.createElement("div");
  card.className = "cta-card container";
  const content = document.createElement("div");
  const heading = document.createElement("h2");
  heading.textContent = payload.heading || "Get started";
  const body = document.createElement("p");
  body.textContent = payload.body || "";
  content.appendChild(heading);
  content.appendChild(body);

  const actions = document.createElement("div");
  actions.className = "cta-actions";
  (payload.actions || []).forEach((action) =>
    actions.appendChild(createButton(action, "primary"))
  );

  card.appendChild(content);
  card.appendChild(actions);
  section.appendChild(card);
  return section;
}

function renderFooter(payload) {
  const footer = document.createElement("footer");
  footer.className = "footer";
  const inner = document.createElement("div");
  inner.className = "container footer-inner";
  const brand = document.createElement("div");
  const strong = document.createElement("a");
  strong.href = payload.brandHref || "index.html";
  strong.textContent = payload.brand || "HTMSQL";
  const tagline = document.createElement("p");
  tagline.textContent = payload.tagline || "";
  brand.appendChild(strong);
  brand.appendChild(tagline);

  const links = document.createElement("div");
  links.className = "footer-links";
  (payload.links || []).forEach((link) => {
    const anchor = document.createElement("a");
    anchor.href = link.href || "#";
    anchor.textContent = link.label || "Link";
    links.appendChild(anchor);
  });

  inner.appendChild(brand);
  inner.appendChild(links);
  footer.appendChild(inner);
  return footer;
}

function renderBlock(type, payload) {
  switch (type) {
    case "nav":
      return renderNav(payload);
    case "hero":
      return renderHero(payload);
    case "stats":
      return renderStats(payload);
    case "feature-grid":
      return renderFeatureGrid(payload);
    case "content":
      return renderContent(payload);
    case "card-grid":
      return renderCardGrid(payload);
    case "steps":
      return renderSteps(payload);
    case "code-section":
      return renderCodeSection(payload);
    case "faq":
      return renderFaq(payload);
    case "cta":
      return renderCta(payload);
    case "footer":
      return renderFooter(payload);
    default:
      return null;
  }
}

function applyBlockMetadata(element, payload) {
  if (payload?.id) {
    element.id = payload.id;
  }
}

function renderPage() {
  if (!root) {
    return;
  }
  root.innerHTML = "";

  const main = document.createElement("main");
  main.className = "page";

  const blocks = getRows(
    "SELECT type, payload FROM blocks WHERE page_slug IN (?, ?) ORDER BY block_order ASC, id ASC;",
    ["global", pageSlug]
  );

  let footerElement = null;
  blocks.forEach((block) => {
    const payload = JSON.parse(block.payload || "{}");
    const element = renderBlock(block.type, payload);
    if (!element) {
      return;
    }
    applyBlockMetadata(element, payload);
    if (block.type === "nav") {
      root.appendChild(element);
      return;
    }
    if (block.type === "footer") {
      footerElement = element;
      return;
    }
    main.appendChild(element);
  });

  root.appendChild(main);
  if (footerElement) {
    root.appendChild(footerElement);
  }
}

async function initialize() {
  const SQL = await initSqlJs({
    locateFile: (file) => `${WASM_CDN}${file}`,
  });
  const storedBytes = normalizeBytes(await readDbBytes());
  db = storedBytes ? new SQL.Database(storedBytes) : new SQL.Database();
  createTables();
  const seeded = seedIfEmpty();
  const updatedNav = ensureNavLogoLink();
  const updatedFooter = ensureFooterBrandLink();
  const cleanedNav = ensureNavActionsClean();
  const updatedLinks = ensureNavLinksValid();
  if (seeded || updatedNav || updatedFooter || cleanedNav || updatedLinks) {
    await persistDatabase();
  }

  const title = getScalar("SELECT title FROM pages WHERE slug = ?;", [pageSlug]);
  if (title) {
    document.title = title;
  }
  renderPage();
}

const ready = initialize().catch((error) => {
  if (root) {
    root.textContent = `Failed to load HTMSQL content: ${
      error instanceof Error ? error.message : String(error)
    }`;
  }
});

window.htmlsql = {
  ready,
  exec: async (sql, params = []) => {
    await ready;
    const stmt = db.prepare(sql);
    stmt.bind(params);
    const results = [];
    const isSelect = /^\s*(select|with)\b/i.test(sql);
    if (isSelect) {
      while (stmt.step()) {
        results.push(stmt.getAsObject());
      }
    } else {
      stmt.run();
    }
    stmt.free();
    await persistDatabase();
    return results;
  },
  render: async () => {
    await ready;
    renderPage();
  },
};
