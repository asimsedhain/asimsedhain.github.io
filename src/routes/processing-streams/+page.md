---
title: "[Draft] Thinking about stream processing in Rust 🦀"
date: Nov 04, 2023
---

<script lang="ts">
	import Note from "$lib/components/Note.svelte";
    import { assets } from "$app/paths";
</script>

# [Draft] Thinking about stream processing in Rust 🦀

[I recently read an excellent article from noz.ai](https://noz.ai/hash-pipeline/) (seems like the site is currently unavailable). It talks about different approaches to parallelizing a CPU bound task and compares their performance.
One thing I found missing in that article was joining of streams or enriching streams with auxiliary data. It is a task that I come across regularly at work.

### Problem
First, let me give you a simplified scenario of the problem and limit the scope of this article as well. We have a stream of trades coming in. Each trade is a tuple that looks as follows:

```python
(trade_id, insturment_id, user_id, trade_px, side)
```

The trade tuple contains:
* the trade identifier 
* the instrument id for the instrument that was traded
* user id for the user who initiated the trade
* side (buy or sell)

Now this trade data is coming from some trading engine that is responsible for making the trades. What we need to do is enrich this stream with auxiliary data so that it can use be used further downstream (be that by other systems or by human users who want to monitor this stream of data).
One information that is useful for a human is instrument metadata. It will easier for them to view which instrument was actually traded. For example:

```python
# trade we get from the engine
trade = {
    trade_id: 01,
    insturment_id: 1234,
    user_id: 0001,
    trade_px: 100,
    side: "buy"
}

# instrument metadata we get from some other system
instrument = {
    insturment_id: 1234,
    ticker: "SPY",
    strike: 200,
    expiry: 241103,
    type: "call"
}

# after joining
enriched_trade = {
    trade_id: 01,
    insturment_id: 1234,
    user_id: 0001,
    trade_px: 100,
    side: "buy"
    instrument_ticker: "SPY",
    instrument_strike: 200,
    instrument_expiry: 241103,
    instrument_type: "call"
}

# usually this is also processed down into a human readable format.
# FYI this is an options instrument
enriched_trade = {
    trade_id: 01,
    user_id: 0001,
    trade_px: 100,
    side: "buy"
    instrument: "SPY241103C00200000",
}

```

Now this is one join that might be necessary. We will keep with this example and extend it throughout the article.

To make our lives easier and also limit the scope, we will consider the instrument data to be slow moving.

<Note>
What I mean by slow moving stream is the kind of stream where data is not changing often and also we do have not to worry about late arrival of data. Any data we received at that point will be considered complete. This will make it so that we do not have worry about any kind of temporal joins.
</Note>


Now let us write some code and see how it performs.

### Baseline
We will first implement the most naive join and use that as our baseline. A single thread that generates the message and then processes it.

```rust
fn main() {
    // get the size parameter from the command line
    let n = get_size_arg();

    // create a generator
    // we will get into how exactly this is done later
    let mut gen = default_generator(n);

    // Pipeline holds the logic for the join
    let pipeline = Pipeline::new();
    for i in 0..n {
        let message = gen.generate(i);
        let _ = pipeline.process(message);
    }
}
```

The code for `Pipeline` is also very simple:

```rust
pub struct Pipeline {
    instrument_map: DashMap<u32, String>,
}

impl Pipeline {
    pub fn new() -> Pipeline {
        Pipeline {
            instrument_map: DashMap::new(),
        }
    }
    pub fn process(&self, message: Message) -> Option<EnrichedTrade> {
        match message {
            Message::Instrument(instrument) => {
                self.instrument_map.insert(instrument.id, instrument.into());
            }

            Message::Trade(trade) => {
                let Some(instrument) = self.instrument_map.get(&trade.insturment_id) else {
                    return None;
                };

                return Some(EnrichedTrade {
                    insturment: instrument.clone(),
                    id: trade.id,
                    user_id: trade.user_id,
                    trade_px: trade.trade_px,
                    side: trade.side,
                });
            }
        };
        None
    }
}
```

We have a hashmap. When we get instrument message, we put it in a hashmap. When we get a trade message, we check the instrument map, if there is a value, we emit an `EnrichedTrade`, else we do nothing.
The `generate` function uses [`fake-rs`](https://github.com/cksac/fake-rs) to generate the fake data. [You can find the code for the generation here.](https://github.com/asimsedhain/stream-processing-benchmark/blob/v/instrument-only/src/generator.rs#L94)

<Note>
Fake-rs is slow to generate random data. We will treat it as waiting for the data over a network.
</Note>


Let's run it on hyperfine and see how it does.

```bash
cargo build --release

hyperfine --warmup 3 "./target/release/naive 10000000"
```


We get the following output:

```bash
Benchmark 1: ./target/release/naive 10000000
  Time (mean ± σ):      1.537 s ±  0.009 s    [User: 1.528 s, System: 0.007 s]
  Range (min … max):    1.526 s …  1.550 s    10 runs
```

Now that we have base line result, let us see if we can improve it by adding some concurrency.

### Channel and Threads

```
    ┌────────────────────┐             ┌────────────────────┐
    │      thread 1      │             │      thread 2      │
    │                    │             │                    │
    │                    │  channel    │                    │
    │      Generate      ├────────────►│      Process       │
    │                    │             │                    │
    │                    │             │                    │
    │                    │             │                    │
    └────────────────────┘             └────────────────────┘
```

We will split the logic into distinct computation threads. thread 1 will be responsible for generating the data and thread 2 will be responsible for processing the data.
Think of thread 1 as reading the data from the network and then passing it to thread 2 for processing.

The code for that will look as follows:

```rust
fn main() {
    let n = get_size_arg();
    let channel_size = get_channel_size(n);

    let mut gen = default_generator(n);
    let pipeline = Pipeline::new();
    let (tx, rx) = mpsc::sync_channel(channel_size);

    thread::scope(|s| {
        s.spawn(move || {
            for i in 0..n {
                let _ = tx.send(gen.generate(i));
            }
            drop(tx);
        });

        s.spawn(move || {
            let pipeline = pipeline;
            while let Ok(message) = rx.recv() {
                let _ = pipeline.process(message);
            }
        });
    });
}
```

We run it through hyperfine and these are the results:

```bash
Benchmark 1: ./target/release/naive-threads-std 10000000
  Time (mean ± σ):      1.183 s ±  0.013 s    [User: 2.008 s, System: 0.157 s]
  Range (min … max):    1.160 s …  1.200 s    10 runs
```

We can see that the results are ~23% faster than our naive approach. That is a decent improvement!
If we look at the flamegraph of the naive approach, we will see that more than 50% of the time is spent on generating the data (which for now we will assume as being unoptimizable).

##### Naive approach flamegraph
<img src="{assets}/processing-streams/naive-flamegraph.svg" alt="naive-flamegraph" width="100%"/>

If we look at the hyperfine output, we see that we are spending more time in the system space compared to the naive approach. Let's see if we can improve it by using a different implementation for channel.


### Threads and Rings buffers

Just going by the benchmarks performed by noz.ai, we will use the ring buffer implementation from the rtrb library.
The code for that will look as follows:

```rust
use rtrb::RingBuffer;
use std::thread;
use std::time::Duration;
use stream_processing::pipeline::Pipeline;
use stream_processing::utils::{get_channel_size, get_size_arg, push};
use stream_processing::{default_generator, Generator};

fn main() {
    let n = get_size_arg();
    let channel_size = get_channel_size(n);

    let mut gen = default_generator(n);
    let pipeline = Pipeline::new();
    let (mut tx, mut rx) = RingBuffer::new(channel_size);

    thread::scope(|s| {
        s.spawn(|| {
            for i in 0..n {
                let gen_value = gen.generate(i);
                push(&mut tx, gen_value);
            }
            drop(tx);
        });

        s.spawn(move || {
            let pipeline = pipeline;
            'inner: loop {
                match rx.pop() {
                    Ok(message) => {
                        let _ = pipeline.process(message);
                    }
                    Err(_) => {
                        thread::sleep(Duration::from_micros(100));
                        if rx.is_abandoned() {
                            break 'inner;
                        }
                    }
                }
            }
        });
    });
}
```

The implementation is quite the same. We are just swappig out the std mpsc channel for a spsc ring buffer that is wait-free and lock-free.
When we run it using hyperfine, we get the following results:

```bash
Benchmark 1: ./target/release/naive-threads-rtrb 10000000
  Time (mean ± σ):      1.006 s ±  0.004 s    [User: 1.743 s, System: 0.010 s]
  Range (min … max):    1.001 s …  1.015 s    10 runs
```

