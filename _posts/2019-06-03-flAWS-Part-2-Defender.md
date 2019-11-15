---
title:  "flAWS - Part 2 - Defender"
categories: [CTF, flAWS, AWS]
---

![Logo](/assets/images/cloud3.jpg)

<blockquote>
<p>
Welcome Defender! As an incident responder we're granting you access to the AWS account called "Security" as an IAM user. This account contains a copy of the logs during the time period of the incident and has the ability to assume into the "Security" role in the target account so you can look around to spot the misconfigurations that allowed for this attack to happen.
<br/><br/>
The Defender track won't include challenges like the Attacker track, and instead will walk you through key skills for doing security work on AWS.
</p>
</blockquote>

For the writeups and notes to the other flAWS challenges:
* [flAWS Part 1]({{ site.baseurl }}{% post_url 2019-05-01-flAWS-Part-1 %})
* [flAWS Part 2 - Attacker]({{ site.baseurl }}{% post_url 2019-06-01-flAWS-Part-2-Attacker %})

Before starting, I wanted to say thank you again to the creator of these games, Scott Piper of [summitroute](https://summitroute.com/) for the effort of designing, hosting and making them available for free for everyone! All the levels are highly educative and recommended for anyone interested in AWS security.

## Scenario

IAM credentials are provided for the Security account:

<blockquote>
<p>The credentials above give you access to the Security account, which can assume the role "security" in the Target account. You also have access to an S3 bucket, named flaws2_logs, in the Security account that, that contains the CloudTrail logs recorded during a successful compromise from the Attacker track.</p>
</blockquote>
