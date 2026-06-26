const linuxCourse = {
  "id": "linux",
  "title": "Linux Course in Cybersecurity",
  "description": "A comprehensive course covering Linux fundamentals, terminal mastery, networking, scripting, and cybersecurity use-cases — built for aspiring penetration testers and security engineers.",
  "thumbnail": "courseThumbnail",
  "modules": [
    {
      "id": "m1",
      "title": "Module 1: Introduction & Setup",
      "lectures": [
        {
          "id": "1.1",
          "title": "Introduction",
          "subtitle": "WHOAMI and Course Objectives",
          "videoId": "koojpqx0WG4",
          "duration": "8:45",
          "quiz": null,
          "notes": [
            "Course overview and what you'll learn by the end",
            "Prerequisites: basic computer literacy, curiosity",
            "Tools we'll use throughout: terminal, VM, Kali Linux"
          ]
        },
        {
          "id": "1.2",
          "title": "Linux History",
          "subtitle": "Unix, GNU and Linux Kernel",
          "videoId": "RWTb5PwVIMg",
          "duration": "12:30",
          "quiz": null,
          "notes": [
            "Unix was created in 1969 at AT&T Bell Labs",
            "GNU Project (1983) — free software movement by Richard Stallman",
            "Linux kernel created by Linus Torvalds in 1991",
            "Linux = GNU tools + Linux kernel"
          ]
        },
        {
          "id": "1.3",
          "title": "What is Linux? Why Linux?",
          "subtitle": "What is Linux and why Linux?",
          "videoId": "7iwn_RBUCAo",
          "duration": "10:15",
          "quiz": null,
          "notes": [
            "Linux is open-source: free to use, modify, and distribute",
            "Dominates servers (90%+ of the internet runs on Linux)",
            "Essential for cybersecurity — most pentesting tools are Linux-native",
            "Lightweight, customizable, and secure compared to other OSes"
          ]
        },
        {
          "id": "1.4",
          "title": "Linux Distros",
          "subtitle": "Ubuntu, Kali, CentOS, Fedora — when to use each",
          "videoId": "_GIBjo514YM",
          "duration": "14:20",
          "quiz": null,
          "notes": [
            "Ubuntu — beginner-friendly, great for learning and development",
            "Kali Linux — purpose-built for penetration testing and ethical hacking",
            "CentOS/Rocky Linux — server-oriented, enterprise stability",
            "Fedora — cutting-edge packages, good for developers",
            "Choose your distro based on your use case, not popularity"
          ]
        },
        {
          "id": "1.5",
          "title": "Installing Linux",
          "subtitle": "VMware, WSL demo",
          "videoId": "RKagfRQARhM",
          "duration": "18:50",
          "quiz": null,
          "notes": [
            "VMware/VirtualBox — run Linux inside a virtual machine (safest for beginners)",
            "WSL (Windows Subsystem for Linux) — run Linux directly on Windows",
            "Dual boot — install Linux alongside Windows on the same machine",
            "Always allocate at least 2GB RAM and 20GB disk space for VMs"
          ]
        }
      ]
    },
    {
      "id": "m2",
      "title": "Module 2: The Linux Terminal",
      "lectures": [
        {
          "id": "2.1",
          "title": "System & Terminal Overview & Shell",
          "subtitle": "bash & zsh, echo, whoami, CLI, GUI",
          "videoId": "t-NJIpRJ2yQ",
          "duration": "16:40",
          "quiz": "Quiz2.1",
          "notes": [
            "CLI (Command Line Interface) vs GUI (Graphical User Interface)",
            "Shell is the program that interprets your commands",
            "`bash` is the default shell on most Linux distros",
            "Common first commands: `echo`, `whoami`, `hostname`",
            "`zsh` is an alternative shell with better auto-completion"
          ]
        },
        {
          "id": "2.2",
          "title": "File System & Navigating",
          "subtitle": "Understanding /etc, /home, /var, pwd, ls, cd",
          "videoId": "ZLyauY9TFns",
          "duration": "20:15",
          "quiz": "Quiz2.2",
          "notes": [
            "Linux file system starts at `/` (root directory)",
            "`/home` — user home directories",
            "`/etc` — system configuration files",
            "`/var` — variable data like logs",
            "`pwd` shows current directory, `ls` lists contents, `cd` changes directory",
            "Use `cd ..` to go up one level, `cd ~` to go home"
          ]
        },
        {
          "id": "2.3",
          "title": "Creating & Managing Files",
          "subtitle": "touch, mkdir, cp, mv, rm, cat, tree, man, -h",
          "videoId": "4Azqa1uWcMA",
          "duration": "22:30",
          "quiz": "Quiz2.3",
          "notes": [
            "`touch` creates an empty file, `mkdir` creates a directory",
            "`cp` copies files, `mv` moves or renames them",
            "`rm` deletes files — use `-r` for directories, `-f` to force",
            "`cat` displays file contents, `tree` shows directory structure",
            "`man <command>` opens the manual page for any command"
          ]
        },
        {
          "id": "2.4",
          "title": "Other Commands",
          "subtitle": "Tab completion, nano, piping, less, more, grep, redirections, find",
          "videoId": "ysW_D8qhcog",
          "duration": "25:10",
          "quiz": "Quiz2.4",
          "notes": [
            "Tab key auto-completes file names and commands",
            "`nano` is a simple text editor in the terminal",
            "Piping `|` sends output of one command to another",
            "`grep` searches for text patterns inside files",
            "`>` redirects output to a file (overwrites), `>>` appends",
            "`find` searches for files by name, size, or type"
          ]
        }
      ]
    },
    {
      "id": "m3",
      "title": "Module 3: Users, Permissions & Root Access",
      "lectures": [
        {
          "id": "3.1",
          "title": "Managing Users & Groups",
          "subtitle": "adduser, useradd, usermod, userdel, groups, passwd, id",
          "videoId": "EEQHQN3vECk",
          "duration": "18:25",
          "quiz": "Quiz3.1",
          "notes": [
            "`adduser` creates a new user interactively (preferred on Debian/Ubuntu)",
            "`useradd` is the low-level command for user creation",
            "`usermod` modifies existing users (e.g., adding to groups)",
            "`userdel` removes a user account",
            "`id` displays user ID, group ID, and group membership",
            "`passwd` changes a user's password"
          ]
        },
        {
          "id": "3.2",
          "title": "Permissions & Ownership",
          "subtitle": "chmod, chown, ls -l explained",
          "videoId": "0RNQvb6b2T4",
          "duration": "21:00",
          "quiz": "Quiz3.2",
          "notes": [
            "Every file has owner, group, and others permissions",
            "`ls -l` shows permissions like `-rwxr-xr--` (read/write/execute)",
            "`chmod` changes permissions — numeric (755) or symbolic (u+x)",
            "`chown` changes file ownership: `chown user:group file`",
            "Execute permission (`x`) is needed to run scripts"
          ]
        },
        {
          "id": "3.3",
          "title": "Sudo & Root Explained",
          "subtitle": "What is sudo and root user?",
          "videoId": "cOGUXgtJNKE",
          "duration": "12:45",
          "quiz": "Quiz3.3",
          "notes": [
            "`root` is the superuser with unrestricted access (UID 0)",
            "`sudo` runs a single command with root privileges",
            "Never log in as root for daily tasks — use `sudo` instead",
            "`/etc/sudoers` controls who can use sudo",
            "`su` switches to another user (or root if no username given)"
          ]
        }
      ]
    },
    {
      "id": "m4",
      "title": "Module 4: Package & Tool Management",
      "lectures": [
        {
          "id": "4.1",
          "title": "Using APT Package Manager",
          "subtitle": "apt update, upgrade, install, remove",
          "videoId": "eo2atpxb1-s",
          "duration": "15:30",
          "quiz": "Quiz4.1",
          "notes": [
            "`apt update` refreshes the package index (doesn't install anything)",
            "`apt upgrade` upgrades all installed packages to latest versions",
            "`apt install <pkg>` installs a new package",
            "`apt remove <pkg>` uninstalls a package (keeps config files)",
            "`apt purge <pkg>` removes package AND its configuration files",
            "Always run `apt update` before `apt install`"
          ]
        },
        {
          "id": "4.2",
          "title": "Installing from External Sources",
          "subtitle": "dpkg explained",
          "videoId": "voW4xhcUkj0",
          "duration": "11:20",
          "quiz": "Quiz4.2",
          "notes": [
            "`dpkg -i package.deb` installs a `.deb` file manually",
            "`dpkg -l` lists all installed packages",
            "Use `apt install -f` to fix broken dependencies after dpkg",
            "Download `.deb` files from trusted sources only"
          ]
        }
      ]
    },
    {
      "id": "m5",
      "title": "Module 5: Networking Essentials for Cybersecurity",
      "lectures": [
        {
          "id": "5.1",
          "title": "IP Addressing & Interfaces",
          "subtitle": "IPv4 & IPv6, network interfaces, ip a, ifconfig, loopback, ping",
          "videoId": "XB5p9rTMThI",
          "duration": "19:45",
          "quiz": "Quiz5.1",
          "notes": [
            "IPv4 addresses are 32-bit (e.g., 192.168.1.1), IPv6 are 128-bit",
            "`ip a` (or `ifconfig`) shows network interfaces and their IPs",
            "Loopback `127.0.0.1` (localhost) — always refers to the local machine",
            "`ping` tests connectivity to a host and measures round-trip time",
            "Private IP ranges: 10.x.x.x, 172.16-31.x.x, 192.168.x.x"
          ]
        },
        {
          "id": "5.2",
          "title": "Basic Connectivity Tests",
          "subtitle": "DNS, dig",
          "videoId": "HeNzaNa8XN8",
          "duration": "14:10",
          "quiz": "Quiz5.2",
          "notes": [
            "DNS translates domain names to IP addresses",
            "`dig` queries DNS servers for detailed record information",
            "`nslookup` is a simpler alternative for quick DNS lookups",
            "`/etc/resolv.conf` configures which DNS servers your system uses",
            "Common DNS record types: A (IPv4), AAAA (IPv6), MX (mail), CNAME (alias)"
          ]
        },
        {
          "id": "5.3",
          "title": "Port & Service Scanning",
          "subtitle": "Protocols & ports, lsof, nmap basics",
          "videoId": "iUWzK4NZpME",
          "duration": "23:35",
          "quiz": "Quiz5.3",
          "notes": [
            "Ports are numbered endpoints (0-65535) for network services",
            "Well-known ports: 22 (SSH), 80 (HTTP), 443 (HTTPS), 21 (FTP)",
            "`lsof -i` shows open network connections and listening ports",
            "`nmap` scans hosts for open ports — essential pentesting tool",
            "`nmap -sV` detects service versions running on open ports"
          ]
        }
      ]
    },
    {
      "id": "m6",
      "title": "Module 6: Scripting & Automation",
      "lectures": [
        {
          "id": "6.1",
          "title": "Shell Scripting Basics",
          "subtitle": "Writing .sh scripts, variables, if statements, loops",
          "videoId": "ZugtwpO-tsw",
          "duration": "28:00",
          "quiz": "Quiz6.1",
          "notes": [
            "Scripts start with `#!/bin/bash` (shebang line)",
            "Variables: `NAME=\"value\"` — access with `$NAME`",
            "If statements: `if [ condition ]; then ... fi`",
            "Loops: `for i in 1 2 3; do ... done`",
            "Make scripts executable with `chmod +x script.sh`",
            "Run with `./script.sh` or `bash script.sh`"
          ]
        },
        {
          "id": "6.2",
          "title": "Scheduled Tasks",
          "subtitle": "cron, crontab, automating scans or backups",
          "videoId": "UX_eD5Ml5kk",
          "duration": "16:15",
          "quiz": "Quiz6.2",
          "notes": [
            "Cron is a time-based job scheduler daemon",
            "`crontab -e` edits your scheduled tasks",
            "Cron format: `minute hour day month weekday command`",
            "Example: `0 2 * * * /path/to/backup.sh` runs at 2 AM daily",
            "`crontab -l` lists current user's cron jobs",
            "Use cron to automate backups, scans, and log rotations"
          ]
        }
      ]
    },
    {
      "id": "m7",
      "title": "Module 7: Process & System Monitoring",
      "lectures": [
        {
          "id": "7.1",
          "title": "Managing Processes",
          "subtitle": "ps, top, kill, jobs",
          "videoId": "_sbfT25hmeU",
          "duration": "17:50",
          "quiz": "Quiz7.1",
          "notes": [
            "`ps aux` shows all running processes with details",
            "`top` displays real-time process activity (CPU, memory usage)",
            "`kill <PID>` sends SIGTERM to a process — `kill -9` forces kill",
            "`jobs` lists background processes in the current shell",
            "Use `&` to run a command in the background: `command &`",
            "`fg` brings a background job to foreground"
          ]
        },
        {
          "id": "7.2",
          "title": "System Monitoring Tools",
          "subtitle": "htop, watch, uptime, load average",
          "videoId": "YKdI4ATpAZo",
          "duration": "13:40",
          "quiz": "Quiz7.2",
          "notes": [
            "`htop` is an interactive version of `top` with color and mouse support",
            "`uptime` shows how long the system has been running",
            "Load average measures CPU demand over 1, 5, and 15 minutes",
            "`watch -n 2 command` re-runs a command every 2 seconds",
            "`df -h` shows disk space usage, `free -h` shows memory usage"
          ]
        }
      ]
    },
    {
      "id": "m8",
      "title": "Module 8: Services, Logging & Troubleshooting",
      "lectures": [
        {
          "id": "8.1",
          "title": "Linux Services",
          "subtitle": "systemd, systemctl, managing services",
          "videoId": "vNW8ttCjVE0",
          "duration": "15:25",
          "quiz": "Quiz8.1",
          "notes": [
            "`systemd` is the init system that manages services on modern Linux",
            "`systemctl start/stop/restart <service>` controls services",
            "`systemctl enable <service>` makes it start at boot",
            "`systemctl status <service>` shows current state and recent logs",
            "Common services: ssh, apache2, nginx, mysql, docker"
          ]
        },
        {
          "id": "8.2",
          "title": "Linux Logs Overview",
          "subtitle": "journalctl, /var/log/auth.log, dmesg",
          "videoId": "_AvC017aK2E",
          "duration": "18:10",
          "quiz": "Quiz8.2",
          "notes": [
            "Logs are stored in `/var/log/` directory",
            "`/var/log/auth.log` — authentication attempts (login, sudo, SSH)",
            "`/var/log/syslog` — general system events",
            "`journalctl` queries the systemd journal for all logged messages",
            "`dmesg` shows kernel ring buffer messages (hardware/driver events)",
            "`tail -f /var/log/auth.log` watches logs in real-time"
          ]
        },
        {
          "id": "8.3",
          "title": "Common Issues & Fixes",
          "subtitle": "Sudo not working, file not executable, broken config",
          "videoId": "VOB7o8thkTg",
          "duration": "14:55",
          "quiz": "Quiz8.3",
          "notes": [
            "\"Permission denied\" — check file permissions with `ls -l`",
            "\"Command not found\" — ensure the package is installed or check your PATH",
            "\"User is not in the sudoers file\" — add user to sudo group",
            "\"Cannot execute binary\" — ensure the file has `+x` permission",
            "Always check logs (`journalctl`, `/var/log/`) when troubleshooting"
          ]
        }
      ]
    },
    {
      "id": "m9",
      "title": "Module 9: Cybersecurity Use Cases",
      "lectures": [
        {
          "id": "9.1",
          "title": "Using Linux in Pentesting Labs",
          "subtitle": "Working in Kali, netcat, scp, ssh, curl",
          "videoId": "T2UtbjJdt5I",
          "duration": "26:30",
          "quiz": "Quiz9.1",
          "notes": [
            "`ssh user@host` connects to a remote machine securely",
            "`scp` securely copies files between machines over SSH",
            "`curl` makes HTTP requests from the terminal (great for API testing)",
            "`netcat (nc)` is a versatile networking tool for reading/writing data",
            "Kali Linux comes pre-installed with 600+ security tools"
          ]
        },
        {
          "id": "9.2",
          "title": "Shells Explained",
          "subtitle": "Reverse, bind shells",
          "videoId": "aYXfH76R7I0",
          "duration": "20:45",
          "quiz": "Quiz9.2",
          "notes": [
            "Bind shell: target listens on a port, attacker connects to it",
            "Reverse shell: attacker listens, target connects back to attacker",
            "Reverse shells bypass firewalls (outbound connections are usually allowed)",
            "`nc -lvnp 4444` sets up a listener on port 4444",
            "Always use shells ethically and only in authorized environments"
          ]
        },
        {
          "id": "9.3",
          "title": "Linux Final Cyber Challenge",
          "subtitle": "Hands-on challenge",
          "videoId": "pUoHv2f2UC8",
          "duration": "32:15",
          "quiz": null,
          "notes": [
            "Hands-on challenge combining all skills learned in the course",
            "Practice enumeration, file analysis, and privilege escalation",
            "Download the challenge files and follow along",
            "Think like a pentester: enumerate → exploit → escalate"
          ],
          "resource": "/resources/Linux_9.3_challange.tar.gz"
        },
        {
          "id": "9.4",
          "title": "Conclusion & Where to Go Next?",
          "subtitle": "Guided labs, HackTheBox, eJPT, privilege escalation",
          "videoId": "ogkd-yDapK0",
          "duration": "10:30",
          "quiz": null,
          "notes": [
            "Guided training rooms — beginner-friendly, structured labs",
            "HackTheBox — more advanced, real-world-like challenges",
            "eJPT (eLearnSecurity Junior Penetration Tester) — great entry-level cert",
            "Next topics to study: privilege escalation, web exploitation, Active Directory",
            "Keep practicing — consistency is key in cybersecurity"
          ]
        }
      ]
    }
  ]
};

export default linuxCourse;
