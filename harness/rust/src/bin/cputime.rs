//! Prints the CPU time a process has used so far, user and system, on all
//! its threads, in nanoseconds. For the supervisor on macOS, where `ps` only
//! tells hundredths of a second: a server that starts in a few milliseconds
//! read as zero. Usage: cputime <pid>

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
    let _ = pid;
    std::process::exit(1);
}
