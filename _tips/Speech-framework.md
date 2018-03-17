---
title: Fun With Speech Framework
layout: tip
date: 2017-01-30
---

## Overview

MacOS provides a very powerful speech synthesis framework, easily accessible using built-in tools - ```say (1)``` or programmatically via [Applications Services APIs](https://developer.apple.com/documentation/applicationservices/speech_synthesis_manager). Let's see how to get started with using the Speech framework.

From the command-line it's very simple. Just list the available voice and chose one to speak the message. If you're curious how it would sound in French for example:

```bash
$ say --voice="?" | grep fr
Amelie              fr_CA    # Bonjour, je m’appelle Amelie. Je suis une voix canadienne.
Tessa               en_ZA    # Hello, my name is Tessa. I am a South African-English voice.
Thomas              fr_FR    # Bonjour, je m’appelle Thomas. Je suis une voix française.

$ say --voice="Amelie" "The quick brown fox jumps over the lazy dog"
```

<audio controls>
  <source src="/assets/media/speech.mp3" type="audio/mpeg">
Your browser does not support the audio element.
</audio>

## Programmatic approach

It's more interesting to make use of the Speech synthethis APIs and benefit from 

## References

* [Speech Synthesis Manager](https://developer.apple.com/documentation/applicationservices/speech_synthesis_manager)
