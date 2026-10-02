// THP synthetic input helper for th08.
//
// This is the ONLY viable synthetic-input path into th08. The game reads
// DirectInput, not window messages, so PostMessage never reaches it (proven:
// the injected DLL logged `input: cur=0x0000` forever under PostMessage).
// SendInput with KEYEVENTF_KEYEVENT_VK only drives the window-message queue;
// KEYEVENTF_SCANCODE drives the real input stack that DirectInput polls.
//
// Built by build.ps1 next to this file. Do NOT try to compile it with the
// PowerShell Add-Type compiler: it dies with System.OutOfMemoryException on
// the full INPUTUNION explicit-layout struct. See ../README.md for the traps.
//
// Usage:
//   thp_input.exe focus                - bring the th08 window to the foreground
//   thp_input.exe tap <scancode> [n] [gap_ms]      - press+release a scancode
//   thp_input.exe seq <scancode:hold:gap> ...       - run a scripted sequence
//   thp_input.exe click                - click the client-area centre (also focuses)
//   thp_input.exe client               - print the client-area centre in screen coords
//
// Scancodes are PS/2 set-1 codes, which is what DirectInput games read:
//   Z=0x2C  X=0x2D  ENTER=0x1C  SHIFT=0x2A
//   UP=0x48 DOWN=0x50 LEFT=0x4B RIGHT=0x4D  ESC=0x01

using System;
using System.Diagnostics;
using System.Runtime.InteropServices;
using System.Threading;

static class THPInput
{
    const uint INPUT_KEYBOARD = 1;
    const uint KEYEVENTF_KEYUP = 0x0002;
    const uint KEYEVENTF_SCANCODE = 0x0008;

    [StructLayout(LayoutKind.Sequential)]
    struct KEYBDINPUT
    {
        public ushort wVk;
        public ushort wScan;
        public uint dwFlags;
        public uint time;
        public IntPtr dwExtraInfo;
    }

    [StructLayout(LayoutKind.Sequential)]
    struct MOUSEINPUT
    {
        public int dx;
        public int dy;
        public uint mouseData;
        public uint dwFlags;
        public uint time;
        public IntPtr dwExtraInfo;
    }

    [StructLayout(LayoutKind.Sequential)]
    struct HARDWAREINPUT
    {
        public uint uMsg;
        public ushort wParamL;
        public ushort wParamH;
    }

    // INPUT is { DWORD type; UNION u; }. The union is as large as its biggest
    // member, MOUSEINPUT. On x64 that makes INPUT exactly 40 bytes: type(4)
    // plus 4 bytes of alignment padding plus the 32-byte union. Hand-rolling
    // this with a trailing pad array produced 56 bytes and SendInput failed
    // with ERROR_INVALID_PARAMETER (87) -- a struct the wrong size is rejected
    // outright, which is a good property: it cannot silently half-work.
    [StructLayout(LayoutKind.Explicit)]
    struct INPUTUNION
    {
        [FieldOffset(0)] public MOUSEINPUT mi;
        [FieldOffset(0)] public KEYBDINPUT ki;
        [FieldOffset(0)] public HARDWAREINPUT hi;
    }

    [StructLayout(LayoutKind.Sequential)]
    struct INPUT
    {
        public uint type;
        public INPUTUNION u;
    }

    [DllImport("user32.dll", SetLastError = true)]
    static extern uint SendInput(uint n, INPUT[] inputs, int size);

    [DllImport("user32.dll")]
    static extern IntPtr GetForegroundWindow();

    [DllImport("user32.dll")]
    static extern bool SetForegroundWindow(IntPtr h);

    [DllImport("user32.dll")]
    static extern bool ShowWindow(IntPtr h, int cmd);

    [DllImport("user32.dll")]
    static extern bool BringWindowToTop(IntPtr h);

    [DllImport("user32.dll")]
    static extern uint GetWindowThreadProcessId(IntPtr h, out uint pid);

    [DllImport("user32.dll")]
    static extern bool AttachThreadInput(uint idAttach, uint idAttachTo, bool fAttach);

    [DllImport("user32.dll")]
    static extern bool IsWindowVisible(IntPtr h);

    [DllImport("user32.dll")]
    static extern bool EnumWindows(EnumWindowsProc cb, IntPtr l);

    [DllImport("user32.dll")]
    static extern bool GetWindowRect(IntPtr h, out RECT r);

    [DllImport("user32.dll")]
    static extern bool GetClientRect(IntPtr h, out RECT r);

    [DllImport("user32.dll")]
    static extern bool ClientToScreen(IntPtr h, ref POINT p);

    [DllImport("user32.dll")]
    static extern bool SetCursorPos(int x, int y);

    [DllImport("kernel32.dll")]
    static extern uint GetCurrentThreadId();

    [StructLayout(LayoutKind.Sequential)]
    struct RECT { public int Left, Top, Right, Bottom; }

    [StructLayout(LayoutKind.Sequential)]
    struct POINT { public int X, Y; }

    delegate bool EnumWindowsProc(IntPtr h, IntPtr l);

    static uint Tap(ushort scan, int holdMs)
    {
        INPUT[] d = new INPUT[2];
        d[0].type = INPUT_KEYBOARD;
        // The keyboard payload lives in the union, so it is INPUT.u.ki, not INPUT.ki.
        d[0].u.ki = new KEYBDINPUT { wVk = 0, wScan = scan, dwFlags = KEYEVENTF_SCANCODE, time = 0, dwExtraInfo = IntPtr.Zero };
        d[1].u.ki = new KEYBDINPUT { wVk = 0, wScan = scan, dwFlags = KEYEVENTF_SCANCODE | KEYEVENTF_KEYUP, time = 0, dwExtraInfo = IntPtr.Zero };
        // Press, HOLD, then release.
        //
        // The hold must sit BETWEEN the two SendInput calls. Sending down and
        // up back-to-back and sleeping afterwards looks identical from the
        // outside but is invisible to the game: DirectInput polls device state
        // rather than receiving edge notifications, so a key that is already
        // back up by the time the next poll runs is never observed at all.
        //
        // Measured symptom of the old version: SendInput returned 2 events
        // every time and the window genuinely had foreground focus, yet the
        // game logged `input: cur=0x0000` for an entire run. Holding ~60 ms is
        // reliably longer than one 60 Hz frame.
        uint down = SendInput(1, d, Marshal.SizeOf(typeof(INPUT)));
        if (down == 0)
        {
            int e1 = Marshal.GetLastWin32Error();
            Console.WriteLine("  SendInput(down) FAILED err=" + e1 + " (" +
                new System.ComponentModel.Win32Exception(e1).Message + ")");
        }
        if (holdMs > 0) Thread.Sleep(holdMs);
        d[0].u.ki = new KEYBDINPUT { wVk = 0, wScan = scan, dwFlags = KEYEVENTF_SCANCODE | KEYEVENTF_KEYUP, time = 0, dwExtraInfo = IntPtr.Zero };
        uint up = SendInput(1, d, Marshal.SizeOf(typeof(INPUT)));
        if (up == 0)
        {
            int e2 = Marshal.GetLastWin32Error();
            Console.WriteLine("  SendInput(up) FAILED err=" + e2 + " (" +
                new System.ComponentModel.Win32Exception(e2).Message + ")");
        }
        return down + up;
    }

    static uint MouseClickAbs(int x, int y)
    {
        // LEFTDOWN=0x0002 LEFTUP=0x0004, then MOVE|ABSOLUTE via SetCursorPos
        INPUT[] d = new INPUT[2];
        d[0].type = 0; d[1].type = 0;
        // MOUSEINPUT occupies the same union slot; build it via a byte overlay.
        byte[] buf = new byte[Marshal.SizeOf(typeof(INPUT))];
        IntPtr p = Marshal.AllocHGlobal(buf.Length);
        try
        {
            // type=0 (MOUSEINPUT), dx,dy, mouseData=0, flags, time, extraInfo
            IntPtr cur = p;
            Marshal.WriteInt32(cur, 0, 0);                 // type
            cur += 4; Marshal.WriteInt32(cur, 0, x);        // dx
            cur += 4; Marshal.WriteInt32(cur, 0, y);        // dy
            cur += 4; Marshal.WriteInt32(cur, 0, 0);        // mouseData
            cur += 4; Marshal.WriteInt32(cur, 0, 0x0002);   // LEFTDOWN
            cur += 4; Marshal.WriteInt32(cur, 0, 0);        // time
            cur += 4; Marshal.WriteInt64(cur, 0, 0);        // extraInfo
            uint sent1 = SendInput(1, new INPUT[] { (INPUT)Marshal.PtrToStructure(p, typeof(INPUT)) }, Marshal.SizeOf(typeof(INPUT)));
            Thread.Sleep(40);
            cur = p;
            Marshal.WriteInt32(cur, 0, 0);
            cur += 16; Marshal.WriteInt32(cur, 0, 0x0004);  // LEFTUP
            uint sent2 = SendInput(1, new INPUT[] { (INPUT)Marshal.PtrToStructure(p, typeof(INPUT)) }, Marshal.SizeOf(typeof(INPUT)));
            return sent1 + sent2;
        }
        finally { Marshal.FreeHGlobal(p); }
    }

    static bool ForceForeground(IntPtr h)
    {
        uint fgPid;
        uint fgThread = GetWindowThreadProcessId(GetForegroundWindow(), out fgPid);
        uint myThread = (uint)GetCurrentThreadId();
        AttachThreadInput(myThread, fgThread, true);
        ShowWindow(h, 5);
        BringWindowToTop(h);
        bool ok = SetForegroundWindow(h);
        AttachThreadInput(myThread, fgThread, false);
        return ok;
    }

    static int Main(string[] argv)
    {
        if (argv.Length == 0) { Console.WriteLine("usage: thp_input focus|tap|seq|click ..."); return 2; }
        string cmd = argv[0];

        // Locate a visible th08 window. With `focuspid <pid>` the search is
        // restricted to one process, which matters when two instances are
        // running: the previous version always returned the FIRST th08 window
        // it found, so a two-instance run sent every keystroke to the same
        // instance and the other sat in its attract demo.
        uint wantPid = 0;
        if (cmd == "focuspid")
        {
            if (argv.Length < 2) { Console.WriteLine("focuspid needs a pid"); return 2; }
            wantPid = uint.Parse(argv[1]);
        }
        IntPtr target = IntPtr.Zero;
        EnumWindows(delegate(IntPtr h, IntPtr l)
        {
            uint pid;
            GetWindowThreadProcessId(h, out pid);
            if (pid == 0) return true;
            if (wantPid != 0 && pid != wantPid) return true;
            try
            {
                var pc = Process.GetProcessById((int)pid);
                if (pc.ProcessName == "th08" && IsWindowVisible(h)) { target = h; return false; }
            }
            catch { }
            return true;
        }, IntPtr.Zero);

        if (cmd == "focuspid")
        {
            if (target == IntPtr.Zero) { Console.WriteLine("NO_WINDOW_FOR_PID"); return 1; }
            bool ok = ForceForeground(target);
            Thread.Sleep(280);
            bool match = GetForegroundWindow() == target;
            Console.WriteLine("PID={0} TARGET=0x{1:X} SETFG={2} NOWFG=0x{3:X} MATCH={4}",
                wantPid, target.ToInt64(), ok, GetForegroundWindow().ToInt64(), match);
            return match ? 0 : 1;
        }

        if (cmd == "focus")
        {
            if (target == IntPtr.Zero) { Console.WriteLine("NO_THWINDOW"); return 1; }
            bool ok = ForceForeground(target);
            Thread.Sleep(300);
            bool match = GetForegroundWindow() == target;
            Console.WriteLine("TARGET=0x{0:X} SETFG={1} NOWFG=0x{2:X} MATCH={3}",
                target.ToInt64(), ok, GetForegroundWindow().ToInt64(), match);
            return match ? 0 : 1;
        }

        if (cmd == "client")
        {
            if (target == IntPtr.Zero) { Console.WriteLine("NO_THWINDOW"); return 1; }
            RECT cr;
            GetClientRect(target, out cr);
            POINT p = new POINT { X = (cr.Right - cr.Left) / 2, Y = (cr.Bottom - cr.Top) / 2 };
            ClientToScreen(target, ref p);
            Console.WriteLine("{0} {1}", p.X, p.Y);
            return 0;
        }

        if (cmd == "click")
        {
            // click the centre of the client area, which also gives focus
            if (target == IntPtr.Zero) { Console.WriteLine("NO_THWINDOW"); return 1; }
            RECT cr;
            GetClientRect(target, out cr);
            POINT p = new POINT { X = (cr.Right - cr.Left) / 2, Y = (cr.Bottom - cr.Top) / 2 };
            ClientToScreen(target, ref p);
            SetCursorPos(p.X, p.Y);
            Thread.Sleep(80);
            uint c = MouseClickAbs(p.X, p.Y);
            bool match = GetForegroundWindow() == target;
            Console.WriteLine("CLICKED at {0},{1} sent={2} MATCH={3}", p.X, p.Y, c, match);
            return match ? 0 : 1;
        }

        if (cmd == "tap")
        {
            if (argv.Length < 2) { Console.WriteLine("tap needs a scancode"); return 2; }
            ushort scan = Convert.ToUInt16(argv[1], 16);
            int n = argv.Length > 2 ? int.Parse(argv[2]) : 1;
            int delay = argv.Length > 3 ? int.Parse(argv[3]) : 300;
            uint total = 0;
            for (int i = 0; i < n; i++) { total += Tap(scan, 80); Thread.Sleep(delay); }
            Console.WriteLine("TAP 0x{0:X} x{1} sent={2} fg=0x{3:X}", scan, n, total, GetForegroundWindow().ToInt64());
            return 0;
        }

        if (cmd == "seq")
        {
            // seq 0x2C:100:200 0x50:100:200 ...  (scan:hold:gap in ms)
            if (argv.Length < 2) { Console.WriteLine("seq needs steps"); return 2; }
            uint total = 0;
            foreach (var step in argv[1].Split(' '))
            {
                if (step.Length == 0) continue;
                var parts = step.Split(':');
                ushort scan = Convert.ToUInt16(parts[0], 16);
                int hold = parts.Length > 1 ? int.Parse(parts[1]) : 80;
                int gap = parts.Length > 2 ? int.Parse(parts[2]) : 250;
                total += Tap(scan, hold);
                Thread.Sleep(gap);
            }
            Console.WriteLine("SEQ done sent={0} fg=0x{1:X}", total, GetForegroundWindow().ToInt64());
            return 0;
        }

        Console.WriteLine("unknown command " + cmd);
        return 2;
    }
}
