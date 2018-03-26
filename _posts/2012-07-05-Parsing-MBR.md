---
title:  "Parsing the MBR"
categories: [Deep-Dive]
---

![Logo](/assets/images/mbr.png)

## Overview
The Master Boot Record ([MBR](http://en.wikipedia.org/wiki/Master_boot_record)) contains the boot code and information about the partition table. It resides in the first 512 bytes (first sector) of a bootable disk.  The boot loader is in the **first 446 bytes of MBR**. A backup of MBR can help with recovery after a partition table corruption. Let's understand the MBR info and disk geometry in a structured way.

## Linux: *dd* and *file* commands

**dd** can be used to acquire the first sector of the bootable disk:
```bash
$ sudo dd if=/dev/sda of=mbr count=512
512+0 records in
512+0 records out
262144 bytes (262 kB) copied, 0.00553819 s, 47.3 MB/s
```

Information about partitions is obtained with **file88 utility, that recognizes the dump as an MBR dump (by the MBR signature *0x55AA*):
```bash
$ file mbr  
mbr: x86 boot sector; 
partition 1: ID=0x83, starthead 32, startsector 2048, 39061504 sectors; 
partition 2: ID=0x7, active, starthead 254, startsector 39070080, 44998065 sectors; 
partition 3: ID=0x83, starthead 254, startsector 84068145, 13671315 sectors; 
partition 4: ID=0x5, starthead 254, startsector 97739460, 214837245 sectors, code offset 0x63
```

## Windows

Acquiring the MBR can be done also with **dd** command (from [UnxUtils](http://unxutils.sourceforge.net/)), which is a native port of the original dd command:
```bash
> dd if=\\.\PhysicalDrive0 of=mbr count=1
1+0 records in
1+0 records out
```

Then, the following small python script can be used to extract information, similar with file utility:
```python
''' Decode partition table from MBR file
    In: file containing MBR data. Obtained with:
    dd if=/dev/sda of=mbr count=512   (on Linux)
    dd if=\\.\PhysicalDrive0 of=mbr count=1  (on Windows with dd from UnxUtils)
http://en.wikipedia.org/wiki/Master_boot_record    
    
'''
import getopt, sys
import struct
from wsgiref.validate import check_status

def usage():
    print '''Usage:
    python parse_mbr.py [--param=value]
    Params:
    -h, --help                      print this
    -i file, --input=file           set input file    
    
    E.g.: python parse_mbr.py -i mbr 
    '''

# All multi-byte fields in a 16-byte partition record are little-endian!
# Use '<' when unpacking structs below
 
# Read an unsigned byte from data block
def read_ub(data):
    return struct.unpack('B', data[0])[0]
  
# Read an unsigned short int (2 bytes) from data block    
def read_us(data):
    return struct.unpack('<H', data[0:2])[0]

# Read an unsigned int (4 bytes) from data block    
def read_ui(data):
    return struct.unpack('<I', data[0:4])[0]

class PartitionEntry:
    def __init__(self, data):
        self.Status = read_ub(data)
        self.StartHead = read_ub(data[1])
        tmp = read_ub(data[2])
        self.StartSector = tmp & 0x3F
        self.StartCylinder = (((tmp & 0xC0)>>6)<<8) + read_ub(data[3])
        self.PartType = read_ub(data[4])
        self.EndHead = read_ub(data[5])
        tmp = read_ub(data[6])
        self.EndSector = tmp & 0x3F
        self.EndCylinder = (((tmp & 0xC0)>>6)<<8) + read_ub(data[7])
        self.LBA = read_ui(data[8:12])
        self.NumSectors = read_ui(data[12:16])    
    
    def print_partition(self):
        self.check_status()
        print "CHS of first sector: %d %d %d" % \
            (self.StartCylinder, self.StartHead, self.StartSector)
        print "Part type: 0x%02X" % self.PartType
        print "CHS of last sector: %d %d %d" % \
            (self.EndCylinder, self.EndHead, self.EndSector)
        print "LBA of first absolute sector: %d" % (self.LBA)
        print "Number of sectors in partition: %d" % (self.NumSectors)
                
    def check_status(self):
        if (self.Status == 0x00):
            print 'Non bootable'
        else:
            if (self.Status == 0x80):
                print 'Bootable'
            else: 
                print 'Invalid bootable byte'
        
# Table of four primary partitions        
class PartitionTable:
    def __init__(self, data):
        self.Partitions =[PartitionEntry(data[16*i:16*(i+1)]) for i in range (0, 4)]

# Master Boot Record        
class MBR:
    def __init__(self, data):
        self.BootCode = data[:440]        
        self.DiskSig = read_ui(data[440:444])
        self.Unused = data[444:446]        
        self.PartitionTable = PartitionTable(data[446:510])        
        self.MBRSig = data[510:512]
        
    def check_mbr_sig(self):
        mbr_sig = read_us(self.MBRSig)
        print "Read MBR signature: 0x%04X" % (mbr_sig)
        if (mbr_sig == 0xAA55):
            print "Correct MBR signature"
        else:
            print "Incorrect MBR signature"
            
    def get_disk_sig(self):        
        return self.DiskSig      
                      
if __name__=="__main__":
    try:
        opts, args = getopt.getopt(sys.argv[1:], "i:h", ["help", "input="])
    except getopt.GetoptError, err:
        print str(err) # will print something like "option -x not recognized"
        usage()
        sys.exit(2)
        
    input = None
    
    for o, a in opts:
        if o in ("-h", "--help"):
            usage()
            sys.exit()
        elif o in ("-i", "--input"):
            input = a
        else:
            assert False, "Unhandled option"

    if not input:
        usage()
        sys.exit()
        
    f = open(input, 'rb')
    data = f.read()
    print "Read: %d bytes" % (len(data))
    
    master_br = MBR(data)    
    master_br.check_mbr_sig()
    
    print "Disk signature: 0x%08X" % (master_br.get_disk_sig())
    
    for partition in master_br.PartitionTable.Partitions:
        print ""
        partition.print_partition()    
    
    f.close()
```    

On [this](/assets/misc/mbr) mbr file, it will recognise the following structure:
```bash
 ~ python parse_mbr.py -i mbr
Read: 512 bytes
Read MBR signature: 0xAA55
Correct MBR signature
Disk signature: 0x0009DA9A

Non bootable
CHS of first sector: 0 32 33
Part type: 0x83
CHS of last sector: 1023 254 63
LBA of first absolute sector: 2048
Number of sectors in partition: 39061504

Bootable
CHS of first sector: 1023 254 63
Part type: 0x07
CHS of last sector: 1023 254 63
LBA of first absolute sector: 39070080
Number of sectors in partition: 44998065

[...]
```

### Other useful tools in Windows

Information regarding disk geometry (Total Cylinders/Sectors/Tracks,  Sectors per Track, Tracks per cylinder) can be obtained with **System Information** utility from Windows:
![System Information](/assets/images/systemInfo.JPG)

The [WinHex](http://www.x-ways.net/winhex/) editor can be used to obtain information about the first sector of every partition (provided also by file command):
![WinHex drive info](/assets/images/winhex.jpg)
