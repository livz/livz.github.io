---
title: Fun With Speech Framework
layout: tip
date: 2017-01-30
---

## Overview

MacOS provides a very powerful speech synthesis framework, easily accessible using built-in tools - ```say (1)``` or programmatically via [Applications Services APIs](https://developer.apple.com/documentation/applicationservices/speech_synthesis_manager). Let's see how to get started with using the Speech framework.

From the command-line it's very simple. Just list the available voices and chose one to speak the message. If you're curious how it would sound in French for example:

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

To have more flexibility, it's more interesting to make use of the Speech synthethis APIs. The code below simulates the ```say``` command-line tool:

```c
#include <ApplicationServices/ApplicationServices.h>

typedef SInt16 int16;

void checkResult(OSErr error, const char *description) {
    if (error == 0)
        return;
    fprintf(stderr, "Error: %d during %s. exiting.", error, description);
    
    exit(error);
}

int main (int argc, char **argv) {
    SpeechChannel channel;
    VoiceSpec vs;
    SInt16 numVoices, voice;
    CFStringRef message;

    if (argc != 3) {
        printf("[!] Usage: %s <voice number> <message>\n", argv[0]);
        exit(1);
    }

    // List available voices
    checkResult(CountVoices(&numVoices), "CountVoices");
    printf("[*] %d voices available\n", numVoices);
    
    // Get desired voice
    voice = atoi(argv[1]);
    checkResult(GetIndVoice(voice, &vs), "GetVoiceInd");

    // Create a Speech channel
    checkResult(NewSpeechChannel(&vs, &channel), "NewSpeechChannel");

    // Create a string from the message
     message = CFStringCreateWithCString(NULL, argv[2], kCFStringEncodingUTF8);

    // Speak!
    checkResult(SpeakCFString(channel, message, NULL), "SpeakCFString");

    // Release allocated string
    CFRelease(message);
    
    // Wait for speach to finish
    while (SpeechBusy()) 
        sleep(1);
        
    exit(0);
}
```

The final result should be same:

```bash
$ gcc say.c -o mySay -framework ApplicationServices
$ ./mySay 4 "The quick brown fox jumps over the lazy dog"
[*] 47 voices available
```

## References

* [Speech Synthesis Manager](https://developer.apple.com/documentation/applicationservices/speech_synthesis_manager)
