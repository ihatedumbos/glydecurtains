# Local Development Commands

Run all commands from PowerShell.

## First-time setup

```powershell
cd C:\Users\ihate\IdeaProjects\Personal\GlydeCurtains\glydecurtains\frontend
npm install
npm approve-scripts esbuild
```

## Start the application for a full UI preview

Open two PowerShell terminals.

### Terminal 1: Backend with local UI authorization bypass

```powershell
cd C:\Users\ihate\IdeaProjects\Personal\GlydeCurtains\glydecurtains\backend
.\mvnw.cmd -Dspring-boot.run.profiles=local-ui spring-boot:run
```

`local-ui` bypasses authentication and permissions only for local visual testing. Never use it in Docker, integration, or production.

### Terminal 2: Frontend

```powershell
cd C:\Users\ihate\IdeaProjects\Personal\GlydeCurtains\glydecurtains\frontend
npm run dev
```

Open the storefront at http://localhost:5173.

## Start with normal security enabled

Use this backend command when testing login and real permissions:

```powershell
cd C:\Users\ihate\IdeaProjects\Personal\GlydeCurtains\glydecurtains\backend
.\mvnw.cmd spring-boot:run
```

The local seeded admin account is:

- Email: `admin@glydecurtains.com`
- Password: `admin123`

Change this password before any non-local use.

## Verify frontend changes

```powershell
cd C:\Users\ihate\IdeaProjects\Personal\GlydeCurtains\glydecurtains\frontend
npm run build
npm run lint
```

## Check dependency advisories

```powershell
cd C:\Users\ihate\IdeaProjects\Personal\GlydeCurtains\glydecurtains\frontend
npm audit
```

Review audit results before running any automatic dependency upgrade.
