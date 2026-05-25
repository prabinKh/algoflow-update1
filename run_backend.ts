import { spawn } from "child_process";
import path from "path";
import fs from "fs";

export function startDjango() {
  const backendDir = path.join(process.cwd(), "backend");
  
  const runCommand = (cmd: string, args: string[]) => {
    console.log(`Running: ${cmd} ${args.join(" ")}`);
    const logStream = fs.createWriteStream(path.join(process.cwd(), 'backend.log'), { flags: 'a' });
    const proc = spawn(cmd, args, {
      cwd: backendDir,
      stdio: ["inherit", "pipe", "pipe"],
    });

    if (proc.stdout) proc.stdout.pipe(logStream);
    if (proc.stderr) proc.stderr.pipe(logStream);

    return new Promise<number>((resolve) => {
      proc.on("close", (code) => {
        resolve(code || 0);
      });
      proc.on("error", (err) => {
        console.error(`Failed to start ${cmd}:`, err);
        resolve(-1);
      });
    });
  };

  const cleanupExisting = async () => {
    console.log("Cleaning up existing Django processes...");
    const { execSync } = await import('child_process');
    try {
      if (process.platform === "win32") {
        try {
          const netstatOutput = execSync("netstat -ano").toString();
          const lines = netstatOutput.split("\n");
          for (const line of lines) {
            if (line.includes(":8000") && line.includes("LISTENING")) {
              const parts = line.trim().split(/\s+/);
              const pid = parts[parts.length - 1];
              if (pid && pid !== "0") {
                console.log(`Killing existing process on port 8000 with PID: ${pid}`);
                try { execSync(`taskkill /F /PID ${pid}`); } catch (e) { /* ignore */ }
              }
            }
          }
        } catch (e) { /* ignore */ }
        try {
          // Also kill any python processes running manage.py
          execSync('taskkill /F /IM python.exe /T');
        } catch (e) { /* ignore */ }
      } else {
        try {
          execSync("pkill -9 -f 'manage.py runserver'").toString();
        } catch (e) { /* ignore */ }
        try {
          const psOutput = execSync("ps aux | grep 'manage.py runserver' | grep -v grep").toString();
          const lines = psOutput.split('\n');
          for (const line of lines) {
            const parts = line.trim().split(/\s+/);
            if (parts.length > 1) {
              const pid = parseInt(parts[1]);
              if (!isNaN(pid)) {
                console.log(`Killing existing Django process: ${pid}`);
                try { process.kill(pid, 'SIGKILL'); } catch (e) { /* ignore */ }
              }
            }
          }
        } catch (e) { /* ignore */ }
      }
    } catch (e) {
      // Ignore if no processes found
    }
  };

  const start = async () => {
    // Kill any existing instances first
    await cleanupExisting();
    let pythonCmd = "python3";
    let code = await runCommand(pythonCmd, ["--version"]);
    
    if (code !== 0) {
      console.log("python3 not found, trying python...");
      pythonCmd = "python";
      code = await runCommand(pythonCmd, ["--version"]);
      if (code !== 0) {
        console.error("Neither python3 nor python found!");
        return;
      }
    }

    console.log(`Using ${pythonCmd} for Django backend`);

    // Ensure pip is available
    console.log("Checking for pip...");
    let pipCode = await runCommand(pythonCmd, ["-m", "pip", "--version"]);
    
    if (pipCode !== 0) {
      console.log("pip not found, attempting to install via get-pip.py...");
      const getPipScript = `
import urllib.request
import subprocess
import sys
import os

url = "https://bootstrap.pypa.io/get-pip.py"
print(f"Downloading {url}...")
urllib.request.urlretrieve(url, "get-pip.py")
print("Running get-pip.py...")
subprocess.run([sys.executable, "get-pip.py", "--user"], check=True)
os.remove("get-pip.py")
`;
      fs.writeFileSync(path.join(backendDir, 'install_pip.py'), getPipScript);
      await runCommand(pythonCmd, ['install_pip.py']);
      
      // Verify again
      pipCode = await runCommand(pythonCmd, ["-m", "pip", "--version"]);
      if (pipCode !== 0) {
        console.error("Failed to install pip. Backend will not start.");
        return;
      }
    }

    console.log("Installing Python dependencies...");
    await runCommand(pythonCmd, [
      "-m", "pip", "install", "--user", 
      "django", 
      "djangorestframework", 
      "djangorestframework-simplejwt", 
      "django-cors-headers", 
      "django-filter", 
      "django-ratelimit", 
      "celery", 
      "redis", 
      "google-genai", 
      "django-jazzmin", 
      "python-dotenv", 
      "pillow", 
      "PyJWT"
    ]);

    console.log("Running Django makemigrations...");
    await runCommand(pythonCmd, ["manage.py", "makemigrations", "account", "company", "eadmin", "efrontend"]);

    console.log("Starting Django migrations...");
    let migrateCode = await runCommand(pythonCmd, ["manage.py", "migrate"]);
    
    if (migrateCode !== 0) {
      console.log("Migrations failed. Check the backend.log for details.");
      console.log("NOT deleting the database to preserve existing data.");
      // Do NOT delete db.sqlite3 here — that would wipe all companies and user data!
      // If you need a fresh database, delete backend/db.sqlite3 manually.
    }
    
    if (migrateCode === 0) {
      console.log("Migrations completed successfully. Seeding products...");
      await runCommand(pythonCmd, ["manage.py", "seed_products"]);
      console.log("Seeding Apex users & companies...");
      await runCommand(pythonCmd, ["manage.py", "seed_apex_users"]);

      console.log("Starting Django server...");
      const logStream = fs.createWriteStream(path.join(process.cwd(), 'backend.log'), { flags: 'a' });
      logStream.write(`[${new Date().toISOString()}] Attempting to start Django on 8001...\n`);
      const server = spawn(pythonCmd, ["-u", "manage.py", "runserver", "0.0.0.0:8001", "--noreload"], {
        cwd: backendDir,
        stdio: ["inherit", "pipe", "pipe"],
        env: { ...process.env, PYTHONUNBUFFERED: "1" }
      });

      if (server.stdout) server.stdout.pipe(logStream);
      if (server.stderr) server.stderr.pipe(logStream);

      server.on("error", (err) => {
        console.error("Failed to start Django server:", err);
      });
    } else {
      console.error(`Migrations failed with code ${migrateCode}`);
    }
  };

  start();
}
