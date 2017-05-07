![Logo](/assets/images/sectalks8-0.jpg)

The challenge for this edition of SecTalks includes a good mix of topics: encryption, JavaScript obfuscations and interesting custom steganography. Something for everyone. Since my solution is a bit different than the winning solution I've decided to post it here, hoping it will be useful. Not knowing much about how images are loaded in HTML as base64 encoded data, I went for a brute-force approach, which actually worked quite well. But more on this later. Let's download the [page](/files/page.zip) and get started!

## Stage 0

After unzipping the file, we have the following long HTML page, containing just the body element:
```html
<body onload="a=String.fromCharCode;String.prototype.b=String.prototype.charCodeAt;Number.prototype.c=Number.prototype.toString;key=prompt('Enter the key');document.body.innerHTML='<img src='+[23, 4, 23, 2, [...], 4, 78].map((e,i)=>a(e^key[i%10].b(0).c(10))).join('')+' />';"></body>
```

Upon loading, we see a short JavaScript being loaded. Let's arrange it a little bit to understand what it does:

```javascript
a = String.fromCharCode;                                 
String.prototype.b = String.prototype.charCodeAt;
Number.prototype.c = Number.prototype.toString;
key = prompt('Enter the key');
document.body.innerHTML='<img src='+[23, 4, 23, 2, [...], 4, 78].map((e,i)=>a(e^key[i%10].b(0).c(10))).join('')+' />';
```
We see that the [prototypes](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Object/prototype) of _String_ and _Number_ classes are extended in order to obfuscate what functions are being called. We have to find out what image is being loaded. After untangling, the JavaScript bit becomes:

```javascript
[23, 4, 23, 2, [...], 4, 78].map((elem,idx)=>String.fromCharCode(elem^key[idx%10].charcodeAt(0).toString(10))).join('')
```

At this point we know that the long array is being XOR-ed with a repetitive 10 letters key, and the result has to be the actual image since a URL can't be that long. Since we already know the length of the key, we can try to break it (_If we didn't, we'd have to find it first!_). The steps to break repetitive XOR are as follows:

 * Split the ciphertext into blocks of KEYSIZE length.
 * Transpose the blocks: make a new block that is the first byte of every block, then a new block that is the second byte of every block, and so on.
 * Solve each block as if it was single-character XOR. 
 * A simple scoring method based o ncharacters frequency will do. 
 
I've put together a short [script](/files/breakXOR.py) that guesses the most probably five key sizes (notice the 10 in there!) then goes on to crack each of the ten transposed blocks individually:
```
~ python 1.py
[+] Most possible 5 key sizes: 
[*] Key size: 2 Hamming dist: 2.6
[*] Key size: 4 Hamming dist: 2.95
[*] Key size: 3 Hamming dist: 3.06666666667
[*] Key size: 20 Hamming dist: 3.08
[*] Key size: 10 Hamming dist: 3.14
[+] Possible keys for transposed block 0. keysize: 10
83 score: 0.805912157728
[+] Possible keys for transposed block 1. keysize: 10
101 score: 0.799952744743
[...]
Key: SeCTaLks<
Message: DaTA:ImagEpNG;Base,IvBoRw0kggOaAaANSuHEuGAaAdUaaAkC[...]
```

Notice that currently there are a few issues with our result:
* The last character of the key is not a printable ASCII
* The decrypted result includes some uppercase/lowercase letters mismatches. 

Intuitively, we can see these errors are related to the case of the letters in the password. If we XOR a letter with blank (0x20) we get its case reversed. Since we know the password should be 10 characters long, and the first 10 characters of the result are **DaTA:ImagE** we can easily get the actual key by substracting 0x20 from the password characters corresponding to the wrong case in the decrypted text. For example, to get the first and last elements of the key:

* The first character of the result should be 'd' instead of 'D'. We add 0x20 to the first charcter of the key and we get 's'
* The last character of the text should be 'e' instead of 'E'. We add 0x20 to the last character of the key (0x13) and we get '3' (0x33)

So the key to the first stage is **sectalks<3** :sunglasses:
