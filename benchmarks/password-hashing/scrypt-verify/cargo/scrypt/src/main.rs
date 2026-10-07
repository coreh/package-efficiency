use scrypt::password_hash::rand_core::OsRng;
use scrypt::password_hash::{PasswordHash, PasswordHasher, PasswordVerifier, SaltString};
use scrypt::{Params, Scrypt};

#[global_allocator]
static ALLOC: bench_harness::CountingAllocator = bench_harness::CountingAllocator;

fn main() {
    let params = Params::new(12, 8, 1, 32).unwrap();
    bench_harness::operation::run_value(
        |value| {
            let password = value[0].as_str().expect("password").as_bytes();
            let wrong = value[1].as_str().expect("wrong password").as_bytes();
            let salt = SaltString::generate(&mut OsRng);
            let stored = Scrypt
                .hash_password_customized(password, None, None, params, &salt)
                .map_err(|e| e.to_string())?
                .to_string();
            let parsed = PasswordHash::new(&stored).map_err(|e| e.to_string())?;
            Ok::<_, String>([
                Scrypt.verify_password(password, &parsed).is_ok(),
                Scrypt.verify_password(wrong, &parsed).is_ok(),
            ])
        },
        |r| r[0] as u32 + 2 * r[1] as u32,
        |r| serde_json::json!(r),
    );
}
