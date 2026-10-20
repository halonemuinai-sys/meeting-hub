import os
import sys
import time
import paramiko

# Server Credentials (as provided by user)
SSH_HOST = os.getenv("PROXMOX_SSH_HOST", "172.16.9.84")
SSH_USER = os.getenv("PROXMOX_SSH_USER", "root")
SSH_PASS = os.getenv("PROXMOX_SSH_PASS", "MrIT2026Meet")
PROJECT_DIR = os.getenv("PROXMOX_PROJECT_DIR", "/opt/meeting-hub")
REPO_URL = "https://github.com/halonemuinai-sys/meeting-hub.git"

def run_ssh_command(client, command, stdin_input=None):
    print(f"\n[EXEC] {command}")
    stdin, stdout, stderr = client.exec_command(command, get_pty=True)
    
    if stdin_input:
        stdin.write(stdin_input + "\n")
        stdin.flush()
        
    output_lines = []
    while True:
        line = stdout.readline()
        if not line:
            break
        try:
            print(line, end="")
        except Exception:
            print(line.encode("ascii", errors="replace").decode("ascii"), end="")
        output_lines.append(line)
        
    exit_status = stdout.channel.recv_exit_status()
    err = stderr.read().decode("utf-8", errors="ignore")
    if err and exit_status != 0:
        print(f"[STDERR] {err}")
        
    return exit_status, "".join(output_lines), err

def connect_ssh(host, user, password, retries=5, delay=3):
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    for i in range(retries):
        try:
            client.connect(host, username=user, password=password, timeout=25, banner_timeout=35)
            if client.get_transport():
                client.get_transport().set_keepalive(15)
            return client
        except Exception as e:
            print(f"Koneksi SSH percobaan {i+1}/{retries} gagal ({e}). Menunggu {delay} detik...")
            time.sleep(delay)
    raise Exception(f"Gagal menghubungkan ke {host} via SSH.")

def main():
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')

    # Read backend .env locally to replicate to remote server
    backend_env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'backend', '.env')
    if not os.path.exists(backend_env_path):
        print(f"Error: backend/.env tidak ditemukan di {backend_env_path}", file=sys.stderr)
        sys.exit(1)
        
    with open(backend_env_path, 'r', encoding='utf-8') as f:
        env_content = f.read()

    print("===============================================================")
    print("🚀 MEMULAI DEPLOYMENT DOCKER KE PROXMOX SERVER (meeting.mra.co.id)")
    print(f"📍 Target Host: {SSH_HOST} (User: {SSH_USER})")
    print(f"📁 Target Dir : {PROJECT_DIR}")
    print("===============================================================\n")

    client = connect_ssh(SSH_HOST, SSH_USER, SSH_PASS)
    print("✅ Koneksi SSH Berhasil!\n")

    try:
        # 1. Check & Install Git & Docker
        print("--- [1/5] Memeriksa & Menginstall Git & Docker Engine ---")
        status, _, _ = run_ssh_command(client, "git --version && docker --version && docker compose version")
        if status != 0:
            print("Alat belum lengkap. Melakukan instalasi Docker & Git via script resmi...")
            run_ssh_command(client, "apt update -y")
            run_ssh_command(client, "apt install -y git curl ca-certificates gnupg lsb-release")
            run_ssh_command(client, "curl -fsSL https://get.docker.com -o /tmp/get-docker.sh && sh /tmp/get-docker.sh")
            run_ssh_command(client, "systemctl enable docker && systemctl start docker")
            print("Docker Engine berhasil diinstall!")
        else:
            print("Git dan Docker Engine terverifikasi aktif!")

        # 2. Clone or Pull Repo
        print("\n--- [2/5] Menyiapkan Kode Aplikasi dari GitHub ---")
        status, _, _ = run_ssh_command(client, f"test -d {PROJECT_DIR}/.git")
        if status != 0:
            print(f"Cloning {REPO_URL} ke {PROJECT_DIR}...")
            run_ssh_command(client, f"mkdir -p {PROJECT_DIR}")
            run_ssh_command(client, f"git clone {REPO_URL} {PROJECT_DIR}")
        else:
            print(f"Menarik update kode terbaru dari branch main...")
            run_ssh_command(client, f"cd {PROJECT_DIR} && git fetch --all && git reset --hard origin/main")

        # 3. Write backend .env
        print("\n--- [3/5] Menulis Konfigurasi Environment (backend/.env) ---")
        # Ensure APP_URL uses meeting.mra.co.id for production
        env_production = env_content
        if "APP_URL=" in env_production:
            env_production = "\n".join(
                [line if not line.startswith("APP_URL=") else "APP_URL=http://meeting.mra.co.id" for line in env_production.splitlines()]
            )
        
        write_env_cmd = f"cat << 'EOF' > {PROJECT_DIR}/backend/.env\n{env_production.strip()}\nEOF"
        run_ssh_command(client, write_env_cmd)
        run_ssh_command(client, f"ls -la {PROJECT_DIR}/backend/.env")
        print("backend/.env berhasil disiapkan di server!")

        # 4. Build and Start Docker Containers
        print("\n--- [4/5] Membuild dan Menjalankan Kontainer via Docker Compose ---")
        run_ssh_command(client, f"cd {PROJECT_DIR} && docker compose down --remove-orphans || true")
        build_cmd = f"cd {PROJECT_DIR} && docker compose --progress=plain build"
        status, _, _ = run_ssh_command(client, build_cmd)
        if status != 0:
            raise Exception("Build docker gagal.")

        start_cmd = f"cd {PROJECT_DIR} && docker compose up -d"
        run_ssh_command(client, start_cmd)

        # 5. Verification
        print("\n--- [5/5] Memverifikasi Status Kontainer & Port HTTP ---")
        time.sleep(5)
        run_ssh_command(client, f"cd {PROJECT_DIR} && docker compose ps")
        
        print("\n--- Testing HTTP Response Port 8082 (Nginx Proxy) ---")
        run_ssh_command(client, "curl -I -s http://localhost:8082/ | head -n 8")
        
        print("\n--- Testing API Health Response Port 8082 ---")
        run_ssh_command(client, "curl -s http://localhost:8082/api/health")
        
        print("\n===============================================================")
        print("🎉 DEPLOYMENT BERHASIL & SELESAI!")
        print(f"🌐 Aplikasi kini aktif di : http://{SSH_HOST}:8082 dan http://meeting.mra.co.id:8082")
        print("===============================================================\n")

    finally:
        client.close()

if __name__ == "__main__":
    main()
