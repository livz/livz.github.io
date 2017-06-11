![Logo](/assets/images/bermuda-triangle.png)

I’ve always liked puzzles a lot, technical or not, but for some reasons never quite fully enjoyed them during 
interviews. I’ve seen that a lot of people actually are in this same situation. 
In this post I’m questioning the usefulness of such techniques in the interview process, 
not their purpose in general.
 
First thing when approaching an interview like this might be to think that preparation is the key. 
Fortunately there’s no shortage of resources to study in advance. 
A quick search for related terms comes up with several tens millions of results:

![Search results](/assets/images/search1.png)

![More search results](/assets/images/search2.png)

It almost looks like *a whole industry has developed around answering technical interview questions*. 
Titles like *"15 Mind-Bending Interview Questions"*, *"7 Interview Brain Teasers You Could Be Asked"* 
are guaranteed to attract the competitive side of technical people, however, let’s ask ourselves a few questions:
* What is their actual benefit? 
* How much are they helping the candidates in the interview? 
* How much they improve the candidates?
* How much they predict about a candidate’s future performance?
* What if someone decides to spend a few days non-stop reading interview puzzles/questions/brain teasers?
 
I’ve heard from people with strong software development experience, that they prepare continuously for days 
before technical interviews by reviewing algorithms and tricky problems. A very similar problem exist in the related areas of security engineering/security research. 
 
If we think about it, there is a good reason why an engineer needs to study these resources before an interview: **because they are not part of the day-to-day job**. We usually don’t have to solve the *"100 Coins logic problem"*, or the *"Burning rope problem"* or even do insane Big-Oh optimisations.
 
Back in the days (actually only a few years ago) puzzles, brainteasers and other similar challenges were very popular among big companies. This issue has been discussed a lot in the past, there is a [great article](http://www.newyorker.com/tech/elements/why-brainteasers-dont-belong-in-job-interviews) in The New Yorker which captures the main points. Now even Google, famously known for its very hard logic puzzles, [has banned](http://www.businessinsider.com/answers-to-google-interview-questions-2011-11) the practice of brain teasers interview questions (Luckily it’s been a long while since I had this type of interview, incidentally with Google).

As noted in the article above, the main problem is **decontextualization**. Basically *"instead of determining how someone will perform on relevant tasks, the interviewer measures how the candidate will handle a brainteaser during an interview, **and not much more**"* (emphasis added).  

Here are two possible solutions extracted from the article:
1. **A highly standardised interview process** — for instance, asking each candidate the same questions in the same order. To reduce the effect of [*thin-slicing judgement*](https://en.wikipedia.org/wiki/Thin-slicing)
2. **Focus on behavioral measures** - past and future actions, relevant to the job. This could include writing code, going through a scenario exercise step by step, ar typical questions like *"Were you ever in a situation when X?"*, *"How did you handle Y?"*

Some companies now use a mixed approach, where an experienced technical interviewer will walk the candidate through a technical scenario. At each step he can actually gauge the interviewee actions from a technical and behavioural perspective. I would argue that this is the way to go. Switching a bit from engineering to security research and incident investigation, the approach actually fits perfectly. For example, possible general questions include:
* Tell me about the last time you had an incident, how did you deal with it?
* Who did you work with and how?
* Why did you choose this approach over X?
* What were your priorities? 
* What would you have done if Y happened instead?  
* How could this be prevented? 

Branching from these questions, you can go a level up to policy related questions or down to more technical bits if needed. The are countless possibilities and variations and it mostly depends on the experience of the interviewer to steer the discussion in the right way. Also he has a lot of opportunities to sniff the [STE](https://techcrunch.com/2015/03/08/on-secretly-terrible-engineers/). As a friend is saying, you basically want to know if the candidate can get the job done, not if he knows all the flags from the TCP header or a specific syscall number.

**P.S. 1:** Of course someone can argue that a determined candidate might as well prepare in advance answers for these questions, the same way he would do for traditional logic problems/puzzles/brain teasers. Nevertheless, this is one level above that because the interviewer can change the scenario at any moment.

**P.S. 2:** If you haven't already, sovle the puzzle in the logo of this post. It's very interesting.

