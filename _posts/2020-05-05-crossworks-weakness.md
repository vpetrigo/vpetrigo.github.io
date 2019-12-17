---
layout: post
title: "CrossWorks implementation weakness"
tags: [arm, embedded, crossworks, optimization]
---

## Intro

We are using the CrossWorks IDE with bundled GCC compiler on my work as company's standard embedded systems project tool. 
Nobody had noticed any issues with it until we were working on a project with some "slightly higher" demands on waking up time.
It was a STM32L4 based solution with the [piezo switch][piezo_switch] attached to one of the sensor lines that triggers interrupts. The fastest 
wake up time requirement was introduced due to UX of the piezo switch. That switch asserts MCU's sensor line only for _100-200 ms_.
As of the fact that our system goes to the sleep mode between application run and has several wake up sources that affect on application run logic, we faced some challenges.

## When it comes to an issue

To describe the issue more accurate let's check the figure below:

![Figure_with_issue]({{ site.url }}/assets/2020-05-05/TEK00018.png)

There you may notice two markers:

- **Marker A** is set up to the level when the button sensor line triggers a wake up interrupt
- **Marker B** is set up the point when our application finishes its initialization (GPIO, SPI, ADC, etc.) and gets to business logic

It takes **300 ms** just to get to the very beginning of the real application! That was the problem as due to potential noise on the button line,
false positive wake ups had taken place before we implemented a software debouncing algorithm. And that algorithm got into play right after all
STM32L4 necessary peripheral initialization finish. That results in the following behavior:
- an user presses the button gently
- the MCU wakes up and inits itself
- **here we want to know the wake up reason**: run debouncing algorithm to remove false positive wakeups
- debouncing algorithm is told that the button has been the wake up reason, but it sees the button is not pressed now
- the system goes to sleep

That is not the user expects from the system :wink:.

#### Side note

> That issue may be overcome by an user just by increasing time they presses the button. But as the "tactile" piezo switch is not
> really _tactile_ it is not convenient to ask a user for - you will not feel a something you would call a response from such a button,
> it is like you try pressing a metal door with your finger. On the oscillogram above the button pulled down the sensor line after
> a button touch with minimal amount of efforts - really comfortable way of pressing such buttons.

So, several steps were performed to narrow and mitigate that issue.

## Step 1. Find a peripheral that takes too much time to init

That step was not efficient enough:

- GPIO, ADC, SPI, I2C peripheral initialization did not require too much time to init
- ST's USB stack initialization took **~20 ms**, but optimization of that part was not a silverbullet. Getting from 300 to 280 ms wake up time
still was not enough

## Step 2. Find a side code that influence on boot time

It was obvious that long running routines should be somewhere in code that preceedes STM32L4 peripheral initialization.
That is, default CrossWorks CRT or startup code should be rather slow somewhere. After some analysis, I found the following code
in the CRT implementation of CrossWorks (**v4.5.0**):

#### Memory copy routine

{% highlight nasm %}
memory_copy:
    cmp r0, r1
    beq 2f
    subs r2, r2, r1
    beq 2f
1:
    ldrb r3, [r0] ;SUSPICIOUS PART
    adds r0, r0, #1
    strb r3, [r1]
    adds r1, r1, #1
    subs r2, r2, #1
    bne 1b
2:
    bx lr
{% endhighlight %}

#### Memory set routine

{% highlight nasm %}
memory_set:
    cmp r0, r1
    beq 1f
    strb r2, [r0] ;SUSPICIOUS PART
    adds r0, r0, #1
    b memory_set
1:
    bx lr
{% endhighlight %}

As you may see, implemented copy and set routines make its work on per byte basis. Thus it takes 4 times greater time to copy/set memory area
with the given value as `STRB` and `STR` both have a 1 cycle execution time. _It is rather strange as all data should be aligned
per word in memory (4 byte boundary on ARM32 platform)_. If there is an assumption that CrossWorks compiler may utilize unaligned data
it should be stated somewhere in the implementation in my opinion. And code above is not something you expect to get after pay some money.
As in our app we have a lot of third-party libraries and our implementation has some in-RAM buffers, that introduce about ~265 Kbyte of RAM memory occupation:
- `.data` section - _~3 Kbyte_
- `.bss` section - _~262 Kbyte_

As you know `.bss` section usually zeroed during CRT init routine execution and `.data` section, that resides in RAM,
is copied from MCU's Flash memory.

#### Some calculations for STM32L4A6VG

> Just to show the difference between per byte copy/set and per word copy/set implementation, I will make some calculations for CPU we used in
> our project - STM32L4A6VG, that operates on 4 MHz frequency after a reset event. That means:
> $$ t_{instruction} = \frac{1}{f_{CPU}} = \frac{1}{4 \cdot 10^6} = 250 \cdot 10^{-9} \; s = 250 \; ns $$
> For simplicity, let's consider that we use only `memory_set` operation with 5 single cycle instructions within it (`beq`, `cmp`, `strb`, `adds`, `b`).
>
> As it sets 1 byte per an iteration and the app has to clear _265 Kbytes = 271360 bytes_, it takes:
> $$ t_{set} = C_{MEM} \cdot N = 271360 \cdot 5 = 1356800 \; cycles$$
>
> Overall execution time:
>
> $$ T_{set} = t_{instruction} \cdot t_{set} = 250 \cdot 10^{-9} \; s \cdot 1356800 \; cycles = 0.3392 \; s \approx 0.34 \; s = 340 \; ms $$
>
> **That looks quite close to the time we saw on the first oscillogram!**

Applying the simple patch that should improve system's performance:

#### Memory copy routine

{% highlight nasm %}
memory_copy:
    cmp r1, r2
    itte ne
    ldrne r3, [r0], #4
    strne r3, [r1], #4
    beq 1f
    b memory_copy
1:
    bx lr
{% endhighlight %}

#### Memory set routine

{% highlight nasm %}
memory_set:
    cmp r0, r1
    ite ne
    strne r2, [r0], #4
    beq 1f
    b memory_set
1:
    bx lr
{% endhighlight %}

Results in the **~4.5 times boost** of system's wake up time:

![Figure_optimized_boot_time]({{ site.url }}/assets/2020-05-05/TEK00019.png)

That also conform to our calculations as we reduce the number of store (`STRB`) operations by switching to a word basis store - store 4 bytes instead of one.

## Conclusion

As you can see, paid CrossWorks library implementation (as of 4.5.0 version for ARM) is non-optimal in some parts. 
Most of the time the huge performance drop reason is suboptimal implementation (do not be mad on me, but it is true :smile:).
Sometimes issues come from parts you expect them the least to come from though. I would like to suggest not to be afraid of
digging into a IDE/compiler vendor specific libraries if that source code available.
Make some changes and confirm them with your oscilloscope.

If you have any questions, would like me to explain something in more details or find and issue with my post, feel free to contact me via [email](mailto:{{ site.email} }).

[piezo_switch]: https://www.barantec.com/product/sbr11/#1521537503478-81da1b33-beeb
