---
layout: post
title: "Rust Async Executor for Newbies - Part 2"
description: "Update simple async executor to allow task size specification at the build time"
tags: [ rust, async, executor ]
---

In the previous [post]({% post_url 2024-11-15-rust-async-simple-1 %}), we created the simple executor without any
dependencies.

One of the further improvements that we defined was to make it possible to specify a number of tasks that our executor
is able to spawn. Previously, it was hardcoded to 4 tasks. Depending on a goal it may be too many. Or even too few. 😁

Anyway, it is always good to be flexible and have an option to specify a number of tasks we need during a build time.
Let's implement that!

<!--more-->

**Table of content**

- [Naive Approach](#naive-approach)
- [How To Use](#how-to-use)
- [Conclusion](#conclusion)

# Naive Approach

What if we just rely on a user to set an environment variable? That should allow us to check it in the `build.rs`
script, generate a file with a constant defined and include it in the crate.

![construction-worker]({{ site.url }}/assets/2024-12-01/construction_worker.png)

That is the `build.rs` that I got:

```rust
use std::env;
use std::fs;
use std::path::Path;

fn main() {
    let out_dir = env::var_os("OUT_DIR").unwrap();
    let task_array_size = env::var("MINILOOP_TASK_ARRAY_SIZE").unwrap_or(String::from("1"));
    let dest_path = Path::new(&out_dir).join("task_array_size.inc");

    fs::write(
        &dest_path,
        format!("const TASK_ARRAY_SIZE: usize = {task_array_size};\n"),
    )
    .unwrap();
    println!("cargo:rerun-if-env-changed=MINILOOP_TASK_ARRAY_SIZE");
}
```

As easy as possible:

- `MINILOOP_TASK_ARRAY_SIZE` is set up to `1` if undefined
- if `MINILOOP_TASK_ARRAY_SIZE` the build script should be re-run and the `miniloop` crate will be provided with the
  updated value
- the generated file can be included with the [`include!`](https://doc.rust-lang.org/std/macro.include.html) macro

That is it! For now, I have not found any downsides of that approach except of the IDE may complain on undefined symbol
which is included in the crate.

# How To Use

So, the reasonable question there might be - how to use such a crate in an end user application.

Let's say I have the following app:

```rust
// main.rs
use miniloop;

fn main() {
    let mut task = async {
        println!("Hello, world!");
        println!("This is the task!");
    };
    let mut task1 = async {
        println!("Hello, world!");
        println!("This is the task1!");
    };
    let mut executor = miniloop::executor::Executor::new();
    let res = executor.spawn("task", &mut task);
    assert!(res.is_ok());
    let res = executor.spawn("task", &mut task1);
    assert!(res.is_ok());

    executor.run();
}
```

With the respective `Cargo.toml`:

```toml
[package]
name = "myapp"
version = "0.1.0"
edition = "2021"

[dependencies]
miniloop = {version = "*"}
```

The easiest way to supply the number of tasks to be used with our executor is to define an environment variable prior
to running a `cargo`:

```bash
# Unix
export MINILOOP_TASK_ARRAY_SIZE=10
# PowerShell
$env:MINILOOP_TASK_ARRAY_SIZE = 10
```

With our example, we can experiment with the variables definition:

```shell
# Define a variable
$env:MINILOOP_TASK_ARRAY_SIZE = 1
# Run the app
cargo run
# should output something like this
thread 'main' panicked at src/main.rs:16:5:
assertion failed: res.is_ok()
note: run with `RUST_BACKTRACE=1` environment variable to display a backtrace
error: process didn't exit successfully: `target\debug\myapp.exe` (exit code: 101)
```

And if we define the variable to a proper value:

```shell
# Define a variable
$env:MINILOOP_TASK_ARRAY_SIZE = 2
# Run the app
cargo run
# should output something like this
Hello, world!
This is the task!
Hello, world!
This is the task1!
```

In order to avoid all that manual work, one can declare that environment variable in the
[`.cargo/config.toml`](https://doc.rust-lang.org/cargo/reference/config.html#env). The only drawback that I found with
that approach is that you should make a rebuild when you update that variable.

```rust
# .cargo/config.toml
[env]
MINILOOP_TASK_ARRAY_SIZE = "2"
```

That way you should clean and build the app everytime the configuration is updated:

```shell
cargo clean
cargo build
```

# Conclusion

So, in this way short post I described an approach that I selected for the
[`miniloop`](https://crates.io/crates/miniloop) crate to allow a user to specify a number of tasks that executor should
support.

In further posts we will check on how to update the implementation to allow that simple executor to schedule underlying
subsystem "sleep mode" in order to avoid CPU resource wasting in the case when all tasks are in the wait mode. Probably,
there will be a lot of stuff to overcome.

Also, I have a plan to run that simple executor to one of my ARM Cortex-M development kits just to get an understanding
whether I will be able to do so without a runtime. As I mentioned previously, would like to re-invent my own small, ugly
wheel to gain some more knowledge about how low-level stuff is working. 😉

See you next time!
