---
title: (Retro) Hunting
layout: post
date: 2018-06-01
published: true
categories: [Security]
---

![Logo](/assets/images/hunt-logo.png)

# Retro-hunting for macOS process injection

## Overview
* In a previous [post]({% capture itemLink %}{% include findCollectionItem.html collectionName='tips' itemTitle='Code Injection (Run-Time)' %}{% endcapture %}{{ itemLink | strip_newlines }}) we've seen how to do run-time code injection on macOS up to the newest version 10.13. Because there are very limited resources online on how to do that (comapred to Windows/Linux), it's easier to find samples that do this based on string patterns.
* A not so well known feature of Virus Total is [retrohunting](https://www.virustotal.com/intelligence/hunting/). This feature allows YARA scans going back 3 months, or aproximate **75 -100 TB of data**. To access it go to *Intelligence →  Hunting →  Retrohunt*. 
* I was curious what kind of samples used process injection and whether any legitimate software take this approach. __*TL;DR. I didn't find any APT. Most of them are cheats for [Counter-Strike: Global Offensive](https://en.wikipedia.org/wiki/Counter-Strike:_Global_Offensive) and a few small legitimate 3rd party software*__.

## VT Hunting

* We need a YARA rule to match macho binaries and some of the process injection related strings:

```conf
private rule Macho
{
    meta:
        description = "private rule to match Mach-O binaries"
    condition:
        uint32(0) == 0xfeedface or uint32(0) == 0xcefaedfe or uint32(0) == 0xfeedfacf or uint32(0) == 0xcffaedfe or uint32(0) == 0xcafebabe or uint32(0) == 0xbebafeca

}

rule mach_inject {
    meta:
        author = "liviu - keemail - me"
        date = "2018-05-28"
        description = "Looks for process injection based on mach_inject project"
        share_level = "green"
        confidence = "high"
        reference_hash = "b00d55dbf45387e81d5d28adc4829e639740eda1"

    strings:
        $inject1 = "mach_inject"
        $inject2 = "bootstrap.dylib"
        $func1 = "vm_allocate"
        $func2 = "vm_deallocate"
        $func3 = "vm_protect"
        $func4 = "vm_write"

    condition:
        Macho and any of ($inject*) and any of ($func*)
}
```

* The search took a little over 3 hours and explored **more than 100 TB of data**. *That's quite impressive!* For anybody interested, this is the full list of hashes:

```
3d9c28fc2d870c1904966cdc87c00735d22989c704cc4bdc00295f9799f99470
806e1cd635573a30d435a7868a787f971674d63bc719cf5ca683b6d7c47ddc52
9d899d6e86db3e90706a3952d8e07463e03092a7d18175df32e8001d1b5f7199
3fe19ce674dd33bfde1c6c21a6964fc9d5a30c09d5ac0fb48e834c5293f92d86
c96e9e73e329ee56382b585ec6e5eb9641e2716f81cb1102605b2eefb95152b3
e71f745140096bd889bbb0ffdd60803488a0550384e8ab2104b2146c86b56127
5d607b1a4086c3982bb61e303e12a7db87f894ae9fa813c9a6f5e601e1338a17
ffbebc4930133dff2daca90c23275985c783cd875428b39c04661e19dd175fa9
f89df67828f9b0ff71869c730997d7f7d8f3351efc6daf333480e9da2ef94a70
4efcdb8883319c3742810f663e1036fe7f936cca890bcf1ab94595fa2ddae5cc
baf005cbb6774516505dd1e295f7750d572e438c9e05804a928fe82850402f45
22e186d09fe28cab7ca5173d1218bd66437296ae8ba1a192ba3d90315bb1fce1
358551a961b5d9051c7f2d4d94e2ce2d71811d7a27c62a9bd1a8dcea0541f230
ed0675528036683c5c45f45a962d2b7c2fe1b941fd5045adfe5450e9962ada74
e1d3d08d8f05badb56c7d88b9b6eebbacca33754b69d556689c096b32d4131ef
d00cc3bff32bcec397ad3e2d75896da0f19e2e6fbc141af3172c904fb0d3fb1d
a19dcf972317617bc8528149f5b42e0e0545b18df0558683ce4d246c5e1b0186
1b425756ad970a0f8944bd0ee990b882f6a4def314dbe8998ddb7fc6ac766705
df76b40a5454a163e5020d7110cea56d1d0ad25dcbd00303bb10172a14bb3aa8
60ae99b5fd6371aed3f76ba1ae244ddc1e7c65c99a822041587a2a55fb97daf8
ddb00fcc958092682684deef8a0d96b3165106f50c879a9adcf725fc72cec03e
b432fb481685de7616583a2e6e7ce2be0937e1a284870c75d01d31433c3913a7
13e67a8fba0b140c50404b58f7d56547d222b20f114f73e6bc1a8c91178de0c8
4681e83af35e71446554233939423dd8817e07675aa7cb711c504bd9d697fd9b
12b2b603ceea097b4861220a99dfd1d5e4e5dd885b04dfa29e3a2e09ddc00eb4
799515fc6031113e1a1508f404f693fb588ce7fc97eb8ae1eee0729b8662a137
03949e0057b7f5d06e26fddfe7ca5d113f212e881639a483fd6d0997451fc187
5c49daeecfe694fa0ea8576e0ea78c135917720651649de7fc7a96fd0db6d5a7
7b61909654d4a165502f7bb38add776232da09168718953ce04cce2dbb6f133d
4ba730f718d4415e8191dbe391f36d1ba6485f2980e8b03189f581ef266e148d
ab740081c549e00d41066e631a01c5e46a78a05730f830312ab36e7dc7e41ea9
45b6d499c957d7331a123978bb87044c7f329d269b7d0691a0ca1a64deab8cce
54c81944301647e6f1d95f4ace8a564c0780d74f5821691c6ca7ee40cdabb25f
765e5fcbf4d0e34e00053f3d108fdb06a9bf7d3245a1c22641526983d9fdd988
08100dfcb51bfe1c2f137afc6e812aad818f68ed1749718137328d7847252b42
77f493edcaf4a01c859cf784e3cb07c70a4078a083a65c24fe226f4dceea0ee8
0436a6a2ba0c15d33aae3766385ccd7d4b5a1ca91b21df441e57a45cd8132b79
68232b418092f0969d15450ccf1d14ee79c510fe54d80a8b07e92ff7cd1d1343
75f9ad3bf86deded0bd0b3098643f3f1cab624989dcf707773db40f39438a6eb
de96d25808959dfb781f33bc6a49e97a9fa53f69110c1ef6cdd6771f16a0ae37
e77a476cece3cbfcde0d8912d6814b67c0e6068b3b109735eefc78fc45fed697
220c5432ccff453cf2602411066e809ef74e43b003b37640f486d009178087ac
55014f59885500fd8d96117e5b5c0ab166b8f1bbbafa795bfc8710b9f41b3e85
539aa393871eef1cb018f54c6c7030bd15006f7ecc92fcb43609117901b6c3d2
4f6520ae2cf5514cdfb9d71a6f8796e6d068db19c3203d77c93354dc9d6167b7
2c6beae5e5d17d029f3b92ff79cd424b80e9d5f789f34ba81bee2c00e7d774e6
ef52bf8c10e9015e22b3e33b0029a4e96ac910e7951f217a4c7ae78b8bd4d28a
f5eaeeb9db3059a20385f057b13e3386edc98a16b36685f8998266aa1f398203
e7883fcab7a0909dad520eea92be042b00a01488d66d383bf33dafa411536854
ebfcab9308f43c38ae15e7af10621a290c85c12e67e4c5211af3d861027f2a1a
b5a91cc5e0134c1e825a06555ad74b693b36f47db883c483c7ff9093fe0d89d1
f6c56b8fae619440210bfcaeb2c249c5b9f3b6f57da4c65791e6a5b6e70ca464
2c884f5b13331f0d57a3831c10c6202353a685fa0657e44e28211e55f6d8d3ae
18f11096fd9d8fa52bff8ce359e72b04c76000781fafc50d0900892cecb70e27
bb46dbaeae5cba57f0834e2a41654c22e4fcda8e0ae9e549c406a09865d589d9
050bbcf835d7c4a42491118342713a4be57a7c825e850094e6064b5efeb19d9d
26cd793cea36de1af046fc676ce46d04155358eea2b10fad1ce0e8e39a6a4872
a0368bcbec7f879d8b0853fd0fed00ab1a718ff77f1842d7587e3b3f8553b425
85afcd953b6bc7dd1d9dc5fd176db43c7207024ac269ab2c5d3a2b2025a08df8
a5a8c0d113ae40de6d18902fa5d5704da68b78606383b1755f66f53c3780289b
9197fdacef9485ec4749a39cfdc21451325d071eaa6a552d63fb5a676fbc438c
98fa992cc0452256339998fa54c76e4a2107984eb5ca819aaef53784ddcb15ad
93342cdc841b9e09248f315e27f2c1709bbf7bd2dc38315ed810935e929e704c
```

## Analysis
* I was hoping to find new tricks but most of the samples contain just the code for the run-time process injection part. *__The libraries being injected are missing__*, as they are probably delivered separately. This makes it very difficult to determine their functionality and maliciousness.
* As an example, here's how CS:GO does it:

<img src="/assets/images/inject-ida.png" alt="Hex Rays" class="figure-body">

## Conclusions

* Retrohunt is very cool. I should use it more often!
* The sample above had **26/60 detections**. If this is not convinving enough, note that most of the results include the word __*trojan*__ and one even boasts a verdict of __*malicious (high confidence)*__, this doesn't mean we should stop analysing, panic and delete everything. 

<img src="/assets/images/inject-detections.png" alt="VT scan results" class="figure-body">
