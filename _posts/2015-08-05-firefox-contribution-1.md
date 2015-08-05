---
layout: post
title: Contributing to Firefox and living to tell about it
---

It’s been a couple of months since I’ve started my journey to contribute to Firefox codebase. It’s something I’ve always wanted to do, and have finally decided to do it. In the middle of the process, I suddenly realized how many experiences I was going through. I decided to document those in writing. I would love it if this could go down into a nice blog post, but right now it’s just thoughts running around in a chaotic room which is my mind.
The reason I took time now, at this particular moment, to sit down and write about it is just a random thing that happened, but it’s the perfect representative of exactly what happens when I gather myself to address this contribution.

The actual bug I’m solving is irrelevant at this part of the story. But I do need to explain the chain of events that led to this point. I checked out the source code about 3 months ago, and since then it was a matter of sitting down to hack on it about 1-2 times a week. It took me some time to remember that every time I return to the code I should pull new changes. It’s such an obvious thing to a developer - I do it every day at work - but when working on some new project there are so many new details you need to remember, that you forget to breathe.
So tonight I remembered to `hg pull -u`, and this is what I got:

![terminal 1](http://s1.postimg.org/713itgv0f/Screen_Shot_2015_07_20_at_22_28_01.png)

Pretty innocent, right?

Then, I figured I should probably build the project. Firefox has a pretty neat command line tool they call [mach](https://developer.mozilla.org/en-US/docs/Mozilla/Developer_guide/mach), so I ran `./mach build`. 

![terminal 2](http://s11.postimg.org/81ddjrxer/Screen_Shot_2015_07_20_at_22_45_49.png)

I have to say I have a warm corner in my heart for command line tools that take the time and attention to talk to me this way. Short of the scary ALL CAPS at the beginning, it's plain courtesy to let me know this, so I did as instructed. The mercurial setup went just fine, and I went on to return to `./mach build`. This time I was told a different story. 

![terminal 3](http://s15.postimg.org/go6gjvnob/Screen_Shot_2015_07_20_at_22_51_24.png)

*Mach* tells me that I need to do a clobber build. They explain what that is on the [Devtools Hacking page](https://wiki.mozilla.org/DevTools/Hacking). But the thing that caught my mind was what I put in the red rectangle. It's telling me what bug caused this need for a clobber build! Curious enough, I went ahead and looked it up. [Bug 1171344](https://bugzilla.mozilla.org/show_bug.cgi?id=1171344) had a too long thread for me to start delving into. But it's a UI bug that I could understand. And I personally like it when I understand things, so when the first comment pointed to the actual UX bug, [Bug 1106057](https://bugzilla.mozilla.org/show_bug.cgi?id=1106057), I went on and looked that up as well. These bugs talk about designing icons for the `about:home` and `about:newtab` pages. They contain links to svg assets and specs like [this](https://bug1106057.bmoattachments.org/attachment.cgi?id=8631786). The designer working on this is a guy named Stephen Horlander, who also attached specs from his [firefox personal page](http://people.mozilla.org/~shorlander/mockups/InContent-SAPs/InContent-SAPs.html). I don't know about you, but being exposed to design work on your favorite browser is just thrilling to me. I looked the guy up, found his twitter account, followed him, and in his top tweet (for that moment) it said they are looking for designs to the FirefoxOS simulator. 

<blockquote class="twitter-tweet" lang="en"><p lang="en" dir="ltr">Are you a great icon designer? Want to contribute to something big? Design the FirefoxOS simulator icon here (or RT) <a href="https://t.co/T7qs4lDde5">https://t.co/T7qs4lDde5</a></p>&mdash; Darrin Henein (@darrinhenein) <a href="https://twitter.com/darrinhenein/status/611177201984212993">June 17, 2015</a></blockquote>
<script async src="//platform.twitter.com/widgets.js" charset="utf-8"></script>

That's cool! Look just how many things I found out about as a result of a simple try to pull changes. Now, let me get back to hacking on that bug I told you about.



