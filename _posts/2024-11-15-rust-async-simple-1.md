---
layout: post
title: "Rust Async Executor for Newbies - Part 1"
description: "Simple async execution implementation in Rust without any dependencies"
tags: [ rust, async, executor ]
---

For the time being, I decided to get better understanding of some low-level stuff related to asynchronous programming
in Rust. And what can bring your more insights about how things work without inventing your own wheel. 😅

Let's write a simple asynchronous tasks executor without any dependencies on the well-known crates like [
`futures`](https://crates.io/crates/futures).

<!--more-->

**Table of content**

- [Intro](#intro)
- [Simple Executor](#simple-executor)
    * [Futures container](#futures-container)
    * [Task wrapper](#task-wrapper)
    * [Executor](#executor)
- [Assemble everything together](#assemble-everything-together)
- [Final thoughts](#final-thoughts)

# Intro

![ferris-scientist]({{ site.url }}/assets/2024-11-15/ferris-scientist.png)

Some time ago, as a maintainer of the [sntpc](https://github.com/vpetrigo/sntpc) crate which has `async` support, I
decided to dig deeper into Rust async executors implementation. That is because the `sntpc` crate has 2 versions within
itself:

- synchronous that relies on `std::net` or `no_std` socket implementation
- asynchronous one that implements exact same interface marking functions `async`

I found the description of several ways how [we can deal with that](https://nullderef.com/blog/rust-async-sync/). Usage
of `#[maybe_async]` looks really promising and `sntpc` most likely would use it in upcoming releases.

I had decided to analyze a way with custom simple asynchronous executor just to provide an implementation that would use
my own lightweight runtime instead of bringing dependency on `tokio` or `async_std`. Will see whether it will work or
not.

# Simple Executor

So, let’s dive into our journey on building our simple custom executor. Rust Async book contains an example of
an [executor design](https://rust-lang.github.io/async-book/02_execution/04_executor.html) which contains a dependency
on `futures` crate. I decided to not use and dig deeper by myself.

In general, my understanding for now is that the simplest executor environment can be built by following these steps:

- define a container for asynchronous tasks - `futures` crate defines [
  `Box` type](https://github.com/rust-lang/futures-rs/blob/7211cb7c5d8d859fa28ae55808c763a09d502827/futures-core/src/future.rs#L18)
  for tasks. As I mentioned before, it relies on `alloc` crate that requires custom allocator implementation which is
  too much for me at this point. 😅
- make a task `struct` that simplifies future wrapping into inner types
- create an executor, that allows tasks adding and executing them, obviously

## Futures container

To keep things simple, we will store all our futures on stack. In order to do that we will introduce our type:

```rust
pub struct StackBox<'a, T: ?Sized> {
    pub value: OnceCell<Pin<&'a mut T>>,
}

impl<'a, T: ?Sized> StackBox<'a, T> {
    pub fn new(value: &'a mut T) -> Self {
        let new_box = StackBox {
            value: OnceCell::new(),
        };
        new_box
            .value
            .get_or_init(|| unsafe { Pin::new_unchecked(value) });

        new_box
    }
}
```

`Future` does not implement `Unpin` trait, so we have to deal with some `unsafe` code here. The rest should be simple:

- `OnceCell` is used, because we set up our `Future` only once during task creation, and it allows us to get mutable
  reference to an inner value without runtime borrow checking overhead with `RefCell`.
- our future should live as long as our `StackBox` is alive

## Task wrapper

This is a simple `struct` that provides a way to pass future reference and wrap it into our `StackBox` for further usage
in our executor.

```rust
pub struct Task<'a> {
    pub name: &'a str,
    pub future: StackBoxFuture<'a>,
}

impl<'a> Task<'a> {
    pub fn new(name: &'a str, future: &'a mut impl Future<Output = ()>) -> Self {
        Self {
            name,
            future: StackBox::new(future),
        }
    }

    pub fn new_box(name: &'a str, future: StackBoxFuture<'a>) -> Self {
        Self { name, future }
    }
}
```

That implementation allows us to simply wrap whatever closure we want:

```rust
async fn hello() {
    println!("Hello, world!");
}

let mut fut = async { hello().await };
let task = Task::new("hello", &mut fut);
```

## Executor

There is our simple executor:

```rust
pub struct Executor<'a> {
    tasks: [Option<Task<'a>>; 4],
    index: usize,
    pending_callback: Option<fn(&str)>,
}
```

Quite simple: no channels involved for receiving new tasks, just an array of tasks that should be executed and a
reference to a debug callback which is called when a task in pending.

Keen eye may notice that there is a limitation:

- only 4 tasks (I do not know why I decided to have only 4). We will overcome that in the future though. In a single
  core embedded systems you most likely know how many tasks you are going to have in your application.
- you cannot add a task to such an executor “dynamically” - you have to define your tasks in the same scope you create
  an executor or in an outer scope. So, something like that is not possible in the current implementation

```rust
fn add_task(executor: &mut Executor) {
    let mut task = async { ... };
    // `task` has shorter lifetime than
    // an executor
    executor.spawn(&mut task);
}

// pseudocode
fn main() {
    let mut executor = Executor::new(...);
    // ...
    add_task(&mut executor);
    executor.run();
}
```

Technically, that should not be a problem for small embedded systems, where you usually define all tasks you want to run
during initial setup:

```rust
fn main() {
    let mut executor = Executor::new(...);
    let mut logger_task = create_logger_task();
    let mut sensor_task = create_sensor_task();
    let mut cli_task = create_cli_task();

    executor.spawn(logger_task);
    executor.spawn(sensor_task);
    executor.spawn(cli_task);
    // most likely it never returns
    executor.run();
}
```

So, when you do not need a scheduler to conform “real-time system” requirements, that should do the trick. Also, you
will not be able to add tasks from other tasks defined (`sensor_task`, `cli_task`, etc.) with that executor
implementation

Anyway, that is enough for me as a starting point. 😊

# Assemble everything together

There is an [example](https://github.com/vpetrigo/miniloop/blob/main/examples/simple.rs) in the repository that provides
a showcase how it supposes to work. As in the previous section, we allocate all the task we want in executor related
scope:

```rust
async fn dummy_func(data: &str) {
    let mut counter = 0usize;

    while counter != 4 {
        sleep(2);
        let now = get_timestamp_sec();
        println!("{now}: {data}");
        yield_me().await;
        counter += 1;
    }
}

let mut binding1 = async {
    dummy_func("hello").await;
};
let mut binding2 = async {
    dummy_func("world").await;
};
let mut binding3 = async {
    dummy_func("hi").await;
};
let mut binding4 = async {
    dummy_func("rust").await;
};
```

Since the asynchronous version of  `sleep` is not implemented for our runtime, I just used thread sleep to avoid burning
a CPU. Print some info about execution context and `yield` to another task. I assume that asynchronous sleep may be
implemented something like that:

```rust
struct Sleep {
    start: u64
    duration: Duration,
}

impl Future for Sleep {
    type Output = ();

    fn poll(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Self::Output> {
        let now = // get current time
        if start + duration.as_sec() >= now {
            return Poll::Ready(());
        }

        cx.waker().wake_by_ref();
        Poll::Pending
    }
}

async fn sleep_me(duration: Duration) {
    let start = // get start time
    Sleep {
        start, duration
    }.await;
}
```

There are some points to think about though:

- when we have all tasks sleeping, the executor will poll them again and again as they are yielding till sleep duration
  ends. So, we can think about putting them into a “sleep queue”, track the minimum time we can sleep. And if all tasks
  are sleeping, we can effectively release CPU and enter a low power mode, for example. Or use a `Waker`  for that
  maybe?
- `sleep` has a dependency on a somewhat that can provide us with time ticks

Let’s think about later though. 😁

That is it, after that add them all to our executor:

```rust
let _ = executor.spawn("hello", &mut binding1);
let _ = executor.spawn("world", &mut binding2);
let _ = executor.spawn("hi", &mut binding3);
let _ = executor.spawn("rust", &mut binding4);

executor.run();
```

And the result is what we expect:

```bash
1731508882: hello
1731508882: Task hello is pending. Waiting for the next tick...
1731508884: world
1731508884: Task world is pending. Waiting for the next tick...
1731508886: hi
1731508886: Task hi is pending. Waiting for the next tick...
1731508888: rust
# ...
1731508904: Task rust is pending. Waiting for the next tick...
1731508906: hello
1731508906: Task hello is pending. Waiting for the next tick...
1731508908: world
1731508908: Task world is pending. Waiting for the next tick...
1731508910: hi
1731508910: Task hi is pending. Waiting for the next tick...
1731508912: rust
1731508912: Task rust is pending. Waiting for the next tick...
Done!
```

# Final thoughts

Initial implementation of our “no-dependency” executor that is suitable for `no_std` environment is very simple. For
now, the only thing that bothers me in the above executor implementation - hardcoded number of tasks in a list.

If you like, you can experiment with the code yourself - [miniloop](https://github.com/vpetrigo/miniloop/tree/v0.1.0) is
available.

Will see if it will be possible to use it to enhance my [sntpc](https://github.com/vpetrigo/sntpc) crate and avoid
`#[maybe_async]` drawbacks.

What else we should analyse:

- `Waker` operation that makes something sensible tha No-Op
- Build time definition of a number of tasks in the executor

See you next time!
