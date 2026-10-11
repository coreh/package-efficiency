//! Prints the CPU time a process has used so far, user and system, on all
//! its threads, in nanoseconds. For the supervisor, where `ps` (macOS) and
//! /proc/<pid>/stat (Linux) only tell hundredths of a second: a server that
//! starts in a few milliseconds read as zero. Usage: cputime <pid>

#[cfg(target_os = "macos")]
mod mac {
    use std::os::raw::{c_int, c_void};

    // The start of rusage_info_v0 (libproc.h); the times are in Mach ticks.
    #[repr(C)]
    #[derive(Default)]
    struct RusageInfoV0 {
        uuid: [u8; 16],
        user_time: u64,
        system_time: u64,
        rest: [u64; 8],
    }
    #[repr(C)]
    #[derive(Default)]
    struct Timebase {
        numer: u32,
        denom: u32,
    }
    unsafe extern "C" {
        fn proc_pid_rusage(pid: c_int, flavor: c_int, buffer: *mut c_void) -> c_int;
        fn mach_timebase_info(info: *mut Timebase) -> c_int;
    }

    pub fn nanoseconds(pid: i32) -> Option<u128> {
        let mut usage = RusageInfoV0::default();
        let mut timebase = Timebase::default();
        unsafe {
            if proc_pid_rusage(pid, 0, &mut usage as *mut _ as *mut c_void) != 0 {
                return None;
            }
            if mach_timebase_info(&mut timebase) != 0 || timebase.denom == 0 {
                return None;
            }
        }
        let ticks = usage.user_time as u128 + usage.system_time as u128;
        Some(ticks * timebase.numer as u128 / timebase.denom as u128)
    }
}

#[cfg(target_os = "linux")]
mod linux {
    use std::os::raw::{c_int, c_long};

    #[repr(C)]
    #[derive(Default)]
    struct Timespec {
        tv_sec: i64,
        tv_nsec: c_long,
    }
    unsafe extern "C" {
        fn clock_gettime(clock: c_int, time: *mut Timespec) -> c_int;
    }

    // The CPU clock of a whole process, threads that have ended included: the
    // clock id glibc's clock_getcpuclockid gives (CPUCLOCK_SCHED of the pid).
    pub fn nanoseconds(pid: i32) -> Option<u128> {
        let clock = (!pid << 3) | 2;
        let mut time = Timespec::default();
        if unsafe { clock_gettime(clock, &mut time) } != 0 {
            return None;
        }
        Some(time.tv_sec as u128 * 1_000_000_000 + time.tv_nsec as u128)
    }
}

fn main() {
    let pid: i32 = match std::env::args().nth(1).and_then(|arg| arg.parse().ok()) {
        Some(pid) => pid,
        None => std::process::exit(2),
    };
    #[cfg(target_os = "macos")]
    if let Some(ns) = mac::nanoseconds(pid) {
        println!("{ns}");
        return;
    }
    #[cfg(target_os = "linux")]
    if let Some(ns) = linux::nanoseconds(pid) {
        println!("{ns}");
        return;
    }
    let _ = pid;
    std::process::exit(1);
}
