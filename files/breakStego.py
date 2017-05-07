import sys
from PIL import Image

def load(file):
    img = Image.open(sys.argv[1])

    w, h = img.size
    print "[+] Width: %d Heigh: %d (pixels)" % (w, h)
    
    pixels = img.load() 

    return (pixels, w, h)

def buildStream(bits):
    # Trim to multiple of byte
    currLen = len(bits)
    maxLen = currLen - currLen%8
    bits = bits[:maxLen]
    
    # Split into bytes
    stream = []
    bytes = [bits[i:i + 8] for i in xrange(0, len(bits), 8)]
    
    for byte in bytes:
        byte = byte[:7]
        c = reduce(lambda n, b: n << 1 | b, byte)
        stream.append(c)
    
    # Write stream to binary file
    with open(sys.argv[2], "wb") as f:
        f.write("".join([chr(c) for c in stream]))

def getBit(pixel):                    
    print pixel
    if pixel[1] != pixel[2]:
        return 0
    else:
        return 1
 
if __name__ == "__main__":
    pngFile = sys.argv[1]

    (pixels, w, h) = load(pngFile)

    stream = [] 
    print h,w
    for i in range(h): 
        for j in range(w):
            stream.append(getBit(pixels[j, i]))
    
    buildStream(stream)
