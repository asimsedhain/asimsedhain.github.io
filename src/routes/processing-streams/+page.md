---
title: Thinking about stream processing in Rust 🦀 [Draft]
date: Nov 04, 2023
---

<script lang="ts">
	import Note from "$lib/components/Note.svelte";
</script>

# Thinking about stream processing in Rust 🦀

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

To make our lives easier and also limit the scope, we will only allow for the following types of join:
* stream to static data
* stream to slow moving stream

<Note>
What I mean by slow moving stream is the kind of stream where data is not changing often and also we do have not to worry about late arrival of data. Any data we received at that point will be considered complete. This will make it so that we do not have worry about any kind of temporal joins.
</Note>



### Baseline

Let us first take a baseline of the performance. I will start with the simplest approach - a single thread that will take all the events coming in and join them. It will then output them to some sort of channel.
