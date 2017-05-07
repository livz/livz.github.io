# Array of bytes encrypted with repetitive XOR
v = []

# Return the number of different bits between two 32 bits numbers
def dif(a, b, bits = 32):
    x = a ^ b
    return sum((x>>i & 1) for i in xrange(bits))    

# Compute the edit/Hamming distance between two strings (of equal lengths)
# Returns number of differing bits
def d_ham(s1, s2):
    return sum(dif(ord(s1[i]), ord(s2[i])) for i in xrange(len(s1)))

# Used below for single-char xor decoding (step f.)
def transpose(blocks):
    t = []
    for i in xrange(len(blocks[0])):
        t1 = []
        for j in xrange(len(blocks)):
            t1.append(blocks[j][i])
        t.append("".join(t1))
    return t

charset = "abcdefghijklmnopqrstuvwxyz "
charset_up = charset.upper()

# Simple scoring method based on character frequency
def get_score(text):
    # Score: number of valid characters
    s = 0
    for l in text:
        if (l in charset) or (l in charset_up):
            s += 1

    return (s*1.0)/len(text)

# Decrypt/encrypt function are the same
def rxor(text, key):
    dec = [chr(ord(text[i]) ^ ord(key[i % len(key)])) for i in range(0, len(text))]
    return "".join(dec)

if __name__ == "__main__":
    enc =  "".join([chr(c) for c in v])

    # Find the most probable key sizes
    d = {}
    for keysize in range(2, 50):
        blocks = [enc[i:i+keysize] for i in range(0, len(enc), keysize)]
        dist = 0
        # Average Hamming distance over 5 blocks
        for i in range(0,5):
            for j in range(i+1, 5):
                dist += d_ham(blocks[i], blocks[j])*1.0/keysize
        d[keysize] = dist/10

    topN = 5
    print "[+] Most possible %d key sizes: " % topN
    for w in sorted(d, key = lambda k: d[k])[:topN]:
        print "[*] Key size:", w, "Hamming dist:", d[w]
    
    # Split into KEYSIZE blocks and crack individually
    for keysize in [10]:#, 5, 2, 20, 24, 6]:
        k = [0] * keysize

        blocks = [enc[i:i+keysize] for i in range(0, len(enc), keysize)]
        # Transpose the blocks and find the key for each transposed block
        # Leave the last incomplete block for easier calculations
        t_blocks = transpose(blocks[:len(blocks)-1])

        for i in xrange(keysize):
            b = t_blocks[i]

            d = {}
            for key in range(0, 255):
                dec = "".join([chr(ord(c)^key) for c in b])
                d[dec] = (get_score(dec), key, b)

            print "[+] Possible keys for transposed block %d. keysize: %d" % (i, keysize)
         
            for w in sorted(d, key = lambda k: d[k][0], reverse=True)[:1]:
                print d[w][1], "score:", d[w][0]
                k[i] = d[w][1]

        k = "".join([chr(c) for c in k])
        print "Key:", k
        print "Message:", rxor(enc, k)     
