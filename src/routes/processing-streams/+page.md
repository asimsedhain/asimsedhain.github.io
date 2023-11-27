---
title: "Thinking about stream processing in Rust 🦀"
date: Nov 04, 2023
---

<script lang="ts">
	import Note from "$components/Note.svelte";
	import WhiskerPlotClient from "$components/chart/WhiskerPlot.svelte";
    export let data;
</script>

# [Draft] Thinking about stream processing in Rust 🦀

[I recently read an excellent article from noz.ai](https://noz.ai/hash-pipeline/) (seems like the site is currently unavailable). It talks about different approaches to parallelizing a CPU bound task and compares their performance.
 I suggest everyone to read the article themselves ([here is a link to the article using the wayback machine](https://web.archive.org/web/20230808151236/https://noz.ai/hash-pipeline/)). One thing I found missing in that article was joining of streams or enriching streams with auxiliary data. It is a task that I come across regularly at work. And this article will be sort of an exploration of different approaches suggested in that article in context of my stream processing workload.

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

One information that might be useful for a human is know which instrument was exactly traded. The trade tuple only contains an ID and does not say exactly what was traded. For that, we will need to join the trade tuple with instrument metadata. For example:

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
    let mut pipeline = PipelineStd::new();
    for i in 0..n {
        let message = gen.generate(i);
        let _ = pipeline.process(message);
    }
}
```

The code for `Pipeline` is also very simple:

```rust
pub struct PipelineStd {
    instrument_map: HashMap<u32, String>,
}

impl PipelineStd {
    pub fn new() -> PipelineStd {
        PipelineStd {
            instrument_map: HashMap::new(),
        }
    }
    pub fn process(&mut self, message: Message) -> Option<EnrichedTrade> {
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
Fake-rs is slow to generate random data. We will treat it as blackbox with min latency that we cannot optimize such as waiting for the data over a network.
</Note>

Let's run it on hyperfine and see how it does. We will be running all these benchmarks on a Macbook Air M1, 2020 laptop.
You can also run the benchmarks yourself here by [cloning the repo](https://github.com/asimsedhain/stream-processing-benchmark/tree/v/instrument-only) and running it on your setup.

```bash
cargo build --release

hyperfine --warmup 3 "./target/release/naive-std-hash 10000000"
```


We get the following output:

```bash
Benchmark 1: ./target/release/naive-std-hash 10000000
  Time (mean ± σ):      1.361 s ±  0.002 s    [User: 1.357 s, System: 0.004 s]
  Range (min … max):    1.359 s …  1.364 s    10 runs
```

Now that we have base line result, let us see if we can improve it by adding some concurrency.
<Note>
One thing to note is that, these benchmarks could change due to multitude of factors such as my laptop running on battery or the OS giving a bit more priority to my browser. As such, instead of focusing on the absolute time, we will just focus on relative performance to see if we have made any improvements or not.
</Note>

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

The code for the pipeline struct will remain the same and main function will look as follows:

```rust
fn main() {
    let n = get_size_arg();
    let channel_size = get_channel_size(n);

    let mut gen = default_generator(n);
    let pipeline = PipelineStd::new();
    let (tx, rx) = mpsc::sync_channel(channel_size);

    thread::scope(|s| {
        s.spawn(move || {
            for i in 0..n {
                let _ = tx.send(gen.generate(i));
            }
            drop(tx);
        });

        s.spawn(move || {
            let mut pipeline = pipeline;
            while let Ok(message) = rx.recv() {
                let _ = pipeline.process(message);
            }
        });
    });
}
```

We run it through hyperfine and these are the results:

```bash
Benchmark 1: ./target/release/naive-std-hash 10000000
  Time (mean ± σ):      1.378 s ±  0.015 s    [User: 1.369 s, System: 0.005 s]
  Range (min … max):    1.364 s …  1.402 s    10 runs
 
Benchmark 2: ./target/release/thread-std-hash-std-channel 10000000
  Time (mean ± σ):      1.240 s ±  0.011 s    [User: 1.917 s, System: 0.252 s]
  Range (min … max):    1.228 s …  1.263 s    10 runs
 
Summary
  ./target/release/thread-std-hash-std-channel 10000000 ran
    1.11 ± 0.02 times faster than ./target/release/naive-std-hash 10000000
```

We can see that the results are ~11% faster than our naive single threaded approach. That is a decent improvement!
For a few simple line changes, I would consider it a decent win.

### Dashmap

The generator currently is configured to produce trade event 90% of the time and instrument event 10% of the time. This means our workflow is read-heavy. I found [this benchmark](https://github.com/xacrimon/conc-map-bench) about concurrent hashmaps and wanted to see if trying a different implementation would lead to better resutls. The one we will be [Dashmap](https://docs.rs/dashmap/latest/dashmap/) as it has the highest througput for read-heavy workload.

For this, we just need to change `insturment_map` to use `DashMap` instead of the `HashMap` from the standard library.

```rust
pub struct Pipeline {
    instrument_map: DashMap<u32, String>,
}
```

Now we create two more benhmarks and run them through hyperfine:

```bash
hyperfine --warmup 3 "./target/release/naive-std-hash 10000000" "./target/release/naive-dash-hash 10000000" "./target/release/thread-std-hash-std-channel 10000000" "./target/release/thread-dash-hash-std-channel 10000000"
Benchmark 1: ./target/release/naive-std-hash 10000000
  Time (mean ± σ):      1.396 s ±  0.075 s    [User: 1.374 s, System: 0.006 s]
  Range (min … max):    1.363 s …  1.605 s    10 runs
 
  Warning: Statistical outliers were detected. Consider re-running this benchmark on a quiet system without any interferences from other programs. It might help to use the '--warmup' or '--prepare' options.
 
Benchmark 2: ./target/release/naive-dash-hash 10000000
  Time (mean ± σ):      1.538 s ±  0.011 s    [User: 1.529 s, System: 0.006 s]
  Range (min … max):    1.522 s …  1.554 s    10 runs
 
Benchmark 3: ./target/release/thread-std-hash-std-channel 10000000
  Time (mean ± σ):      1.254 s ±  0.006 s    [User: 1.938 s, System: 0.274 s]
  Range (min … max):    1.246 s …  1.265 s    10 runs
 
Benchmark 4: ./target/release/thread-dash-hash-std-channel 10000000
  Time (mean ± σ):      1.160 s ±  0.009 s    [User: 1.978 s, System: 0.136 s]
  Range (min … max):    1.143 s …  1.173 s    10 runs
 
Summary
  ./target/release/thread-dash-hash-std-channel 10000000 ran
    1.08 ± 0.01 times faster than ./target/release/thread-std-hash-std-channel 10000000
    1.20 ± 0.07 times faster than ./target/release/naive-std-hash 10000000
    1.33 ± 0.01 times faster than ./target/release/naive-dash-hash 10000000
```

Now that is a lot of data. Lets see if we can visualize it better with a whisker plot.

##### Scatter Plot showing the median time (lower is better)

<WhiskerPlotClient data={data.dashmapChartData} />

Looking at the chart, we can see that our multi-threaded appraoch with dash-map performance the best. What is surprising is that the naive approach with dashmap is the worst performing. Not entire sure why that might be the case. Maybe sometime in the future, I will profile it further.


### Rings buffers

The final approach used by noz.ai was using a ring buffer instead of the channel provided by the std library.
The article already provides a lot of performant implementation for ring buffers. For this we will just be using the [rtrb library](https://docs.rs/rtrb/latest/rtrb/).
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
We add an extra loop to retry in-case the channel is full. 
When we run it using hyperfine, we get the following results:

```bash
Benchmark 1: ./target/release/naive-std-hash 10000000
  Time (mean ± σ):      1.385 s ±  0.022 s    [User: 1.374 s, System: 0.001 s]
  Range (min … max):    1.362 s …  1.436 s    10 runs
 
Benchmark 2: ./target/release/naive-dash-hash 10000000
  Time (mean ± σ):      1.533 s ±  0.012 s    [User: 1.527 s, System: 0.001 s]
  Range (min … max):    1.517 s …  1.555 s    10 runs
 
Benchmark 3: ./target/release/thread-std-hash-std-channel 10000000
  Time (mean ± σ):      1.219 s ±  0.006 s    [User: 1.890 s, System: 0.224 s]
  Range (min … max):    1.209 s …  1.225 s    10 runs
 
Benchmark 4: ./target/release/thread-dash-hash-std-channel 10000000
  Time (mean ± σ):      1.191 s ±  0.004 s    [User: 2.021 s, System: 0.178 s]
  Range (min … max):    1.185 s …  1.198 s    10 runs
 
Benchmark 5: ./target/release/thread-dash-hash-rtrb-channel 10000000
  Time (mean ± σ):      1.029 s ±  0.041 s    [User: 1.766 s, System: 0.008 s]
  Range (min … max):    1.006 s …  1.138 s    10 runs
 
  Warning: Statistical outliers were detected. Consider re-running this benchmark on a quiet system without any interferences from other programs. It might help to use the '--warmup' or '--prepare' options.
 
Summary
  ./target/release/thread-dash-hash-rtrb-channel 10000000 ran
    1.16 ± 0.05 times faster than ./target/release/thread-dash-hash-std-channel 10000000
    1.18 ± 0.05 times faster than ./target/release/thread-std-hash-std-channel 10000000
    1.35 ± 0.06 times faster than ./target/release/naive-std-hash 10000000
    1.49 ± 0.06 times faster than ./target/release/naive-dash-hash 10000000
```

##### Scatter Plot showing the median time (lower is better)

<WhiskerPlotClient data={data.rtrbChartData} />

Now this is interesting, the approach using rtrb is faster but it has a much bigger spread. The lines around the point show the range of times observed during our benchmarks and only the rtrb one has the biggest spread.
Even though, the rtrb approach has a higher spread, it is statistically faster.

### Multi Joins

Now, one way join is a simple case but usually the workload involves multiple joins and side effects that could result from the result of those joins. Right now, I think it will be hard to model side effects from joins (e.g. dynamically subscribing/unsubscribing to other channels based on the join). But we can emulate multi joins.

Let us supposed in addition to instrument data, we also want to know who did the trade. We have the user ID, we will now need to join this with the user field in order to get the final view.
On a high-level it will look as follows:


```python
# we have the enriched_trade from before
enriched_trade = {
    trade_id: 01,
    user_id: 0001,
    trade_px: 100,
    side: "buy"
    instrument: "SPY241103C00200000",
}

# we have data about the user
user = {
    id: 0001,
    username: "DiamonHands"
}

# finnaly after we join these, we get
user_enriched_trade{
    trade_id: 01,
    user: "DiamonHands",
    trade_px: 100,
    side: "buy"
    instrument: "SPY241103C00200000",
}
```

We will also modify our generator emit user messages 1% of the time. So, the distribution will look as follows:
* 2% user message
* 8% instrument message
* 90% trade message

The code change to handle this case will also be very minimal and look as follows:

```rust

pub struct PipelineDash {
    instrument_map: DashMap<u32, String>,
    // We add a new map to store users
    user_map: DashMap<u32, String>,
}

impl PipelineDash {
    pub fn new() -> PipelineDash {
        PipelineDash::default()
    }
    pub fn process(&self, message: Message) -> Option<EnrichedTrade> {
        match message {
            Message::Instrument(instrument) => {
                self.instrument_map.insert(instrument.id, instrument.into());
            }
            // insert them when we get a user message
            Message::User(user) => {
                self.user_map.insert(user.id, user.username);
            }

            Message::Trade(trade) => {
                let Some(instrument) = self.instrument_map.get(&trade.insturment_id) else {
                    return None;
                };

                // join users if they are found
                // or do nothing in case they are not found
                let Some(user) = self.user_map.get(&trade.user_id) else {
                    return None;
                };

                return Some(EnrichedTrade {
                    insturment: instrument.clone(),
                    id: trade.id,
                    user: user.clone(),
                    trade_px: trade.trade_px,
                    side: trade.side,
                });
            }
        };
        None
    }
}
```

Now, let us see how this performs.

```bash
Benchmark 1: ./target/release/naive-std-hash 10000000
  Time (mean ± σ):      1.244 s ±  0.027 s    [User: 1.239 s, System: 0.001 s]
  Range (min … max):    1.217 s …  1.295 s    10 runs
 
Benchmark 2: ./target/release/naive-dash-hash 10000000
  Time (mean ± σ):      1.438 s ±  0.027 s    [User: 1.429 s, System: 0.002 s]
  Range (min … max):    1.412 s …  1.501 s    10 runs
 
Benchmark 3: ./target/release/thread-std-hash-std-channel 10000000
  Time (mean ± σ):      1.390 s ±  0.017 s    [User: 1.869 s, System: 0.375 s]
  Range (min … max):    1.370 s …  1.417 s    10 runs
 
Benchmark 4: ./target/release/thread-dash-hash-std-channel 10000000
  Time (mean ± σ):      1.341 s ±  0.029 s    [User: 2.069 s, System: 0.260 s]
  Range (min … max):    1.315 s …  1.396 s    10 runs
 
Benchmark 5: ./target/release/thread-dash-hash-rtrb-channel 10000000
  Time (mean ± σ):      1.064 s ±  0.012 s    [User: 1.639 s, System: 0.012 s]
  Range (min … max):    1.053 s …  1.091 s    10 runs
 
Summary
  ./target/release/thread-dash-hash-rtrb-channel 10000000 ran
    1.17 ± 0.03 times faster than ./target/release/naive-std-hash 10000000
    1.26 ± 0.03 times faster than ./target/release/thread-dash-hash-std-channel 10000000
    1.31 ± 0.02 times faster than ./target/release/thread-std-hash-std-channel 10000000
    1.35 ± 0.03 times faster than ./target/release/naive-dash-hash 10000000
```

<WhiskerPlotClient data={data.instrumentUserChartData} />

Hmmm, this is strange. `thread-dash-hash-rtrb-channel` still performs the best but adding this new join causes the performance of the other threaded approach to be worse than the `naive-std-hash`. Seems like the cost of multi-threading does not pay off when there is an extra join.

Overall, it has been interesting to see how the performation changes with different approaches. I believe there are still ways of getting more performance out of the multi-threaded approaches. It would be an interesting idea to profile it and see where is the actual bottleneck. But that is for another day.

[You can find the link to the source code here](https://github.com/asimsedhain/stream-processing-benchmark/tree/v/instrument-user-join)

