---
title:  "[CTF] OverTheWire vortex Level 0"
---

![Logo](/assets/images/vortex0.png)

## Solution
The first one is a very easy warm up level, and can be found [here](http://overthewire.org/wargames/vortex/vortex0.html). It's a small socket programming problem: a server sends 4 consecutive unsigned integers, little endian, and you have to reply with their sum to get the password for the next level. In Python, the solution is straight-forward:

```python
import socket
import struct
 
def solve():
    host = "vortex.labs.overthewire.org"
    port = 5842
     
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
     
    s.connect((host, port))
     
    sum = 0
    for i in range(0,4):
        data = s.recv(4)
        num,  = struct.unpack("<I", data)
        sum += num
    print "Sum: %u" % (sum)
     
    s.send(struct.pack("<I",(sum & 0xFFFFFFFF)))
    level1 =  s.recv(1024)
    print level1
 
    s.close()
         
if __name__=="__main__":        
    solve()
```

And to get the password for the next level:
```bash
# python L0.py 
Sum: 3188809347
Username: vortex1 Password: *******
```
