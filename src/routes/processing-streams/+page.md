---
title: "[Draft] Thinking about stream processing in Rust 🦀"
date: Nov 04, 2023
---

<script lang="ts">
	import Note from "$lib/components/Note.svelte";
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

Now this is one join that might be needed to be done. We will keep with this example throughout the article.

To make our lives easier and also limit the scope, we will consider the instrument data to either be static or slow moving.
It will limit us to the following kind of joins:
* stream to static data
* stream to slow moving stream

<Note>
What I mean by slow moving stream is the kind of stream where data is not changing often and also we do have not to worry about late arrival of data. Any data we received at that point will be considered complete. This will make it so that we do not have worry about any kind of temporal joins.
</Note>


Now let us write some code and see how it performs.

### Static Joins

#### Baseline
We will first implement the most naive join and use that as our baseline. It will be single channel where both the trades and instrument metadata are published.

