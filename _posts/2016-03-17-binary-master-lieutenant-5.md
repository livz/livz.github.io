![Logo](/assets/images/belts-black-plus.png)


We're finally getting closer to the end of the [Lieutenant](https://www.certifiedsecure.com/certification/view/37) set of challenges from **Certified Secure Binary Mastery**. This time we'll analyse another classic vulnerability - **Time of check to time of use (TOCTOU)**. At its root, the vulnerability is a class of [race condition](https://en.wikipedia.org/wiki/Race_condition). As the [Wikipedia article](https://en.wikipedia.org/wiki/Time_of_check_to_time_of_use) states:
> **TOCTOU**, pronounced "TOCK too" is a class of software bug caused by changes in a system between the checking of a condition (such as a security credential) and the use of the results of that check.

The vulnerability in this level is actually pretty straight-forward to spot. Although race-conditions are usually difficult to exploit reliably, in this case things are easier, as we'll see.

To review the previous levels, check the links below:
* [Binary Master: Ensign - Level 1](https://livz.github.io/2016/01/07/binary-master-ensign-1.html)
* [Binary Master: Ensign - Level 2](https://livz.github.io/2016/01/14/binary-master-ensign-2.html)
* [Binary Master: Ensign - Level 3](https://livz.github.io/2016/01/21/binary-master-ensign-3.html)
* [Binary Master: Ensign - Level 4](https://livz.github.io/2016/01/28/binary-master-ensign-4.html)
* [Binary Master: Ensign - Level 5](https://livz.github.io/2016/02/09/binary-master-ensign-5.html)
* [Binary Master: Lieutenant - Level 1](https://livz.github.io/2016/02/16/binary-master-lieutenant-1.html)
* [Binary Master: Lieutenant - Level 2](https://livz.github.io/2016/02/23/binary-master-lieutenant-2.html)
* [Binary Master: Lieutenant - Level 3](https://livz.github.io/2016/03/02/binary-master-lieutenant-3.html)

## 0 - Discovery
